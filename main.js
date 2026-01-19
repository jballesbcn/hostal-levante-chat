
import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import htm from 'htm';
import { GoogleGenAI } from "@google/genai";

const html = htm.bind(React.createElement);

// --- CONFIGURACIÓN ---
const BOOKING_URL = "https://booking.redforts.com/e4mh/";
const GREETINGS = {
  es: "¡Hola! Soy el asistente del Hostal Levante. ¿En qué puedo ayudarte?",
  en: "Hi! I'm the Hostal Levante assistant. How can I help you?",
  ca: "Hola! Soc l'assistent de l'Hostal Levante. En què et puc ayudar?",
  fr: "Bonjour ! Je suis l'assistant de l'Hostal Levante.",
  de: "Hallo! Ich bin der Assistent des Hostal Levante."
};

// --- MOTOR IA ---
const askAI = async (history, knowledge, lang) => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === "undefined") return "Error de configuración de API.";
  try {
    const ai = new GoogleGenAI({ apiKey });
    const context = knowledge.map(k => `${k.title}: ${k.content}`).join('. ');
    const systemInstruction = `Eres el asistente oficial del Hostal Levante Barcelona. Sé amable y profesional. Idioma: ${lang}. Contexto: ${context}. Reservas: ${BOOKING_URL}`;
    const chat = ai.chats.create({ 
      model: 'gemini-3-flash-preview', 
      config: { systemInstruction, temperature: 0.5 } 
    });
    const response = await chat.sendMessage({ message: history[history.length - 1].text });
    return response.text;
  } catch (e) { return "Lo siento, ha ocurrido un error. Inténtalo de nuevo."; }
};

const ChatWidget = ({ knowledge }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);
  const lang = new URLSearchParams(window.location.search).get('lang') || 'es';

  // Notificar apertura/cierre a la web principal
  useEffect(() => {
    window.parent.postMessage({ type: 'CHAT_TOGGLE', isOpen }, '*');
  }, [isOpen]);

  useEffect(() => { setMessages([{ role: 'model', text: GREETINGS[lang] || GREETINGS.es }]); }, [lang]);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages, isTyping]);

  const onSend = async () => {
    if (!input.trim() || isTyping) return;
    const userMsg = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    const reply = await askAI([...messages, userMsg], knowledge, lang);
    setMessages(prev => [...prev, { role: 'model', text: reply }]);
    setIsTyping(false);
  };

  return html`
    <div className="fixed inset-0 flex flex-col items-end justify-end p-4 pointer-events-none">
      ${isOpen && html`
        <div className="w-full max-w-[350px] h-[500px] bg-white rounded-2xl shadow-2xl border flex flex-col mb-4 pointer-events-auto animate-chat">
          <div className="bg-[#1e3a8a] p-4 text-white flex justify-between items-center rounded-t-2xl">
            <span className="font-bold">Asistente Levante</span>
            <button onClick=${() => setIsOpen(false)}><i className="fas fa-times"></i></button>
          </div>
          <div ref=${scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 hide-scroll">
            ${messages.map((m, i) => html`
              <div key=${i} className=${`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className=${`p-3 rounded-lg max-w-[80%] text-sm ${m.role === 'user' ? 'bg-[#1e3a8a] text-white' : 'bg-white border text-gray-800'}`}>
                  ${m.text}
                </div>
              </div>
            `)}
            ${isTyping && html`<div className="text-gray-400 text-xs animate-pulse">Escribiendo...</div>`}
          </div>
          <div className="p-3 bg-white border-t flex gap-2 rounded-b-2xl">
            <input className="flex-1 border rounded-lg px-3 py-2 text-sm outline-none" value=${input} onChange=${e => setInput(e.target.value)} onKeyDown=${e => e.key === 'Enter' && onSend()} placeholder="Escribe aquí..." />
            <button onClick=${onSend} className="bg-[#1e3a8a] text-white p-2 rounded-lg w-10 h-10"><i className="fas fa-paper-plane"></i></button>
          </div>
        </div>
      `}
      <button onClick=${() => setIsOpen(!isOpen)} className="w-14 h-14 bg-[#1e3a8a] text-white rounded-full shadow-lg flex items-center justify-center pointer-events-auto pulse-blue cursor-pointer">
        <i className=${`fas ${isOpen ? 'fa-times' : 'fa-comments'} text-xl`}></i>
      </button>
    </div>
  `;
};

const App = () => {
  const [knowledge, setKnowledge] = useState(() => {
    const s = localStorage.getItem('lev_kb');
    return s ? JSON.parse(s) : [{ id: 1, title: 'Ubicación', content: 'Carrer de la Baixada de Sant Miquel, 2, 08002 Barcelona.' }];
  });

  useEffect(() => { localStorage.setItem('lev_kb', JSON.stringify(knowledge)); }, [knowledge]);

  const isEmbed = new URLSearchParams(window.location.search).has('embed');

  if (isEmbed) return html`<${ChatWidget} knowledge=${knowledge} />`;

  return html`
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-[#1e3a8a]">Configuración del Chatbot</h1>
      <div className="space-y-4">
        ${knowledge.map(k => html`
          <div key=${k.id} className="p-4 border rounded-xl bg-white shadow-sm flex gap-2">
            <input className="font-bold border-b w-1/4 outline-none" value=${k.title} onChange=${e => setKnowledge(knowledge.map(x => x.id === k.id ? {...x, title: e.target.value} : x))} />
            <textarea className="flex-1 text-sm outline-none" value=${k.content} onChange=${e => setKnowledge(knowledge.map(x => x.id === k.id ? {...x, content: e.target.value} : x))} />
          </div>
        `)}
        <button onClick=${() => setKnowledge([...knowledge, {id: Date.now(), title: '', content: ''}])} className="text-blue-600 text-sm">+ Añadir más información</button>
      </div>
      <${ChatWidget} knowledge=${knowledge} />
    </div>
  `;
};

createRoot(document.getElementById('root')).render(html`<${App} />`);
