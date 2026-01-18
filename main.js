
import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import htm from 'htm';
import { GoogleGenAI } from "@google/genai";

const html = htm.bind(React.createElement);

const GREETINGS = {
  es: "¡Hola! Bienvenido al Hostal Levante. Soy tu asistente virtual inteligente. ¿En qué puedo ayudarte?",
  en: "Hello! Welcome to Hostal Levante. I'm your virtual assistant. How can I help you?",
  ca: "Hola! Benvingut a l'Hostal Levante. Soc el teu assistent virtual. En què et puc ayudar?"
};

// --- CORE SERVICE V20 ---
const askAI = async (history, knowledge, lang) => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API_KEY_NOT_CONFIGURED");

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    const systemInstruction = `Eres el asistente oficial del Hostal Levante (Barcelona). 
Ubicación: Baixada de Sant Miquel, 2. 
Idioma: ${lang}.
Información clave:
${knowledge.map(k => `- ${k.title}: ${k.content}`).join('\n')}

Instrucciones: 
1. Sé muy amable y hospitalario.
2. Responde en máximo 3 frases.
3. Si el cliente pregunta algo que no está en la información, dile que llame al +34 933 17 95 65.
4. No inventes precios si no están listados.`;

    const contents = history
      .filter(m => !m.isGreeting && m.text)
      .map(m => ({
        role: m.role === 'model' ? 'model' : 'user',
        parts: [{ text: m.text }]
      }));

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: contents,
      config: { systemInstruction, temperature: 0.6 }
    });

    return response.text || "Lo siento, he tenido un pequeño lapsus. ¿Puedes repetir?";
  } catch (e) {
    console.error("Vercel AI Error:", e);
    throw e;
  }
};

