
import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import htm from 'htm';
import { GoogleGenAI } from "@google/genai";

// 'htm' es una utilidad que nos permite escribir HTML estándar dentro de JavaScript.
// Es lo que hace que el código sea legible y fácil de modificar sin usar herramientas complejas.
const html = htm.bind(React.createElement);

// --- 1. CONFIGURACIÓN DE RUTAS Y DESTINOS ---
// Aquí definimos las direcciones a las que el sistema enviará a los clientes.
const BOOKING_URL = "https://booking.redforts.com/e4mh/";
const DESTINATION_EMAIL = "contactoweb@hostallevante.com";

// --- 2. MOTOR DE IDIOMAS: SALUDOS IA ---
// Este objeto guarda el primer mensaje que dirá el Chatbot según el idioma de la web.
const GREETINGS = {
  es: "¡Hola! Soy el asistente del Hostal Levante. ¿En qué puedo ayudarte hoy?",
  en: "Hi! I'm the Hostal Levante assistant. How can I help you today?",
  de: "Hallo! Ich bin der Assistent des Hostal Levante. Wie kann ich Ihnen heute helfen?",
  fr: "Bonjour ! Je suis l'assistant de l'Hostal Levante. Comment puis-je vous aider aujourd'hui ?",
  it: "Ciao! Sono l'assistente dell'Hostal Levante. Come posso aiutarti oggi?",
  pt: "Olá! Sou o assistente do Hostal Levante. Como posso ajudá-lo hoje?",
  ca: "Hola! Soc l'assistent de l'Hostal Levante. En què et puc ayudar avui?"
};

// --- 3. MOTOR DE IDIOMAS: TEXTOS DEL FORMULARIO ---
// Aquí configuramos todas las palabras que aparecen en el formulario de contacto para los 7 idiomas.
const CONTACT_STRINGS = {
  es: { title: "Contacto", name: "Nombre", email: "Email", message: "Mensaje", send: "ENVIAR", success: "Mensaje enviado con éxito", error_mail: "Email no válido", subtitle: "Responderemos en 24h", captcha: "Protegido por reCAPTCHA" },
  en: { title: "Contact", name: "Name", email: "Email", message: "Message", send: "SEND", success: "Message sent successfully", error_mail: "Invalid email", subtitle: "We reply within 24h", captcha: "Protected by reCAPTCHA" },
  de: { title: "Kontakt", name: "Name", email: "E-Mail", message: "Nachricht", send: "SENDEN", success: "Nachricht erfolgreich gesendet", error_mail: "Ungültige E-Mail", subtitle: "Antwort innerhalb von 24h", captcha: "Geschützt durch reCAPTCHA" },
  fr: { title: "Contact", name: "Nom", email: "E-mail", message: "Message", send: "ENVOYER", success: "Message envoyé avec succès", error_mail: "E-mail invalide", subtitle: "Réponse sous 24h", captcha: "Protégé par reCAPTCHA" },
  it: { title: "Contatto", name: "Nome", email: "Email", message: "Messaggio", send: "INVIA", success: "Messaggio inviato con successo", error_mail: "Email non valida", subtitle: "Risposta entro 24 ore", captcha: "Protetto da reCAPTCHA" },
  pt: { title: "Contacto", name: "Nome", email: "E-mail", message: "Mensagem", send: "ENVIAR", success: "Mensagem enviada com sucesso", error_mail: "E-mail inválido", subtitle: "Resposta em 24h", captcha: "Protegido por reCAPTCHA" },
  ca: { title: "Contacte", name: "Nom", email: "Email", message: "Missatge", send: "ENVIAR", success: "Missatge enviat amb èxit", error_mail: "Email no vàlid", subtitle: "Respondrem en 24h", captcha: "Protegit per reCAPTCHA" }
};

