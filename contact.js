
import React, { useState } from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

const TEXTS = {
  es: {
    title: "Contacto", subtitle: "Estamos aquí para ayudarte. Envíanos tu consulta.",
    name: "Nombre", email: "Email", message: "Mensaje",
    send: "Enviar Mensaje", sending: "Enviando...",
    success: "¡Mensaje enviado con éxito!", successSub: "Te responderemos a la brevedad en tu correo electrónico.",
    error: "Hubo un error al enviar. Por favor, inténtalo de nuevo.",
    required: "Este campo es obligatorio", invalidEmail: "Email no válido"
  },
  en: {
    title: "Contact Us", subtitle: "We are here to help. Send us your inquiry.",
    name: "Name", email: "Email", message: "Message",
    send: "Send Message", sending: "Sending...",
    success: "Message sent successfully!", successSub: "We will get back to you shortly via email.",
    error: "There was an error. Please try again.",
    required: "Required field", invalidEmail: "Invalid email"
  },
  ca: {
    title: "Contacte", subtitle: "Estem aquí per ajudar-te. Envia'ns la teva consulta.",
    name: "Nom", email: "Email", message: "Missatge",
    send: "Enviar Missatge", sending: "Enviant...",
    success: "Missatge enviat amb èxit!", successSub: "Et respondrem ben aviat al teu correu electrònic.",
    error: "S'ha produït un error. Torna-ho a intentar.",
    required: "Camp obligatori", invalidEmail: "Email no vàlid"
  },
  fr: {
    title: "Contact", subtitle: "Nous sommes là pour vous aider.",
    name: "Nom", email: "Email", message: "Message",
    send: "Envoyer", sending: "Envoi...",
    success: "Message envoyé !", successSub: "Nous vous répondrons par email dès que possible.",
    error: "Erreur lors de l'envoi.",
    required: "Obligatoire", invalidEmail: "Email invalide"
  },
  it: {
    title: "Contatto", subtitle: "Siamo qui per aiutarti.",
    name: "Nome", email: "Email", message: "Messaggio",
    send: "Invia", sending: "Invio...",
    success: "Messaggio inviato!", successSub: "Ti risponderemo al più presto via email.",
    error: "Errore durante l'invio.",
    required: "Obbligatorio", invalidEmail: "Email non valida"
  },
  de: {
    title: "Kontakt", subtitle: "Wir sind hier, um zu helfen.",
    name: "Name", email: "E-Mail", message: "Nachricht",
    send: "Absenden", sending: "Wird gesendet...",
    success: "Nachricht gesendet!", successSub: "Wir werden uns in Kürze per E-Mail bei Ihnen melden.",
    error: "Fehler beim Senden.",
    required: "Erforderlich", invalidEmail: "Ungültige E-Mail"
  },
  nl: {
    title: "Contact", subtitle: "Wij zijn hier om te helpen.",
    name: "Naam", email: "E-mail", message: "Bericht",
    send: "Versturen", sending: "Verzenden...",
    success: "Bericht verzonden!", successSub: "We nemen zo snel mogelijk contact met u op via e-mail.",
    error: "Fout bij verzenden.",
    required: "Verplicht", invalidEmail: "Ongeldig e-mailadres"
  },
  pt: {
    title: "Contato", subtitle: "Estamos aqui para ajudar.",
    name: "Nome", email: "E-mail", message: "Mensagem",
    send: "Enviar", sending: "Enviando...",
    success: "Mensagem enviada!", successSub: "Responderemos o mais breve possível por e-mail.",
    error: "Erro ao enviar.",
    required: "Obrigatório", invalidEmail: "E-mail inválido"
  }
};

export const ContactForm = () => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState('idle'); // idle, sending, success, error
  const lang = new URLSearchParams(window.location.search).get('lang') || 'es';
  const t = TEXTS[lang] || TEXTS.es;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;
    
    setStatus('sending');
    
    try {
      // Simulación de envío al servidor SMTP del hostal
      // Aquí conectarías con tu endpoint de backend (PHP/Node) que maneja contactoweb@hostallevante.com
      await new Promise(resolve => setTimeout(resolve, 1500));
      setStatus('success');
    } catch (err) {
      setStatus('error');
    }
  };

  if (status === 'success') {
    return html`
      <div className="w-full h-full flex items-center justify-center p-6 animate-chat">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="fas fa-check text-3xl"></i>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">${t.success}</h2>
          <p className="text-slate-500 text-sm">${t.successSub}</p>
          <button onClick=${() => { setStatus('idle'); setFormData({name:'', email:'', message:''}) }} className="mt-8 text-[#1e3a8a] font-bold text-sm hover:underline">
             ${lang === 'es' ? 'Enviar otro mensaje' : 'Send another message'}
          </button>
        </div>
      </div>
    `;
  }

  return html`
    <form onSubmit=${handleSubmit} className="w-full h-full bg-white flex flex-col p-6 font-sans overflow-y-auto hide-scroll">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">${t.title}</h1>
        <p className="text-slate-500 text-sm">${t.subtitle}</p>
      </div>

      <div className="flex-1 space-y-4 max-w-lg">
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">${t.name}</label>
          <input required type="text" value=${formData.name} onChange=${e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-[#1e3a8a] outline-none transition-all" />
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">${t.email}</label>
          <input required type="email" value=${formData.email} onChange=${e => setFormData({...formData, email: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-[#1e3a8a] outline-none transition-all" />
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">${t.message}</label>
          <textarea required rows="4" value=${formData.message} onChange=${e => setFormData({...formData, message: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-[#1e3a8a] outline-none transition-all resize-none"></textarea>
        </div>

        <!-- Placeholder para reCAPTCHA -->
        <div className="py-2">
           <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <input type="checkbox" required className="w-4 h-4 rounded text-[#1e3a8a]" />
                 <span className="text-[11px] text-slate-500 font-medium">No soy un robot / I'm not a robot</span>
              </div>
              <i className="fab fa-google text-slate-300 text-xl"></i>
           </div>
        </div>
      </div>

      <div className="mt-8">
        <button 
          type="submit"
          disabled=${status === 'sending'}
          className=${`w-full bg-[#1e3a8a] text-white py-4 rounded-2xl text-sm font-bold shadow-lg shadow-blue-100 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-3 ${status === 'sending' ? 'opacity-70' : ''}`}>
          ${status === 'sending' ? html`<i className="fas fa-spinner animate-spin"></i>` : ''}
          ${status === 'sending' ? t.sending : t.send}
        </button>
        ${status === 'error' && html`<p className="text-red-500 text-[10px] mt-2 text-center font-bold">${t.error}</p>`}
      </div>
    </form>
  `;
};
