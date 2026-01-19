
import React, { useState } from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

const TEXTS = {
  es: { title: "Contacto", name: "Nombre", email: "Email", message: "Mensaje", send: "Enviar Mensaje", sending: "Enviando...", success: "¡Mensaje enviado con éxito!", error: "Error al enviar el mensaje." },
  en: { title: "Contact", name: "Name", email: "Email", message: "Message", send: "Send Message", sending: "Sending...", success: "Message sent successfully!", error: "Error sending message." }
};

export const ContactForm = () => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const lang = new URLSearchParams(window.location.search).get('lang') || 'es';
  const t = TEXTS[lang] || TEXTS.es;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    try {
      const response = await fetch('send_email.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const result = await response.json();
      if (result.status === 'success') {
        setStatus('success');
        setFormData({ name: '', email: '', message: '' });
      } else {
        throw new Error(result.message);
      }
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  return html`
    <div className="w-full h-full bg-white p-8 font-sans overflow-y-auto hide-scroll">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-[#1e3a8a] mb-2 flex items-center gap-2">
            <i className="fas fa-envelope-open-text"></i> ${t.title}
        </h1>
        <p className="text-slate-400 text-xs mb-8">Responderemos a tu consulta lo antes posible.</p>
        
        <form onSubmit=${handleSubmit} className="space-y-5">
            <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">${t.name}</label>
            <input 
                required
                value=${formData.name}
                onChange=${e => setFormData({...formData, name: e.target.value})}
                className="w-full border-b-2 border-slate-100 py-2 text-sm outline-none focus:border-[#1e3a8a] transition-colors" 
            />
            </div>
            <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">${t.email}</label>
            <input 
                required
                type="email"
                value=${formData.email}
                onChange=${e => setFormData({...formData, email: e.target.value})}
                className="w-full border-b-2 border-slate-100 py-2 text-sm outline-none focus:border-[#1e3a8a] transition-colors" 
            />
            </div>
            <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">${t.message}</label>
            <textarea 
                required
                value=${formData.message}
                onChange=${e => setFormData({...formData, message: e.target.value})}
                className="w-full border-2 border-slate-100 rounded-xl p-3 text-sm outline-none focus:border-[#1e3a8a] h-32 transition-colors resize-none"
            ></textarea>
            </div>
            
            <button 
                type="submit"
                disabled=${status === 'loading'}
                className="w-full bg-[#1e3a8a] text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-900/20 active:scale-95 transition-all disabled:opacity-50"
            >
                ${status === 'loading' ? t.sending : t.send}
            </button>

            ${status === 'success' && html`<p className="text-green-600 text-xs font-bold text-center mt-2 animate-bounce">${t.success}</p>`}
            ${status === 'error' && html`<p className="text-red-600 text-xs font-bold text-center mt-2">${t.error}</p>`}
        </form>
      </div>
    </div>
  `;
};