// --- 4. COMPONENTE VISUAL: FORMULARIO DE CONTACTO ---
// Este bloque de código dibuja el formulario en la pantalla y gestiona lo que escribe el usuario.
const ContactForm = ({ lang = 'es' }) => {
  const t = CONTACT_STRINGS[lang] || CONTACT_STRINGS.es;
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState('idle'); // Estados: espera, enviando, terminado.
  const [errors, setErrors] = useState({});

  // Función interna para validar que los datos sean correctos antes de enviar.
  const validate = () => {
    let e = {};
    if (!formData.name) e.name = true;
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) e.email = true;
    if (!formData.message || formData.message.length < 5) e.message = true;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // Función que se dispara al hacer clic en "ENVIAR".
  const handleSubmit = async (e) => {
    e.preventDefault(); // Evita que la página se recargue.
    if (!validate()) return;
    setStatus('sending');
    
    // Simulación de envío: Aquí es donde conectaremos con el servidor SMTP más adelante.
    setTimeout(() => {
      console.log(`Log: Email preparado para ${DESTINATION_EMAIL}`, formData);
      setStatus('success');
    }, 1500);
  };

  // Interfaz que se muestra cuando el mensaje se ha enviado correctamente.
  if (status === 'success') {
    return html`
      <div className="p-10 text-center animate-chat bg-white rounded-[2.5rem] border border-slate-100 shadow-xl max-w-md mx-auto">
        <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-6 mx-auto">
          <i className="fas fa-check text-3xl"></i>
        </div>
        <h2 className="text-2xl font-bold text-slate-800">${t.success}</h2>
        <p className="text-sm text-slate-400 mt-3 leading-relaxed">Hem rebut la seva sol·licitud. Li respondrem al correu electrònic indicat.</p>
        <button onClick=${() => { setStatus('idle'); setFormData({name:'', email:'', message:''}); }} className="mt-8 text-xs font-black text-blue-600 uppercase tracking-widest hover:underline">Enviar un altre</button>
      </div>
    `;
  }

  // Dibujo del formulario (campos de texto y botón).
  return html`
    <form onSubmit=${handleSubmit} className="w-full max-w-lg mx-auto p-8 md:p-12 bg-white rounded-[3rem] shadow-2xl border border-slate-100 animate-chat">
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-black text-[#1e3a8a] tracking-tighter">${t.title}</h2>
        <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-bold mt-2">${t.subtitle}</p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-2">${t.name}</label>
          <input type="text" placeholder="Ej. Juan Pérez" className=${`w-full px-6 py-4 bg-slate-50 rounded-2xl border ${errors.name ? 'border-red-300' : 'border-slate-100'} outline-none focus:ring-4 focus:ring-blue-500/5 transition-all text-sm`} value=${formData.name} onChange=${e => setFormData({...formData, name: e.target.value})} />
        </div>

        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-2">${t.email}</label>
          <input type="email" placeholder="email@ejemplo.com" className=${`w-full px-6 py-4 bg-slate-50 rounded-2xl border ${errors.email ? 'border-red-300' : 'border-slate-100'} outline-none focus:ring-4 focus:ring-blue-500/5 transition-all text-sm`} value=${formData.email} onChange=${e => setFormData({...formData, email: e.target.value})} />
        </div>

        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-2">${t.message}</label>
          <textarea rows="4" placeholder="..." className=${`w-full px-6 py-4 bg-slate-50 rounded-2xl border ${errors.message ? 'border-red-300' : 'border-slate-100'} outline-none focus:ring-4 focus:ring-blue-500/5 transition-all text-sm resize-none`} value=${formData.message} onChange=${e => setFormData({...formData, message: e.target.value})} />
        </div>

        <div className="flex items-center space-x-3 px-2">
          <i className="fas fa-shield-check text-blue-400 text-xs"></i>
          <span className="text-[9px] text-slate-300 uppercase font-black tracking-widest">${t.captcha}</span>
        </div>

        <button type="submit" disabled=${status === 'sending'} className="w-full bg-[#1e3a8a] text-white py-5 rounded-[2rem] font-black text-sm shadow-2xl shadow-blue-900/20 hover:bg-blue-800 hover:-translate-y-1 transition-all active:scale-95 flex items-center justify-center space-x-3 uppercase tracking-widest">
          ${status === 'sending' ? html`<i className="fas fa-circle-notch animate-spin text-lg"></i>` : html`<span>${t.send}</span>`}
        </button>
      </div>
    </form>
  `;
};

