
import React, { useState } from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

const TEXTS = {
  es: { title: "Contacto", name: "Nombre", email: "Email", message: "Mensaje", send: "Enviar" },
  en: { title: "Contact", name: "Name", email: "Email", message: "Message", send: "Send" }
};

export const ContactForm = () => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const lang = new URLSearchParams(window.location.search).get('lang') || 'es';
  const t = TEXTS[lang] || TEXTS.es;

  return html`
    <div className="w-full h-full bg-white p-8 font-sans">
      <h1 className="text-2xl font-bold text-[#1e3a8a] mb-6">${t.title}</h1>
      <form className="space-y-4">
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase">${t.name}</label>
          <input className="w-full border rounded-xl p-3 text-sm outline-none focus:border-[#1e3a8a]" />
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase">${t.email}</label>
          <input className="w-full border rounded-xl p-3 text-sm outline-none focus:border-[#1e3a8a]" />
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase">${t.message}</label>
          <textarea className="w-full border rounded-xl p-3 text-sm outline-none focus:border-[#1e3a8a] h-32"></textarea>
        </div>
        <button className="w-full bg-[#1e3a8a] text-white py-3 rounded-xl font-bold">${t.send}</button>
      </form>
    </div>
  `;
};
