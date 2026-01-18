
import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import htm from 'htm';
import { GoogleGenAI } from "@google/genai";

const html = htm.bind(React.createElement);

const GREETINGS = {
  es: "¡Hola! Bienvenido al Hostal Levante en Barcelona. Soy tu asistente virtual. ¿En qué puedo ayudarte?",
  en: "Hello! Welcome to Hostal Levante in Barcelona. I'm your virtual assistant. How can I help you?",
  ca: "Hola! Benvingut a l'Hostal Levante a Barcelona. Soc el teu assistent virtual. En què et puc ayudar?"
};

const askAI = async (history, knowledge, lang) => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey || apiKey === "undefined" || apiKey.length < 10) {
    throw new Error("API_KEY_INVALID");
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    // Instrucción de sistema optimizada
    const systemInstruction = `Eres el asistente virtual oficial del Hostal Levante, Barcelona.
Responde siempre en el idioma: ${lang}.

CONOCIMIENTO ACTUALIZADO:
${knowledge.map(k => `- ${k.title}: ${k.content}`).join('\n')}

REGLAS DE ORO:
1. ACCESIBILIDAD: El hostal NO está adaptado (hay escaleras, ascensor pequeño).
2. SERVICIOS: NO hay TV, NO hay cocina, NO hay desayuno. SÍ hay Wifi y consigna gratis.
3. PAGOS: No Reembolsable (se cobra al reservar) vs Solo Alojamiento (depósito 3 días antes). Tasa turística aparte.
4. ESTILO: Breve, amable y profesional.
5. SI NO SABES ALGO: Remite a info@hostallevante.com o +34 933 17 95 65.`;

    // Creamos el chat con el historial previo formateado
    // Filtramos mensajes de error y el saludo inicial para el historial de la IA
    const chatHistory = history
      .filter(m => !m.isGreeting && !m.isError)
      .slice(0, -1) // Todo menos el último mensaje (que es el que vamos a enviar ahora)
      .map(m => ({
        role: m.role === 'model' ? 'model' : 'user',
        parts: [{ text: m.text }]
      }));

    const chat = ai.chats.create({
      model: 'gemini-flash-latest', // Modelo más compatible y estable
      config: {
        systemInstruction,
        temperature: 0.7,
        maxOutputTokens: 500,
      },
      history: chatHistory
    });

    const lastUserMessage = history[history.length - 1].text;
    const result = await chat.sendMessage({ message: lastUserMessage });
    
    if (!result || !result.text) throw new Error("EMPTY_RESPONSE");
    return result.text;
  } catch (e) {
    console.error("Error detallado de la IA:", e);
    throw e;
  }
};

