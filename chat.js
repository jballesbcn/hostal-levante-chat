
import React, { useState, useEffect, useRef } from 'react';
import htm from 'htm';
import { GoogleGenAI } from "@google/genai";

const html = htm.bind(React.createElement);

const GREETINGS = {
  es: "¡Hola! Soy el asistente del Hostal Levante. ¿En qué puedo ayudarte?",
  en: "Hi! I'm the Hostal Levante assistant. How can I help you?",
  ca: "Hola! Soc l'assistent de l'Hostal Levante. En què et puc ayudar?",
  de: "Hallo! Ich bin der Levante-Assistent. Wie kann ich helfen?",
  it: "Ciao! Sono l'assistente del Hostal Levante. Come posso aiutarti?",
  fr: "Bonjour ! Je suis l'assistant de l'Hostal Levante. Comment puis-je vous aider ?",
  nl: "Hallo! Hoe kan ik u helpen?",
  pt: "Olá! Como posso ajudá-lo?"
};

const QUICK_TIPS = {
  es: ["¿Cómo llegar?", "Horario Check-in", "¿Hay Wifi?", "Lugares cercanos"],
  en: ["How to get here?", "Check-in time", "Is there Wifi?", "Nearby places"],
  ca: ["Com arribar-hi?", "Horari Check-in", "Hi ha Wifi?", "Llocs propers"]
};

const UI_TEXT = {
  es: { book: "Reservar ahora", write: "Escribe...", error: "Lo siento, ha habido un problema de conexión. ¿Puedes repetir?" },
  en: { book: "Book now", write: "Type...", error: "Sorry, there was a connection issue. Can you try again?" },
  ca: { book: "Reservar ara", write: "Escriu...", error: "Ho sento, hi ha un problema de connexió. Pots repetir?" }
};

const BOOKING_URL = "https://booking.redforts.com/e4mh/";

const FormattedMessage = ({ text }) => {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return html`
    <span style=${{ whiteSpace: 'pre-wrap', display: 'block' }}>
      ${parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return html`<b key=${i} className="font-bold text-slate-900">${part.slice(2, -2)}</b>`;
        }
        return part;
      })}
    </span>
  `;
};

const askAI = async (history, knowledge, lang) => {
  // Inicialización directa según las reglas de la plataforma
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const knowledgeStr = knowledge.map(k => `${k.title}: ${k.content}`).join(' | ');
  const systemInstruction = `Eres el asistente oficial del Hostal Levante en Barcelona. Idioma: ${lang}. 
Eres amable y servicial. 
NORMAS: 
- Respuestas breves (máx 2-3 párrafos).
- Usa **negritas** para datos importantes.
- Si no sabes algo, indica que contacten por el formulario.
CONOCIMIENTO: ${knowledgeStr}`;

  // Filtrar historial: Debe empezar por 'user' y alternar roles
  const contents = [];
  let lastRole = null;

  for (const msg of history) {
    const role = msg.role === 'user' ? 'user' : 'model';
    // Saltamos mensajes del bot al inicio
    if (contents.length === 0 && role === 'model') continue;
    // Evitamos roles duplicados seguidos
    if (role === lastRole) continue;
    
    contents.push({
      role: role,
      parts: [{ text: msg.text }]
    });
    lastRole = role;
  }

  // Si por algún motivo el filtrado falla, enviamos el último mensaje del usuario
  if (contents.length === 0) {
    contents.push({ role: 'user', parts: [{ text: history[history.length - 1].text }] });
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: contents,
    config: {
      systemInstruction,
      temperature: 0.7
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

  const toggleChat = (state) => {
    setIsOpen(state);
    if (isEmbedded) {
        window.parent.postMessage({ type: 'chatbot_state', open: state }, '*');
    }
  };

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isTyping]);

  const onSend = async (customText) => {
    const text = typeof customText === 'string' ? customText : input;
    if (!text.trim() || isTyping) return;

    const userMsg = { role: 'user', text };
    const newMsgs = [...messages, userMsg];
    
    setMessages(newMsgs);
    setInput('');
    setIsTyping(true);

    try {
      const reply = await askAI(newMsgs, knowledge, lang);
      setMessages(prev => [...prev, { role: 'model', text: reply }]);
    } catch (err) {
      console.error("Chat Error:", err);
      setMessages(prev => [...prev, { role: 'model', text: t.error }]);
    } finally {
      setIsTyping(false);
    }
  };

  if (!isOpen && isEmbedded) return html`
    <div className="w-full h-full flex items-center justify-center bg-transparent">
      <button onClick=${() => toggleChat(true)} className="w-16 h-16 bg-[#1e3a8a] text-white rounded-full shadow-2xl flex items-center justify-center pulse-blue border-4 border-white">
        <i className="fas fa-comments text-2xl"></i>
      </button>
    </div>
  `;

  return html`
    <div className=${`flex flex-col bg-white shadow-2xl animate-chat ${isEmbedded ? 'w-full h-full' : 'fixed bottom-5 right-5 w-[380px] h-[600px] rounded-[2rem] border'}`}>
      <div className="bg-[#1e3a8a] p-4 text-white flex justify-between items-center rounded-t-[2rem]">
        <div className="flex items-center space-x-2"><i className="fas fa-hotel"></i><span className="font-bold text-sm">Hostal Levante</span></div>
        <div className="flex items-center space-x-2">
          <a href=${BOOKING_URL} target="_blank" className="bg-white text-[#1e3a8a] text-[10px] font-bold px-3 py-1 rounded-full uppercase">${t.book}</a>
          <button onClick=${() => toggleChat(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10"><i className="fas fa-times"></i></button>
        </div>
      </div>
      <div ref=${scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 hide-scroll">
        ${messages.map((m, idx) => html`
          <div key=${idx} className=${`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className=${`max-w-[85%] p-3 rounded-2xl text-[13px] ${m.role === 'user' ? 'bg-[#1e3a8a] text-white rounded-tr-none' : 'bg-white text-slate-700 rounded-tl-none border shadow-sm'}`}>
              <${FormattedMessage} text=${m.text} />
            </div>
            ${m.isGreeting && html`
              <div className="flex flex-wrap gap-2 mt-3">
                ${(QUICK_TIPS[lang] || QUICK_TIPS.es).map(tip => html`
                  <button key=${tip} onClick=${() => onSend(tip)} className="text-[11px] bg-white border border-[#1e3a8a] text-[#1e3a8a] px-3 py-1.5 rounded-full hover:bg-[#1e3a8a] hover:text-white transition-all shadow-sm">
                    ${tip}
                  </button>
                `)}
              </div>
            `}
          </div>
        `)}
        ${isTyping && html`
          <div className="flex items-center space-x-2 mt-2 ml-1">
             <div className="flex space-x-1">
                <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style=${{animationDelay: '0ms'}}></div>
                <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style=${{animationDelay: '150ms'}}></div>
                <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style=${{animationDelay: '300ms'}}></div>
             </div>
          </div>
        `}
      </div>
      <div className="p-4 bg-white border-t flex space-x-2 rounded-b-[2rem]">
        <input 
          value=${input} 
          onChange=${e => setInput(e.target.value)} 
          onKeyDown=${e => e.key === 'Enter' && onSend()} 
          placeholder=${t.write} 
          className="flex-1 bg-slate-100 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1e3a8a]/20" 
        />
        <button onClick=${onSend} className="bg-[#1e3a8a] text-white w-10 h-10 rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all"><i className="fas fa-paper-plane"></i></button>
      </div>
    </div>
  `;
};
