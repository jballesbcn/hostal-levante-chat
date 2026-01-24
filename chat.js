
import React, { useState, useEffect, useRef } from 'react';
import htm from 'htm';
import { GoogleGenAI } from "@google/genai";

const html = htm.bind(React.createElement);

const UI_TEXT = {
  es: { book: "Reserva", write: "Escribe tu duda...", greeting: "¡Hola! Soy tu Concierge en Hostal Levante. ¿Buscas habitación o necesitas saber cómo llegar?", error: "Lo siento, mi conexión ha fallado un momento." },
  en: { book: "Book Now", write: "Type your question...", greeting: "Hi! I'm your Concierge at Hostal Levante. Do you need a room or help with directions?", error: "I'm sorry, I lost my connection for a second." },
  it: { book: "Prenota", write: "Scrivi la tua domanda...", greeting: "Ciao! Sono il tuo Concierge all'Hostal Levante. Cerchi una camera o hai bisogno di indicaciones?", error: "Scusa, la mia connessione si è interrotta per un momento." },
  de: { book: "Buchen", write: "Schreiben Sie Ihre Frage...", greeting: "Hallo! Ich bin Ihr Concierge im Hostal Levante. Suchen Sie ein Zimmer o brauchen Sie Hilfe?", error: "Entschuldigung, meine Verbindung wurde kurz unterbrochen." },
  fr: { book: "Réserver", write: "Écrivez votre question...", greeting: "Bonjour ! Je suis votre Concierge à l'Hostal Levante. Vous cherchez une chambre ou des indications ?", error: "Désolé, j'ai perdu ma conexión pendant un moment." },
  nl: { book: "Boeken", write: "Typ je vraag...", greeting: "Hallo! I ben je conciërge bij Hostal Levante. Zoek je een kamer of heb je hulp nodig?", error: "Sorry, ik ben de verbinding even kwijt." },
  pt: { book: "Reservar", write: "Digite sua duda...", greeting: "Olá! Sou o seu Concierge no Hostal Levante. Procura um quarto o precisa de ayuda?", error: "Desculpe, perdi minha conexión por un momento." },
  ca: { book: "Reserva ara", write: "Escriu el teu dubte...", greeting: "Hola! Soc el teu Concierge a l'Hostal Levante. Busques habitació o necessites saber com arribar-hi?", error: "Ho sento, la meva connexió ha fallat un momento." }
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
      
      const responseStream = await ai.models.generateContentStream({
        model: 'gemini-3-flash-preview',
        contents: [{ role: 'user', parts: [{ text: textToSend }] }],
        config: { 
            temperature: 0.3, 
            systemInstruction: `You are the polyglot CONCIERGE of Hostal Levante in Barcelona.
            
            SUPPORTED LANGUAGES: Spanish, English, Catalan, French, Italian, German, Dutch, Portuguese.
            
            MANDATORY RULES:
            1. ALWAYS respond in the SAME language the user is speaking.
            2. Be professional, warm, and extremely brief.
            3. If the user wants to book, tell them you'll open the booking engine or use the "Reserva" button.
            
            FORMATTING:
            - Use single newlines. 
            - NO asterisks (*). 
            - NO double newlines.
            
            KNOWLEDGE BASE:
            ${kbContent}`
        }
      });

      // Crear espacio para la respuesta
      setMessages(prev => [...prev, { role: 'model', text: '' }]);
      
      let currentText = '';
      for await (const chunk of responseStream) {
        const chunkText = chunk.text || '';
        currentText += chunkText;
        
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { 
            ...updated[updated.length - 1], 
            text: currentText.replace(/\*/g, '') 
          };
          return updated;
        });
      }

    } catch (err) {
      console.error("Error en streaming:", err);
      setMessages(prev => [...prev, { role: 'model', text: t.error }]);
    } finally {
      setIsTyping(false);
    }
  };

  const toggleChat = (state) => {
    setIsOpen(state);
    if (isEmbedded) {
        // Notificar al padre para que ajuste el tamaño del iframe si fuera necesario
        window.parent.postMessage({ type: 'chatbot_state', open: state }, '*');
    }
  };

  // UI CUANDO EL CHAT ESTÁ CERRADO (BOTÓN FLOTANTE)
  if (!isOpen && isEmbedded) return html`
    <div className="w-full h-full flex items-end justify-end p-4 bg-transparent">
      <button onClick=${() => toggleChat(true)} className="w-14 h-14 bg-[#1e3a8a] text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-all border-4 border-white">
        <i className="fas fa-comment-dots text-xl"></i>
      </button>
    </div>
  `;

  // UI CUANDO EL CHAT ESTÁ ABIERTO
  return html`
    <div className=${`flex flex-col bg-white shadow-2xl overflow-hidden transition-all duration-300 ${isEmbedded ? 'w-full h-full' : 'fixed bottom-5 right-5 w-[380px] h-[600px] rounded-[2.5rem] border border-slate-100'}`}>
      <div className="bg-[#1e3a8a] p-4 text-white flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
             <i className="fas fa-concierge-bell text-xs"></i>
          </div>
          <span className="font-bold text-sm tracking-tight">Hostal Levante AI</span>
        </div>
        <div className="flex gap-2">
            <button onClick=${goToBooking} className="bg-white text-[#1e3a8a] px-3 py-1.5 rounded-lg text-[10px] font-black uppercase shadow-sm">
                ${t.book}
            </button>
            <button onClick=${() => toggleChat(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10">
                <i className="fas fa-times text-xs"></i>
            </button>
        </div>
      </div>
      
      <div ref=${scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#f8fafc] hide-scroll">
        ${messages.map((m, i) => html`
          <div key=${i} className=${`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
            <div 
              style=${{ whiteSpace: 'pre-line' }}
              className=${`max-w-[85%] p-3.5 rounded-2xl text-[13px] shadow-sm ${m.role === 'user' ? 'bg-[#1e3a8a] text-white rounded-tr-none' : 'bg-white text-slate-700 rounded-tl-none border border-slate-100'}`}
            >
               ${m.text || '...'}
            </div>
          </div>
        `)}
        
        ${isTyping && messages[messages.length - 1].text === '' && html`
          <div className="flex gap-1 p-3 bg-white rounded-xl border border-slate-100 w-fit ml-2">
            <div className="w-1 h-1 bg-slate-300 rounded-full animate-bounce"></div>
            <div className="w-1 h-1 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]"></div>
            <div className="w-1 h-1 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]"></div>
          </div>
        `}
      </div>

      <div className="p-4 bg-white border-t">
        <div className="flex gap-2 bg-slate-100 p-1 rounded-xl items-center border border-slate-200 focus-within:bg-white focus-within:border-[#1e3a8a] transition-all">
          <input 
            value=${input} 
            onChange=${e => setInput(e.target.value)} 
            onKeyDown=${e => e.key === 'Enter' && onSend()}
            placeholder=${t.write}
            className="flex-1 bg-transparent text-[13px] px-3 py-2 outline-none"
            disabled=${isTyping}
          />
          <button onClick=${() => onSend()} disabled=${isTyping || !input.trim()} className="bg-[#1e3a8a] text-white w-9 h-9 rounded-lg flex items-center justify-center disabled:opacity-30">
            <i className="fas fa-paper-plane text-[10px]"></i>
          </button>
        </div>
      </div>
    </div>
    <style>
      @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
      .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }
    </style>
  `;
};
