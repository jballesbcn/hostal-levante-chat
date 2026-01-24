
import React, { useState, useEffect, useRef } from 'react';
import htm from 'htm';
import { GoogleGenAI } from "@google/genai";

const html = htm.bind(React.createElement);

const UI_TEXT = {
  es: { book: "Reserva", write: "Escribe tu duda...", greeting: "¡Hola! Soy tu Concierge en Hostal Levante. ¿Buscas habitación o necesitas saber cómo llegar?", error: "Lo siento, mi conexión ha fallado un momento.", suggestions: ["¿Cómo llegar?", "Check-in 24h?", "¿Tienen Wifi?", "Reservar"] },
  en: { book: "Book Now", write: "Type your question...", greeting: "Hi! I'm your Concierge at Hostal Levante. Do you need a room or help with directions?", error: "I'm sorry, I lost my connection for a second.", suggestions: ["How to get here?", "24h Check-in?", "Free Wifi?", "Book"] },
  it: { book: "Prenota", write: "Scrivi la tua domanda...", greeting: "Ciao! Sono il tuo Concierge all'Hostal Levante. Cerchi una camera o hai bisogno di indicazioni?", error: "Scusa, la mia connessione si è interrotta per un momento.", suggestions: ["Come arrivare?", "Check-in 24h?", "Prenota"] },
  de: { book: "Buchen", write: "Schreiben Sie Ihre Frage...", greeting: "Hallo! Ich bin Ihr Concierge im Hostal Levante. Suchen Sie ein Zimmer oder brauchen Sie Hilfe?", error: "Entschuldigung, meine Verbindung wurde kurz unterbrochen.", suggestions: ["Anfahrt?", "24h Check-in?", "Buchen"] },
  fr: { book: "Réserver", write: "Écrivez votre question...", greeting: "Bonjour ! Je suis votre Concierge à l'Hostal Levante. Vous cherchez une chambre ou des indications ?", error: "Désolé, j'ai perdu ma connexion pendant un moment.", suggestions: ["Comment venir ?", "Check-in 24h ?", "Réserver"] },
  nl: { book: "Boeken", write: "Typ je vraag...", greeting: "Hallo! Ik ben je conciërge bij Hostal Levante. Zoek je een kamer of heb je hulp nodig?", error: "Sorry, ik ben de verbinding even kwijt.", suggestions: ["Hoe kom ik er?", "24u Check-in?", "Boeken"] },
  pt: { book: "Reservar", write: "Digite sua duda...", greeting: "Olá! Sou o seu Concierge no Hostal Levante. Procura um quarto o precisa de ajuda?", error: "Desculpe, perdi minha conexão por un momento.", suggestions: ["Como chegar?", "Check-in 24h?", "Reservar"] },
  ca: { book: "Reserva", write: "Escriu el teu dubte...", greeting: "Hola! Soc el teu Concierge a l'Hostal Levante. Busques habitació o necessites saber com arribar-hi?", error: "Ho sento, la meva connexió ha fallat un momento.", suggestions: ["Com arribar-hi?", "Check-in 24h?", "Reserva"] }
};

const EXTERNAL_BOOKING_URL = "https://booking.redforts.com/e4mh/";

