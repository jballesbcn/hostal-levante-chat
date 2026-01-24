
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import htm from 'htm';
import { ChatWidget } from './chat.js';
import { BookingForm } from './booking.js';
import { ContactForm } from './contact.js';

const html = htm.bind(React.createElement);

const AdminPanel = ({ knowledge }) => {
  const navigate = (view) => {
    const url = new URL(window.location.href);
    url.searchParams.set('view', view);
    window.location.href = url.toString();
  };

  return html`
    <div className="p-8 max-w-5xl mx-auto font-sans bg-[#f1f5f9] min-h-screen">
      <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm mb-8">
        <div className="flex justify-between items-start mb-10">
            <div>
                <h1 className="text-3xl font-black text-slate-800 flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#1e3a8a] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-900/20">
                    <i className="fas fa-layer-group text-xl"></i>
                  </div>
                  Panel Hostal Levante
                </h1>
                <p className="text-slate-400 mt-2 font-medium">Gestión del ecosistema digital y asistente AI</p>
            </div>
            <div className="flex gap-3">
                <button onClick=${() => navigate('booking')} className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                    <i className="fas fa-calendar-alt mr-2"></i> Reservas
                </button>
                <button onClick=${() => navigate('contact')} className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                    <i className="fas fa-envelope mr-2"></i> Contacto
                </button>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-2 text-sm">
           <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl border border-blue-100 group hover:shadow-md transition-all">
             <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 mb-4 shadow-sm">
                <i className="fas fa-robot text-lg"></i>
             </div>
             <div className="font-black text-slate-800 text-lg mb-1">Concierge AI</div>
             <div className="text-blue-600/70 text-[10px] uppercase tracking-widest font-black">Estado: Proactivo</div>
           </div>
           
           <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm opacity-60 grayscale">
             <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 mb-4">
                <i className="fas fa-chart-pie text-lg"></i>
             </div>
             <div className="font-black text-slate-800 text-lg mb-1">Estadísticas</div>
             <div className="text-slate-400 text-[10px] uppercase tracking-widest font-black">Mantenimiento</div>
           </div>

           <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm opacity-60 grayscale">
             <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 mb-4">
                <i className="fas fa-database text-lg"></i>
             </div>
             <div className="font-black text-slate-800 text-lg mb-1">Documentación</div>
             <div className="text-slate-400 text-[10px] uppercase tracking-widest font-black">Próximamente</div>
           </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-4">
            <div className="bg-[#1e3a8a] text-white p-8 rounded-[2rem] shadow-xl">
                <h3 className="font-black text-xl mb-4 leading-tight">Vista del Cliente</h3>
                <p className="text-blue-100 text-sm mb-6 leading-relaxed">Interactúa con el asistente tal y como lo verán tus huéspedes en la web oficial.</p>
                <div className="flex flex-col gap-2">
                    <div className="p-3 bg-white/10 rounded-xl text-[10px] flex items-center gap-2">
                        <i className="fas fa-info-circle opacity-50"></i>
                        <span>Modo Concierge Activado</span>
                    </div>
                </div>
            </div>
        </div>
        <div className="lg:col-span-8 relative h-[650px] border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-2xl bg-white">
            <${ChatWidget} knowledge=${knowledge} isEmbedded=${true} />
        </div>
      </div>
    </div>
  `;
};

const App = () => {
  const [knowledge] = useState([
    { title: 'Check-in', content: 'Desde las 15:00h (3:00 PM). Recepción abierta 24h. Si llegas antes puedes dejar equipaje en consigna.' },
    { title: 'Check-out', content: 'Límite a las 11:00h AM. Se puede dejar equipaje en consigna después. No hay late check-out.' },
    { title: 'Pagos y Tarifas', content: 'No Reembolsable: se cobra al reservar. Solo Acomodación: depósito de una noche 3 días antes, el resto al llegar (tarjeta o efectivo). Tasa turística se paga al llegar.' },
    { title: 'Cómo llegar', content: 'Desde Aeropuerto: Aerobús a Plaza Catalunya, luego Metro L3 a Liceu. Desde Sants: Metro L3 (línea verde) a Liceu. También Taxi/Uber disponible.' },
    { title: 'Accesibilidad', content: 'No adaptado para necesidades especiales. Acceso por escaleras, ascensor pequeño (no cabe silla de ruedas sin plegar).' },
    { title: 'Servicios Habitación', content: 'Sin televisión. Incluye ropa de cama y toallas. Wifi gratis. Aire acondicionado y calefacción.' },
    { title: 'Otros Servicios', content: 'Pequeña nevera en recepción para medicinas. No hay cocina ni microondas. No hay desayuno ni comidas.' },
    { title: 'Ubicación y Entorno', content: 'En el centro gótico, Baixada de Sant Miquel 2. Cerca de Las Ramblas, Liceu y la Catedral.' }
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