// --- 5. LÓGICA DE INTELIGENCIA ARTIFICIAL (GEMINI) ---
// Función para dar formato a las respuestas (pone en negrita lo que esté entre **)
const FormattedMessage = ({ text }) => {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return html`
    <span style=${{ whiteSpace: 'pre-wrap', display: 'block' }}>
      ${parts.map((p, i) => p.startsWith('**') ? html`<b key=${i} className="font-bold text-slate-900">${p.slice(2, -2)}</b>` : p)}
    </span>
  `;
};

// Esta es la función "corazón" que habla con Google Gemini.
const askAI = async (history, knowledge, lang) => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey.length < 10) throw new Error("API_KEY_INVALID");
  try {
    const ai = new GoogleGenAI({ apiKey });
    // Aquí le damos las instrucciones secretas a la IA (System Instructions)
    const systemInstruction = `Eres el asistente oficial del Hostal Levante. Idioma de respuesta: ${lang}. 
    Debes ser amable, profesional y conciso. Si el cliente pregunta por reservar, redirígelo a ${BOOKING_URL}. 
    Usa la siguiente información para responder: ${knowledge.map(k => k.content).join(' ')}`;
    
    const chat = ai.chats.create({ model: 'gemini-3-flash-preview', config: { systemInstruction, temperature: 0.4 } });
    const response = await chat.sendMessage({ message: history[history.length - 1].text });
    return response.text;
  } catch (e) { throw e; }
};

