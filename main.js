
import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import htm from 'htm';
import { GoogleGenAI } from "@google/genai";

const html = htm.bind(React.createElement);

// --- 1. CONFIGURACIÓN ---
const BOOKING_URL = "https://booking.redforts.com/e4mh/";
const GREETINGS = {
  es: "¡Hola! Soy el asistente del Hostal Levante. ¿En qué puedo ayudarte?",
  en: "Hi! I'm the Hostal Levante assistant. How can I help you?",
  ca: "Hola! Soc l'assistent de l'Hostal Levante. En què et puc ayudar?",
  fr: "Bonjour ! Je suis l'assistant de l'Hostal Levante.",
  de: "Hallo! Ich bin der Assistent des Hostal Levante."
};

// --- 2. MOTOR DE IA ---
const askAI = async (history, knowledge, lang) => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === "undefined") return "Error de configuración.";
  try {
    const ai = new GoogleGenAI({ apiKey });
    const context = knowledge.map(k => `${k.title}: ${k.content}`).join('. ');
    const systemInstruction = `Eres el asistente oficial del Hostal Levante Barcelona. Sé amable, profesional y conciso. Idioma: ${lang}. Reservas: ${BOOKING_URL}. Contexto: ${context}`;
    const chat = ai.chats.create({ 
      model: 'gemini-3-flash-preview', 
      config: { systemInstruction, temperature: 0.4 } 
    });
    const response = await chat.sendMessage({ message: history[history.length - 1].text });
    return response.text;
  } catch (error) { return "Lo siento, ha habido un error. ¿Puedes repetir?"; }
};

