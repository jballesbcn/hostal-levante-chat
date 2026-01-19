
import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

export const BookingForm = () => {
  return html`
    <div className="w-full h-full flex items-center justify-center p-8 bg-white font-sans">
      <div className="text-center max-w-sm">
        <div className="w-20 h-20 bg-blue-50 text-[#1e3a8a] rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
          <i className="fas fa-calendar-check text-3xl"></i>
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Sistema de Reservas</h1>
        <p className="text-slate-400 text-sm mb-8 leading-relaxed">
          Estamos integrando el nuevo motor de reservas directo. 
          Estará disponible muy pronto.
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full text-[11px] font-bold text-slate-500 uppercase tracking-widest">
           <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
           Próximamente
        </div>
        
        <div className="mt-10">
          <button 
            onClick=${() => window.top.location.href = 'https://www.hostallevante.com/'}
            className="text-[#1e3a8a] font-bold text-sm hover:underline">
            Volver a la web principal
          </button>
        </div>
      </div>
    </div>
  `;
};