// --- 6. INTERFAZ DEL CHAT (BURBUJA FLOTANTE) ---
const ChatWidget = ({ knowledge, isEmbedded }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);
  
  // Detectamos el idioma desde la URL para que el Chat sepa cómo empezar
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
    } catch { 
      setMessages(prev => [...prev, { role: 'model', text: "Lo sentimos, hay un problema de conexión. Por favor, inténtalo de nuevo más tarde." }]); 
    }
    finally { setIsTyping(false); }
  };

  // Botón flotante que aparece en la web
  if (!isOpen && isEmbedded) return html`
    <div className="w-full h-full flex items-center justify-center">
      <button onClick=${() => setIsOpen(true)} className="w-20 h-20 bg-[#1e3a8a] text-white rounded-full shadow-2xl flex items-center justify-center pulse-blue border-4 border-white transition-transform hover:scale-110">
        <i className="fas fa-comments text-3xl"></i>
      </button>
    </div>
  `;

  // Ventana de chat abierta
  return html`
    <div className=${`flex flex-col bg-white shadow-2xl animate-chat ${isEmbedded ? 'w-full h-full' : 'fixed bottom-5 right-5 w-[400px] h-[650px] rounded-[3rem] z-[9999] border border-slate-200 overflow-hidden'}`}>
      <div className="bg-[#1e3a8a] p-6 text-white flex justify-between items-center shadow-xl">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md"><i className="fas fa-hotel"></i></div>
          <div>
            <div className="font-black text-sm tracking-tight">Hostal Levante</div>
            <div className="flex items-center space-x-1.5"><div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div><span className="text-[10px] opacity-70 font-bold uppercase">Online ahora</span></div>
          </div>
        </div>
        <button onClick=${() => setIsOpen(false)} className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"><i className="fas fa-times text-lg"></i></button>
      </div>
      <div ref=${scrollRef} className="flex-1 overflow-y-auto p-6 space-y-5 bg-slate-50 hide-scroll">
        ${messages.map((m, i) => html`
          <div key=${i} className=${`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className=${`max-w-[85%] p-4 rounded-2xl text-[13.5px] leading-relaxed shadow-sm ${m.role === 'user' ? 'bg-[#1e3a8a] text-white rounded-tr-none' : 'bg-white text-slate-700 rounded-tl-none border border-slate-100'}`}>
              <${FormattedMessage} text=${m.text} />
            </div>
          </div>
        `)}
        ${isTyping && html`<div className="flex justify-start"><div className="bg-white p-4 rounded-2xl shadow-sm animate-pulse text-blue-400 space-x-1"><i className="fas fa-circle text-[6px]"></i><i className="fas fa-circle text-[6px]"></i><i className="fas fa-circle text-[6px]"></i></div></div>`}
      </div>
      <div className="p-5 bg-white border-t border-slate-100 flex space-x-3 items-center">
        <input value=${input} onChange=${e => setInput(e.target.value)} onKeyDown=${e => e.key === 'Enter' && onSend()} placeholder="Escribe tu mensaje..." className="flex-1 bg-slate-100 rounded-[1.5rem] px-6 py-4 text-sm outline-none focus:ring-2 focus:ring-blue-500/10 transition-all" />
        <button onClick=${onSend} className="bg-[#1e3a8a] text-white w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl hover:bg-blue-800 transition-all hover:rotate-6"><i className="fas fa-paper-plane text-lg"></i></button>
      </div>
    </div>
  `;
};

// --- 7. APLICACIÓN PRINCIPAL (HUB) ---
// Aquí es donde el sistema decide si mostrar el Panel Admin, el Chat o el Formulario.
const App = () => {
  const [view, setView] = useState('admin');
  const [currentLang, setCurrentLang] = useState('es');
  
  // Cargamos la base de conocimientos que hayas guardado anteriormente en el navegador.
  const [knowledge, setKnowledge] = useState(() => {
    const s = localStorage.getItem('lev_v23_kb');
    return s ? JSON.parse(s) : [{ id: 1, title: 'Check-in', content: 'L\'horari de entrada es a partir de las 15h. La sortida es a las 11h.' }];
  });

  // Este efecto vigila si hay cambios en la URL (como ?view=contact)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setCurrentLang(params.get('lang') || 'es');
    if (params.get('view') === 'contact') setView('form_independent');
    localStorage.setItem('lev_v23_kb', JSON.stringify(knowledge));
  }, [knowledge]);

  // Si la URL pide el formulario, lo mostramos sin nada más (limpio para el iframe).
  if (view === 'form_independent') return html`
    <div className="min-h-screen bg-transparent flex items-center justify-center p-4">
      <${ContactForm} lang=${currentLang} />
    </div>
  `;

  // Si la URL pide el chatbot embebido.
  if (window.location.search.includes('embed=true')) return html`<${ChatWidget} knowledge=${knowledge} isEmbedded=${true} />`;

  // VISTA POR DEFECTO: El Panel de Control que tú manejas.
  return html`
    <div className="min-h-screen bg-slate-50 p-6 md:p-12">
      <div className="max-w-6xl mx-auto bg-white rounded-[3.5rem] shadow-2xl overflow-hidden border border-slate-200/50">
        
        <!-- CABECERA DEL ADMIN -->
        <div className="p-10 bg-[#1e3a8a] text-white flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center space-x-5">
             <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center backdrop-blur-md shadow-inner"><i className="fas fa-rocket text-2xl text-blue-200"></i></div>
             <div>
                <h1 className="text-3xl font-black uppercase tracking-tighter">Levante AI Hub</h1>
                <p className="text-[10px] text-blue-300 font-black uppercase tracking-[0.3em] opacity-80 mt-1">Centro de Mando Unificado</p>
             </div>
          </div>
          <div className="flex bg-black/20 p-2 rounded-[1.8rem] backdrop-blur-xl border border-white/10">
            <button onClick=${() => setView('admin')} className=${`px-8 py-3 rounded-[1.2rem] text-xs font-black transition-all ${view === 'admin' ? 'bg-white text-blue-900 shadow-2xl scale-105' : 'text-white/60 hover:text-white'}`}>ENTRENAR IA</button>
            <button onClick=${() => setView('form_preview')} className=${`px-8 py-3 rounded-[1.2rem] text-xs font-black transition-all ${view === 'form_preview' ? 'bg-white text-blue-900 shadow-2xl scale-105' : 'text-white/60 hover:text-white'}`}>FORMULARIO</button>
          </div>
        </div>
        
        <div className="p-12">
          ${view === 'admin' ? html`
            <div className="space-y-10 animate-chat">
              <div className="flex justify-between items-end border-b border-slate-100 pb-8">
                <div>
                  <h3 className="font-black text-slate-800 text-2xl tracking-tight">Base de Conocimientos</h3>
                  <p className="text-sm text-slate-400 mt-1">Añade aquí toda la información que quieres que la IA sepa.</p>
                </div>
                <button onClick=${() => setKnowledge([{id:Date.now(), title:'', content:''}, ...knowledge])} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl text-xs font-black shadow-xl shadow-blue-600/30 transition-all hover:-translate-y-1 active:scale-95">AÑADIR DATO NUEVO</button>
              </div>
              <div className="grid gap-5 max-h-[600px] overflow-y-auto pr-4 custom-scroll">
                ${knowledge.map(k => html`
                  <div key=${k.id} className="flex flex-col md:flex-row gap-5 p-6 bg-slate-50 rounded-[2rem] border border-slate-100 hover:border-blue-200 transition-all group">
                    <input className="bg-white border border-slate-200 p-5 rounded-2xl text-xs w-full md:w-1/4 font-black outline-none focus:ring-4 focus:ring-blue-500/5" placeholder="Ej: Mascotas" value=${k.title} onChange=${e => setKnowledge(knowledge.map(x => x.id === k.id ? {...x, title: e.target.value} : x))} />
                    <textarea className="bg-white border border-slate-200 p-5 rounded-2xl text-xs flex-1 outline-none focus:ring-4 focus:ring-blue-500/5 min-h-[80px]" placeholder="Ej: Admitimos mascotas bajo petición con un suplemento..." value=${k.content} onChange=${e => setKnowledge(knowledge.map(x => x.id === k.id ? {...x, content: e.target.value} : x))} />
                    <button onClick=${() => setKnowledge(knowledge.filter(x => x.id !== k.id))} className="text-red-200 hover:text-red-500 transition-colors p-3 self-center"><i className="fas fa-trash-alt text-xl"></i></button>
                  </div>
                `)}
              </div>
            </div>
          ` : html`
             <div className="py-16 bg-slate-50 rounded-[4rem] border-4 border-dashed border-slate-200 flex flex-col items-center animate-chat">
                <div className="mb-12 text-center px-8">
                  <h3 className="font-black text-slate-800 text-2xl tracking-tighter">Vista Previa Multiidioma</h3>
                  <p className="text-xs text-slate-400 mt-2 mb-6">Prueba cómo se ve el formulario en cada idioma:</p>
                  <div className="flex flex-wrap justify-center gap-3">
                    ${['es','en','de','fr','it','pt','ca'].map(l => html`
                      <button onClick=${() => setCurrentLang(l)} className=${`px-6 py-2.5 rounded-full text-[11px] font-black border-2 transition-all ${currentLang === l ? 'bg-[#1e3a8a] text-white border-[#1e3a8a] shadow-xl scale-110' : 'bg-white text-slate-400 border-slate-200 hover:border-blue-200'}`}>${l.toUpperCase()}</button>
                    `)}
                  </div>
                </div>
                
                <${ContactForm} lang=${currentLang} />

                <div className="mt-16 p-10 bg-blue-50/50 mx-10 rounded-[3rem] border border-blue-100 max-w-4xl">
                  <p className="text-sm text-blue-900 font-black mb-6 flex items-center uppercase tracking-widest"><i className="fas fa-terminal mr-4 text-2xl opacity-40"></i>CÓDIGO DE INTEGRACIÓN PARA BLUEHOST:</p>
                  <p className="text-xs text-blue-700/70 mb-5 font-bold">Copia este código y pégalo en el HTML de la página de contacto de la versión <b className="text-blue-900">${currentLang.toUpperCase()}</b>:</p>
                  <div className="relative group">
                    <code className="block bg-white p-6 rounded-3xl text-[11px] text-blue-900 border border-blue-200 overflow-x-auto font-mono shadow-inner leading-relaxed">
                      &lt;iframe src="https://hostal-levante-chat.vercel.app?view=contact&lang=${currentLang}" width="100%" height="750px" frameborder="0" style="border:none; overflow:hidden;"&gt;&lt;/iframe&gt;
                    </code>
                  </div>
                  <p className="text-[10px] text-blue-400 mt-5 font-bold italic">* Nota: El alto (height) de 750px es ideal para que no aparezcan barras de scroll dentro del formulario.</p>
                </div>
             </div>
          `}
        </div>
      </div>
      
      <!-- Chat de prueba siempre disponible en el admin -->
      <${ChatWidget} knowledge=${knowledge} isEmbedded=${false} />
    </div>
  `;
};

// --- 8. INICIO DE LA APLICACIÓN ---
// Buscamos el div con ID 'root' en el index.html y montamos todo el sistema allí.
createRoot(document.getElementById('root')).render(html`<${App} />`);