// --- COMPONENTE CHAT ---
const ChatWidget = ({ knowledge, isEmbedded }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [lang, setLang] = useState('es');
  const scrollRef = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const l = params.get('lang') || 'es';
    setLang(l);
    setMessages([{ role: 'model', text: GREETINGS[l] || GREETINGS.es, isGreeting: true }]);
  }, []);

  useEffect(() => {
    if (isEmbedded) window.parent.postMessage({ type: 'chatbot_state', open: isOpen }, '*');
  }, [isOpen, isEmbedded]);

  useEffect(() => { 
    if (scrollRef.current) scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isTyping]);

  const onSend = async (msg) => {
    const text = msg || input;
    if (!text.trim() || isTyping) return;

    setMessages(prev => [...prev, { role: 'user', text }]);
    setInput('');
    setIsTyping(true);

    try {
      const reply = await askAI([...messages, { role: 'user', text }], knowledge, lang);
      setMessages(prev => [...prev, { role: 'model', text: reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { 
        role: 'model', 
        text: "He tenido un problema de conexión. Si estás en Vercel, verifica la API_KEY. Si sigues en Bluehost, por favor migra a Vercel como te recomendé.",
        isError: true 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  if (!isOpen && isEmbedded) return html`
    <button onClick=${() => setIsOpen(true)} className="fixed bottom-4 right-4 w-14 h-14 bg-[#1e3a8a] text-white rounded-2xl shadow-2xl flex items-center justify-center hover:scale-110 transition-transform pulse-blue z-50">
      <i className="fas fa-comments text-xl"></i>
    </button>
  `;

  return html`
    <div className=${isEmbedded 
      ? "w-full h-full flex flex-col bg-white overflow-hidden shadow-2xl md:rounded-t-[2.5rem] animate-chat" 
      : "fixed bottom-5 right-5 w-[360px] h-[580px] flex flex-col bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 z-[9999] overflow-hidden animate-chat"}>
      
      <div className="bg-[#1e3a8a] p-6 text-white flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/20"><i className="fas fa-concierge-bell"></i></div>
          <div>
            <h3 className="font-bold text-sm leading-tight">Levante AI</h3>
            <p className="text-[10px] opacity-60 uppercase tracking-widest font-medium">Online 24/7</p>
          </div>
        </div>
        <button onClick=${() => setIsOpen(false)} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors"><i className="fas fa-times"></i></button>
      </div>

      <div ref=${scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50 hide-scroll">
        ${messages.map((m, idx) => html`
          <div key=${idx} className=${`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className=${`max-w-[85%] p-4 rounded-2xl text-[13px] leading-relaxed shadow-sm ${m.role === 'user' ? 'bg-[#1e3a8a] text-white rounded-tr-none' : 'bg-white text-slate-700 rounded-tl-none border border-slate-100'}`}>
              ${m.text}
              ${m.isError && html`
                <button onClick=${() => onSend(messages[messages.length-2].text)} className="mt-3 block w-full py-2 bg-blue-50 text-blue-700 rounded-lg text-[10px] font-bold uppercase tracking-wider">Reintentar</button>
              `}
            </div>
          </div>
        `)}
        ${isTyping && html`
          <div className="flex justify-start p-2">
            <div className="bg-white border p-3 rounded-2xl flex items-center space-x-2 shadow-sm">
              <div className="w-1 h-1 bg-blue-900 rounded-full animate-bounce"></div>
              <div className="w-1 h-1 bg-blue-900 rounded-full animate-bounce [animation-delay:0.2s]"></div>
              <div className="w-1 h-1 bg-blue-900 rounded-full animate-bounce [animation-delay:0.4s]"></div>
            </div>
          </div>
        `}
      </div>

      <div className="p-4 bg-white border-t flex space-x-2 items-center">
        <input 
          id="chat-input-v20"
          name="message"
          value=${input} 
          onChange=${e => setInput(e.target.value)} 
          onKeyDown=${e => e.key === 'Enter' && onSend()} 
          placeholder="Escribe tu pregunta..." 
          className="flex-1 bg-slate-50 rounded-2xl px-5 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-100 transition-all border border-slate-100" 
        />
        <button onClick=${() => onSend()} disabled=${!input.trim() || isTyping} className="bg-[#1e3a8a] text-white w-12 h-12 rounded-2xl flex items-center justify-center disabled:opacity-20 shadow-lg hover:bg-blue-800 transition-colors">
          <i className="fas fa-paper-plane text-sm"></i>
        </button>
      </div>
    </div>
  `;
};

// --- PANEL DE CONTROL ---
const App = () => {
  const [isAdmin, setIsAdmin] = useState(true);
  const [knowledge, setKnowledge] = useState(() => {
    const s = localStorage.getItem('lev_v20_kb');
    return s ? JSON.parse(s) : [
      { id: 1, title: 'Check-in', content: 'A partir de las 14:00. Check-out antes de las 11:00.' },
      { id: 2, title: 'Desayuno', content: 'No ofrecemos servicio de desayuno, pero hay cafeterías excelentes a 1 minuto.' },
      { id: 3, title: 'Equipaje', content: 'Disponemos de consigna gratuita para guardar maletas antes del check-in o tras el check-out.' }
    ];
  });

  useEffect(() => localStorage.setItem('lev_v20_kb', JSON.stringify(knowledge)), [knowledge]);

  if (window.location.search.includes('embed=true')) return html`<${ChatWidget} knowledge=${knowledge} isEmbedded=${true} />`;

  const apiReady = !!process.env.API_KEY;

  return html`
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans">
      <nav className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-10 shadow-sm sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-[#1e3a8a] rounded-xl flex items-center justify-center text-white shadow-xl rotate-3"><i className="fas fa-robot text-lg"></i></div>
          <span className="font-black text-xl tracking-tighter text-slate-900">LEVANTE <span className="text-blue-600">AI</span></span>
        </div>
        
        <div className="flex items-center space-x-6">
          <div className="hidden md:flex items-center space-x-2 px-4 py-2 bg-slate-50 rounded-full border border-slate-100">
            <div className=${`w-2 h-2 rounded-full ${apiReady ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`}></div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">${apiReady ? 'API Conectada' : 'API Desconectada'}</span>
          </div>
          <div className="bg-slate-100 p-1 rounded-2xl flex font-bold text-[11px]">
             <button onClick=${() => setIsAdmin(false)} className=${`px-6 py-2 rounded-xl transition-all ${!isAdmin ? 'bg-white shadow-sm text-blue-700' : 'text-slate-500'}`}>VISTA PREVIA</button>
             <button onClick=${() => setIsAdmin(true)} className=${`px-6 py-2 rounded-xl transition-all ${isAdmin ? 'bg-white shadow-sm text-blue-700' : 'text-slate-500'}`}>ADMINISTRAR</button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto py-12 px-6">
        ${isAdmin ? html`
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                 <h2 className="font-bold text-xl mb-2">Instrucciones</h2>
                 <p className="text-sm text-slate-400 mb-6">Añade aquí los datos sobre el hostal. El asistente los usará para responder a los clientes.</p>
                 <button onClick=${() => setKnowledge([{ id: Date.now(), title: 'Nuevo Dato', content: 'Escribe aquí la información...' }, ...knowledge])} className="w-full bg-[#1e3a8a] text-white py-4 rounded-2xl font-bold shadow-xl shadow-blue-900/20 hover:bg-blue-800 transition-all flex items-center justify-center space-x-2">
                    <i className="fas fa-plus"></i> <span>AÑADIR DATO</span>
                 </button>
                 
                 ${!apiReady && html`
                   <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-2xl">
                     <p className="text-[11px] text-red-600 font-bold uppercase mb-2 leading-none"><i className="fas fa-exclamation-triangle mr-1"></i> Error de Configuración</p>
                     <p className="text-[11px] text-red-500 leading-relaxed">No se detecta la API_KEY. Si estás en Vercel, asegúrate de añadirla en "Environment Variables" y hacer un nuevo Deploy.</p>
                   </div>
                 `}
              </div>
            </div>

            <div className="lg:col-span-2 space-y-4 overflow-y-auto max-h-[calc(100vh-250px)] pr-2 hide-scroll pb-20">
              ${knowledge.map(k => html`
                <div key=${k.id} className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm hover:border-blue-200 transition-all group">
                  <div className="flex justify-between items-start mb-4">
                    <input 
                      className="text-sm font-bold text-blue-900 bg-transparent outline-none w-full mr-4 uppercase tracking-wider" 
                      value=${k.title} 
                      onChange=${e => {
                        const newKb = knowledge.map(x => x.id === k.id ? {...x, title: e.target.value} : x);
                        setKnowledge(newKb);
                      }}
                    />
                    <button onClick=${() => setKnowledge(knowledge.filter(x => x.id !== k.id))} className="text-slate-300 hover:text-red-500 transition-colors p-2"><i className="fas fa-trash-alt text-xs"></i></button>
                  </div>
                  <textarea 
                    className="w-full text-sm text-slate-500 bg-slate-50 p-4 rounded-2xl outline-none focus:ring-1 focus:ring-blue-100 min-h-[100px] resize-none"
                    value=${k.content}
                    onChange=${e => {
                      const newKb = knowledge.map(x => x.id === k.id ? {...x, content: e.target.value} : x);
                      setKnowledge(newKb);
                    }}
                  />
                </div>
              `)}
            </div>
          </div>
        ` : html`
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
            <div className="w-32 h-32 bg-white rounded-[3rem] shadow-2xl flex items-center justify-center text-[#1e3a8a] text-4xl border border-slate-100"><i className="fas fa-comment-medical animate-bounce"></i></div>
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Modo Previsualización</h2>
              <p className="text-slate-400 mt-2 max-w-md mx-auto">Interactúa con el asistente abajo a la derecha. Asegúrate de haber configurado la API_KEY en Vercel para que responda.</p>
            </div>
          </div>
        `}
      </div>
      <${ChatWidget} knowledge=${knowledge} isEmbedded=${false} />
    </div>
  `;
};

createRoot(document.getElementById('root')).render(html`<${App} />`);
