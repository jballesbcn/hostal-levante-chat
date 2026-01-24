
import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import htm from 'htm';
import { ChatWidget } from './chat.js';
import { ContactForm } from './contact.js';

const html = htm.bind(React.createElement);

const detectLanguage = () => {
  const validLangs = ['es', 'en', 'ca', 'fr', 'it', 'de', 'nl', 'pt'];
  const urlParams = new URLSearchParams(window.location.search);
  let lang = urlParams.get('lang');
  if (lang && validLangs.includes(lang.toLowerCase())) return lang.toLowerCase();
  
  const referrer = document.referrer;
  if (referrer) {
    const lowerReferrer = referrer.toLowerCase();
    for (const l of validLangs) {
      if (lowerReferrer.includes(`/${l}/`)) return l;
    }
  }
  
  const navLang = navigator.language.split('-')[0];
  if (validLangs.includes(navLang)) return navLang;
  
  return 'es';
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
    <div className="p-8 max-w-4xl mx-auto font-sans bg-slate-50 min-h-screen text-slate-800">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
        <h1 className="text-2xl font-black mb-2">Panel Admin - Hostal Levante</h1>
        <p className="text-slate-400 text-sm mb-8">Gestión de conocimientos de la IA</p>
        
        <form onSubmit=${handleAdd} className="flex gap-4 mb-10">
          <input className="border p-3 rounded-xl flex-1 text-sm" placeholder="Título" value=${newTitle} onChange=${e => setNewTitle(e.target.value)} />
          <input className="border p-3 rounded-xl flex-[2] text-sm" placeholder="Contenido para la IA" value=${newContent} onChange=${e => setNewContent(e.target.value)} />
          <button className="bg-blue-600 text-white px-6 rounded-xl font-bold">Añadir</button>
        </form>

        <div className="space-y-4">
          ${knowledge.map((item, idx) => html`
            <div key=${idx} className="flex justify-between items-center p-4 border rounded-2xl bg-slate-50">
              <div>
                <div className="font-bold text-sm">${item.title}</div>
                <div className="text-xs text-slate-500">${item.content}</div>
              </div>
              <button onClick=${() => onDelete(idx)} className="text-red-400 hover:text-red-600 p-2">
                <i className="fas fa-trash"></i>
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

  useEffect(() => {
    localStorage.setItem('levante_kb', JSON.stringify(knowledge));
  }, [knowledge]);

  const addKnowledge = (item) => setKnowledge([...knowledge, item]);
  const deleteKnowledge = (index) => setKnowledge(knowledge.filter((_, i) => i !== index));
  
  const params = new URLSearchParams(window.location.search);
  const view = params.get('view');
  
  // Vista de Administración (Solo vía ?view=admin)
  if (view === 'admin') return html`<${AdminPanel} knowledge=${knowledge} onAdd=${addKnowledge} onDelete=${deleteKnowledge} />`;
  
  // Vista de Contacto
  if (view === 'contact') return html`<${ContactForm} forcedLang=${lang} />`;
  
  // POR DEFECTO: El ChatWidget (con fondo transparente y sin márgenes)
  return html`
    <div className="w-full h-full m-0 p-0 bg-transparent overflow-hidden">
        <${ChatWidget} knowledge=${knowledge} isEmbedded=${true} forcedLang=${lang} />
    </div>
  `;
};

createRoot(document.getElementById('root')).render(html`<${App} />`);
