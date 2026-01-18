
import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import htm from 'htm';
import { GoogleGenAI } from "@google/genai";

const html = htm.bind(React.createElement);

const GREETINGS = {
  es: "¡Hola! Soy el asistente del Hostal Levante. ¿En qué puedo ayudarte hoy?",
  en: "Hi! I'm the Hostal Levante assistant. How can I help you today?",
  ca: "Hola! Soc l'assistent de l'Hostal Levante. En què et puc ajudar avui?"
};

const QUICK_TIPS = {
  es: ["¿Cómo llegar?", "Horario Check-in", "¿Hay Wifi?", "Lugares cercanos"],
  en: ["How to get here?", "Check-in time", "Is there Wifi?", "Nearby places"],
  ca: ["Com arribar-hi?", "Horari Check-in", "Hi ha Wifi?", "Llocs propers"]
};

const askAI = async (history, knowledge, lang) => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === "undefined" || apiKey.length < 10) throw new Error("API_KEY_INVALID");

  try {
    const ai = new GoogleGenAI({ apiKey });
    const systemInstruction = `Eres el asistente virtual del Hostal Levante (Barcelona). 
Idioma: ${lang}. 
Eres amable, conciso y actúas como un recepcionista experto.

CONOCIMIENTO:
${knowledge.map(k => `- ${k.title}: ${k.content}`).join('\n')}

REGLAS:
1. Si preguntan por disponibilidad o precios específicos, diles que el mejor precio está en www.hostallevante.com.
2. Sé honesto sobre la accesibilidad (no adaptado).
3. Recomienda lugares del Barrio Gótico si preguntan por turismo.
4. No inventes servicios (no hay desayuno, no hay cocina, no hay TV).`;

    const chatHistory = history
      .filter(m => !m.isGreeting && !m.isError)
      .slice(0, -1)
      .map(m => ({
        role: m.role === 'model' ? 'model' : 'user',
        parts: [{ text: m.text }]
      }));

    const chat = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: { systemInstruction, temperature: 0.7 }
    });

    const lastUserMessage = history[history.length - 1].text;
    const response = await chat.sendMessage({ message: lastUserMessage });
    return response.text;
  } catch (e) {
    console.error("AI Error:", e);
    throw e;
  }
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

  const toggleChat = (state) => {
    setIsOpen(state);
    if (isEmbedded) window.parent.postMessage({ type: 'chatbot_state', open: state }, '*');
  };

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isTyping]);

  const onSend = async (customText) => {
    const text = typeof customText === 'string' ? customText : input;
    if (!text.trim() || isTyping) return;
    
    const newMessages = [...messages, { role: 'user', text }];
    setMessages(newMessages);
    setInput('');
    setIsTyping(true);
    
    try {
      const reply = await askAI(newMessages, knowledge, lang);
      setMessages(prev => [...prev, { role: 'model', text: reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'model', text: "Lo siento, error de conexión.", isError: true }]);
    } finally { setIsTyping(false); }
  };

  if (!isOpen && isEmbedded) return html`
    <div className="w-full h-full flex items-center justify-center bg-transparent">
      <button onClick=${() => toggleChat(true)} className="w-16 h-16 bg-[#1e3a8a] text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform pulse-blue border-4 border-white">
        <i className="fas fa-comments text-2xl"></i>
      </button>
    </div>
  `;

  return html`
    <div className=${`flex flex-col bg-white shadow-2xl animate-chat ${isEmbedded ? 'w-full h-full' : 'fixed bottom-5 right-5 w-[380px] h-[600px] rounded-[2rem] z-[9999] border border-slate-200'}`}>
      <div className="bg-[#1e3a8a] p-4 text-white flex justify-between items-center shadow-md">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center"><i className="fas fa-hotel text-sm"></i></div>
          <div>
            <div className="font-bold text-sm leading-none">Hostal Levante</div>
            <div className="text-[9px] text-blue-200 mt-1 uppercase tracking-widest font-bold">Online Assistant</div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <a href="https://www.hostallevante.com" target="_blank" className="text-[10px] bg-white/10 hover:bg-white/20 px-2 py-1 rounded-md border border-white/20 transition-all">RESERVAR</a>
          <button onClick=${() => toggleChat(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10"><i className="fas fa-times"></i></button>
        </div>
      </div>
      
      <div ref=${scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 hide-scroll">
        ${messages.map((m, idx) => html`
          <div key=${idx} className=${`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className=${`max-w-[85%] p-3.5 rounded-2xl text-[13px] leading-relaxed shadow-sm ${m.role === 'user' ? 'bg-[#1e3a8a] text-white rounded-tr-none' : 'bg-white text-slate-700 rounded-tl-none border border-slate-100'}`}>
              ${m.text}
            </div>
          </div>
        `)}
        
        ${messages.length === 1 && html`
          <div className="flex flex-wrap gap-2 pt-2">
            ${(QUICK_TIPS[lang] || QUICK_TIPS.es).map(tip => html`
              <button onClick=${() => onSend(tip)} className="text-[11px] bg-white border border-blue-200 text-blue-600 px-3 py-1.5 rounded-full hover:bg-blue-50 transition-all font-medium shadow-sm">
                ${tip}
              </button>
            `)}
          </div>
        `}
        
        ${isTyping && html`<div className="flex justify-start"><div className="bg-white border p-3 rounded-2xl shadow-sm"><div className="flex space-x-1"><div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></div><div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]"></div><div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.4s]"></div></div></div></div>`}
      </div>

      <div className="p-4 bg-white border-t border-slate-100">
        <div className="flex space-x-2 items-center">
          <input 
            value=${input} 
            onChange=${e => setInput(e.target.value)} 
            onKeyDown=${e => e.key === 'Enter' && onSend()} 
            placeholder="Escribe tu pregunta..." 
            className="flex-1 bg-slate-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" 
          />
          <button onClick=${onSend} className="bg-[#1e3a8a] hover:bg-blue-800 text-white w-10 h-10 rounded-xl flex items-center justify-center transition-colors shadow-lg shadow-blue-900/10">
            <i className="fas fa-paper-plane text-xs"></i>
          </button>
        </div>
      </div>
    </div>
  `;
};

const App = () => {
  const [isAdmin, setIsAdmin] = useState(true);
  const [knowledge, setKnowledge] = useState(() => {
    const s = localStorage.getItem('lev_v23_kb'); // Nueva versión para incluir tips locales
    if (s) return JSON.parse(s);
    
    return [
      { id: 1, title: 'Check-in/Out', content: 'Check-in: 15:00h. Check-out: 11:00h. Recepción 24h. Consigna gratuita para maletas antes y después.' },
      { id: 2, title: 'Pagos', content: 'Tarifa No Reembolsable (pago al reservar) y Solo Alojamiento (depósito 3 días antes). Tasa turística se paga en el hostal.' },
      { id: 3, title: 'Accesibilidad', content: 'IMPORTANTE: No adaptado. Hay escaleras. Ascensor pequeño (no cabe silla de ruedas sin plegar).' },
      { id: 4, title: 'Servicios', content: 'Wifi gratis. Toallas y sábanas incluidas. NO hay TV, NO hay cocina, NO hay desayuno.' },
      { id: 5, title: 'Ubicación y Transporte', content: 'Centro de Barcelona. Aerobús hasta Plaza Catalunya. Metro L3 Liceu a 5 min andando.' },
      { id: 6, title: 'Local Tips: Tapas', content: 'Recomendamos explorar las calles del Barrio Gótico cercanas como Carrer de Ferran o la Plaza Real para encontrar tapas tradicionales.' },
      { id: 7, title: 'Local Tips: Cultura', content: 'Estamos a 2 minutos de la Catedral de Barcelona y a 5 minutos de Las Ramblas. El Museo de Historia de la Ciudad está muy cerca.' },
      { id: 8, title: 'Seguridad', content: 'Barcelona es segura pero recomendamos tener cuidado con las pertenencias en zonas muy concurridas como Las Ramblas.' }
    ];
  });

  useEffect(() => localStorage.setItem('lev_v23_kb', JSON.stringify(knowledge)), [knowledge]);
  if (window.location.search.includes('embed=true')) return html`<${ChatWidget} knowledge=${knowledge} isEmbedded=${true} />`;

  return html`
    <div className="min-h-screen bg-slate-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-[2rem] shadow-2xl overflow-hidden">
        <div className="p-6 bg-[#1e3a8a] text-white flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#1e3a8a] shadow-lg"><i className="fas fa-brain text-lg"></i></div>
            <h1 className="text-xl font-bold">Levante AI Admin</h1>
          </div>
          <div className="flex bg-white/10 p-1 rounded-xl">
            <button onClick=${() => setIsAdmin(true)} className=${`px-4 py-1.5 rounded-lg text-xs font-semibold ${isAdmin ? 'bg-white text-blue-900 shadow-md' : 'text-white'}`}>Editor</button>
            <button onClick=${() => setIsAdmin(false)} className=${`px-4 py-1.5 rounded-lg text-xs font-semibold ${!isAdmin ? 'bg-white text-blue-900 shadow-md' : 'text-white'}`}>Preview</button>
          </div>
        </div>
        
        <div className="p-6">
          ${isAdmin ? html`
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-slate-700 text-sm italic underline">Base de Conocimientos (Incluye Tips Locales)</h3>
                <button onClick=${() => setKnowledge([{id:Date.now(), title:'', content:''}, ...knowledge])} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-[10px] font-bold shadow-lg">NUEVO DATO</button>
              </div>
              <div className="grid gap-3">
                ${knowledge.map(k => html`
                  <div key=${k.id} className="flex flex-col md:flex-row gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <input className="bg-white border border-slate-200 p-2 rounded-lg font-bold text-slate-800 text-xs w-full md:w-1/4" placeholder="Título" value=${k.title} onChange=${e => setKnowledge(knowledge.map(x => x.id === k.id ? {...x, title: e.target.value} : x))} />
                    <textarea className="bg-white border border-slate-200 p-2 rounded-lg text-slate-600 text-xs w-full md:flex-1 resize-none" rows="2" placeholder="Información..." value=${k.content} onChange=${e => setKnowledge(knowledge.map(x => x.id === k.id ? {...x, content: e.target.value} : x))} />
                    <button onClick=${() => setKnowledge(knowledge.filter(x => x.id !== k.id))} className="text-red-300 hover:text-red-500 p-2"><i className="fas fa-trash"></i></button>
                  </div>
                `)}
              </div>
            </div>
          ` : html`
             <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
               <i className="fas fa-comment-dots text-4xl text-blue-200 mb-4"></i>
               <h2 className="text-lg font-bold">Modo de Prueba Activado</h2>
               <p className="text-xs">Usa el botón azul de abajo para chatear.</p>
             </div>
          `}
        </div>
      </div>
      <${ChatWidget} knowledge=${knowledge} isEmbedded=${false} />
    </div>
  `;
};

createRoot(document.getElementById('root')).render(html`<${App} />`);
