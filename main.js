
import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import htm from 'htm';
import { ChatWidget } from './chat.js';
import { ContactForm } from './contact.js';

const html = htm.bind(React.createElement);

// Detección de idioma para Hostal Levante (Ultra-precisa)
const detectLanguage = () => {
  const validLangs = ['es', 'en', 'ca', 'fr', 'it', 'de', 'nl', 'pt'];
  
  // 1. Prioridad Máxima: Parámetro explícito en la URL del iframe (?lang=en)
  const urlParams = new URLSearchParams(window.location.search);
  let lang = urlParams.get('lang');
  if (lang && validLangs.includes(lang.toLowerCase())) return lang.toLowerCase();
  
  // 2. Prioridad: Ruta en el Referrer (URL de la web padre)
  const referrer = document.referrer;
  if (referrer) {
    const lowerReferrer = referrer.toLowerCase();
    for (const l of validLangs) {
      // Busca patrones como hostallevante.com/en/ o /ca/home.html
      if (lowerReferrer.includes(`/${l}/`)) return l;
    }
  }
  
  // 3. Prioridad: Idioma del navegador
  const navLang = navigator.language.split('-')[0];
  if (validLangs.includes(navLang)) return navLang;
  
  return 'es'; // Idioma base
};

const AdminPanel = ({ knowledge, onAdd, onDelete }) => {
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');

  const navigate = (view) => {
    const url = new URL(window.location.href);
    url.searchParams.set('view', view);
    window.location.href = url.toString();
  };

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newTitle || !newContent) return;
    onAdd({ title: newTitle, content: newContent });
    setNewTitle('');
    setNewContent('');
  };

  return html`
    <div className="p-8 max-w-5xl mx-auto font-sans bg-[#f1f5f9] min-h-screen">
      <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start mb-10 gap-6">
            <div>
                <h1 className="text-3xl font-black text-slate-800 flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#1e3a8a] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-900/20">
                    <i className="fas fa-robot text-xl"></i>
                  </div>
                  Gestión IA Hostal Levante
                </h1>
                <p className="text-slate-400 mt-2 font-medium">Configuración del Concierge Digital</p>
            </div>
            <div className="flex gap-3">
                <button onClick=${() => navigate('contact')} className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                    <i className="fas fa-envelope mr-2"></i> Probar Contacto
                </button>
            </div>
        </div>

        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 mb-8">
          <h3 className="text-sm font-black text-slate-700 mb-4 uppercase tracking-wider">Añadir nueva instrucción a la IA</h3>
          <form onSubmit=${handleAdd} className="flex flex-col md:flex-row gap-4">
            <input 
              className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#1e3a8a]" 
              placeholder="Título (Ej: Check-out)" 
              value=${newTitle}
              onChange=${e => setNewTitle(e.target.value)}
            />
            <input 
              className="flex-[2] px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#1e3a8a]" 
              placeholder="Descripción para la IA..." 
              value=${newContent}
              onChange=${e => setNewContent(e.target.value)}
            />
            <button type="submit" className="bg-[#1e3a8a] text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-blue-800 transition-colors">
              <i className="fas fa-plus mr-2"></i> Actualizar IA
            </button>
          </form>
        </div>

        <div className="space-y-3">
          <h3 className="text-xs font-black text-slate-400 mb-4 uppercase tracking-widest">Conocimientos Activos</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${knowledge.map((item, idx) => html`
              <div key=${idx} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-start group">
                <div>
                  <div className="font-bold text-slate-800 text-sm mb-1">${item.title}</div>
                  <div className="text-slate-500 text-xs leading-relaxed">${item.content}</div>
                </div>
                <button 
                  onClick=${() => onDelete(idx)}
                  className="text-slate-300 hover:text-red-500 p-2 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <i className="fas fa-trash-alt text-xs"></i>
                </button>
              </div>
            `)}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-12 relative h-[650px] border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-2xl bg-white">
            <${ChatWidget} knowledge=${knowledge} isEmbedded=${true} forcedLang=${detectLanguage()} />
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

  // Escuchar cambios en la URL (si el padre cambia el idioma dinámicamente)
  useEffect(() => {
    const handleUrlChange = () => setLang(detectLanguage());
    window.addEventListener('popstate', handleUrlChange);
    return () => window.removeEventListener('popstate', handleUrlChange);
  }, []);

  useEffect(() => {
    localStorage.setItem('levante_kb', JSON.stringify(knowledge));
  }, [knowledge]);

  const addKnowledge = (item) => setKnowledge([...knowledge, item]);
  const deleteKnowledge = (index) => setKnowledge(knowledge.filter((_, i) => i !== index));
  
  const params = new URLSearchParams(window.location.search);
  const view = params.get('view');
  const isEmbed = params.get('embed') === 'true';

  if (view === 'contact') return html`<${ContactForm} forcedLang=${lang} />`;
  if (isEmbed) return html`<${ChatWidget} knowledge=${knowledge} isEmbedded=${true} forcedLang=${lang} />`;
  
  return html`<${AdminPanel} knowledge=${knowledge} onAdd=${addKnowledge} onDelete=${deleteKnowledge} />`;
};

createRoot(document.getElementById('root')).render(html`<${App} />`);