// --- 3. COMPONENTE CHAT ---
const ChatWidget = ({ knowledge, isStandaloneWidget = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);
  const lang = new URLSearchParams(window.location.search).get('lang') || 'es';

  // Notificar al padre (tu web) el cambio de tamaño usando window.top para mayor compatibilidad
  useEffect(() => {
    if (isStandaloneWidget) {
      window.top.postMessage({ type: 'LEVANTE_CHAT_STATE', isOpen }, '*');
    }
  }, [isOpen, isStandaloneWidget]);

  useEffect(() => { setMessages([{ role: 'model', text: GREETINGS[lang] || GREETINGS.es }]); }, [lang]);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }); }, [messages, isTyping]);

  const onSend = async () => {
    if (!input.trim() || isTyping) return;
    const userText = input;
    const newMsgs = [...messages, { role: 'user', text: userText }];
    setMessages(newMsgs);
    setInput('');
    setIsTyping(true);
    const reply = await askAI(newMsgs, knowledge, lang);
    setMessages(prev => [...prev, { role: 'model', text: reply }]);
    setIsTyping(false);
  };

  const containerClass = isStandaloneWidget 
    ? "h-full w-full flex flex-col items-end justify-end p-2 overflow-hidden" 
    : "fixed bottom-6 right-6 z-[9999] flex flex-col items-end";

  return html`
    <div className=${containerClass}>
      ${isOpen && html`
        <div className="mb-4 w-full sm:w-[350px] h-[500px] bg-white rounded-[2rem] shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-chat pointer-events-auto">
          <div className="bg-[#1e3a8a] p-4 text-white flex justify-between items-center shrink-0 shadow-lg">
            <div className="flex items-center space-x-2">
              <i className="fas fa-hotel text-sm"></i>
              <span className="font-bold text-xs uppercase tracking-tight">Hostal Levante</span>
            </div>
            <button onClick=${() => setIsOpen(false)} className="w-8 h-8 rounded-full hover:bg-white/20 transition-colors flex items-center justify-center"><i className="fas fa-times"></i></button>
          </div>
          <div ref=${scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 hide-scroll text-[13px]">
            ${messages.map((m, i) => html`
              <div key=${i} className=${`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className=${`max-w-[85%] p-3 rounded-2xl shadow-sm ${m.role === 'user' ? 'bg-[#1e3a8a] text-white rounded-tr-none' : 'bg-white text-slate-700 rounded-tl-none border border-slate-100'}`}>
                  ${m.text}
                </div>
              </div>
            `)}
            ${isTyping && html`<div className="flex justify-start"><div className="bg-white p-3 rounded-2xl shadow-sm animate-pulse text-blue-400"><i className="fas fa-ellipsis-h"></i></div></div>`}
          </div>
          <div className="p-3 bg-white border-t border-slate-100 flex space-x-2 shrink-0 pointer-events-auto">
            <input value=${input} onChange=${e => setInput(e.target.value)} onKeyDown=${e => e.key === 'Enter' && onSend()} placeholder="Escribe tu mensaje..." className="flex-1 bg-slate-100 rounded-xl px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-200 transition-all" />
            <button onClick=${onSend} className="bg-[#1e3a8a] text-white w-10 h-10 rounded-xl flex items-center justify-center hover:bg-blue-800 transition-colors shadow-md"><i className="fas fa-paper-plane text-xs"></i></button>
          </div>
        </div>
      `}
      <button 
        onClick=${() => setIsOpen(!isOpen)} 
        className="pointer-events-auto w-14 h-14 bg-[#1e3a8a] text-white rounded-full shadow-2xl pulse-blue border-4 border-white flex items-center justify-center cursor-pointer transition-transform active:scale-95 hover:scale-105"
      >
        <i className=${`fas ${isOpen ? 'fa-times' : 'fa-comments'} text-xl`}></i>
      </button>
    </div>
  `;
};

// --- 4. APP PRINCIPAL ---
const App = () => {
  const [knowledge, setKnowledge] = useState(() => {
    const s = localStorage.getItem('lev_v23_kb');
    return s ? JSON.parse(s) : [{ id: 1, title: 'Ubicación', content: 'Carrer de la Baixada de Sant Miquel, 2, 08002 Barcelona.' }];
  });

  useEffect(() => { localStorage.setItem('lev_v23_kb', JSON.stringify(knowledge)); }, [knowledge]);

  const params = new URLSearchParams(window.location.search);
  const isWidgetMode = params.has('widget') || params.has('embed');

  if (isWidgetMode) {
    return html`<${ChatWidget} knowledge=${knowledge} isStandaloneWidget=${true} />`;
  }

  return html`
    <div className="min-h-screen bg-slate-100 p-4 md:p-12">
      <div className="max-w-4xl mx-auto bg-white rounded-[2.5rem] shadow-xl overflow-hidden border">
        <div className="p-6 bg-[#1e3a8a] text-white flex justify-between items-center">
          <div className="flex items-center space-x-3">
             <i className="fas fa-cog"></i>
             <h1 className="font-bold uppercase tracking-widest text-sm">Panel de Administración</h1>
          </div>
          <button onClick=${() => setKnowledge([{id:Date.now(), title:'', content:''}, ...knowledge])} className="bg-white/20 px-4 py-2 rounded-lg text-[10px] font-bold hover:bg-white/30 transition-colors uppercase">Añadir Información</button>
        </div>
        <div className="p-8 space-y-4">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-4">Información para entrenar a la IA:</p>
          ${knowledge.map(k => html`
            <div key=${k.id} className="flex gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 items-start">
              <input className="bg-white border p-2 rounded-lg text-xs w-1/4 font-bold" placeholder="Asunto (ej. Check-in)" value=${k.title} onChange=${e => setKnowledge(knowledge.map(x => x.id === k.id ? {...x, title: e.target.value} : x))} />
              <textarea className="bg-white border p-2 rounded-lg text-xs flex-1 min-h-[60px]" placeholder="Detalles que la IA debe conocer..." value=${k.content} onChange=${e => setKnowledge(knowledge.map(x => x.id === k.id ? {...x, content: e.target.value} : x))} />
              <button onClick=${() => setKnowledge(knowledge.filter(x => x.id !== k.id))} className="text-red-300 hover:text-red-500 p-2 mt-1"><i className="fas fa-trash"></i></button>
            </div>
          `)}
        </div>
      </div>
      <${ChatWidget} knowledge=${knowledge} isStandaloneWidget=${false} />
    </div>
  `;
};

createRoot(document.getElementById('root')).render(html`<${App} />`);
