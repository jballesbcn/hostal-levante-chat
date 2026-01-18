
import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import htm from 'htm';
import { GoogleGenAI } from "@google/genai";

const html = htm.bind(React.createElement);

const GREETINGS = {
  es: "¡Hola! Bienvenido al Hostal Levante en Barcelona. Soy tu asistente virtual. ¿En qué puedo ayudarte hoy?",
  en: "Hello! Welcome to Hostal Levante in Barcelona. I'm your virtual assistant. How can I help you today?",
  ca: "Hola! Benvingut a l'Hostal Levante a Barcelona. Soc el teu assistent virtual. En què et puc ayudar avui?"
};

const askAI = async (history, knowledge, lang) => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === "undefined") throw new Error("API_KEY_MISSING");

  try {
    const ai = new GoogleGenAI({ apiKey });
    const systemInstruction = `Eres el asistente oficial del Hostal Levante (Barcelona). 
Ubicación: Baixada de Sant Miquel, 2. Cerca de Las Ramblas y la Plaza San Jaime.
Idioma: ${lang}.
Información: ${knowledge.map(k => `${k.title}: ${k.content}`).join('. ')}
Reglas: Responde amable y breve (máximo 2-3 frases). Si no sabes algo, indica info@hostallevante.com.`;

    const contents = history
      .filter(m => !m.isGreeting && m.text && !m.isError)
      .map(m => ({
        role: m.role === 'model' ? 'model' : 'user',
        parts: [{ text: m.text }]
      }));

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: contents,
      config: { systemInstruction, temperature: 0.7 }
    });
    return response.text;
  } catch (e) { throw e; }
};

const ChatWidget = ({ knowledge, isEmbedded }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [lang, setLang] = useState('es');
  const scrollRef = useRef(null);

  useEffect(() => {
    const l = new URLSearchParams(window.location.search).get('lang') || 'es';
    setLang(l);
    setMessages([{ role: 'model', text: GREETINGS[l] || GREETINGS.es, isGreeting: true }]);
  }, []);

  // Notificar a la web principal el cambio de estado
  const toggleChat = (state) => {
    setIsOpen(state);
    if (isEmbedded) {
      window.parent.postMessage({ type: 'chatbot_state', open: state }, '*');
    }
  };

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isTyping]);

  const onSend = async () => {
    if (!input.trim() || isTyping) return;
    const text = input;
    setMessages(prev => [...prev, { role: 'user', text }]);
    setInput('');
    setIsTyping(true);
    try {
      const reply = await askAI([...messages, { role: 'user', text }], knowledge, lang);
      setMessages(prev => [...prev, { role: 'model', text: reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'model', text: "Error de conexión. Revisa la API_KEY en Vercel.", isError: true }]);
    } finally { setIsTyping(false); }
  };

  if (!isOpen && isEmbedded) return html`
    <div className="w-full h-full flex items-center justify-center bg-transparent">
      <button onClick=${() => toggleChat(true)} className="w-16 h-16 bg-[#1e3a8a] text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform pulse-blue">
        <i className="fas fa-comments text-2xl"></i>
      </button>
    </div>
  `;

  return html`
    <div className=${`flex flex-col bg-white overflow-hidden shadow-2xl animate-chat ${isEmbedded ? 'w-full h-full' : 'fixed bottom-5 right-5 w-[380px] h-[600px] rounded-[2rem] z-[9999]'}`}>
      <div className="bg-[#1e3a8a] p-5 text-white flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center"><i className="fas fa-hotel text-xs"></i></div>
          <span className="font-bold text-sm">Asistente Levante</span>
        </div>
        <button onClick=${() => toggleChat(false)} className="hover:bg-white/10 w-8 h-8 rounded-full"><i className="fas fa-times"></i></button>
      </div>
      <div ref=${scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#f9fafb] hide-scroll">
        ${messages.map((m, idx) => html`
          <div key=${idx} className=${`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className=${`max-w-[85%] p-3 rounded-2xl text-sm ${m.role === 'user' ? 'bg-[#1e3a8a] text-white rounded-tr-none' : 'bg-white text-slate-700 rounded-tl-none border border-slate-100 shadow-sm'}`}>
              ${m.text}
            </div>
          </div>
        `)}
        ${isTyping && html`<div className="flex justify-start"><div className="bg-white border p-2 rounded-xl animate-pulse text-xs text-slate-400">Escribiendo...</div></div>`}
      </div>
      <div className="p-3 bg-white border-t flex space-x-2">
        <input value=${input} onChange=${e => setInput(e.target.value)} onKeyDown=${e => e.key === 'Enter' && onSend()} placeholder="Escribe aquí..." className="flex-1 bg-slate-100 rounded-lg px-4 py-2 text-sm outline-none" />
        <button onClick=${onSend} className="bg-[#1e3a8a] text-white px-4 py-2 rounded-lg"><i className="fas fa-paper-plane"></i></button>
      </div>
    </div>
  `;
};

const App = () => {
  const [isAdmin, setIsAdmin] = useState(true);
  const [knowledge, setKnowledge] = useState(() => {
    const s = localStorage.getItem('lev_v20_kb');
    return s ? JSON.parse(s) : [
      { id: 1, title: 'Check-in', content: 'Desde las 14:00h.' },
      { id: 2, title: 'Ubicación', content: 'Barrio Gótico, Barcelona.' }
    ];
  });

  useEffect(() => localStorage.setItem('lev_v20_kb', JSON.stringify(knowledge)), [knowledge]);
  if (window.location.search.includes('embed=true')) return html`<${ChatWidget} knowledge=${knowledge} isEmbedded=${true} />`;

  return html`
    <div className="min-h-screen bg-slate-100 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden">
        <div className="p-6 bg-[#1e3a8a] text-white flex justify-between items-center">
          <h1 className="text-xl font-bold">Panel de Control - Hostal Levante</h1>
          <button onClick=${() => setIsAdmin(!isAdmin)} className="bg-white/20 px-4 py-2 rounded-lg text-sm">${isAdmin ? 'Ver Preview' : 'Editar Datos'}</button>
        </div>
        <div className="p-8">
          ${isAdmin ? html`
            <div className="space-y-4">
              <button onClick=${() => setKnowledge([{id:Date.now(), title:'Nuevo', content:''}, ...knowledge])} className="bg-blue-600 text-white px-4 py-2 rounded-lg mb-4">+ Añadir información</button>
              ${knowledge.map(k => html`
                <div className="flex space-x-2 mb-2">
                  <input className="border p-2 rounded flex-1 font-bold" value=${k.title} onChange=${e => setKnowledge(knowledge.map(x => x.id === k.id ? {...x, title: e.target.value} : x))} />
                  <input className="border p-2 rounded flex-[2]" value=${k.content} onChange=${e => setKnowledge(knowledge.map(x => x.id === k.id ? {...x, content: e.target.value} : x))} />
                  <button onClick=${() => setKnowledge(knowledge.filter(x => x.id !== k.id))} className="text-red-500">Eliminar</button>
                </div>
              `)}
            </div>
          ` : html`
             <div className="text-center py-20">
               <p className="text-slate-400">El chat aparece en la esquina inferior derecha.</p>
             </div>
          `}
        </div>
      </div>
      <${ChatWidget} knowledge=${knowledge} isEmbedded=${false} />
    </div>
  `;
};

createRoot(document.getElementById('root')).render(html`<${App} />`);
