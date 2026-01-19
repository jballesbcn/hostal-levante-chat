
import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import htm from 'htm';
import { GoogleGenAI } from "@google/genai";

// 'htm' nos permite escribir HTML de forma sencilla en JavaScript
const html = htm.bind(React.createElement);

// --- SECCIÓN 1: CONFIGURACIÓN BÁSICA ---
// Definimos las constantes globales para reservas y correo de contacto
const BOOKING_URL = "https://booking.redforts.com/e4mh/";
const DESTINATION_EMAIL = "contactoweb@hostallevante.com";

// --- SECCIÓN 2: DICCIONARIOS DE IDIOMAS (7 IDIOMAS) ---
// Aquí configuramos los saludos iniciales del chatbot
const GREETINGS = {
  es: "¡Hola! Soy el asistente del Hostal Levante. ¿En qué puedo ayudarte hoy?",
  en: "Hi! I'm the Hostal Levante assistant. How can I help you today?",
  de: "Hallo! Ich bin der Assistent des Hostal Levante. Wie kann ich Ihnen heute helfen?",
  fr: "Bonjour ! Je suis l'assistant de l'Hostal Levante. Comment puis-je vous aider aujourd'hui ?",
  it: "Ciao! Sono l'assistente dell'Hostal Levante. Come posso aiutarti oggi?",
  pt: "Olá! Sou o assistente do Hostal Levante. Como posso ajudá-lo hoje?",
  ca: "Hola! Soc l'assistent de l'Hostal Levante. En què et puc ayudar avui?"
};

// Configuración de textos del formulario de contacto
const CONTACT_STRINGS = {
  es: { title: "Contacto", name: "Nombre", email: "Email", message: "Mensaje", send: "ENVIAR", success: "Mensaje enviado con éxito", error_mail: "Email no válido", subtitle: "Responderemos en 24h", captcha: "Protegido" },
  en: { title: "Contact", name: "Name", email: "Email", message: "Message", send: "SEND", success: "Message sent successfully", error_mail: "Invalid email", subtitle: "We reply within 24h", captcha: "Protected" },
  de: { title: "Kontakt", name: "Name", email: "E-Mail", message: "Nachricht", send: "SENDEN", success: "Nachricht erfolgreich gesendet", error_mail: "Ungültige E-Mail", subtitle: "Antwort innerhalb von 24h", captcha: "Geschützt" },
  fr: { title: "Contact", name: "Nom", email: "E-mail", message: "Message", send: "ENVOYER", success: "Message envoyé avec succès", error_mail: "E-mail invalide", subtitle: "Réponse sous 24h", captcha: "Protégé" },
  it: { title: "Contatto", name: "Nome", email: "Email", message: "Messaggio", send: "INVIA", success: "Messaggio inviato con successo", error_mail: "Email non valida", subtitle: "Risposta entro 24 ore", captcha: "Protetto" },
  pt: { title: "Contacto", name: "Nome", email: "E-mail", message: "Mensagem", send: "ENVIAR", success: "Mensagem enviada com sucesso", error_mail: "E-mail inválido", subtitle: "Resposta em 24h", captcha: "Protegido" },
  ca: { title: "Contacte", name: "Nom", email: "Email", message: "Missatge", send: "ENVIAR", success: "Missatge enviat amb èxit", error_mail: "Email no vàlid", subtitle: "Respondrem en 24h", captcha: "Protegit" }
};