const ChatWidget = ({ knowledge, isEmbedded }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [lang, setLang] = useState('es');
  const scrollRef = useRef(null);

  useEffect(() => {
    const l = new URLSearchParams(window.location.search).get('lang') || 'es';
    setLang(l);
    setMessages([{ role: 'model', text: GREETINGS[l] || GREETINGS.es, isGreeting: true }]);
  }, []);

  const toggleChat = (state) => {
    setIsOpen(state);
    if (isEmbedded) {
      window.parent.postMessage({ type: 'chatbot_state', open: state }, '*');
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  const onSend = async () => {
    if (!input.trim() || isTyping) return;
    const userText = input;
    const newMessages = [...messages, { role: 'user', text: userText }];
    setMessages(newMessages);
    setInput('');
    setIsTyping(true);
    
    try {
      const reply = await askAI(newMessages, knowledge, lang);
      setMessages(prev => [...prev, { role: 'model', text: reply }]);
    } catch (err) {
      let errorMsg = "Lo siento, ha habido un problema de conexión con el servidor de IA. Por favor, inténtalo de nuevo.";
      if (err.message === "API_KEY_INVALID") {
        errorMsg = "Error: La API_KEY no está configurada correctamente en Vercel.";
      }
      setMessages(prev => [...prev, { role: 'model', text: errorMsg, isError: true }]);
    } finally { 
      setIsTyping(false); 
    }
  };

  if (!isOpen && isEmbedded) return html`
    <div className="w-full h-full flex items-center justify-center bg-transparent">
      <button onClick=${() => toggleChat(true)} className="w-16 h-16 bg-[#1e3a8a] text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform pulse-blue border-4 border-white">
        <i className="fas fa-comments text-2xl"></i>
      </button>
    </div>
  `;

  return html`
    <div className=${`flex flex-col bg-white overflow-hidden shadow-2xl animate-chat ${isEmbedded ? 'w-full h-full' : 'fixed bottom-5 right-5 w-[380px] h-[600px] rounded-[2rem] z-[9999]'}`}>
      <div className="bg-[#1e3a8a] p-5 text-white flex justify-between items-center shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center border border-white/30"><i className="fas fa-hotel text-sm"></i></div>
          <div>
            <div className="font-bold text-sm leading-tight">Hostal Levante</div>
            <div className="text-[10px] text-blue-200 uppercase tracking-wider">Asistente Virtual</div>
          </div>
        </div>
        <button onClick=${() => toggleChat(false)} className="hover:bg-white/10 w-8 h-8 rounded-full transition-colors flex items-center justify-center"><i className="fas fa-times"></i></button>
      </div>
      
      <div ref=${scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 hide-scroll">
        ${messages.map((m, idx) => html`
          <div key=${idx} className=${`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className=${`max-w-[85%] p-3.5 rounded-2xl text-[13px] leading-relaxed shadow-sm ${m.role === 'user' ? 'bg-[#1e3a8a] text-white rounded-tr-none' : m.isError ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-white text-slate-700 rounded-tl-none border border-slate-100'}`}>
              ${m.text}
            </div>
          </div>
        `)}
        ${isTyping && html`<div className="flex justify-start"><div className="bg-white border p-3 rounded-2xl shadow-sm"><div className="flex space-x-1"><div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></div><div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]"></div><div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.4s]"></div></div></div></div>`}
      </div>

      <div className="p-4 bg-white border-t border-slate-100 flex space-x-2 items-center">
        <input 
          value=${input} 
          onChange=${e => setInput(e.target.value)} 
          onKeyDown=${e => e.key === 'Enter' && onSend()} 
          placeholder="Escribe tu pregunta..." 
          className="flex-1 bg-slate-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all border border-transparent focus:border-blue-200" 
        />
        <button onClick=${onSend} className="bg-[#1e3a8a] hover:bg-blue-800 text-white w-10 h-10 rounded-xl flex items-center justify-center transition-colors shadow-lg">
          <i className="fas fa-paper-plane text-xs"></i>
        </button>
      </div>
      <div className="bg-white pb-2 text-center">
        <span className="text-[8px] text-slate-400 uppercase tracking-[0.2em] font-semibold">AI Powered Assistant</span>
      </div>
    </div>
  `;
};

const App = () => {
  const [isAdmin, setIsAdmin] = useState(true);
  const [knowledge, setKnowledge] = useState(() => {
    const s = localStorage.getItem('lev_v22_kb'); // Nueva versión de clave para forzar carga de PDF
    if (s) return JSON.parse(s);
    
    return [
      { id: 1, title: 'Check-in y Consigna', content: 'El check-in es a partir de las 15:00h. Si llegas antes, puedes dejar tu equipaje en nuestra consigna de forma gratuita.' },
      { id: 2, title: 'Recepción 24h', content: 'Nuestra recepción está abierta las 24 horas del día. Siempre hay personal disponible para recibirte.' },
      { id: 3, title: 'Pagos y Reservas', content: 'Tarifa No Reembolsable: Se cobra el total al reservar. Tarifa Solo Alojamiento: Se cobra una noche como depósito 3 días antes de la llegada y el resto en el hostal. La tasa turística se paga al llegar.' },
      { id: 4, title: 'Check-out', content: 'La hora límite de salida es a las 11:00h. No ofrecemos late check-out, pero sí consigna de equipaje gratuita tras la salida.' },
      { id: 5, title: 'Cómo llegar', content: 'Desde el Aeropuerto: Aerobús hasta Plaza Catalunya y luego Metro L3 (Liceu) o andando. Desde Sants: Metro L3 directo hasta Liceu.' },
      { id: 6, title: 'Accesibilidad (IMPORTANTE)', content: 'El hostal NO está adaptado para movilidad reducida. Hay escaleras y el ascensor es pequeño (no cabe una silla de ruedas sin plegar).' },
      { id: 7, title: 'Servicios en Habitación', content: 'Wifi gratuito. Sábanas y toallas incluidas. NO hay televisión en las habitaciones. NO hay habitaciones familiares o conectadas.' },
      { id: 8, title: 'Comidas y Cocina', content: 'NO ofrecemos desayuno ni comidas. NO disponemos de cocina o microondas para uso de los clientes.' },
      { id: 9, title: 'Nevera Medicinas', content: 'Hay una pequeña nevera en recepción exclusivamente para medicinas que requieran frío.' },
      { id: 10, title: 'Taxis y Traslados', content: 'Podemos pedir taxi al aeropuerto (precio no fijo). No hay transfer propio a cruceros, pero hay paradas de taxi y Uber muy cerca.' }
    ];
  });

  useEffect(() => localStorage.setItem('lev_v22_kb', JSON.stringify(knowledge)), [knowledge]);
  if (window.location.search.includes('embed=true')) return html`<${ChatWidget} knowledge=${knowledge} isEmbedded=${true} />`;

  return html`
    <div className="min-h-screen bg-slate-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-white">
        <div className="p-6 bg-[#1e3a8a] text-white flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#1e3a8a] shadow-lg">
              <i className="fas fa-brain text-lg"></i>
            </div>
            <div>
              <h1 className="text-xl font-bold leading-none">Panel de Control AI</h1>
              <p className="text-blue-200 text-[10px] mt-1 uppercase tracking-wider">Hostal Levante Barcelona</p>
            </div>
          </div>
          <div className="flex bg-white/10 p-1 rounded-xl border border-white/20">
            <button onClick=${() => setIsAdmin(true)} className=${`px-5 py-1.5 rounded-lg text-xs font-semibold transition-all ${isAdmin ? 'bg-white text-blue-900 shadow-md' : 'text-white'}`}>Editor de Datos</button>
            <button onClick=${() => setIsAdmin(false)} className=${`px-5 py-1.5 rounded-lg text-xs font-semibold transition-all ${!isAdmin ? 'bg-white text-blue-900 shadow-md' : 'text-white'}`}>Vista Previa</button>
          </div>
        </div>
        
        <div className="p-6">
          ${isAdmin ? html`
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-slate-700 text-sm">Base de Conocimientos (Extraída del PDF)</h3>
                <button onClick=${() => setKnowledge([{id:Date.now(), title:'', content:''}, ...knowledge])} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold hover:bg-blue-700 transition-all shadow-md">
                  + AÑADIR NUEVO DATO
                </button>
              </div>
              <div className="grid gap-3">
                ${knowledge.map(k => html`
                  <div key=${k.id} className="flex flex-col md:flex-row gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-blue-300 transition-all group">
                    <input className="bg-white border border-slate-200 p-2 rounded-lg font-bold text-slate-800 text-xs w-full md:w-1/4 outline-none focus:border-blue-500" placeholder="Ej: Wifi" value=${k.title} onChange=${e => setKnowledge(knowledge.map(x => x.id === k.id ? {...x, title: e.target.value} : x))} />
                    <textarea className="bg-white border border-slate-200 p-2 rounded-lg text-slate-600 text-xs w-full md:flex-1 resize-none outline-none focus:border-blue-500" rows="2" placeholder="Información detallada..." value=${k.content} onChange=${e => setKnowledge(knowledge.map(x => x.id === k.id ? {...x, content: e.target.value} : x))} />
                    <button onClick=${() => setKnowledge(knowledge.filter(x => x.id !== k.id))} className="text-slate-300 hover:text-red-500 transition-colors p-1 self-center">
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </div>
                `)}
              </div>
            </div>
          ` : html`
             <div className="flex flex-col items-center justify-center py-20 text-center">
               <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-400 mb-4">
                 <i className="fas fa-comment-dots text-2xl animate-pulse"></i>
               </div>
               <h2 className="text-lg font-bold text-slate-800">Modo de Prueba</h2>
               <p className="text-slate-500 text-xs max-w-xs mx-auto mt-2">Interactúa con el widget azul de la derecha para verificar que las respuestas basadas en tu PDF son correctas.</p>
             </div>
          `}
        </div>
      </div>
      
      <footer className="mt-8 text-center text-slate-400 text-[10px] uppercase tracking-[0.3em]">
        © Hostal Levante AI Assistant • v2.2 Production
      </footer>

      <${ChatWidget} knowledge=${knowledge} isEmbedded=${false} />
    </div>
  `;
};

createRoot(document.getElementById('root')).render(html`<${App} />`);
