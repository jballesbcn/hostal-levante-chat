
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import htm from 'htm';
import { ChatWidget } from './chat.js';
import { BookingForm } from './booking.js';
import { ContactForm } from './contact.js';

const html = htm.bind(React.createElement);

const AdminPanel = ({ knowledge }) => {
  return html`
    <div className="p-8 max-w-4xl mx-auto font-sans bg-slate-50 min-h-screen">
      <div className="bg-white border rounded-3xl p-8 shadow-sm mb-8">
        <h1 className="text-2xl font-bold mb-6 text-slate-800 flex items-center gap-3">
          <i className="fas fa-tools text-[#1e3a8a]"></i> 
          Hostal Levante - Panel de Administración
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-sm">
           <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
             <div className="font-bold text-blue-800 text-base mb-1">Estado del Chat</div>
             <div className="text-blue-600/70 text-xs uppercase tracking-wider font-bold">Activo</div>
           </div>
           <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
             <div className="font-bold text-slate-800 text-base mb-1">Módulo Reservas</div>
             <div className="text-slate-400 text-xs uppercase tracking-wider font-bold italic">En preparación</div>
           </div>
        </div>
      </div>
      
      <div className="relative h-[600px] border rounded-[2rem] overflow-hidden shadow-inner bg-slate-200/50">
        <${ChatWidget} knowledge=${knowledge} isEmbedded=${true} />
      </div>
    </div>
  `;
};

const App = () => {
  const [knowledge] = useState([
    { title: 'Hostal Levante', content: 'Ubicado en Baixada de Sant Miquel 2, Barcelona. Cerca de Las Ramblas y la Catedral.' },
    { title: 'Check-in', content: 'A partir de las 14:00h. Recepción 24 horas.' },
    { title: 'Wifi', content: 'Gratis en todo el establecimiento.' },
    { title: 'Clima', content: 'Habitaciones con aire acondicionado y calefacción.' }
  ]);
  
  const params = new URLSearchParams(window.location.search);
  const view = params.get('view');
  const isEmbed = params.get('embed') === 'true';

  if (view === 'booking') return html`<${BookingForm} />`;
  if (view === 'contact') return html`<${ContactForm} />`;
  if (isEmbed) return html`<${ChatWidget} knowledge=${knowledge} isEmbedded=${true} />`;
  
  return html`<${AdminPanel} knowledge=${knowledge} />`;
};

createRoot(document.getElementById('root')).render(html`<${App} />`);