// --- SECCIÓN 3: COMPONENTE DEL FORMULARIO ---
// Este componente maneja la entrada de datos, validación y respuesta visual del envío
const ContactForm = ({ lang = 'es' }) => {
  const t = CONTACT_STRINGS[lang] || CONTACT_STRINGS.es;
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState('idle');
  const [errors, setErrors] = useState({});

  const validate = () => {
    let e = {};
    if (!formData.name) e.name = true;
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) e.email = true;
    if (!formData.message || formData.message.length < 5) e.message = true;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setStatus('sending');
    setTimeout(() => {
      console.log("SIMULACIÓN: Enviando datos a:", DESTINATION_EMAIL, formData);
      setStatus('success');
    }, 1500);
  };

  if (status === 'success') {
    return html`
      <div className="p-8 text-center animate-chat bg-white rounded-3xl border border-slate-100 shadow-sm">
        <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-4 mx-auto">
          <i className="fas fa-check text-2xl"></i>
        </div>
        <h2 className="text-xl font-bold text-slate-800">${t.success}</h2>
        <button onClick=${() => { setStatus('idle'); setFormData({name:'', email:'', message:''}); }} className="mt-4 text-xs font-bold text-blue-600 uppercase">Volver a intentar</button>
      </div>
    `;
  }

  return html`
    <form onSubmit=${handleSubmit} className="w-full max-w-lg mx-auto p-6 md:p-8 bg-white rounded-[2rem] shadow-sm border border-slate-100 animate-chat">
      <div className="mb-6 text-center">
        <h2 className="text-xl font-bold text-[#1e3a8a]">${t.title}</h2>
        <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest">${t.subtitle}</p>
      </div>
      <div className="space-y-4">
        <input type="text" placeholder=${t.name} className=${`w-full px-5 py-3 bg-slate-50 rounded-xl border ${errors.name ? 'border-red-300' : 'border-slate-100'} outline-none text-sm`} value=${formData.name} onChange=${e => setFormData({...formData, name: e.target.value})} />
        <input type="email" placeholder=${t.email} className=${`w-full px-5 py-3 bg-slate-50 rounded-xl border ${errors.email ? 'border-red-300' : 'border-slate-100'} outline-none text-sm`} value=${formData.email} onChange=${e => setFormData({...formData, email: e.target.value})} />
        <textarea placeholder=${t.message} rows="3" className=${`w-full px-5 py-3 bg-slate-50 rounded-xl border ${errors.message ? 'border-red-300' : 'border-slate-100'} outline-none text-sm resize-none`} value=${formData.message} onChange=${e => setFormData({...formData, message: e.target.value})} />
        <button type="submit" disabled=${status === 'sending'} className="w-full bg-[#1e3a8a] text-white py-4 rounded-xl font-bold shadow-lg hover:bg-blue-800 transition-all flex items-center justify-center">
          ${status === 'sending' ? html`<i className="fas fa-circle-notch animate-spin"></i>` : html`<span>${t.send}</span>`}
        </button>
      </div>
    </form>
  `;
};

// --- SECCIÓN 4: MOTOR DE INTELIGENCIA ARTIFICIAL ---
// Esta función conecta con Google Gemini para generar respuestas
const askAI = async (history, knowledge, lang) => {
  // CAMPO DE INFORMACIÓN: Verificamos que la clave de API sea válida
  const apiKey = process.env.API_KEY;
  console.log("DEBUG: Verificando clave de API...");
  
  if (!apiKey || apiKey === "undefined" || apiKey.length < 10) {
    console.error("ERROR: API_KEY no encontrada o no válida en el entorno.");
    throw new Error("API_KEY_INVALID");
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    // CAMPO DE INFORMACIÓN: Preparamos las instrucciones del sistema con los datos del Hostal
    const context = knowledge && knowledge.length > 0 
      ? knowledge.map(k => `${k.title}: ${k.content}`).join('. ') 
      : "Información general del Hostal Levante Barcelona.";

    const systemInstruction = `Eres el asistente virtual del Hostal Levante (Barcelona). Idioma: ${lang}. 
    Responde de forma amable y servicial. Si preguntan por disponibilidad/precios: ${BOOKING_URL}. 
    DATOS DEL HOSTAL: ${context}`;

    console.log("DEBUG: Llamando a Gemini con el idioma:", lang);

    const chat = ai.chats.create({ 
      model: 'gemini-3-flash-preview', 
      config: { systemInstruction, temperature: 0.5 } 
    });

    const userMessage = history[history.length - 1].text;
    const response = await chat.sendMessage({ message: userMessage });
    
    console.log("DEBUG: Respuesta recibida con éxito.");
    return response.text;
  } catch (error) {
    console.error("ERROR EN askAI:", error);
    throw error;
  }
};

