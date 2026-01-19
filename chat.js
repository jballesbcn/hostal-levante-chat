
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
  es: { book: "Reservar", write: "Escribe un mensaje...", error: "Error de conexión" },
  en: { book: "Book", write: "Type a message...", error: "Connection error" },
  ca: { book: "Reservar", write: "Escriu un missatge...", error: "Error de connexió" }
};

const askAI = async (messages, knowledge, lang) => {
  // Inicialización estrictamente según las reglas del SDK
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const knowledgeBase = knowledge.map(k => `${k.title}: ${k.content}`).join('\n');
  const systemInstruction = `Eres el asistente del Hostal Levante en Barcelona. Idioma: ${lang}. 
  Responde de forma amable y concisa. Usa **negritas** para información relevante.
  Información del hostal: ${knowledgeBase}`;

  const contents = messages.map(m => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.text }]
  }));

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
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isTyping]);

  const onSend = async (text) => {
    const msgText = typeof text === 'string' ? text : input;
    if (!msgText.trim() || isTyping) return;

    const newMessages = [...messages, { role: 'user', text: msgText }];
    setMessages(newMessages);
    setInput('');
    setIsTyping(true);

    try {
      const reply = await askAI(newMessages, knowledge, lang);
      setMessages(prev => [...prev, { role: 'model', text: reply }]);
    } catch (err) {
      console.error("Gemini Error:", err);
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
      <button onClick=${() => toggleChat(true)} className="w-16 h-16 bg-[#1e3a8a] text-white rounded-full shadow-xl flex items-center justify-center hover:scale-110 transition-transform">
        <i className="fas fa-comments text-2xl"></i>
      </button>
    </div>
  `;

  return html`
    <div className=${`flex flex-col bg-white shadow-2xl animate-chat ${isEmbedded ? 'w-full h-full' : 'fixed bottom-5 right-5 w-[350px] h-[500px] rounded-2xl border'}`}>
      <div className="bg-[#1e3a8a] p-4 text-white flex justify-between items-center rounded-t-2xl">
        <span className="font-bold text-sm">Hostal Levante</span>
        <button onClick=${() => toggleChat(false)} className="text-white/80 hover:text-white"><i className="fas fa-times"></i></button>
      </div>
      
      <div ref=${scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 hide-scroll">
        ${messages.map((m, i) => html`
          <div key=${i} className=${`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className=${`max-w-[85%] p-3 rounded-xl text-sm ${m.role === 'user' ? 'bg-[#1e3a8a] text-white' : 'bg-white border text-gray-700'}`}>
              ${m.text}
            </div>
            ${m.isGreeting && html`
              <div className="flex flex-wrap gap-2 mt-2">
                ${(QUICK_TIPS[lang] || QUICK_TIPS.es).map(tip => html`
                  <button onClick=${() => onSend(tip)} className="text-[11px] bg-white border border-[#1e3a8a] text-[#1e3a8a] px-3 py-1 rounded-full hover:bg-[#1e3a8a] hover:text-white transition-colors">
                    ${tip}
                  </button>
                `)}
              </div>
            `}
          </div>
        `)}
        ${isTyping && html`<div className="text-xs text-gray-400 italic">Escribiendo...</div>`}
      </div>

      <div className="p-3 border-t flex gap-2">
        <input 
          value=${input} 
          onChange=${e => setInput(e.target.value)} 
          onKeyDown=${e => e.key === 'Enter' && onSend()} 
          placeholder=${t.write}
          className="flex-1 text-sm border rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-[#1e3a8a]" 
        />
        <button onClick=${onSend} className="bg-[#1e3a8a] text-white px-3 py-2 rounded-lg hover:bg-[#162d6b]">
          <i className="fas fa-paper-plane"></i>
        </button>
      </div>
    </div>
  `;
};
