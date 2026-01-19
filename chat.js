
import React, { useState, useEffect, useRef } from 'react';
import htm from 'htm';
import { GoogleGenAI } from "@google/genai";

const html = htm.bind(React.createElement);

const UI_TEXT = {
  es: { 
    book: "Reserva", 
    contact: "Contacto",
    write: "Escribe tu duda...", 
    greeting: "¡Hola! Soy tu Concierge en Hostal Levante. ¿Buscas habitación o necesitas saber cómo llegar?", 
    error: "El sistema está un poco saturado. Por favor, reintenta enviar tu mensaje en unos segundos.",
    suggestions: ["¿Cómo llegar?", "Check-in 24h?", "¿Tienen Wifi?", "Qué ver cerca", "Reservar"]
  },
  en: { 
    book: "Book Now", 
    contact: "Contact",
    write: "Type your question...", 
    greeting: "Hi! I'm your Concierge at Hostal Levante. Do you need a room or help with directions?", 
    error: "The system is a bit busy. Please try sending your message again in a few seconds.",
    suggestions: ["How to get here?", "24h Check-in?", "Free Wifi?", "Local tips", "Book"]
  }
};

const BOOKING_URL = "https://booking.redforts.com/e4mh/";

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
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isTyping]);

  const goToBooking = () => {
    window.open(BOOKING_URL, '_blank');
  };

  const goToContact = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('view', 'contact');
    window.location.href = url.toString();
  };

  const fetchWithRetry = async (ai, config, text, retries = 2, delay = 2000) => {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: text,
        config: config
      });
      return response;
    } catch (err) {
      if (retries > 0 && (err.status === 429 || err.message?.includes('429'))) {
        await new Promise(res => setTimeout(res, delay));
        return fetchWithRetry(ai, config, text, retries - 1, delay * 2);
      }
      throw err;
    }
  };

  const onSend = async (textOverride) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim() || isTyping) return;
    
    const lowerText = textToSend.toLowerCase();
    if (lowerText.includes('reservar') || (lowerText.includes('book') && !lowerText.includes('ing'))) {
        goToBooking();
        return;
    }
    if (lowerText.includes('contacto') || lowerText.includes('contact')) {
        goToContact();
        return;
    }

    setMessages(prev => [...prev, { role: 'user', text: textToSend }]);
    if (!textOverride) setInput('');
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const kbContent = (knowledge || []).map(k => `${k.title}: ${k.content}`).join('\n');
      
      const config = { 
        temperature: 0.7,
        systemInstruction: `Eres el CONCIERGE experto del Hostal Levante en Barcelona. 
        
        REGLAS DE FORMATO (ESTRICTO):
        1. NO USES ASTERISCOS (*). Están prohibidos.
        2. Para listas, usa exclusivamente el punto "•" al inicio de la línea.
        3. Separa las ideas en párrafos cortos.
        4. Usa un salto de línea simple para separar párrafos. No amontones el texto.
        5. No uses negrita ni Markdown. Solo texto limpio y legible.
        
        CONTENIDO:
        - Check-in: 15:00h (Recepción 24h). Check-out: 11:00h.
        - Ubicación: Gótico, cerca de Metro Liceu (L3).
        - No tenemos TV ni cocina. Ofrece cafeterías cercanas con amabilidad.
        - Accesibilidad: NO adaptado (escaleras, ascensor muy pequeño).
        
        Información del Hostal:
        ${kbContent}`
      };

      const response = await fetchWithRetry(ai, config, textToSend);
      if (!response.text) throw new Error("Sin respuesta");
      setMessages(prev => [...prev, { role: 'model', text: response.text }]);
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

  // Botón cuando el chat está cerrado
  if (!isOpen) return html`
    <div className=${isEmbedded ? "w-full h-full flex items-center justify-center" : "fixed bottom-5 right-5 z-50"}>
      <button onClick=${() => toggleChat(true)} className="w-16 h-16 bg-[#1e3a8a] text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all border-4 border-white animate-bounce-slow">
        <i className="fas fa-concierge-bell text-2xl"></i>
      </button>
    </div>
    <style>
      @keyframes bounce-slow { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
      .animate-bounce-slow { animation: bounce-slow 3s infinite ease-in-out; }
    </style>
  `;

  return html`
    <div className=${`flex flex-col bg-white shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden transition-all duration-300 ${isEmbedded ? 'w-full h-full' : 'fixed bottom-5 right-5 w-[380px] h-[600px] rounded-[2.5rem] border border-slate-100 z-50'}`}>
      
      <!-- Header -->
      <div className="bg-gradient-to-r from-[#1e3a8a] to-[#2563eb] p-5 text-white flex justify-between items-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center shadow-inner border border-white/20">
             <i className="fas fa-concierge-bell text-sm"></i>
          </div>
          <div>
            <div className="font-black text-[13px] tracking-tight">Hostal Levante</div>
            <div className="flex items-center gap-1.5">
               <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
               <span className="text-[10px] font-medium opacity-80 uppercase tracking-widest">Concierge AI</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 relative z-10">
          <button onClick=${goToBooking} className="bg-white text-[#1e3a8a] hover:bg-blue-50 px-4 py-2 rounded-xl text-[11px] font-black uppercase transition-all shadow-lg active:scale-95 border border-white">
            <i className="fas fa-calendar-check mr-2"></i> ${t.book}
          </button>
          <button onClick=${() => toggleChat(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors">
            <i className="fas fa-times text-xs"></i>
          </button>
        </div>
      </div>
      
      <!-- Chat Body -->
      <div ref=${scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#f8fafc] hide-scroll">
        ${messages.map((m, i) => html`
          <div key=${i} className=${`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeInUp`}>
            <div className=${`max-w-[88%] p-4 rounded-2xl text-[13px] leading-[1.6] shadow-sm whitespace-pre-wrap ${m.role === 'user' ? 'bg-[#1e3a8a] text-white rounded-tr-none shadow-blue-900/10' : 'bg-white text-slate-700 rounded-tl-none border border-slate-100'}`}>
               ${m.text}
            </div>
          </div>
        `)}
        
        <!-- Suggestions -->
        ${messages.length === 1 && !isTyping && html`
          <div className="flex flex-wrap gap-2 mt-4 animate-fadeInUp">
            ${t.suggestions.map(s => html`
              <button key=${s} onClick=${() => onSend(s)} className="bg-white border border-slate-200 text-slate-600 text-[11px] font-bold px-3 py-2 rounded-full hover:border-[#1e3a8a] hover:text-[#1e3a8a] transition-all active:scale-95 shadow-sm">
                ${s}
              </button>
            `)}
          </div>
        `}

        ${isTyping && html`
          <div className="flex gap-1.5 p-3.5 bg-white rounded-2xl border border-slate-100 w-fit ml-2 shadow-sm animate-pulse">
            <div className="w-1.5 h-1.5 bg-[#1e3a8a] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-1.5 h-1.5 bg-[#1e3a8a] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-1.5 h-1.5 bg-[#1e3a8a] rounded-full animate-bounce"></div>
          </div>
        `}
      </div>

      <!-- Input Area -->
      <div className="p-4 bg-white border-t rounded-b-[2.5rem]">
        <div className="flex gap-2 bg-slate-50 p-1.5 rounded-2xl items-center border border-slate-200 focus-within:border-[#1e3a8a] transition-all">
          <input 
            value=${input} 
            onChange=${e => setInput(e.target.value)} 
            onKeyDown=${e => e.key === 'Enter' && onSend()}
            placeholder=${t.write}
            className="flex-1 bg-transparent text-[13px] px-3 py-2.5 outline-none placeholder:text-slate-400"
            disabled=${isTyping}
          />
          <button onClick=${() => onSend()} disabled=${isTyping || !input.trim()} className="bg-[#1e3a8a] text-white w-10 h-10 rounded-xl flex items-center justify-center disabled:opacity-30 transition-all hover:scale-105 active:scale-95">
            <i className="fas fa-paper-plane text-[10px]"></i>
          </button>
        </div>
      </div>
    </div>
    
    <style>
      @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      .animate-fadeInUp { animation: fadeInUp 0.4s ease-out forwards; }
    </style>
  `;
};