// --- SECCIÓN 5: COMPONENTE DEL CHATWIDGET ---
// Formatea el texto (negritas) para que sea más legible
const FormattedMessage = ({ text }) => {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return html`<span>${parts.map((p, i) => p.startsWith('**') ? html`<b key=${i} className="font-bold">${p.slice(2, -2)}</b>` : p)}</span>`;
};

const ChatWidget = ({ knowledge, isEmbedded }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);
  const lang = new URLSearchParams(window.location.search).get('lang') || 'es';

  useEffect(() => { 
    setMessages([{ role: 'model', text: GREETINGS[lang] || GREETINGS.es }]); 
  }, [lang]);

  useEffect(() => { 
    if (scrollRef.current) scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }); 
  }, [messages, isTyping]);

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
    } catch (err) {
      console.error("Error en el envío del chat:", err);
      setMessages(prev => [...prev, { role: 'model', text: "Lo sentimos, el servicio de IA no está disponible en este momento. Revisa la consola de desarrollador para más detalles." }]);
    } finally {
      setIsTyping(false);
    }
  };

  if (!isOpen && isEmbedded) return html`
    <div className="w-full h-full flex items-center justify-center">
      <button onClick=${() => setIsOpen(true)} className="w-16 h-16 bg-[#1e3a8a] text-white rounded-full shadow-2xl pulse-blue border-4 border-white transition-transform hover:scale-110">
        <i className="fas fa-comments text-2xl"></i>
      </button>
    </div>
  `;

  return html`
    <div className=${`flex flex-col bg-white shadow-2xl animate-chat ${isEmbedded ? 'w-full h-full' : 'fixed bottom-5 right-5 w-[380px] h-[600px] rounded-[2rem] z-[9999] border border-slate-200 overflow-hidden'}`}>
      <div className="bg-[#1e3a8a] p-4 text-white flex justify-between items-center shadow-md">
        <div className="flex items-center space-x-3"><i className="fas fa-hotel"></i><span className="font-bold text-sm uppercase">Hostal Levante</span></div>
        <button onClick=${() => setIsOpen(false)} className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center"><i className="fas fa-times"></i></button>
      </div>
      <div ref=${scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 hide-scroll">
        ${messages.map((m, i) => html`
          <div key=${i} className=${`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className=${`max-w-[85%] p-3.5 rounded-2xl text-[13px] shadow-sm ${m.role === 'user' ? 'bg-[#1e3a8a] text-white rounded-tr-none' : 'bg-white text-slate-700 rounded-tl-none border border-slate-100'}`}>
              <${FormattedMessage} text=${m.text} />
            </div>
          </div>
        `)}
        ${isTyping && html`<div className="flex justify-start"><div className="bg-white p-3 rounded-2xl shadow-sm animate-pulse text-blue-400"><i className="fas fa-ellipsis-h"></i></div></div>`}
      </div>
      <div className="p-4 bg-white border-t border-slate-100 flex space-x-2">
        <input value=${input} onChange=${e => setInput(e.target.value)} onKeyDown=${e => e.key === 'Enter' && onSend()} placeholder="Escribe..." className="flex-1 bg-slate-100 rounded-xl px-4 py-2 text-sm outline-none" />
        <button onClick=${onSend} className="bg-[#1e3a8a] text-white w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"><i className="fas fa-paper-plane text-xs"></i></button>
      </div>
    </div>
  `;
};

// --- SECCIÓN 6: APP PRINCIPAL (ADMIN HUB) ---
const App = () => {
  const [view, setView] = useState('admin');
  const [currentLang, setCurrentLang] = useState('es');
  const [knowledge, setKnowledge] = useState(() => {
    const s = localStorage.getItem('lev_v23_kb');
    return s ? JSON.parse(s) : [{ id: 1, title: 'Check-in', content: 'L\'entrada es a las 15h y la salida a las 11h.' }];
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setCurrentLang(params.get('lang') || 'es');
    if (params.get('view') === 'contact') setView('form_independent');
    localStorage.setItem('lev_v23_kb', JSON.stringify(knowledge));
  }, [knowledge]);

  if (view === 'form_independent') return html`<div className="min-h-screen bg-transparent flex items-center justify-center p-4"><${ContactForm} lang=${currentLang} /></div>`;
  if (window.location.search.includes('embed=true')) return html`<${ChatWidget} knowledge=${knowledge} isEmbedded=${true} />`;

  return html`
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-slate-200">
        <div className="p-6 bg-[#1e3a8a] text-white flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-3"><i className="fas fa-robot text-xl"></i><h1 className="text-xl font-bold">Levante AI Admin</h1></div>
          <div className="flex bg-black/20 p-1 rounded-xl">
            <button onClick=${() => setView('admin')} className=${`px-6 py-2 rounded-lg text-xs font-bold transition-all ${view === 'admin' ? 'bg-white text-blue-900 shadow-sm' : 'text-white/60'}`}>CONOCIMIENTO</button>
            <button onClick=${() => setView('form_preview')} className=${`px-6 py-2 rounded-lg text-xs font-bold transition-all ${view === 'form_preview' ? 'bg-white text-blue-900 shadow-sm' : 'text-white/60'}`}>FORMULARIO</button>
          </div>
        </div>
        
        <div className="p-8">
          ${view === 'admin' ? html`
            <div className="space-y-6 animate-chat">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-slate-800">Datos para entrenar la IA</h3>
                <button onClick=${() => setKnowledge([{id:Date.now(), title:'', content:''}, ...knowledge])} className="bg-blue-600 text-white px-5 py-2 rounded-xl text-xs font-bold">AÑADIR DATO</button>
              </div>
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scroll">
                ${knowledge.map(k => html`
                  <div key=${k.id} className="flex gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 group">
                    <input className="bg-white border border-slate-200 p-3 rounded-xl text-xs w-1/4 font-bold outline-none" placeholder="Título (ej: Wifi)" value=${k.title} onChange=${e => setKnowledge(knowledge.map(x => x.id === k.id ? {...x, title: e.target.value} : x))} />
                    <textarea className="bg-white border border-slate-200 p-3 rounded-xl text-xs flex-1 outline-none min-h-[50px]" placeholder="Información detallada..." value=${k.content} onChange=${e => setKnowledge(knowledge.map(x => x.id === k.id ? {...x, content: e.target.value} : x))} />
                    <button onClick=${() => setKnowledge(knowledge.filter(x => x.id !== k.id))} className="text-red-300 hover:text-red-500 transition-colors p-2"><i className="fas fa-trash-alt"></i></button>
                  </div>
                `)}
              </div>
            </div>
          ` : html`
             <div className="py-12 bg-slate-50 rounded-[3rem] border-4 border-dashed border-slate-200 flex flex-col items-center animate-chat text-center">
                <h3 className="font-bold text-slate-800 mb-6">Prueba de Formulario (${currentLang.toUpperCase()})</h3>
                <div className="flex flex-wrap justify-center gap-2 mb-8">
                  ${['es','en','de','fr','it','pt','ca'].map(l => html`
                    <button onClick=${() => setCurrentLang(l)} className=${`px-4 py-2 rounded-full text-[10px] font-bold border ${currentLang === l ? 'bg-[#1e3a8a] text-white' : 'bg-white text-slate-400'}`}>${l.toUpperCase()}</button>
                  `)}
                </div>
                <${ContactForm} lang=${currentLang} />
             </div>
          `}
        </div>
      </div>
      <${ChatWidget} knowledge=${knowledge} isEmbedded=${false} />
    </div>
  `;
};

createRoot(document.getElementById('root')).render(html`<${App} />`);
