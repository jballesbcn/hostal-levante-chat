
import React, { useState, useEffect, useRef } from 'react';
import htm from 'htm';
import { GoogleGenAI } from "@google/genai";

const html = htm.bind(React.createElement);

const GREETINGS = {
  es: "¡Hola! Soy el asistente del Hostal Levante. ¿En qué puedo ayudarte?",
  en: "Hi! I'm the Hostal Levante assistant. How can I help you?",
  ca: "Hola! Soc l'assistent de l'Hostal Levante. En què et puc ayudar?"
};

const QUICK_TIPS = {
  es: ["¿Cómo llegar?", "Horario Check-in", "¿Hay Wifi?", "Lugares cercanos"],
  en: ["How to get here?", "Check-in time", "Is there Wifi?", "Nearby places"],
  ca: ["Com arribar-hi?", "Horari Check-in", "Hi ha Wifi?", "Llocs propers"]
};

const UI_TEXT = {
  es: { book: "Reservar ahora", write: "Escribe...", error: "Error de conexión" },
  en: { book: "Book now", write: "Type...", error: "Connection error" },
  ca: { book: "Reservar ara", write: "Escriu...", error: "Error de connexió" }
};

const askAI = async (messages, knowledge, lang) => {
  // Inicialización siguiendo estrictamente el SDK
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const knowledgeBase = knowledge.map(k => `${k.title}: ${k.content}`).join('\n');
  const systemInstruction = `Eres el asistente oficial del Hostal Levante en Barcelona. Idioma: ${lang}. 
  Responde de forma amable y servicial. Usa **negritas** para información clave. 
  Respuestas cortas (máximo 2 párrafos).
  
  CONTEXTO DEL HOSTAL:
  ${knowledgeBase}`;

  // REGLA CRÍTICA: El historial debe empezar por 'user' y alternar.
  // Filtramos el saludo inicial si es de tipo 'model'.
  const contents = [];
  for (const m of messages) {
    const role = m.role === 'user' ? 'user' : 'model';
    if (contents.length === 0 && role === 'model') continue;
    contents.push({ role, parts: [{ text: m.text }] });
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: contents,
    config: {
      systemInstruction,
      temperature: 0.7,
    }
  });

  return response.text;
};

export const ChatWidget = ({ knowledge, isEmbedded }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);
  const lang = new URLSearchParams(window.location.search).get('lang') || 'es';
  const t = UI_TEXT[lang] || UI_TEXT.es;

  useEffect(() => {
    setMessages([{ role: 'model', text: GREETINGS[lang] || GREETINGS.es, isGreeting: true }]);
  }, [lang]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  const onSend = async (customText) => {
    const text = typeof customText === 'string' ? customText : input;
    if (!text.trim() || isTyping) return;

    const userMsg = { role: 'user', text };
    const currentHistory = [...messages, userMsg];
    
    setMessages(currentHistory);
    setInput('');
    setIsTyping(true);

    try {
      const reply = await askAI(currentHistory, knowledge, lang);
      setMessages(prev => [...prev, { role: 'model', text: reply }]);
    } catch (err) {
      console.error("Gemini Error:", err);
      setMessages(prev => [...prev, { role: 'model', text: `${t.error}. Por favor, vuelve a intentarlo.` }]);
    } finally {
      setIsTyping(false);
    }
  };

  const toggleChat = (state) => {
    setIsOpen(state);
    if (isEmbedded) window.parent.postMessage({ type: 'chatbot_state', open: state }, '*');
  };

  if (!isOpen && isEmbedded) return html`
    <div className="w-full h-full flex items-center justify-center bg-transparent">
      <button onClick=${() => toggleChat(true)} className="w-16 h-16 bg-[#1e3a8a] text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform pulse-blue border-4 border-white">
        <i className="fas fa-comments text-2xl"></i>
      </button>
    </div>
  `;

  return html`
    <div className=${`flex flex-col bg-white shadow-2xl animate-chat ${isEmbedded ? 'w-full h-full' : 'fixed bottom-5 right-5 w-[380px] h-[600px] rounded-[2rem] border'}`}>
      <div className="bg-[#1e3a8a] p-5 text-white flex justify-between items-center rounded-t-[2rem]">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="font-bold text-sm tracking-wide leading-none">Asistente Levante</span>
        </div>
        <button onClick=${() => toggleChat(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors">
          <i className="fas fa-times"></i>
        </button>
      </div>
      
      <div ref=${scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 hide-scroll">
        ${messages.map((m, i) => html`
          <div key=${i} className=${`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className=${`max-w-[85%] p-3 rounded-2xl text-[13px] shadow-sm leading-relaxed ${m.role === 'user' ? 'bg-[#1e3a8a] text-white rounded-tr-none' : 'bg-white border text-slate-700 rounded-tl-none'}`}>
               <span style=${{ whiteSpace: 'pre-wrap' }}>${m.text}</span>
            </div>
            
            ${m.isGreeting && html`
              <div className="flex flex-wrap gap-2 mt-3">
                ${(QUICK_TIPS[lang] || QUICK_TIPS.es).map(tip => html`
                  <button key=${tip} onClick=${() => onSend(tip)} className="text-[11px] bg-white border border-[#1e3a8a] text-[#1e3a8a] px-3 py-1.5 rounded-full hover:bg-[#1e3a8a] hover:text-white transition-all shadow-sm transform hover:-translate-y-0.5">
                    ${tip}
                  </button>
                `)}
              </div>
            `}
          </div>
        `)}
        
        ${isTyping && html`
          <div className="flex items-center space-x-2 bg-white p-3 rounded-2xl border shadow-sm w-fit">
            <div className="flex space-x-1">
              <div className="w-1.5 h-1.5 bg-[#1e3a8a] rounded-full animate-bounce" style=${{animationDelay: '0ms'}}></div>
              <div className="w-1.5 h-1.5 bg-[#1e3a8a] rounded-full animate-bounce" style=${{animationDelay: '150ms'}}></div>
              <div className="w-1.5 h-1.5 bg-[#1e3a8a] rounded-full animate-bounce" style=${{animationDelay: '300ms'}}></div>
            </div>
          </div>
        `}
      </div>

      <div className="p-4 bg-white border-t rounded-b-[2rem]">
        <div className="flex gap-2 bg-slate-100 p-1.5 rounded-2xl items-center focus-within:ring-2 focus-within:ring-[#1e3a8a]/20 transition-all shadow-inner">
          <input 
            value=${input} 
            onChange=${e => setInput(e.target.value)} 
            onKeyDown=${e => e.key === 'Enter' && onSend()} 
            placeholder=${t.write}
            className="flex-1 bg-transparent text-sm px-3 py-2 outline-none" 
            disabled=${isTyping}
          />
          <button 
            onClick=${onSend} 
            disabled=${isTyping || !input.trim()}
            className="bg-[#1e3a8a] text-white w-10 h-10 rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-50 shadow-lg shadow-blue-900/20">
            <i className=${`fas ${isTyping ? 'fa-circle-notch animate-spin' : 'fa-paper-plane'}`}></i>
          </button>
        </div>
      </div>
    </div>
  `;
};
