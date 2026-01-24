
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
    error: "Lo siento, mi conexión ha fallado un momento.",
    },
  en: { 
    book: "Book Now", 
    contact: "Contact",
    write: "Type your question...", 
    greeting: "Hi! I'm your Concierge at Hostal Levante. Do you need a room or help with directions?", 
    error: "I'm sorry, I lost my connection for a second.",
    },
  it: { 
    book: "Prenota", contact: "Contatti", write: "Scrivi la tua domanda...", 
    greeting: "Ciao! Sono il tuo Concierge all'Hostal Levante. Cerchi una camera o hai bisogno di indicazioni?", 
    error: "Scusa, la mia connessione si è interrotta per un momento.",
    },
  de: { 
    book: "Buchen", contact: "Kontakt", write: "Schreiben Sie Ihre Frage...", 
    greeting: "Hallo! Ich bin Ihr Concierge im Hostal Levante. Suchen Sie ein Zimmer oder brauchen Sie Hilfe?", 
    error: "Entschuldigung, meine Verbindung wurde kurz unterbrochen.",
    },
  fr: { 
    book: "Réserver", contact: "Contact", write: "Écrivez votre question...", 
    greeting: "Bonjour ! Je suis votre Concierge à l'Hostal Levante. Vous cherchez une chambre ou des indications ?", 
    error: "Désolé, j'ai perdu ma connexion pendant un moment.",
    },
  nl: { 
    book: "Boeken", contact: "Contact", write: "Typ je vraag...", 
    greeting: "Hallo! Ik ben je conciërge bij Hostal Levante. Zoek je een kamer of heb je hulp nodig?", 
    error: "Sorry, ik ben de verbinding even kwijt.",
    },
  pt: { 
    book: "Reservar", contact: "Contato", write: "Digite sua dúvida...", 
    greeting: "Olá! Sou o seu Concierge no Hostal Levante. Procura um quarto ou precisa de ajuda?", 
    error: "Desculpe, perdi minha conexão por um momento.",
    },
  ca: { 
    book: "Reserva", contact: "Contacte", write: "Escriu el teu dubte...", 
    greeting: "Hola! Soc el teu Concierge a l'Hostal Levante. Busques habitació o necessites saber com arribar-hi?", 
    error: "Ho sento, la meva connexió ha fallat un moment.",
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

  const onSend = async (textOverride) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim() || isTyping) return;
    
    const lowerText = textToSend.toLowerCase();

    if (lowerText.includes('reservar') || lowerText.includes('book') || lowerText.includes('reserva') || lowerText.includes('prenota') || lowerText.includes('buche')) {
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
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: textToSend,
        config: { 
            temperature: 0.7,
            systemInstruction: `Eres el CONCIERGE experto del Hostal Levante en Barcelona. 
            
            REGLAS CRÍTICAS:
            1. Responde SIEMPRE en el idioma en que te hable el usuario (ES, EN, DE, FR, IT, NL, PT o CA).
            2. PROHIBIDO usar asteriscos (*). No los uses para negrita ni para listas.
            3. Usa viñetas claras con el símbolo "•" para enumerar opciones o servicios.
            4. Estructura la respuesta en párrafos cortos y usa saltos de línea (ENTER).
            5. Sé amable, proactivo y usa emojis de viaje 🏨.
            
            CONTENIDO:
            - Ayuda con info técnica y consejos locales.
            - Si no tenemos algo (TV, cocina), ofrece alternativas con empatía.
            - Accesibilidad: NO adaptado.
            - Reservas: Botón "Booking" arriba a la derecha.
            
            Información del Hostal:
            ${kbContent}`
        }
      });

      if (!response.text) throw new Error("Sin respuesta");
      setMessages(prev => [...prev, { role: 'model', text: response.text.replace(/\*/g, '') }]);
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
      <button onClick=${() => toggleChat(true)} className="w-16 h-16 bg-[#1e3a8a] text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all border-4 border-white animate-bounce-slow">
        <i className="fas fa-concierge-bell text-2xl"></i>
      </button>
    </div>
  `;

  return html`
    <div className=${`flex flex-col bg-white shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden transition-all duration-300 ${isEmbedded ? 'w-full h-full' : 'fixed bottom-5 right-5 w-[380px] h-[600px] rounded-[2.5rem] border border-slate-100'}`}>
      
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
          <button onClick=${goToBooking} className="bg-white text-[#1e3a8a] hover:bg-blue-50 px-4 py-2 rounded-xl text-[11px] font-black uppercase transition-all shadow-lg shadow-blue-900/20 active:scale-95 border border-white">
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
            <div className=${`max-w-[88%] p-4 rounded-2xl text-[13px] shadow-sm whitespace-pre-wrap ${m.role === 'user' ? 'bg-[#1e3a8a] text-white rounded-tr-none shadow-blue-900/10' : 'bg-white text-slate-700 rounded-tl-none border border-slate-100'}`}>
               ${m.text}
            </div>
          </div>
        `)}
        
        <!-- Suggestions -->
        ${messages.length === 1 && !isTyping && html`
          <div className="flex flex-wrap gap-2 mt-4 animate-fadeInUp [animation-delay:200ms]">
            ${t.suggestions.map(s => html`
              <button 
                key=${s}
                onClick=${() => onSend(s)}
                className="bg-white border border-slate-200 text-slate-600 text-[11px] font-bold px-3 py-2 rounded-full hover:border-[#1e3a8a] hover:text-[#1e3a8a] transition-all active:scale-95 shadow-sm"
              >
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
        <div className="flex gap-2 bg-slate-50 p-1.5 rounded-2xl items-center border border-slate-200 focus-within:border-[#1e3a8a] focus-within:ring-2 focus-within:ring-[#1e3a8a]/5 transition-all">
          <input 
            value=${input} 
            onChange=${e => setInput(e.target.value)} 
            onKeyDown=${e => e.key === 'Enter' && onSend()}
            placeholder=${t.write}
            className="flex-1 bg-transparent text-[13px] px-3 py-2.5 outline-none placeholder:text-slate-400"
            disabled=${isTyping}
          />
          <button 
            onClick=${() => onSend()} 
            disabled=${isTyping || !input.trim()} 
            className="bg-[#1e3a8a] text-white w-10 h-10 rounded-xl flex items-center justify-center disabled:opacity-30 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-blue-900/20"
          >
            <i className="fas fa-paper-plane text-[10px]"></i>
          </button>
        </div>
        <div className="mt-3 text-center">
            <span className="text-[9px] text-slate-300 font-bold uppercase tracking-widest">Hostal Levante AI Concierge</span>
        </div>
      </div>
    </div>
    
    <style>
      @keyframes fadeInUp {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .animate-fadeInUp { animation: fadeInUp 0.4s ease-out forwards; }
      @keyframes bounce-slow {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-5px); }
      }
      .animate-bounce-slow { animation: bounce-slow 3s infinite ease-in-out; }
    </style>
  `;
};
