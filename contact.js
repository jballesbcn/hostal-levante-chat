
import React, { useState, useEffect } from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

const TEXTS = {
  es: {
    title: "Contacto", subtitle: "Estamos aquí para ayudarte. Envíanos tu consulta.",
    name: "Nombre", email: "Email", whatsapp: "WhatsApp (opcional)", message: "Mensaje",
    send: "Enviar Mensaje", sending: "Enviando...",
    success: "¡Mensaje enviado!", successSub: "Hemos recibido tu consulta. Te responderemos muy pronto a contactoweb@hostallevante.com",
    error: "Error al enviar. Por favor, contacta directamente con nosotros.",
    captcha: "Por favor, verifica que no eres un robot."
  },
  en: {
    title: "Contact", subtitle: "We are here to help. Send us your inquiry.",
    name: "Name", email: "Email", whatsapp: "WhatsApp (optional)", message: "Message",
    send: "Send Message", sending: "Sending...",
    success: "Message sent!", successSub: "We have received your inquiry. We will reply shortly.",
    error: "Error sending. Please try contacting us directly.",
    captcha: "Please verify that you are not a robot."
  },
  ca: {
    title: "Contacte", subtitle: "Estem aquí per ajudar-te. Envia'ns la teva consulta.",
    name: "Nom", email: "Email", whatsapp: "WhatsApp (opcional)", message: "Missatge",
    send: "Enviar Missatge", sending: "Enviant...",
    success: "Missatge enviat!", successSub: "Hem rebut la teva consulta. Et respondrem ben aviat.",
    error: "Error en enviar. Torna-ho a intentar o contacta per telèfon.",
    captcha: "Per favor, verifica que no ets un robot."
  },
  fr: {
    title: "Contact", subtitle: "Nous sommes là pour vous aider.",
    name: "Nom", email: "Email", whatsapp: "WhatsApp (facultatif)", message: "Message",
    send: "Envoyer", sending: "Envoi...",
    success: "Message envoyé !", successSub: "Nous vous répondrons dans les plus brefs délais.",
    error: "Erreur d'envoi.",
    captcha: "Veuillez vérifier que vous n'êtes pas un robot."
  },
  it: {
    title: "Contatto", subtitle: "Siamo qui per aiutarti.",
    name: "Nome", email: "Email", whatsapp: "WhatsApp (opzionale)", message: "Messaggio",
    send: "Invia", sending: "Invio...",
    success: "Messaggio inviato!", successSub: "Ti risponderemo al più presto.",
    error: "Errore di invio.",
    captcha: "Per favor, verifica di no essere un robot."
  },
  de: {
    title: "Kontakt", subtitle: "Wir helfen Ihnen gerne weiter.",
    name: "Name", email: "E-Mail", whatsapp: "WhatsApp (optional)", message: "Nachricht",
    send: "Absenden", sending: "Wird gesendet...",
    success: "Nachricht gesendet!", successSub: "Wir werden uns in Kürze bei Ihnen melden.",
    error: "Fehler beim Senden.",
    captcha: "Bitte bestätigen Sie, dass Sie kein Roboter sind."
  },
  nl: {
    title: "Contact", subtitle: "Wij zijn er om u te helpen.",
    name: "Naam", email: "E-mail", whatsapp: "WhatsApp (optioneel)", message: "Bericht",
    send: "Versturen", sending: "Verzenden...",
    success: "Bericht verzonden!", successSub: "We nemen zo snel mogelijk contact met u op.",
    error: "Fout bij verzenden.",
    captcha: "Bevestig dat u geen robot bent."
  },
  pt: {
    title: "Contacto", subtitle: "Estamos aqui para ajudar.",
    name: "Nome", email: "E-mail", whatsapp: "WhatsApp (opcional)", message: "Mensagem",
    send: "Enviar", sending: "A enviar...",
    success: "Mensagem enviada!", successSub: "Responderemos o más breve posible.",
    error: "Erro ao enviar.",
    captcha: "Por favor, verifique que não é um robô."
  }
};

