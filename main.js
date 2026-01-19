
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import htm from 'htm';
import { ChatWidget } from './chat.js';
import { ContactForm } from './contact.js';

const html = htm.bind(React.createElement);

const AdminPanel = ({ knowledge, setKnowledge }) => {
  return html`
    <div className="p-8 max-w-4xl mx-auto font-sans bg-slate-50 min-h-screen">
      <div className="bg-white border rounded-3xl p-8 shadow-sm mb-8">
        <h1 className="text-2xl font-bold mb-6 text-slate-800 flex items-center gap-3">
          <i className="fas fa-tools text-[#1e3a8a]"></i> 
          Hostal Levante - Panel de Control
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
            <h3 className="font-bold text-blue-800 mb-1 text-sm">Estado del Chat</h3>
            <p className="text-xs text-blue-600">Operativo en 8 idiomas.</p>
          </div>
          <div className="p-4 bg-green-50 rounded-2xl border border-green-100">
            <h3 className="font-bold text-green-800 mb-1 text-sm">Formulario de Contacto</h3>
            <p className="text-xs text-green-600">Listo para integración externa.</p>
          </div>
        </div>

        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Base de Conocimiento Chat</h2>
        <div className="space-y-3">
          ${knowledge.map(k => html`
            <div key=${k.id} className="flex gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-200 focus-within:border-blue-400 transition-colors">
              <input className="bg-transparent text-xs w-1/4 font-bold outline-none" placeholder="Título" value=${k.title} onChange=${e => setKnowledge(knowledge.map(x => x.id === k.id ? {...x, title: e.target.value} : x))} />
              <textarea className="bg-transparent text-xs flex-1 outline-none resize-none" rows="1" placeholder="Contenido..." value=${k.content} onChange=${e => setKnowledge(knowledge.map(x => x.id === k.id ? {...x, content: e.target.value} : x))} />
              <button onClick=${() => setKnowledge(knowledge.filter(x => x.id !== k.id))} className="text-slate-300 hover:text-red-500 transition-colors"><i className="fas fa-times-circle"></i></button>
            </div>
          `)}
          <button onClick=${() => setKnowledge([...knowledge, {id: Date.now(), title: '', content: ''}])} className="text-[#1e3a8a] text-xs font-bold hover:underline py-2">+ Añadir nueva información</button>
        </div>

        <div className="mt-8 pt-6 border-t flex justify-between items-center">
          <p className="text-[10px] text-slate-400 italic">Los cambios guardados se aplicarán instantáneamente al chatbot.</p>
          <button onClick=${() => {
            localStorage.setItem('lev_v23_kb', JSON.stringify(knowledge));
            alert('Conocimiento actualizado correctamente.');
          }} className="bg-[#1e3a8a] text-white px-8 py-3 rounded-2xl text-xs font-bold shadow-lg hover:shadow-blue-200 transition-all">Guardar Configuración</button>
        </div>
      </div>
      
      <${ChatWidget} knowledge=${knowledge} isEmbedded=${false} />
    </div>
  `;
};

const App = () => {
  const [knowledge, setKnowledge] = useState(() => {
    const s = localStorage.getItem('lev_v23_kb');
    return s ? JSON.parse(s) : [{ id: 1, title: 'Ubicación', content: 'Carrer de la Baixada de Sant Miquel, 2, 08002 Barcelona.' }];
  });

  const params = new URLSearchParams(window.location.search);
  const isEmbed = params.get('embed') === 'true';
  const view = params.get('view');

  // ROUTER LOGIC
  if (isEmbed) {
    if (view === 'contact') return html`<${ContactForm} />`;
    return html`<${ChatWidget} knowledge=${knowledge} isEmbedded=${true} />`;
  }

  return html`<${AdminPanel} knowledge=${knowledge} setKnowledge=${setKnowledge} />`;
};

createRoot(document.getElementById('root')).render(html`<${App} />`);
