
import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import htm from 'htm';
import { GoogleGenAI } from "@google/genai";

// Inicializamos 'htm' que nos permite escribir HTML dentro de JavaScript de forma limpia
const html = htm.bind(React.createElement);

// --- CONFIGURACIÓN GLOBAL ---
// Estas constantes definen los enlaces y correos de destino
const BOOKING_URL = "https://booking.redforts.com/e4mh/";
const DESTINATION_EMAIL = "contactoweb@hostallevante.com";

// --- DICCIONARIO MULTIIDIOMA: SALUDOS DEL CHAT ---
// Mensajes iniciales de la IA según el idioma detectado en la URL
const GREETINGS = {
  es: "¡Hola! Soy el asistente del Hostal Levante. ¿En qué puedo ayudarte hoy?",
  en: "Hi! I'm the Hostal Levante assistant. How can I help you today?",
  de: "Hallo! Ich bin der Assistent des Hostal Levante. Wie kann ich Ihnen heute helfen?",
  fr: "Bonjour ! Je suis l'assistant de l'Hostal Levante. Comment puis-je vous aider aujourd'hui ?",
  it: "Ciao! Sono l'assistente dell'Hostal Levante. Come posso aiutarti oggi?",
  pt: "Olá! Sou o assistente do Hostal Levante. Como posso ajudá-lo hoje?",
  ca: "Hola! Soc l'assistent de l'Hostal Levante. En què et puc ayudar avui?"
};

// --- DICCIONARIO MULTIIDIOMA: FORMULARIO DE CONTACTO ---
// Textos de etiquetas, errores y mensajes de éxito para los 7 idiomas solicitados
const CONTACT_STRINGS = {
  es: { title: "Contacto", name: "Nombre", email: "Email", message: "Mensaje", send: "ENVIAR", success: "Mensaje enviado con éxito", error_mail: "Email no válido", subtitle: "Responderemos en 24h", captcha: "Protegido" },
  en: { title: "Contact", name: "Name", email: "Email", message: "Message", send: "SEND", success: "Message sent successfully", error_mail: "Invalid email", subtitle: "We reply within 24h", captcha: "Protected" },
  de: { title: "Kontakt", name: "Name", email: "E-Mail", message: "Nachricht", send: "SENDEN", success: "Nachricht erfolgreich gesendet", error_mail: "Ungültige E-Mail", subtitle: "Antwort innerhalb von 24h", captcha: "Geschützt" },
  fr: { title: "Contact", name: "Nom", email: "E-mail", message: "Message", send: "ENVOYER", success: "Message envoyé avec succès", error_mail: "E-mail invalide", subtitle: "Réponse sous 24h", captcha: "Protégé" },
  it: { title: "Contatto", name: "Nome", email: "Email", message: "Messaggio", send: "INVIA", success: "Messaggio inviato con successo", error_mail: "Email non valida", subtitle: "Risposta entro 24 ore", captcha: "Protetto" },
  pt: { title: "Contacto", name: "Nome", email: "E-mail", message: "Mensagem", send: "ENVIAR", success: "Mensagem enviada com sucesso", error_mail: "E-mail inválido", subtitle: "Resposta em 24h", captcha: "Protegido" },
  ca: { title: "Contacte", name: "Nom", email: "Email", message: "Missatge", send: "ENVIAR", success: "Missatge enviat amb èxit", error_mail: "Email no vàlid", subtitle: "Respondrem en 24h", captcha: "Protegit" }
};

