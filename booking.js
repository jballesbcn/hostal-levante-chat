
import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

export const BookingForm = () => {
  return html`
    <div className="w-full h-full flex items-center justify-center p-8 bg-white font-sans text-center">
      <div>
        <div className="w-20 h-20 bg-blue-50 text-[#1e3a8a] rounded-3xl flex items-center justify-center mx-auto mb-6">
          <i className="fas fa-calendar-alt text-3xl"></i>
        </div>
        <h1 className="text-xl font-bold mb-2">Sistema de Reservas</h1>
        <p className="text-slate-400 text-sm mb-6">Integrando disponibilidad en tiempo real...</p>
        <span className="bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-full">Próximamente</span>
      </div>
    </div>
  `;
};