export const ChatWidget = ({ knowledge, isEmbedded, forcedLang }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);
  
  const lang = forcedLang || 'es';
  const t = UI_TEXT[lang] || UI_TEXT.es;

  useEffect(() => {
    setMessages([{ role: 'model', text: t.greeting }]);
  }, [lang]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const goToBooking = () => window.open(EXTERNAL_BOOKING_URL, '_blank');
  
  const onSend = async (textOverride) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim() || isTyping) return;
    
    const lowerText = textToSend.toLowerCase();
    const bookKeywords = ['reservar', 'book', 'reserva', 'prenota', 'buchen', 'réserver', 'boeken', 'reserveren', 'reservar'];
    if (bookKeywords.some(k => lowerText.includes(k))) {
        goToBooking();
        return;
    }

    setMessages(prev => [...prev, { role: 'user', text: textToSend }]);
    if (!textOverride) setInput('');
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const kbContent = (knowledge || []).map(k => `${k.title}: ${k.content}`).join('\n');
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: textToSend,
        config: { 
            temperature: 0.3, 
            systemInstruction: `You are the CONCIERGE of Hostal Levante in Barcelona.
            
            IMPORTANT LANGUAGE POLICY:
            - You are a polyglot assistant. You speak all languages fluently.
            - ALWAYS respond in the EXACT same language used by the user. 
            - If the user writes in English, reply in English. If they write in French, reply in French.
            - NEVER, under any circumstances, say "I only speak Spanish" or "I am configured for one language". That is strictly forbidden.
            
            STYLE:
            - Professional, warm, and helpful.
            - NO asterisks (*). Use "•" for list items.
            - Keep responses concise.
            
            KNOWLEDGE:
            ${kbContent}`
        }
      });

      const text = response.text?.replace(/\*/g, '') || t.error;
      setMessages(prev => [...prev, { role: 'model', text }]);
    } catch (err) {
      console.error(err);
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
      <button onClick=${() => toggleChat(true)} className="w-16 h-16 bg-[#1e3a8a] text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-all border-4 border-white shadow-blue-900/30">
        <i className="fas fa-concierge-bell text-2xl"></i>
      </button>
    </div>
  `;

  return html`
    <div className=${`flex flex-col bg-white shadow-2xl overflow-hidden transition-all duration-300 ${isEmbedded ? 'w-full h-full' : 'fixed bottom-5 right-5 w-[380px] h-[600px] rounded-[2.5rem] border border-slate-100'}`}>
      <div className="bg-gradient-to-r from-[#1e3a8a] to-[#2563eb] p-5 text-white flex justify-between items-center relative">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shadow-inner">
             <i className="fas fa-concierge-bell text-sm"></i>
          </div>
          <div>
            <div className="font-black text-[13px]">Hostal Levante</div>
            <div className="text-[10px] font-medium opacity-80 uppercase tracking-widest">Concierge AI</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick=${goToBooking} className="bg-white text-[#1e3a8a] px-4 py-2 rounded-xl text-[11px] font-black uppercase hover:scale-105 transition-all shadow-lg shadow-blue-900/20">
            ${t.book}
          </button>
          <button onClick=${() => toggleChat(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10">
            <i className="fas fa-times text-xs"></i>
          </button>
        </div>
      </div>
      
      <div ref=${scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#f8fafc] hide-scroll">
        ${messages.map((m, i) => html`
          <div key=${i} className=${`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeInUp`}>
            <div className=${`max-w-[88%] p-4 rounded-2xl text-[13px] shadow-sm ${m.role === 'user' ? 'bg-[#1e3a8a] text-white rounded-tr-none shadow-blue-900/10' : 'bg-white text-slate-700 rounded-tl-none border border-slate-100'}`}>
               ${m.text}
            </div>
          </div>
        `)}
        
        ${isTyping && html`
          <div className="flex gap-1.5 p-3.5 bg-white rounded-2xl border border-slate-100 w-fit ml-2 animate-pulse">
            <div className="w-1.5 h-1.5 bg-[#1e3a8a] rounded-full animate-bounce"></div>
            <div className="w-1.5 h-1.5 bg-[#1e3a8a] rounded-full animate-bounce [animation-delay:0.2s]"></div>
            <div className="w-1.5 h-1.5 bg-[#1e3a8a] rounded-full animate-bounce [animation-delay:0.4s]"></div>
          </div>
        `}
      </div>

      <div className="p-4 bg-white border-t rounded-b-[2.5rem]">
        <div className="flex gap-2 bg-slate-50 p-1.5 rounded-2xl items-center border border-slate-200 focus-within:border-[#1e3a8a] transition-all">
          <input 
            value=${input} 
            onChange=${e => setInput(e.target.value)} 
            onKeyDown=${e => e.key === 'Enter' && onSend()}
            placeholder=${t.write}
            className="flex-1 bg-transparent text-[13px] px-3 py-2.5 outline-none"
            disabled=${isTyping}
          />
          <button onClick=${() => onSend()} disabled=${isTyping || !input.trim()} className="bg-[#1e3a8a] text-white w-10 h-10 rounded-xl flex items-center justify-center disabled:opacity-30 transition-all shadow-lg shadow-blue-900/10">
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
