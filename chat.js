
import React, { useState, useEffect, useRef } from 'react';
import htm from 'htm';
import { GoogleGenAI } from "@google/genai";

const html = htm.bind(React.createElement);

const UI_TEXT = {
  es: { book: "Reservar", write: "Escribe tu duda...", greeting: "¡Hola! Soy el asistente de Hostal Levante. ¿En qué puedo ayudarte?", error: "Lo siento, hubo un problema de conexión. Inténtalo de nuevo." },
  en: { book: "Book", write: "Type your question...", greeting: "Hi! I'm the Hostal Levante assistant. How can I help you?", error: "Sorry, there was a connection issue. Please try again." }
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
    setMessages([{ role: 'model', text: t.greeting }]);
  }, [lang]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isTyping]);

  const onSend = async () => {
    if (!input.trim() || isTyping) return;
    
    const userText = input;
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setInput('');
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const kb = knowledge.map(k => `${k.title}: ${k.content}`).join('\n');
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Eres el asistente oficial del Hostal Levante. Responde en ${lang}. 
        Usa esta información para responder:
        ${kb}
        
        Pregunta del cliente: ${userText}`,
        config: { temperature: 0.7 }
      });

      if (!response.text) throw new Error("No response text");
      setMessages(prev => [...prev, { role: 'model', text: response.text }]);
    } catch (err) {
      console.error("Chat Error:", err);
      setMessages(prev => [...prev, { role: 'model', text: t.error }]);
    } finally {
      setIsTyping(false);
    }
  };

  const toggleChat = (state) => {
    setIsOpen(state);
    if (isEmbedded) window.parent.postMessage({ type: 'chatbot_state', open: state }, '*');
  };

  if (!isOpen && isEmbedded) return html`
    <div className="w-full h-full flex items-center justify-center">
      <button onClick=${() => toggleChat(true)} className="w-16 h-16 bg-[#1e3a8a] text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-all border-4 border-white">
        <i className="fas fa-comments text-2xl"></i>
      </button>
    </div>
  `;

  return html`
    <div className=${`flex flex-col bg-white shadow-2xl overflow-hidden ${isEmbedded ? 'w-full h-full' : 'fixed bottom-5 right-5 w-[380px] h-[600px] rounded-[2rem] border'}`}>
      <div className="bg-[#1e3a8a] p-5 text-white flex justify-between items-center rounded-t-[2rem]">
        <div>
          <div className="font-bold text-sm leading-tight">Hostal Levante</div>
          <div className="text-[10px] opacity-70">Asistente Virtual</div>
        </div>
        <div className="flex items-center gap-2">
           <button onClick=${() => window.open('https://www.hostallevante.com/reserva', '_blank')} className="bg-white text-[#1e3a8a] px-3 py-1 rounded-full text-[10px] font-bold">
             ${t.book}
           </button>
           <button onClick=${() => toggleChat(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10">
             <i className="fas fa-times"></i>
           </button>
        </div>
      </div>
      
      <div ref=${scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 hide-scroll">
        ${messages.map((m, i) => html`
          <div key=${i} className=${`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className=${`max-w-[85%] p-3 rounded-2xl text-[13px] shadow-sm ${m.role === 'user' ? 'bg-[#1e3a8a] text-white rounded-tr-none' : 'bg-white text-slate-700 rounded-tl-none border'}`}>
               ${m.text}
            </div>
          </div>
        `)}
        ${isTyping && html`
          <div className="flex gap-1 p-2 bg-white rounded-xl border w-fit animate-pulse">
            <div className="w-1.5 h-1.5 bg-[#1e3a8a] rounded-full"></div>
            <div className="w-1.5 h-1.5 bg-[#1e3a8a] rounded-full"></div>
            <div className="w-1.5 h-1.5 bg-[#1e3a8a] rounded-full"></div>
          </div>
        `}
      </div>

      <div className="p-4 bg-white border-t rounded-b-[2rem]">
        <div className="flex gap-2 bg-slate-100 p-1.5 rounded-2xl items-center">
          <input 
            value=${input} 
            onChange=${e => setInput(e.target.value)} 
            onKeyDown=${e => e.key === 'Enter' && onSend()}
            placeholder=${t.write}
            className="flex-1 bg-transparent text-sm px-3 py-2 outline-none"
            disabled=${isTyping}
          />
          <button onClick=${onSend} disabled=${isTyping || !input.trim()} className="bg-[#1e3a8a] text-white w-10 h-10 rounded-xl flex items-center justify-center disabled:opacity-50 transition-all">
            <i className="fas fa-paper-plane"></i>
          </button>
        </div>
      </div>
    </div>
  `;
};
