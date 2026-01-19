
import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import htm from 'htm';
import { GoogleGenAI } from "@google/genai";

const html = htm.bind(React.createElement);

// --- CONFIGURACIÓN MULTIIDIOMA ---
const GREETINGS = {
  es: "¡Hola! Soy el asistente del Hostal Levante. ¿En qué puedo ayudarte hoy?",
  en: "Hi! I'm the Hostal Levante assistant. How can I help you today?",
  ca: "Hola! Soc l'assistent de l'Hostal Levante. En què et puc ajudar avui?",
  de: "Hallo! Ich bin der Assistent des Hostal Levante. Wie kann ich Ihnen heute helfen?",
  it: "Ciao! Sono l'assistente dell'Hostal Levante. Come posso aiutarti oggi?",
  fr: "Bonjour ! Je suis l'assistant de l'Hostal Levante. Comment puis-je vous aider aujourd'hui ?",
  nl: "Hallo! Ik ben de assistent van Hostal Levante. Hoe kan ik u vandaag helpen?",
  pt: "Olá! Sou o assistente do Hostal Levante. Como posso ajudá-lo hoje?"
};

const QUICK_TIPS = {
  es: ["¿Cómo llegar?", "Horario Check-in", "¿Hay Wifi?", "Lugares cercanos"],
  en: ["How to get here?", "Check-in time", "Is there Wifi?", "Nearby places"],
  ca: ["Com arribar-hi?", "Horari Check-in", "Hi ha Wifi?", "Llocs propers"],
  de: ["Anfahrt?", "Check-in Zeit", "Gibt es WLAN?", "Orte in der Nähe"],
  it: ["Come arrivare?", "Orario Check-in", "C'è il Wifi?", "Luoghi vicini"],
  fr: ["Comment venir ?", "Heure d'arrivée", "Y a-t-il du Wifi ?", "Lieux proches"],
  nl: ["Hoe kom ik er?", "Check-in tijd", "Is er Wifi?", "Plaatsen in de buurt"],
  pt: ["Como chegar?", "Horário de Check-in", "Tem Wifi?", "Lugares próximos"]
};

const UI_TEXT = {
  es: { book: "Reservar ahora", write: "Escribe..." },
  en: { book: "Book now", write: "Write..." },
  ca: { book: "Reservar ara", write: "Escriu..." },
  de: { book: "Jetzt buchen", write: "Schreiben..." },
  it: { book: "Prenota ora", write: "Scrivi..." },
  fr: { book: "Réserver", write: "Écrire..." },
  nl: { book: "Nu boeken", write: "Schrijven..." },
  pt: { book: "Reservar agora", write: "Escrever..." }
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
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === "undefined") throw new Error("API_KEY_MISSING");

  try {
    const ai = new GoogleGenAI({ apiKey });
    const systemInstruction = `Eres el asistente virtual del Hostal Levante (Barcelona). 
Idioma: ${lang}. 
Eres amable, conciso y actúas como un recepcionista experto.

ESTRUCTURA DE RESPUESTA (IMPORTANTE):
1. Usa PÁRRAFOS cortos. Separa cada punto con UN SALTO DE LÍNEA (No uses líneas vacías ni doble espacio).
2. Para listas o enumeraciones, utiliza el símbolo "•" al inicio de la línea.
3. Usa negritas (así: **texto**) solo para palabras clave.

CONOCIMIENTO:
${knowledge.map(k => `- ${k.title}: ${k.content}`).join('\n')}

REGLAS:
1. Disponibilidad/precios -> redirigir a ${BOOKING_URL}.
2. Accesibilidad -> El hostal NO está adaptado (hay escaleras).
3. No hay TV ni cocina en las habitaciones.`;

    const chat = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: { systemInstruction, temperature: 0.5 }
    });

    const response = await chat.sendMessage({ message: history[history.length - 1].text });
    return response.text;
  } catch (e) {
    throw e;
  }
};

const ChatWidget = ({ knowledge, isEmbedded }) => {
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
    const newMsgs = [...messages, { role: 'user', text }];
    setMessages(newMsgs);
    setInput('');
    setIsTyping(true);
    try {
      const reply = await askAI(newMsgs, knowledge, lang);
      setMessages(prev => [...prev, { role: 'model', text: reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'model', text: "Error de conexión." }]);
    } finally { setIsTyping(false); }
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
      <!-- HEADER -->
      <div className="bg-[#1e3a8a] p-4 text-white flex justify-between items-center rounded-t-[2rem]">
        <div className="flex items-center space-x-2">
           <i className="fas fa-hotel"></i>
           <span className="font-bold text-sm">Hostal Levante</span>
        </div>
        <div className="flex items-center space-x-2">
          <a href=${BOOKING_URL} target="_blank" className="bg-white text-[#1e3a8a] text-[10px] font-bold px-3 py-1 rounded-full uppercase hover:bg-slate-100 transition-colors">
            ${t.book}
          </a>
          <button onClick=${() => toggleChat(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-white">
            <i className="fas fa-times"></i>
          </button>
        </div>
      </div>

      <!-- MESSAGES -->
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
        ${isTyping && html`<div className="text-xs text-slate-400 animate-pulse flex items-center gap-1 mt-2"> Escribiendo...</div>`}
      </div>

      <!-- INPUT -->
      <div className="p-4 bg-white border-t flex space-x-2 rounded-b-[2rem]">
        <input value=${input} onChange=${e => setInput(e.target.value)} onKeyDown=${e => e.key === 'Enter' && onSend()} placeholder=${t.write} className="flex-1 bg-slate-100 rounded-xl px-4 py-2 text-sm outline-none" />
        <button onClick=${onSend} className="bg-[#1e3a8a] text-white w-10 h-10 rounded-xl flex items-center justify-center"><i className="fas fa-paper-plane"></i></button>
      </div>
    </div>
  `;
};

const App = () => {
  const [knowledge, setKnowledge] = useState(() => {
    const s = localStorage.getItem('lev_v23_kb');
    return s ? JSON.parse(s) : [{ id: 1, title: 'Ubicación', content: 'Carrer de la Baixada de Sant Miquel, 2, 08002 Barcelona.' }];
  });
  const isEmbed = window.location.search.includes('embed=true');
  if (isEmbed) return html`<${ChatWidget} knowledge=${knowledge} isEmbedded=${true} />`;
  return html`
    <div className="p-8 max-w-2xl mx-auto font-sans">
      <h1 className="text-xl font-bold mb-4">Admin Panel - Hostal Levante</h1>
      ${knowledge.map(k => html`
        <div key=${k.id} className="mb-2 flex gap-2">
          <input className="border p-2 text-xs w-1/4 font-bold" value=${k.title} onChange=${e => setKnowledge(knowledge.map(x => x.id === k.id ? {...x, title: e.target.value} : x))} />
          <textarea className="border p-2 text-xs flex-1" value=${k.content} onChange=${e => setKnowledge(knowledge.map(x => x.id === k.id ? {...x, content: e.target.value} : x))} />
        </div>
      `)}
      <button onClick=${() => localStorage.setItem('lev_v23_kb', JSON.stringify(knowledge))} className="bg-green-600 text-white px-4 py-2 rounded text-xs mt-4">Guardar Conocimiento</button>
      <${ChatWidget} knowledge=${knowledge} isEmbedded=${false} />
    </div>
  `;
};

createRoot(document.getElementById('root')).render(html`<${App} />`);
