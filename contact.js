
import React, { useState, useEffect } from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

// Mapeo preciso de páginas de inicio según estructura del servidor
const HOME_URLS = {
  es: "https://www.hostallevante.com/es/index.html",
  en: "https://www.hostallevante.com/en/home.html",
  ca: "https://www.hostallevante.com/ca/home-ca.html",
  fr: "https://www.hostallevante.com/fr/home-fr.html",
  it: "https://www.hostallevante.com/it/home-it.html",
  de: "https://www.hostallevante.com/de/home-de.html",
  nl: "https://www.hostallevante.com/nl/home-nl.html",
  pt: "https://www.hostallevante.com/pt/home-pt.html"
};

const TEXTS = {
  es: { 
    title: "Contacto", subtitle: "Responderemos a tu consulta lo antes posible.",
    name: "Nombre", email: "Email", whatsapp: "WhatsApp", optional: "(opcional)",
    message: "Mensaje", captcha: "No soy un robot", send: "Enviar Mensaje", 
    sending: "Enviando...", success: "¡Mensaje enviado con éxito!", 
    redirect: "Redirigiendo a la página de inicio en", error: "Error al enviar el mensaje." 
  },
  en: { 
    title: "Contact", subtitle: "We will reply to your inquiry as soon as possible.",
    name: "Name", email: "Email", whatsapp: "WhatsApp", optional: "(optional)",
    message: "Message", captcha: "I am not a robot", send: "Send Message", 
    sending: "Sending...", success: "Message sent successfully!", 
    redirect: "Redirecting to home page in", error: "Error sending message." 
  },
  it: { title: "Contatto", subtitle: "Risponderemo alla tua richiesta il prima possibile.", name: "Nome", email: "Email", whatsapp: "WhatsApp", optional: "(opzionale)", message: "Messaggio", captcha: "Non sono un robot", send: "Invia Messaggio", sending: "Invio...", success: "Messaggio inviato con successo!", redirect: "Reindirizzamento alla home page tra", error: "Errore durante l'invio." },
  de: { title: "Kontakt", subtitle: "Wir werden Ihre Anfrage so schnell wie möglich beantworten.", name: "Name", email: "Email", whatsapp: "WhatsApp", optional: "(optional)", message: "Nachricht", captcha: "Ich bin kein Roboter", send: "Nachricht Senden", sending: "Wird gesendet...", success: "Nachricht erfolgreich gesendet!", redirect: "Weiterleitung zur Startseite in", error: "Fehler beim Senden." },
  fr: { title: "Contact", subtitle: "Nous répondrons a votre demanda dans les plus brefs délais.", name: "Nom", email: "Email", whatsapp: "WhatsApp", optional: "(optionnel)", message: "Message", captcha: "Je ne suis pas un robot", send: "Envoyer Message", sending: "Envoi...", success: "Message envoyé avec succès !", redirect: "Redirection vers l'accueil dans", error: "Erreur lors de l'envoi." },
  nl: { title: "Contact", subtitle: "Wij zullen uw aanvraag zo snel mogelijk beantwoorden.", name: "Naam", email: "Email", whatsapp: "WhatsApp", optional: "(optioneel)", message: "Bericht", captcha: "Ik bin geen robot", send: "Bericht Verzenden", sending: "Verzenden...", success: "Bericht succesvol verzonden!", redirect: "Doorsturen naar home in", error: "Fout bij verzenden." },
  pt: { title: "Contato", subtitle: "Responderemos à sua duda o más breve posible.", name: "Nome", email: "Email", whatsapp: "WhatsApp", optional: "(opcional)", message: "Mensagem", captcha: "Não sou um robô", send: "Enviar Mensagem", sending: "Enviando...", success: "Mensagem enviada con sucesso!", redirect: "Redirecionando para o início em", error: "Erro ao enviar a mensaje." },
  ca: { title: "Contacte", subtitle: "Respondrem a la teva consulta el més aviat possible.", name: "Nom", email: "Email", whatsapp: "WhatsApp", optional: "(opcional)", message: "Missatge", captcha: "No soc un robot", send: "Enviar Missatge", sending: "Enviant...", success: "Missatge enviat amb èxit!", redirect: "Redirigint a la pàgina d'inici en", error: "Error en enviar el missatge." }
};

