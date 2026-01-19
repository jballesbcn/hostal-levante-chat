
import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import htm from 'htm';
import { GoogleGenAI } from "@google/genai";

const html = htm.bind(React.createElement);

// --- 1. CONFIGURACIÓN ---
const BOOKING_URL = "https://booking.redforts.com/e4mh/";
const GREETINGS = {
  es: "¡Hola! Soy el asistente del Hostal Levante. ¿En qué puedo ayudarte?",
  en: "Hi! I'm the Hostal Levante assistant. How can I help you?",
  ca: "Hola! Soc l'assistent de l'Hostal Levante. En què et puc ayudar?",
  de: "Hallo! Ich bin der Assistent des Hostal Levante. Wie kann ich Ihnen helfen?",
  fr: "Bonjour ! Je suis l'assistant de l'Hostal Levante. Comment puis-je vous aider ?",
  it: "Ciao! Sono l'assistente dell'Hostal Levante. Come posso aiutarti?",
  pt: "Olá! Sou o assistente do Hostal Levante. Como posso ajudá-lo?"
};

const CONTACT_STRINGS = {
  es: { title: "Contacto", name: "Nombre", email: "Email", message: "Mensaje", send: "ENVIAR", success: "¡Enviado!" },
  en: { title: "Contact", name: "Name", email: "Email", message: "Message", send: "SEND", success: "Sent!" }
};

// --- 2. MOTOR DE IA (GEMINI) ---
const askAI = async (history, knowledge, lang) => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === "undefined") throw new Error("API_KEY_MISSING");

  try {
    const ai = new GoogleGenAI({ apiKey });
    const context = knowledge && knowledge.length > 0 
      ? knowledge.map(k => `${k.title}: ${k.content}`).join('. ') 
      : "Hostal Levante Barcelona.";

    const systemInstruction = `Eres el asistente oficial del Hostal Levante Barcelona. Idioma: ${lang}. 
    Sé profesional, amable y conciso. 
    Para reservas redirige siempre a: ${BOOKING_URL}. 
    Información del hostal: ${context}`;

    const chat = ai.chats.create({ 
      model: 'gemini-3-flash-preview', 
      config: { systemInstruction, temperature: 0.4 } 
    });

    const response = await chat.sendMessage({ message: history[history.length - 1].text });
    return response.text;
  } catch (error) {
    console.error("Error en IA:", error);
    throw error;
  }
};

// --- 3. COMPONENTES VISUALES ---
const FormattedMessage = ({ text }) => {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return html`<span>${parts.map((p, i) => p.startsWith('**') ? html`<b key=${i} className="font-bold text-slate-900">${p.slice(2, -2)}</b>` : p)}</span>`;
};

const ContactForm = ({ lang = 'es' }) => {
  const t = CONTACT_STRINGS[lang] || CONTACT_STRINGS.es;
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState('idle');

  const handleSubmit = (e) => {
    e.preventDefault();
    setStatus('sending');
    setTimeout(() => setStatus('success'), 1500);
  };

  if (status === 'success') return html`<div className="p-10 text-center animate-chat"><i className="fas fa-check-circle text-green-500 text-4xl mb-4"></i><p className="font-bold">${t.success}</p></div>`;

  return html`
    <form onSubmit=${handleSubmit} className="w-full max-w-md mx-auto p-8 bg-white rounded-[2rem] shadow-xl border border-slate-100">
      <h2 className="text-2xl font-black text-[#1e3a8a] text-center mb-6 uppercase tracking-tight">${t.title}</h2>
      <div className="space-y-4">
        <input className="w-full px-5 py-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none focus:ring-2 focus:ring-blue-500/20" placeholder=${t.name} value=${formData.name} onChange=${e => setFormData({...formData, name: e.target.value})} />
        <input className="w-full px-5 py-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none focus:ring-2 focus:ring-blue-500/20" placeholder=${t.email} value=${formData.email} onChange=${e => setFormData({...formData, email: e.target.value})} />
        <textarea className="w-full px-5 py-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none focus:ring-2 focus:ring-blue-500/20 resize-none" rows="4" placeholder=${t.message} value=${formData.message} onChange=${e => setFormData({...formData, message: e.target.value})} />
        <button className="w-full bg-[#1e3a8a] text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-800 transition-all">${status === 'sending' ? 'ENVIANDO...' : t.send}</button>
      </div>
    </form>
  `;
};

