
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-sm">
           <div className="p-4 bg-blue-50 rounded-xl">Formulario de Contacto: <b>Activo</b></div>
           <div className="p-4 bg-green-50 rounded-xl">Chat AI: <b>Activo</b></div>
        </div>
        <button onClick=${() => alert('Configuración guardada en navegador')} className="bg-[#1e3a8a] text-white px-6 py-2 rounded-xl text-sm font-bold">Guardar Cambios</button>
      </div>
      <${ChatWidget} knowledge=${knowledge} isEmbedded=${false} />
    </div>
  `;
};

const App = () => {
  const [knowledge] = useState([{ id: 1, title: 'Info', content: 'Hostal Levante Barcelona' }]);
  const params = new URLSearchParams(window.location.search);
  const view = params.get('view');

  // Solo mantenemos la vista de contacto y la del chat (por defecto)
  if (view === 'contact') return html`<${ContactForm} />`;
  
  // Por defecto el chatbot (o panel admin si no hay embed)
  return html`<${ChatWidget} knowledge=${knowledge} isEmbedded=${params.get('embed') === 'true'} />`;
};

createRoot(document.getElementById('root')).render(html`<${App} />`);