export const ContactForm = ({ forcedLang }) => {
  const [formData, setFormData] = useState({ name: '', email: '', whatsapp: '', message: '' });
  const [isHuman, setIsHuman] = useState(false);
  const [status, setStatus] = useState('idle');
  const [countdown, setCountdown] = useState(null);

  const lang = forcedLang || 'es';
  const t = TEXTS[lang];

  useEffect(() => {
    let timer;
    if (countdown !== null && countdown > 0) {
      timer = setTimeout(() => setCountdown(prev => prev - 1), 1000);
    } else if (countdown === 0) {
      const redirectUrl = HOME_URLS[lang] || HOME_URLS.es;
      window.top.location.href = redirectUrl;
    }
    return () => clearTimeout(timer);
  }, [countdown, lang]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isHuman || status === 'loading') return;
    
    setStatus('loading');
    try {
      const response = await fetch('https://www.hostallevante.com/send_email.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const result = await response.json();
      if (result.status === 'success') {
        setStatus('success');
        setCountdown(5);
      } else {
        throw new Error(result.message || 'Error');
      }
    } catch (err) {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  return html`
    <div className="w-full h-full bg-white p-8 font-sans overflow-y-auto hide-scroll">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-black text-[#1e3a8a] mb-1 flex items-center gap-3 tracking-tight">
            <i className="fas fa-paper-plane"></i> ${t.title}
        </h1>
        <p className="text-slate-400 text-xs mb-8 font-medium">${t.subtitle}</p>
        
        <form onSubmit=${handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
              <div className="w-full">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">${t.name}</label>
                <input required value=${formData.name} onChange=${e => setFormData({...formData, name: e.target.value})} className="w-full border-b-2 border-slate-100 py-2 text-sm outline-none focus:border-[#1e3a8a] transition-colors bg-transparent" />
              </div>
              <div className="w-full">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">${t.email}</label>
                <input required type="email" value=${formData.email} onChange=${e => setFormData({...formData, email: e.target.value})} className="w-full border-b-2 border-slate-100 py-2 text-sm outline-none focus:border-[#1e3a8a] transition-colors bg-transparent" />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-2">
                <i className="fab fa-whatsapp text-green-500 text-sm"></i> ${t.whatsapp} <span className="lowercase font-normal opacity-60">${t.optional}</span>
              </label>
              <input type="text" value=${formData.whatsapp} onChange=${e => setFormData({...formData, whatsapp: e.target.value})} placeholder="+34 ..." className="w-full border-b-2 border-slate-100 py-2 text-sm outline-none focus:border-[#1e3a8a] transition-colors bg-transparent" />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">${t.message}</label>
              <textarea required value=${formData.message} onChange=${e => setFormData({...formData, message: e.target.value})} className="w-full border-2 border-slate-100 rounded-2xl p-4 text-sm outline-none focus:border-[#1e3a8a] h-32 transition-all resize-none bg-slate-50 shadow-inner"></textarea>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl max-w-sm">
                <div className="flex items-center gap-3">
                    <input type="checkbox" required id="captcha" checked=${isHuman} onChange=${e => setIsHuman(e.target.checked)} className="w-5 h-5 rounded border-slate-300 text-[#1e3a8a]" />
                    <label htmlFor="captcha" className="text-xs font-bold text-slate-600 cursor-pointer select-none">${t.captcha}</label>
                </div>
                <img src="https://www.gstatic.com/recaptcha/api2/logo_48.png" className="w-8 h-8 grayscale opacity-50" alt="reCAPTCHA" />
            </div>
            
            <button type="submit" disabled=${status === 'loading' || !isHuman || status === 'success'} className="w-full bg-[#1e3a8a] text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-900/20 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                ${status === 'loading' ? t.sending : t.send}
            </button>

            ${status === 'success' && html`
              <div className="fixed inset-0 bg-white z-[999] flex items-center justify-center p-8">
                <div className="text-center space-y-6 max-w-sm">
                  <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-lg"><i className="fas fa-check text-4xl"></i></div>
                  <h2 className="text-2xl font-black text-slate-800">${t.success}</h2>
                  <p className="text-slate-500 text-sm">${t.redirect} <span className="text-[#1e3a8a] font-black">${countdown}</span>s</p>
                </div>
              </div>
            `}
        </form>
      </div>
    </div>
  `;
};