// --- COMPONENTE: FORMULARIO DE CONTACTO ---
// Este bloque gestiona la entrada de datos del usuario, las validaciones y el envío visual
const ContactForm = ({ lang = 'es' }) => {
  const t = CONTACT_STRINGS[lang] || CONTACT_STRINGS.es;
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState('idle'); // Estados: idle (espera), sending (enviando), success (éxito)
  const [errors, setErrors] = useState({});

  // Función de validación: comprueba que los campos no estén vacíos y el email sea correcto
  const validate = () => {
    let e = {};
    if (!formData.name) e.name = true;
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) e.email = true;
    if (!formData.message || formData.message.length < 5) e.message = true;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // Función de envío: se ejecuta al pulsar el botón
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setStatus('sending');
    
    // Simulación del envío (Aquí se conectaría con la función SMTP de Vercel)
    setTimeout(() => {
      console.log(`Email enviado a ${DESTINATION_EMAIL}`, formData);
      setStatus('success');
    }, 1500);
  };

  // Si el envío es exitoso, mostramos un mensaje de confirmación amigable
  if (status === 'success') {
    return html`
      <div className="p-8 text-center animate-chat bg-white rounded-3xl border border-slate-100 shadow-sm max-w-md mx-auto">
        <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-4 mx-auto">
          <i className="fas fa-check text-2xl"></i>
        </div>
        <h2 className="text-xl font-bold text-slate-800">${t.success}</h2>
        <p className="text-xs text-slate-400 mt-2">Hem rebut la teva consulta correctament.</p>
        <button onClick=${() => { setStatus('idle'); setFormData({name:'', email:'', message:''}); }} className="mt-6 text-xs font-bold text-blue-600 uppercase">Enviar un altre</button>
      </div>
    `;
  }

  // Interfaz del formulario (diseño limpio y profesional tipo tarjeta)
  return html`
    <form onSubmit=${handleSubmit} className="w-full max-w-lg mx-auto p-6 md:p-10 bg-white rounded-[2.5rem] shadow-sm border border-slate-100 animate-chat">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-[#1e3a8a]">${t.title}</h2>
        <p className="text-[11px] text-slate-400 uppercase tracking-widest mt-1">${t.subtitle}</p>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 ml-1">${t.name}</label>
          <input type="text" className=${`w-full px-5 py-3.5 bg-slate-50 rounded-2xl border ${errors.name ? 'border-red-300' : 'border-slate-100'} outline-none focus:ring-2 focus:ring-blue-500/10 text-sm`} value=${formData.name} onChange=${e => setFormData({...formData, name: e.target.value})} />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 ml-1">${t.email}</label>
          <input type="email" className=${`w-full px-5 py-3.5 bg-slate-50 rounded-2xl border ${errors.email ? 'border-red-300' : 'border-slate-100'} outline-none focus:ring-2 focus:ring-blue-500/10 text-sm`} value=${formData.email} onChange=${e => setFormData({...formData, email: e.target.value})} />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 ml-1">${t.message}</label>
          <textarea rows="4" className=${`w-full px-5 py-3.5 bg-slate-50 rounded-2xl border ${errors.message ? 'border-red-300' : 'border-slate-100'} outline-none focus:ring-2 focus:ring-blue-500/10 text-sm resize-none`} value=${formData.message} onChange=${e => setFormData({...formData, message: e.target.value})} />
        </div>

        <div className="flex items-center space-x-2 px-1">
          <i className="fas fa-shield-alt text-blue-300 text-[10px]"></i>
          <span className="text-[9px] text-slate-300 uppercase font-bold">${t.captcha}</span>
        </div>

        <button type="submit" disabled=${status === 'sending'} className="w-full bg-[#1e3a8a] text-white py-5 rounded-[1.5rem] font-bold shadow-xl shadow-blue-900/10 hover:bg-blue-800 transition-all flex items-center justify-center space-x-3">
          ${status === 'sending' ? html`<i className="fas fa-circle-notch animate-spin"></i>` : html`<span>${t.send}</span>`}
        </button>
      </div>
    </form>
  `;
};

// --- COMPONENTE: ASISTENTE IA (CHAT) ---
// Función para procesar negritas en las respuestas de la IA
const FormattedMessage = ({ text }) => {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return html`
    <span style=${{ whiteSpace: 'pre-wrap', display: 'block' }}>
      ${parts.map((p, i) => p.startsWith('**') ? html`<b key=${i} className="font-bold text-slate-900">${p.slice(2, -2)}</b>` : p)}
    </span>
  `;
};

// Función principal de llamada a Google Gemini AI
const askAI = async (history, knowledge, lang) => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey.length < 10) throw new Error("API_KEY_INVALID");
  try {
    const ai = new GoogleGenAI({ apiKey });
    const systemInstruction = `Eres el asistente del Hostal Levante. Idioma: ${lang}. Responde siempre de forma amable y concisa. Si preguntan por reserva: ${BOOKING_URL}. Conocimiento: ${knowledge.map(k => k.content).join(' ')}`;
    const chat = ai.chats.create({ model: 'gemini-3-flash-preview', config: { systemInstruction, temperature: 0.4 } });
    const response = await chat.sendMessage({ message: history[history.length - 1].text });
    return response.text;
  } catch (e) { throw e; }
};