const ChatWidget = ({ knowledge }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);
  const lang = new URLSearchParams(window.location.search).get('lang') || 'es';

  useEffect(() => { setMessages([{ role: 'model', text: GREETINGS[lang] || GREETINGS.es }]); }, [lang]);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }); }, [messages, isTyping]);

  const onSend = async () => {
    if (!input.trim() || isTyping) return;
    const userText = input;
    const newMsgs = [...messages, { role: 'user', text: userText }];
    setMessages(newMsgs);
    setInput('');
    setIsTyping(true);
    try {
      const reply = await askAI(newMsgs, knowledge, lang);
      setMessages(prev => [...prev, { role: 'model', text: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'model', text: "Lo siento, tengo problemas de conexión. Por favor, inténtalo de nuevo." }]);
    } finally { setIsTyping(false); }
  };

  return html`
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end">
      <!-- VENTANA DE CHAT -->
      ${isOpen && html`
        <div className="mb-4 w-[90vw] sm:w-[380px] h-[600px] max-h-[80vh] bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-chat">
          <div className="bg-[#1e3a8a] p-5 text-white flex justify-between items-center shrink-0">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"><i className="fas fa-hotel"></i></div>
              <div>
                <div className="font-black text-sm uppercase tracking-tight">Hostal Levante</div>
                <div className="flex items-center space-x-1"><div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div><span className="text-[10px] opacity-70 font-bold uppercase">Online</span></div>
              </div>
            </div>
            <button onClick=${() => setIsOpen(false)} className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"><i className="fas fa-times"></i></button>
          </div>
          
          <div ref=${scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50 hide-scroll">
            ${messages.map((m, i) => html`
              <div key=${i} className=${`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className=${`max-w-[85%] p-4 rounded-2xl text-[13px] shadow-sm leading-relaxed ${m.role === 'user' ? 'bg-[#1e3a8a] text-white rounded-tr-none' : 'bg-white text-slate-700 rounded-tl-none border border-slate-100'}`}>
                  <${FormattedMessage} text=${m.text} />
                </div>
              </div>
            `)}
            ${isTyping && html`<div className="flex justify-start"><div className="bg-white p-4 rounded-2xl shadow-sm animate-pulse text-blue-400"><i className="fas fa-ellipsis-h"></i></div></div>`}
          </div>

          <div className="p-4 bg-white border-t border-slate-100 flex space-x-2 shrink-0">
            <input value=${input} onChange=${e => setInput(e.target.value)} onKeyDown=${e => e.key === 'Enter' && onSend()} placeholder="Escribe aquí..." className="flex-1 bg-slate-100 rounded-2xl px-5 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/10 transition-all" />
            <button onClick=${onSend} className="bg-[#1e3a8a] text-white w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg hover:bg-blue-800 transition-all"><i className="fas fa-paper-plane text-sm"></i></button>
          </div>
        </div>
      `}

      <!-- BOTÓN FLOTANTE (Siempre visible y fuera del flujo para evitar cortes) -->
      <button 
        onClick=${() => setIsOpen(!isOpen)} 
        className="w-16 h-16 bg-[#1e3a8a] text-white rounded-full shadow-2xl pulse-blue border-4 border-white flex items-center justify-center cursor-pointer hover:scale-110 transition-transform active:scale-95"
      >
        <i className=${`fas ${isOpen ? 'fa-times' : 'fa-comments'} text-2xl`}></i>
      </button>
    </div>
  `;
};

// --- 4. APP PRINCIPAL (ADMIN HUB) ---
const App = () => {
  const [view, setView] = useState('admin');
  const [currentLang, setCurrentLang] = useState('es');
  const [knowledge, setKnowledge] = useState(() => {
    const s = localStorage.getItem('lev_v23_kb');
    return s ? JSON.parse(s) : [{ id: 1, title: 'Check-in', content: 'Entrada 15h, Salida 11h.' }];
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setCurrentLang(params.get('lang') || 'es');
    if (params.get('view') === 'contact') setView('form_independent');
    localStorage.setItem('lev_v23_kb', JSON.stringify(knowledge));
  }, [knowledge]);

  if (view === 'form_independent') return html`<div className="min-h-screen flex items-center justify-center p-4 bg-transparent"><${ContactForm} lang=${currentLang} /></div>`;

  return html`
    <div className="min-h-screen bg-slate-100 p-4 md:p-12">
      <div className="max-w-5xl mx-auto bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-200">
        <div className="p-8 bg-[#1e3a8a] text-white flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center"><i className="fas fa-robot text-xl"></i></div>
            <h1 className="text-xl font-black uppercase tracking-tighter">Levante AI Admin</h1>
          </div>
          <div className="flex bg-black/20 p-1.5 rounded-2xl backdrop-blur-md">
            <button onClick=${() => setView('admin')} className=${`px-8 py-2.5 rounded-xl text-xs font-black transition-all ${view === 'admin' ? 'bg-white text-blue-900 shadow-xl' : 'text-white/60'}`}>CONOCIMIENTO</button>
            <button onClick=${() => setView('form_preview')} className=${`px-8 py-2.5 rounded-xl text-xs font-black transition-all ${view === 'form_preview' ? 'bg-white text-blue-900 shadow-xl' : 'text-white/60'}`}>FORMULARIO</button>
          </div>
        </div>
        
        <div className="p-10">
          ${view === 'admin' ? html`
            <div className="space-y-8 animate-chat">
              <div className="flex justify-between items-center border-b pb-6">
                <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm">Base de Datos de la IA</h3>
                <button onClick=${() => setKnowledge([{id:Date.now(), title:'', content:''}, ...knowledge])} className="bg-blue-600 text-white px-6 py-3 rounded-xl text-xs font-black shadow-lg shadow-blue-600/20 hover:-translate-y-1 transition-all">AÑADIR DATO</button>
              </div>
              <div className="space-y-4 max-h-[550px] overflow-y-auto pr-2 hide-scroll">
                ${knowledge.map(k => html`
                  <div key=${k.id} className="flex gap-4 p-5 bg-slate-50 rounded-[1.5rem] border border-slate-100 group transition-all hover:border-blue-200">
                    <input className="bg-white border border-slate-200 p-4 rounded-xl text-xs w-1/4 font-black outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="Título" value=${k.title} onChange=${e => setKnowledge(knowledge.map(x => x.id === k.id ? {...x, title: e.target.value} : x))} />
                    <textarea className="bg-white border border-slate-200 p-4 rounded-xl text-xs flex-1 outline-none focus:ring-2 focus:ring-blue-500/20 min-h-[60px]" placeholder="Información..." value=${k.content} onChange=${e => setKnowledge(knowledge.map(x => x.id === k.id ? {...x, content: e.target.value} : x))} />
                    <button onClick=${() => setKnowledge(knowledge.filter(x => x.id !== k.id))} className="text-red-200 hover:text-red-500 transition-colors p-2"><i className="fas fa-trash-alt"></i></button>
                  </div>
                `)}
              </div>
            </div>
          ` : html`
             <div className="py-10 flex flex-col items-center animate-chat">
                <p className="text-xs font-black text-slate-400 uppercase mb-10 tracking-[0.2em]">Vista previa del formulario de contacto</p>
                <div className="flex gap-2 mb-10 flex-wrap justify-center">
                  ${['es','en','ca','fr','de','it','pt'].map(l => html`
                    <button onClick=${() => setCurrentLang(l)} className=${`px-5 py-2 rounded-full text-[10px] font-black border-2 transition-all ${currentLang === l ? 'bg-[#1e3a8a] text-white border-[#1e3a8a]' : 'bg-white text-slate-300 border-slate-100 hover:border-blue-100'}`}>${l.toUpperCase()}</button>
                  `)}
                </div>
                <${ContactForm} lang=${currentLang} />
             </div>
          `}
        </div>
      </div>
      <!-- Widget del Chat siempre visible en el admin para pruebas -->
      <${ChatWidget} knowledge=${knowledge} />
    </div>
  `;
};

createRoot(document.getElementById('root')).render(html`<${App} />`);
