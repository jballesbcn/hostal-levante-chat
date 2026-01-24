
import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import htm from 'htm';
import { ChatWidget } from './chat.js';
import { ContactForm } from './contact.js';

const html = htm.bind(React.createElement);

const detectLanguage = () => {
  const validLangs = ['es', 'en', 'ca', 'fr', 'it', 'de', 'nl', 'pt'];
  const urlParams = new URLSearchParams(window.location.search);
  
  // 1. Prioridad: Parámetro ?lang en la URL
  let lang = urlParams.get('lang');
  if (lang && validLangs.includes(lang.toLowerCase())) return lang.toLowerCase();
  
  // 2. Referrer (URL del sitio padre)
  const referrer = document.referrer;
  if (referrer) {
    const lowerReferrer = referrer.toLowerCase();
    for (const l of validLangs) {
      if (lowerReferrer.includes(`/${l}/`)) return l;
    }
  }
  
  // 3. Idioma del navegador
  const navLang = navigator.language.split('-')[0];
  if (validLangs.includes(navLang)) return navLang;
  
  return 'es';
};

// Nueva función para decidir qué mostrar automáticamente
const detectView = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const viewParam = urlParams.get('view');
  if (viewParam) return viewParam;

  // Si no hay parámetro, miramos la URL del sitio padre
  const referrer = document.referrer.toLowerCase();
  if (referrer.includes('contact')) return 'contact';
  
  return 'chat';
};

const AdminPanel = ({ knowledge, onAdd, onDelete }) => {
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newTitle || !newContent) return;
    onAdd({ title: newTitle, content: newContent });
    setNewTitle('');
    setNewContent('');
  };

  return html`
    <div className="p-8 max-w-4xl mx-auto font-sans bg-slate-50 min-h-screen text-slate-800 animate-fadeIn">
      <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-200">
        <div className="mb-8">
            <h1 className="text-3xl font-black mb-2 text-[#1e3a8a]">Gestión IA</h1>
            <p className="text-slate-400 text-sm font-medium">Actualiza los conocimientos de tu concierge digital.</p>
        </div>
        
        <form onSubmit=${handleAdd} className="flex flex-col md:flex-row gap-4 mb-12 bg-slate-50 p-6 rounded-3xl border border-dashed border-slate-300">
          <input className="border-0 bg-white p-4 rounded-2xl flex-1 text-sm shadow-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="Título (ej: Wifi)" value=${newTitle} onChange=${e => setNewTitle(e.target.value)} />
          <input className="border-0 bg-white p-4 rounded-2xl flex-[2] text-sm shadow-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="Respuesta que debe dar la IA..." value=${newContent} onChange=${e => setNewContent(e.target.value)} />
          <button className="bg-[#1e3a8a] text-white px-8 py-4 rounded-2xl font-bold hover:bg-blue-800 transition-all shadow-lg shadow-blue-900/20 active:scale-95">Guardar</button>
        </form>

        <div className="grid grid-cols-1 gap-4">
          ${knowledge.map((item, idx) => html`
            <div key=${idx} className="flex justify-between items-center p-6 border border-slate-100 rounded-3xl bg-white shadow-sm hover:shadow-md transition-shadow group">
              <div>
                <div className="font-bold text-slate-800 mb-1">${item.title}</div>
                <div className="text-xs text-slate-500 leading-relaxed">${item.content}</div>
              </div>
              <button onClick=${() => onDelete(idx)} className="text-slate-200 hover:text-red-500 p-3 transition-colors opacity-0 group-hover:opacity-100">
                <i className="fas fa-trash-alt"></i>
              </button>
            </div>
          `)}
        </div>
      </div>
    </div>
  `;
};

const App = () => {
  const [knowledge, setKnowledge] = useState(() => {
    const saved = localStorage.getItem('levante_kb');
    return saved ? JSON.parse(saved) : [
      { title: 'Check-in', content: 'Desde las 15:00h. Recepción 24h. Consigna gratuita.' },
      { title: 'Check-out', content: 'Límite a las 11:00h AM. Consigna disponible después.' },
      { title: 'Ubicación', content: 'Baixada de Sant Miquel 2, en el corazón del Gótico.' }
    ];
  });

  const [lang, setLang] = useState(detectLanguage());
  const [view, setView] = useState(detectView());

  useEffect(() => {
    localStorage.setItem('levante_kb', JSON.stringify(knowledge));
  }, [knowledge]);

  const addKnowledge = (item) => setKnowledge([...knowledge, item]);
  const deleteKnowledge = (index) => setKnowledge(knowledge.filter((_, i) => i !== index));
  
  // Renderizado condicional
  if (view === 'admin') return html`<${AdminPanel} knowledge=${knowledge} onAdd=${addKnowledge} onDelete=${deleteKnowledge} />`;
  if (view === 'contact') return html`<${ContactForm} forcedLang=${lang} />`;
  
  return html`
    <div className="w-full h-full m-0 p-0 bg-transparent overflow-hidden flex flex-col">
        <${ChatWidget} knowledge=${knowledge} isEmbedded=${true} forcedLang=${lang} />
    </div>
  `;
};

createRoot(document.getElementById('root')).render(html`<${App} />`);