// Componente visual del botón de chat flotante y la ventana de chat
const ChatWidget = ({ knowledge, isEmbedded }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);
  const lang = new URLSearchParams(window.location.search).get('lang') || 'es';

  useEffect(() => { setMessages([{ role: 'model', text: GREETINGS[lang] || GREETINGS.es, isGreeting: true }]); }, []);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }); }, [messages, isTyping]);

  const onSend = async (txt) => {
    const message = typeof txt === 'string' ? txt : input;
    if (!message.trim() || isTyping) return;
    const newMsgs = [...messages, { role: 'user', text: message }];
    setMessages(newMsgs); setInput(''); setIsTyping(true);
    try {
      const reply = await askAI(newMsgs, knowledge, lang);
      setMessages(prev => [...prev, { role: 'model', text: reply }]);
    } catch { setMessages(prev => [...prev, { role: 'model', text: "Error de conexió." }]); }
    finally { setIsTyping(false); }
  };

  if (!isOpen && isEmbedded) return html`
    <div className="w-full h-full flex items-center justify-center">
      <button onClick=${() => setIsOpen(true)} className="w-16 h-16 bg-[#1e3a8a] text-white rounded-full shadow-2xl flex items-center justify-center pulse-blue border-4 border-white">
        <i className="fas fa-comments text-2xl"></i>
      </button>
    </div>
  `;

  return html`
    <div className=${`flex flex-col bg-white shadow-2xl animate-chat ${isEmbedded ? 'w-full h-full' : 'fixed bottom-5 right-5 w-[380px] h-[600px] rounded-[2.5rem] z-[9999] border border-slate-200 overflow-hidden'}`}>
      <div className="bg-[#1e3a8a] p-5 text-white flex justify-between items-center shadow-lg">
        <div className="flex items-center space-x-3"><i className="fas fa-hotel"></i><span className="font-bold text-sm">Hostal Levante</span></div>
        <button onClick=${() => setIsOpen(false)} className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center"><i className="fas fa-times"></i></button>
      </div>
      <div ref=${scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50 hide-scroll">
        ${messages.map((m, i) => html`
          <div key=${i} className=${`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className=${`max-w-[85%] p-4 rounded-2xl text-[13px] shadow-sm ${m.role === 'user' ? 'bg-[#1e3a8a] text-white rounded-tr-none' : 'bg-white text-slate-700 rounded-tl-none border border-slate-100'}`}>
              <${FormattedMessage} text=${m.text} />
            </div>
          </div>
        `)}
        ${isTyping && html`<div className="flex justify-start"><div className="bg-white p-3 rounded-2xl shadow-sm animate-pulse text-blue-400"><i className="fas fa-ellipsis-h"></i></div></div>`}
      </div>
      <div className="p-4 bg-white border-t border-slate-100 flex space-x-2">
        <input value=${input} onChange=${e => setInput(e.target.value)} onKeyDown=${e => e.key === 'Enter' && onSend()} placeholder="Escribe..." className="flex-1 bg-slate-100 rounded-2xl px-5 py-3 text-sm outline-none" />
        <button onClick=${onSend} className="bg-[#1e3a8a] text-white w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg hover:bg-blue-800 transition-colors"><i className="fas fa-paper-plane text-sm"></i></button>
      </div>
    </div>
  `;
};

// --- APP PRINCIPAL ---
// Aquí orquestamos qué vista mostrar (Panel Admin, Chatbot o Formulario)
const App = () => {
  const [view, setView] = useState('admin');
  const [currentLang, setCurrentLang] = useState('es');
  const [knowledge, setKnowledge] = useState(() => {
    const s = localStorage.getItem('lev_v23_kb');
    return s ? JSON.parse(s) : [{ id: 1, title: 'Check-in', content: 'Check-in: 15h. Check-out: 11h.' }];
  });

  // Efecto para detectar parámetros en la URL (importante para el Iframe)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setCurrentLang(params.get('lang') || 'es');
    if (params.get('view') === 'contact') setView('form_independent');
    localStorage.setItem('lev_v23_kb', JSON.stringify(knowledge));
  }, [knowledge]);

  // VISTA 1: Formulario independiente para el Iframe de la web de contacto
  if (view === 'form_independent') return html`
    <div className="min-h-screen bg-transparent flex items-center justify-center p-4">
      <${ContactForm} lang=${currentLang} />
    </div>
  `;

  // VISTA 2: Chatbot embebido (si el parámetro embed=true existe)
  if (window.location.search.includes('embed=true')) return html`<${ChatWidget} knowledge=${knowledge} isEmbedded=${true} />`;

  // VISTA 3: Panel de Administración (lo que tú ves para configurar todo)
  return html`
    <div className="min-h-screen bg-slate-100 p-4 md:p-10">
      <div className="max-w-5xl mx-auto bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-200/50">
        
        <!-- Cabecera del Administrador -->
        <div className="p-8 bg-[#1e3a8a] text-white flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center space-x-4">
             <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm"><i className="fas fa-sliders-h text-xl"></i></div>
             <div>
                <h1 className="text-2xl font-black uppercase tracking-tighter">Levante AI Hub</h1>
                <p className="text-[10px] text-blue-300 font-bold uppercase tracking-widest opacity-80">Gestión de IA y Formularios</p>
             </div>
          </div>
          <div className="flex bg-black/20 p-1.5 rounded-2xl backdrop-blur-md">
            <button onClick=${() => setView('admin')} className=${`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${view === 'admin' ? 'bg-white text-blue-900 shadow-xl' : 'text-white/60'}`}>ENTRENAR IA</button>
            <button onClick=${() => setView('form_preview')} className=${`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${view === 'form_preview' ? 'bg-white text-blue-900 shadow-xl' : 'text-white/60'}`}>FORMULARIO</button>
          </div>
        </div>
        
        <div className="p-10">
          ${view === 'admin' ? html`
            <div className="space-y-8 animate-chat">
              <div className="flex justify-between items-end border-b border-slate-100 pb-6">
                <div>
                  <h3 className="font-black text-slate-800 text-lg">Base de Conocimientos</h3>
                  <p className="text-xs text-slate-400">Datos que la IA utilizará para responder a los clientes.</p>
                </div>
                <button onClick=${() => setKnowledge([{id:Date.now(), title:'', content:''}, ...knowledge])} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl text-xs font-black shadow-lg shadow-blue-600/30 transition-all active:scale-95">NUEVO DATO</button>
              </div>
              <div className="grid gap-4 max-h-[500px] overflow-y-auto pr-4 custom-scroll">
                ${knowledge.map(k => html`
                  <div key=${k.id} className="flex flex-col md:flex-row gap-4 p-5 bg-slate-50 rounded-3xl border border-slate-100 hover:border-blue-100 transition-all group">
                    <input className="bg-white border border-slate-200 p-4 rounded-2xl text-xs w-full md:w-1/4 font-black outline-none focus:ring-2 focus:ring-blue-500/10" placeholder="Ej: Política de Cancelación" value=${k.title} onChange=${e => setKnowledge(knowledge.map(x => x.id === k.id ? {...x, title: e.target.value} : x))} />
                    <textarea className="bg-white border border-slate-200 p-4 rounded-2xl text-xs flex-1 outline-none focus:ring-2 focus:ring-blue-500/10 min-h-[60px]" placeholder="Escribe aquí los detalles..." value=${k.content} onChange=${e => setKnowledge(knowledge.map(x => x.id === k.id ? {...x, content: e.target.value} : x))} />
                    <button onClick=${() => setKnowledge(knowledge.filter(x => x.id !== k.id))} className="text-red-200 hover:text-red-500 transition-colors p-2 self-center"><i className="fas fa-trash-alt"></i></button>
                  </div>
                `)}
              </div>
            </div>
          ` : html`
             <div className="py-12 bg-slate-50 rounded-[3rem] border-4 border-dashed border-slate-200 flex flex-col items-center animate-chat">
                <div className="mb-10 text-center px-6">
                  <h3 className="font-black text-slate-800 text-xl">Previsualización de Formulario</h3>
                  <div className="flex flex-wrap justify-center gap-2 mt-4">
                    ${['es','en','de','fr','it','pt','ca'].map(l => html`
                      <button onClick=${() => setCurrentLang(l)} className=${`px-4 py-1.5 rounded-full text-[10px] font-black border transition-all ${currentLang === l ? 'bg-[#1e3a8a] text-white border-[#1e3a8a]' : 'bg-white text-slate-400 border-slate-200'}`}>${l.toUpperCase()}</button>
                    `)}
                  </div>
                </div>
                
                <${ContactForm} lang=${currentLang} />

                <div className="mt-12 p-8 bg-blue-50/50 mx-10 rounded-[2rem] border border-blue-100 max-w-3xl">
                  <p className="text-xs text-blue-800 font-black mb-4 flex items-center"><i className="fas fa-code mr-2 text-lg"></i>CÓDIGO DE INTEGRACIÓN PARA TU WEB:</p>
                  <p className="text-[11px] text-blue-600 mb-4 font-medium">Copia y pega este código en tu archivo <b>contacto-Hostal-Levante.html</b> de Bluehost:</p>
                  <code className="block bg-white p-5 rounded-2xl text-[11px] text-blue-900 border border-blue-200 overflow-x-auto font-mono shadow-inner">
                    &lt;iframe src="https://hostal-levante-chat.vercel.app?view=contact&lang=${currentLang}" width="100%" height="700px" frameborder="0" style="border:none; overflow:hidden;"&gt;&lt;/iframe&gt;
                  </code>
                </div>
             </div>
          `}
        </div>
      </div>
      
      <!-- El chatbot también aparece en el Admin para que puedas probarlo mientras editas -->
      <${ChatWidget} knowledge=${knowledge} isEmbedded=${false} />
    </div>
  `;
};

// Renderizamos la aplicación en el elemento 'root' del index.html
createRoot(document.getElementById('root')).render(html`<${App} />`);
