
import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

export const BookingForm = () => {
  return html`
    <div className="w-full h-full bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center border">
        <div className="w-20 h-20 bg-blue-100 text-[#1e3a8a] rounded-full flex items-center justify-center mx-auto mb-6">
          <i className="fas fa-calendar-alt text-3xl"></i>
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Sistema de Reservas</h2>
        <p className="text-slate-500 mb-6">Estamos preparando el nuevo motor de reservas inteligente para el Hostal Levante.</p>
        <div className="bg-blue-50 text-blue-700 p-4 rounded-2xl text-sm font-medium">
          <i className="fas fa-info-circle mr-2"></i>
          Disponible próximamente
        </div>
      </div>
    </div>
  `;
};