export const ContactForm = () => {
  const [formData, setFormData] = useState({ name: '', email: '', whatsapp: '', message: '' });
  const [status, setStatus] = useState('idle'); 
  const lang = new URLSearchParams(window.location.search).get('lang') || 'es';
  const t = TEXTS[lang] || TEXTS.es;

  useEffect(() => {
    if (window.grecaptcha && document.getElementById('recaptcha-element')) {
      window.grecaptcha.render('recaptcha-element', {
        'sitekey': '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI' 
      });
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const captchaResponse = window.grecaptcha ? window.grecaptcha.getResponse() : 'dummy';
    if (!captchaResponse && status !== 'success') {
      alert(t.captcha);
      return;
    }

    setStatus('sending');
    
    try {
      // LLAMADA REAL AL SERVIDOR PHP
      // Reemplaza esta URL con la ruta absoluta donde subas el archivo PHP
      const response = await fetch('https://www.hostallevante.com/send_email.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.status === 'success') {
        setStatus('success');
      } else {
        throw new Error(result.message || 'Error en el servidor');
      }
    } catch (err) {
      console.error("Error envío:", err);
      setStatus('error');
    }
  };

  if (status === 'success') {
    return html`
      <div className="w-full h-full flex items-center justify-center p-8 bg-white animate-chat">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-check text-2xl"></i>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">${t.success}</h2>
          <p className="text-slate-500 text-xs max-w-[250px] mx-auto">${t.successSub}</p>
          <button onClick=${() => window.location.reload()} className="mt-6 text-[#1e3a8a] text-xs font-bold hover:underline">
            ${lang === 'es' ? 'Enviar otro mensaje' : 'Send another message'}
          </button>
        </div>
      </div>
    `;
  }

  return html`
    <div className="w-full h-full bg-white flex flex-col p-6 font-sans overflow-hidden">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1e3a8a] mb-1">${t.title}</h1>
        <p className="text-slate-400 text-xs">${t.subtitle}</p>
      </div>

      <form onSubmit=${handleSubmit} className="flex-1 space-y-4 overflow-y-auto hide-scroll pb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">${t.name}</label>
              <input required type="text" value=${formData.name} onChange=${e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:border-[#1e3a8a] outline-none transition-all" />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">${t.email}</label>
              <input required type="email" value=${formData.email} onChange=${e => setFormData({...formData, email: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:border-[#1e3a8a] outline-none transition-all" />
            </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">${t.whatsapp}</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-green-500">
                <i className="fab fa-whatsapp"></i>
            </div>
            <input type="tel" value=${formData.whatsapp} onChange=${e => setFormData({...formData, whatsapp: e.target.value})} placeholder="+34 000 000 000" className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm focus:border-[#1e3a8a] outline-none transition-all" />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">${t.message}</label>
          <textarea required rows="3" value=${formData.message} onChange=${e => setFormData({...formData, message: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:border-[#1e3a8a] outline-none transition-all resize-none"></textarea>
        </div>

        <div className="pt-2">
           <div id="recaptcha-element" className="g-recaptcha"></div>
        </div>

        <button 
          type="submit"
          disabled=${status === 'sending'}
          className=${`w-full bg-[#1e3a8a] text-white py-3.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-100 hover:bg-[#162d6b] transition-all flex items-center justify-center gap-2 ${status === 'sending' ? 'opacity-70 cursor-not-allowed' : ''}`}>
          ${status === 'sending' ? html`<i className="fas fa-circle-notch animate-spin"></i>` : html`<i className="fas fa-paper-plane text-xs"></i>`}
          ${status === 'sending' ? t.sending : t.send}
        </button>
        
        ${status === 'error' && html`<p className="text-red-500 text-[10px] text-center font-bold">${t.error}</p>`}
      </form>
    </div>
  `;
};
