
import React, { useState } from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

const TEXTS = {
  es: { 
    title: "Contacto", 
    subtitle: "Responderemos a tu consulta lo antes posible.",
    name: "Nombre", 
    email: "Email", 
    whatsapp: "WhatsApp / Teléfono (opcional)",
    message: "Mensaje", 
    send: "Enviar Mensaje", 
    sending: "Enviando...", 
    success: "¡Mensaje enviado con éxito!", 
    error: "Error al enviar el mensaje." 
  },
  en: { 
    title: "Contact", 
    subtitle: "We will reply to your inquiry as soon as possible.",
    name: "Name", 
    email: "Email", 
    whatsapp: "WhatsApp / Phone (optional)",
    message: "Message", 
    send: "Send Message", 
    sending: "Sending...", 
    success: "Message sent successfully!", 
    error: "Error sending message." 
  },
  it: { 
    title: "Contatto", 
    subtitle: "Risponderemo alla tua richiesta il prima possibile.",
    name: "Nome", 
    email: "Email", 
    whatsapp: "WhatsApp / Telefono (opzionale)",
    message: "Messaggio", 
    send: "Invia Messaggio", 
    sending: "Invio...", 
    success: "Messaggio inviato con successo!", 
    error: "Errore durante l'invio." 
  },
  de: { 
    title: "Kontakt", 
    subtitle: "Wir werden Ihre Anfrage so schnell wie möglich beantworten.",
    name: "Name", 
    email: "Email", 
    whatsapp: "WhatsApp / Telefon (optional)",
    message: "Nachricht", 
    send: "Nachricht Senden", 
    sending: "Wird gesendet...", 
    success: "Nachricht erfolgreich gesendet!", 
    error: "Fehler beim Senden." 
  },
  fr: { 
    title: "Contact", 
    subtitle: "Nous répondrons a votre demande dans les plus brefs délais.",
    name: "Nom", 
    email: "Email", 
    whatsapp: "WhatsApp / Téléphone (optionnel)",
    message: "Message", 
    send: "Envoyer Message", 
    sending: "Envoi...", 
    success: "Message envoyé avec succès !", 
    error: "Erreur lors de l'envoi." 
  },
  nl: { 
    title: "Contact", 
    subtitle: "Wij zullen uw aanvraag zo snel mogelijk beantwoorden.",
    name: "Naam", 
    email: "Email", 
    whatsapp: "WhatsApp / Telefoon (optioneel)",
    message: "Bericht", 
    send: "Bericht Verzenden", 
    sending: "Verzenden...", 
    success: "Bericht succesvol verzonden!", 
    error: "Fout bij verzenden." 
  },
  pt: { 
    title: "Contato", 
    subtitle: "Responderemos à sua dúvida o mais breve possível.",
    name: "Nome", 
    email: "Email", 
    whatsapp: "WhatsApp / Telefone (opcional)",
    message: "Mensagem", 
    send: "Enviar Mensagem", 
    sending: "Enviando...", 
    success: "Mensagem enviada com sucesso!", 
    error: "Erro ao enviar a mensagem." 
  },
  ca: { 
    title: "Contacte", 
    subtitle: "Respondrem a la teva consulta el més aviat possible.",
    name: "Nom", 
    email: "Email", 
    whatsapp: "WhatsApp / Telèfon (opcional)",
    message: "Missatge", 
    send: "Enviar Missatge", 
    sending: "Enviant...", 
    success: "Missatge enviat amb èxit!", 
    error: "Error en enviar el missatge." 
  }
};

export const ContactForm = () => {
  const [formData, setFormData] = useState({ name: '', email: '', whatsapp: '', message: '' });
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
        setFormData({ name: '', email: '', whatsapp: '', message: '' });
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
        <h1 className="text-2xl font-black text-[#1e3a8a] mb-2 flex items-center gap-3">
            <i className="fas fa-envelope-open-text"></i> ${t.title}
        </h1>
        <p className="text-slate-400 text-xs mb-8 font-medium">${t.subtitle}</p>
        
        <form onSubmit=${handleSubmit} className="space-y-6">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">${t.name}</label>
              <input 
                  required
                  value=${formData.name}
                  onChange=${e => setFormData({...formData, name: e.target.value})}
                  className="w-full border-b-2 border-slate-100 py-2 text-sm outline-none focus:border-[#1e3a8a] transition-colors bg-transparent" 
              />
            </div>
            
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">${t.email}</label>
              <input 
                  required
                  type="email"
                  value=${formData.email}
                  onChange=${e => setFormData({...formData, email: e.target.value})}
                  className="w-full border-b-2 border-slate-100 py-2 text-sm outline-none focus:border-[#1e3a8a] transition-colors bg-transparent" 
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">${t.whatsapp}</label>
              <input 
                  type="text"
                  value=${formData.whatsapp}
                  onChange=${e => setFormData({...formData, whatsapp: e.target.value})}
                  placeholder="+34 ..."
                  className="w-full border-b-2 border-slate-100 py-2 text-sm outline-none focus:border-[#1e3a8a] transition-colors bg-transparent" 
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">${t.message}</label>
              <textarea 
                  required
                  value=${formData.message}
                  onChange=${e => setFormData({...formData, message: e.target.value})}
                  className="w-full border-2 border-slate-100 rounded-2xl p-4 text-sm outline-none focus:border-[#1e3a8a] h-32 transition-all resize-none bg-slate-50/30"
              ></textarea>
            </div>
            
            <button 
                type="submit"
                disabled=${status === 'loading'}
                className="w-full bg-[#1e3a8a] text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-900/20 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
                ${status === 'loading' ? html`<i className="fas fa-circle-notch animate-spin"></i>` : ''}
                ${status === 'loading' ? t.sending : t.send}
            </button>

            ${status === 'success' && html`
              <div className="bg-green-50 border border-green-100 p-4 rounded-2xl text-green-700 text-[11px] font-bold text-center animate-fadeIn">
                <i className="fas fa-check-circle mr-2"></i> ${t.success}
              </div>
            `}
            
            ${status === 'error' && html`
              <div className="bg-red-50 border border-red-100 p-4 rounded-2xl text-red-700 text-[11px] font-bold text-center animate-shake">
                <i className="fas fa-exclamation-circle mr-2"></i> ${t.error}
              </div>
            `}
        </form>
      </div>
      <style>
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
        .animate-shake { animation: shake 0.3s ease-in-out; }
      </style>
    </div>
  `;
};
