
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
    const systemInstruction = `Eres el asistente virtual oficial del Hostal Levante, ubicado en el centro de Barcelona (Baixada de Sant Miquel, 2).
Tu objetivo es ayudar a los huéspedes con información precisa basada en el conocimiento proporcionado.
Idioma de respuesta: ${lang}.

CONOCIMIENTO DEL HOSTAL:
${knowledge.map(k => `- ${k.title}: ${k.content}`).join('\n')}

DIRECTRICES CRÍTICAS:
- ACCESIBILIDAD: Sé muy claro en que el hostal NO está adaptado para movilidad reducida (hay escaleras y el ascensor es pequeño).
- SERVICIOS: No hay TV, no hay cocina, no hay desayuno. Sí hay Wifi gratis, toallas y sábanas incluidas.
- PAGOS: Explica bien la diferencia entre tarifa No Reembolsable y Solo Alojamiento.
- TONO: Amable, profesional y conciso (máximo 3 frases).
- CONTACTO: Si no tienes la respuesta exacta o es un tema de reserva personal, remite a info@hostallevante.com o al +34 933 17 95 65.`;

    const contents = history
      .filter(m => !m.isGreeting && m.text && !m.isError)
      .map(m => ({
        role: m.role === 'model' ? 'model' : 'user',
        parts: [{ text: m.text }]
      }));

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: contents,
      config: { 
        systemInstruction, 
        temperature: 0.5,
        maxOutputTokens: 600
      }
    });
    
    if (!response || !response.text) throw new Error("EMPTY_RESPONSE");
    return response.text;
  } catch (e) {
    console.error("Error en la llamada a Gemini:", e);
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
    const text = input;
    setMessages(prev => [...prev, { role: 'user', text }]);
    setInput('');
    setIsTyping(true);
    
    try {
      const reply = await askAI([...messages, { role: 'user', text }], knowledge, lang);
      setMessages(prev => [...prev, { role: 'model', text: reply }]);
    } catch (err) {
      let errorMsg = "Lo siento, ha habido un problema de conexión. Por favor, inténtalo de nuevo más tarde.";
      if (err.message === "API_KEY_INVALID") {
        errorMsg = "Configuración incompleta: La API_KEY no es válida en Vercel.";
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
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center border border-white/30"><i className="fas fa-hotel"></i></div>
          <div>
            <div className="font-bold text-sm leading-tight">Hostal Levante</div>
            <div className="text-[10px] text-blue-200">Asistente Virtual 24/7</div>
          </div>
        </div>
        <button onClick=${() => toggleChat(false)} className="hover:bg-white/10 w-8 h-8 rounded-full transition-colors"><i className="fas fa-times"></i></button>
      </div>
      
      <div ref=${scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 hide-scroll">
        ${messages.map((m, idx) => html`
          <div key=${idx} className=${`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className=${`max-w-[85%] p-3.5 rounded-2xl text-[13px] leading-relaxed ${m.role === 'user' ? 'bg-[#1e3a8a] text-white rounded-tr-none shadow-md' : m.isError ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-white text-slate-700 rounded-tl-none border border-slate-100 shadow-sm'}`}>
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
          placeholder="Escribe tu duda aquí..." 
          className="flex-1 bg-slate-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" 
        />
        <button onClick=${onSend} className="bg-[#1e3a8a] hover:bg-blue-800 text-white w-10 h-10 rounded-xl flex items-center justify-center transition-colors shadow-md shadow-blue-900/10">
          <i className="fas fa-paper-plane text-sm"></i>
        </button>
      </div>
      <div className="bg-white pb-2 text-center">
        <span className="text-[9px] text-slate-400 uppercase tracking-widest">Powered by Hostal Levante AI</span>
      </div>
    </div>
  `;
};

const App = () => {
  const [isAdmin, setIsAdmin] = useState(true);
  const [knowledge, setKnowledge] = useState(() => {
    const s = localStorage.getItem('lev_v21_kb');
    if (s) return JSON.parse(s);
    
    // Información optimizada del PDF como predeterminada
    return [
      { id: 1, title: 'Check-in y Consigna', content: 'El check-in es a partir de las 15:00h. Si llegas antes de esa hora, puedes dejar tu equipaje en nuestra consigna de forma gratuita mientras preparas tu habitación.' },
      { id: 2, title: 'Recepción y Horarios', content: 'Nuestra recepción está abierta las 24 horas del día. Siempre hay personal disponible para recibirte, independientemente de la hora de tu llegada.' },
      { id: 3, title: 'Pagos y Reservas', content: 'Tarifa No Reembolsable: Se cobra el total al reservar. Tarifa Solo Alojamiento: Se cobra una noche como depósito 3 días antes de la llegada y el resto en el hostal (tarjeta o efectivo). La tasa turística siempre se paga al llegar.' },
      { id: 4, title: 'Check-out', content: 'La hora límite de salida es a las 11:00h. Ofrecemos servicio de consigna para tus maletas después de salir, pero no disponemos de servicio de late check-out.' },
      { id: 5, title: 'Cómo llegar', content: 'Desde el Aeropuerto: Aerobús hasta Plaza Catalunya y luego Metro L3 (Liceu) o andando. Desde Sants: Metro L3 directo hasta Liceu. También puedes llegar fácilmente en Taxi o Uber.' },
      { id: 6, title: 'Accesibilidad', content: 'El hostal NO está adaptado para personas con movilidad reducida. Hay escaleras, y el ascensor es de uso compartido y pequeño (no cabe una silla de ruedas sin plegar).' },
      { id: 7, title: 'Servicios en Habitación', content: 'Ofrecemos Wifi gratuito en todo el hostal. Las sábanas y toallas están incluidas en el precio. No disponemos de televisión en las habitaciones ni de habitaciones familiares/conectadas.' },
      { id: 8, title: 'Comidas y Cocina', content: 'No ofrecemos servicio de desayuno ni comidas. Tampoco disponemos de cocina o microondas para uso de los clientes, pero estamos rodeados de excelentes cafeterías.' },
      { id: 9, title: 'Nevera para Medicinas', content: 'Disponemos de una pequeña nevera en el office de recepción exclusivamente para que los clientes puedan guardar medicinas que requieran refrigeración.' },
      { id: 10, title: 'Traslados', content: 'Podemos gestionar un taxi al aeropuerto con precio no fijo. No tenemos transfer propio a las terminales de crucero, pero hay paradas de taxi y servicio Uber muy cerca.' }
    ];
  });

  useEffect(() => localStorage.setItem('lev_v21_kb', JSON.stringify(knowledge)), [knowledge]);
  if (window.location.search.includes('embed=true')) return html`<${ChatWidget} knowledge=${knowledge} isEmbedded=${true} />`;

  return html`
    <div className="min-h-screen bg-slate-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-white">
        <div className="p-8 bg-[#1e3a8a] text-white flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-[#1e3a8a] shadow-lg">
              <i className="fas fa-robot text-xl"></i>
            </div>
            <div>
              <h1 className="text-2xl font-bold">Panel de Control</h1>
              <p className="text-blue-200 text-xs">Entrena a la IA del Hostal Levante</p>
            </div>
          </div>
          <div className="flex bg-white/10 p-1 rounded-xl border border-white/20">
            <button onClick=${() => setIsAdmin(true)} className=${`px-6 py-2 rounded-lg text-sm transition-all ${isAdmin ? 'bg-white text-blue-900 shadow-lg' : 'text-white'}`}>Editor</button>
            <button onClick=${() => setIsAdmin(false)} className=${`px-6 py-2 rounded-lg text-sm transition-all ${!isAdmin ? 'bg-white text-blue-900 shadow-lg' : 'text-white'}`}>Vista Previa</button>
          </div>
        </div>
        
        <div className="p-8">
          ${isAdmin ? html`
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-slate-700">Base de Conocimientos (Datos del PDF)</h3>
                <button onClick=${() => setKnowledge([{id:Date.now(), title:'', content:''}, ...knowledge])} className="bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition-all border border-blue-100">
                  <i className="fas fa-plus mr-2"></i>Añadir Dato
                </button>
              </div>
              <div className="grid gap-4">
                ${knowledge.map(k => html`
                  <div key=${k.id} className="group flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-200 transition-colors">
                    <input className="bg-transparent border-none p-2 font-bold text-slate-800 placeholder:text-slate-300 outline-none w-full md:w-1/3" placeholder="Título" value=${k.title} onChange=${e => setKnowledge(knowledge.map(x => x.id === k.id ? {...x, title: e.target.value} : x))} />
                    <textarea className="bg-transparent border-none p-2 text-slate-600 placeholder:text-slate-300 outline-none w-full md:flex-1 resize-none" rows="2" placeholder="Contenido" value=${k.content} onChange=${e => setKnowledge(knowledge.map(x => x.id === k.id ? {...x, content: e.target.value} : x))} />
                    <button onClick=${() => setKnowledge(knowledge.filter(x => x.id !== k.id))} className="text-slate-300 hover:text-red-500 transition-colors self-center p-2">
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </div>
                `)}
              </div>
            </div>
          ` : html`
             <div className="flex flex-col items-center justify-center py-24 text-center">
               <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center text-blue-400 mb-6">
                 <i className="fas fa-eye text-3xl"></i>
               </div>
               <h2 className="text-xl font-bold text-slate-800">Modo Previsualización</h2>
               <p className="text-slate-500 max-w-sm mx-auto mt-2">Prueba el chat con los nuevos datos cargados. El botón azul aparecerá abajo a la derecha.</p>
             </div>
          `}
        </div>
      </div>
      
      <footer className="mt-8 text-center text-slate-400 text-xs">
        <p>© 2024 Hostal Levante Barcelona • Base de datos actualizada v2.1</p>
      </footer>

      <${ChatWidget} knowledge=${knowledge} isEmbedded=${false} />
    </div>
  `;
};

createRoot(document.getElementById('root')).render(html`<${App} />`);
