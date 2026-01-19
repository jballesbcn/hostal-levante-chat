
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import htm from 'htm';
import { ChatWidget } from './chat.js';
import { ContactForm } from './contact.js';

const html = htm.bind(React.createElement);

const AdminPanel = ({ knowledge }) => {
  return html`
    <div className="p-8 max-w-4xl mx-auto font-sans bg-slate-50 min-h-screen">
      <div className="bg-white border rounded-3xl p-8 shadow-sm mb-8">
        <h1 className="text-2xl font-bold mb-6 text-slate-800 flex items-center gap-3">
          <i className="fas fa-tools text-[#1e3a8a]"></i> 
          Hostal Levante - Panel de Control
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-sm">
           <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
             <div className="font-bold text-blue-800">Chatbot AI</div>
             <div className="text-blue-600/70 text-xs">Estado: Activo y conectado</div>
           </div>
           <div className="p-4 bg-green-50 rounded-xl border border-green-100">
             <div className="font-bold text-green-800">Formulario Contacto</div>
             <div className="text-green-600/70 text-xs">Estado: Operativo (send_email.php)</div>
           </div>
        </div>
        <div className="bg-slate-100 p-4 rounded-2xl text-xs text-slate-500 italic">
          Vista previa del chatbot a la derecha/abajo. La configuración del conocimiento está activa.
        </div>
      </div>
      <!-- Vista previa del chat para el administrador -->
      <div className="relative h-[600px] border rounded-[2rem] overflow-hidden shadow-inner bg-slate-200/50">
        <${ChatWidget} knowledge=${knowledge} isEmbedded=${true} />
      </div>
    </div>
  `;
};

const App = () => {
  const [knowledge] = useState([
    { title: 'Hostal Levante', content: 'Ubicado en Baixada de Sant Miquel 2, Barcelona. Cerca de Las Ramblas y la Catedral de Barcelona.' },
    { title: 'Check-in y Recepción', content: 'El check-in es a partir de las 14:00h. Tenemos recepción abierta las 24 horas del día.' },
    { title: 'Wifi y Clima', content: 'Ofrecemos Wifi gratuito en todas las habitaciones y áreas comunes. Todas las habitaciones tienen aire acondicionado y calefacción.' },
    { title: 'Ubicación', content: 'Estamos en pleno Barrio Gótico, a 2 minutos a pie de la Plaza Sant Jaume y a 5 minutos de Las Ramblas.' }
  ]);
  
  const params = new URLSearchParams(window.location.search);
  const view = params.get('view');
  const isEmbed = params.get('embed') === 'true';

  if (view === 'contact') {
    return html`<${ContactForm} />`;
  }
  
  if (isEmbed) {
    return html`<${ChatWidget} knowledge=${knowledge} isEmbedded=${true} />`;
  }
  
  return html`<${AdminPanel} knowledge=${knowledge} />`;
};

createRoot(document.getElementById('root')).render(html`<${App} />`);
