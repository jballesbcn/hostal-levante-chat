
import React, { useState, useEffect } from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

const TEXTS = {
  es: { 
    title: "Contacto", 
    subtitle: "Responderemos a tu consulta lo antes posible.",
    name: "Nombre", 
    email: "Email", 
    whatsapp: "WhatsApp",
    optional: "(opcional)",
    message: "Mensaje", 
    captcha: "No soy un robot",
    send: "Enviar Mensaje", 
    sending: "Enviando...", 
    success: "¡Mensaje enviado con éxito!", 
    redirect: "Redirigiendo a la página de inicio en",
    error: "Error al enviar el mensaje." 
  },
  en: { 
    title: "Contact", 
    subtitle: "We will reply to your inquiry as soon as possible.",
    name: "Name", 
    email: "Email", 
    whatsapp: "WhatsApp",
    optional: "(optional)",
    message: "Message", 
    captcha: "I am not a robot",
    send: "Send Message", 
    sending: "Sending...", 
    success: "Message sent successfully!", 
    redirect: "Redirecting to home page in",
    error: "Error sending message." 
  },
  it: { 
    title: "Contatto", 
    subtitle: "Risponderemo alla tua richiesta il prima possibile.",
    name: "Nome", 
    email: "Email", 
    whatsapp: "WhatsApp",
    optional: "(opzionale)",
    message: "Messaggio", 
    captcha: "Non sono un robot",
    send: "Invia Messaggio", 
    sending: "Invio...", 
    success: "Messaggio inviato con successo!", 
    redirect: "Reindirizzamento alla home page tra",
    error: "Errore durante l'invio." 
  },
  de: { 
    title: "Kontakt", 
    subtitle: "Wir werden Ihre Anfrage so schnell wie möglich beantworten.",
    name: "Name", 
    email: "Email", 
    whatsapp: "WhatsApp",
    optional: "(optional)",
    message: "Nachricht", 
    captcha: "Ich bin kein Roboter",
    send: "Nachricht Senden", 
    sending: "Wird gesendet...", 
    success: "Nachricht erfolgreich gesendet!", 
    redirect: "Weiterleitung zur Startseite in",
    error: "Fehler beim Senden." 
  },
  fr: { 
    title: "Contact", 
    subtitle: "Nous répondrons a votre demande dans les plus brefs délais.",
    name: "Nom", 
    email: "Email", 
    whatsapp: "WhatsApp",
    optional: "(optionnel)",
    message: "Message", 
    captcha: "Je ne suis pas un robot",
    send: "Envoyer Message", 
    sending: "Envoi...", 
    success: "Message envoyé avec succès !", 
    redirect: "Redirection vers l'accueil dans",
    error: "Erreur lors de l'envoi." 
  },
  nl: { 
    title: "Contact", 
    subtitle: "Wij zullen uw aanvraag zo snel mogelijk beantwoorden.",
    name: "Naam", 
    email: "Email", 
    whatsapp: "WhatsApp",
    optional: "(optioneel)",
    message: "Bericht", 
    captcha: "Ik bin geen robot",
    send: "Bericht Verzenden", 
    sending: "Verzenden...", 
    success: "Bericht succesvol verzonden!", 
    redirect: "Doorsturen naar home in",
    error: "Fout bij verzenden." 
  },
  pt: { 
    title: "Contato", 
    subtitle: "Responderemos à sua duda o más breve posible.",
    name: "Nome", 
    email: "Email", 
    whatsapp: "WhatsApp",
    optional: "(opcional)",
    message: "Mensagem", 
    captcha: "Não sou um robô",
    send: "Enviar Mensagem", 
    sending: "Enviando...", 
    success: "Mensagem enviada con sucesso!", 
    redirect: "Redirecionando para o início em",
    error: "Erro ao enviar a mensaje." 
  },
  ca: { 
    title: "Contacte", 
    subtitle: "Respondrem a la teva consulta el més aviat possible.",
    name: "Nom", 
    email: "Email", 
    whatsapp: "WhatsApp",
    optional: "(opcional)",
    message: "Missatge", 
    captcha: "No soc un robot",
    send: "Enviar Missatge", 
    sending: "Enviant...", 
    success: "Missatge enviat amb èxit!", 
    redirect: "Redirigint a la pàgina d'inici en",
    error: "Error en enviar el missatge." 
  }
};

export const ContactForm = () => {
  const [formData, setFormData] = useState({ name: '', email: '', whatsapp: '', message: '' });
  const [isHuman, setIsHuman] = useState(false);
  const [status, setStatus] = useState('idle');
  const [countdown, setCountdown] = useState(null);
  const lang = new URLSearchParams(window.location.search).get('lang') || 'es';
  const t = TEXTS[lang] || TEXTS.es;

  // Lógica de cuenta atrás y redirección
  useEffect(() => {
    let timer;
    if (countdown !== null && countdown > 0) {
      timer = setTimeout(() => setCountdown(prev => prev - 1), 1000);
    } else if (countdown === 0) {
      // Redirección forzada a la URL absoluta del Hostal
      window.top.location.href = 'https://www.hostallevante.com/index.html';
    }
    return () => clearTimeout(timer);
  }, [countdown]);

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
        setCountdown(5); // Inicia la cuenta atrás de 5 segundos
      } else {
        throw new Error(result.message || 'Error desconocido');
      }
    } catch (err) {
      console.error("Error envío:", err);
      setStatus('error');
      // Reset automático del estado de error tras 3 segundos para dejar reintentar
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  return html`
    <div className="w-full h-full bg-white p-8 font-sans overflow-y-auto hide-scroll">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-black text-[#1e3a8a] mb-1 flex items-center gap-3">
            <i className="fas fa-paper-plane"></i> ${t.title}
        </h1>
        <p className="text-slate-400 text-xs mb-8 font-medium">${t.subtitle}</p>
        
        <form onSubmit=${handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
              <div className="w-full">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">${t.name}</label>
                <input 
                    required
                    value=${formData.name}
                    onChange=${e => setFormData({...formData, name: e.target.value})}
                    className="w-full border-b-2 border-slate-100 py-2 text-sm outline-none focus:border-[#1e3a8a] transition-colors bg-transparent" 
                />
              </div>
              
              <div className="w-full">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">${t.email}</label>
                <input 
                    required
                    type="email"
                    value=${formData.email}
                    onChange=${e => setFormData({...formData, email: e.target.value})}
                    className="w-full border-b-2 border-slate-100 py-2 text-sm outline-none focus:border-[#1e3a8a] transition-colors bg-transparent" 
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-2">
                <i className="fab fa-whatsapp text-green-500 text-sm"></i>
                ${t.whatsapp} <span className="lowercase font-normal opacity-60">${t.optional}</span>
              </label>
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
                  className="w-full border-2 border-slate-100 rounded-2xl p-4 text-sm outline-none focus:border-[#1e3a8a] h-32 transition-all resize-none bg-slate-50 shadow-inner"
              ></textarea>
            </div>

            <!-- reCAPTCHA Mock -->
            <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl max-w-sm">
                <div className="flex items-center gap-3">
                    <input 
                        type="checkbox" 
                        required
                        id="captcha"
                        checked=${isHuman}
                        onChange=${e => setIsHuman(e.target.checked)}
                        className="w-5 h-5 rounded border-slate-300 text-[#1e3a8a] focus:ring-[#1e3a8a]"
                    />
                    <label htmlFor="captcha" className="text-xs font-bold text-slate-600 cursor-pointer select-none">${t.captcha}</label>
                </div>
                <div className="flex flex-col items-center">
                    <img src="https://www.gstatic.com/recaptcha/api2/logo_48.png" className="w-8 h-8 grayscale opacity-50" alt="reCAPTCHA" />
                    <span className="text-[7px] text-slate-400 font-bold uppercase mt-1">reCAPTCHA</span>
                </div>
            </div>
            
            <button 
                type="submit"
                disabled=${status === 'loading' || !isHuman || status === 'success'}
                className="w-full bg-[#1e3a8a] text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-900/20 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
                ${status === 'loading' ? html`<i className="fas fa-circle-notch animate-spin"></i>` : ''}
                ${status === 'loading' ? t.sending : t.send}
            </button>

            <!-- Pantalla de Éxito y Cuenta Atrás -->
            ${status === 'success' && html`
              <div className="fixed inset-0 bg-white z-[999] flex items-center justify-center p-8 animate-fadeIn">
                <div className="text-center space-y-6 max-w-sm">
                  <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-lg animate-bounce-short">
                    <i className="fas fa-check text-4xl"></i>
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-800 mb-2">${t.success}</h2>
                    <p className="text-slate-500 text-sm font-medium">
                      ${t.redirect} <span className="text-[#1e3a8a] font-black text-lg ml-1">${countdown}</span>s
                    </p>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-[#1e3a8a] h-full transition-all duration-1000 ease-linear" 
                      style=${{ width: `${(countdown / 5) * 100}%` }}
                    ></div>
                  </div>
                </div>
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
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out forwards; }
        @keyframes bounce-short { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        .animate-bounce-short { animation: bounce-short 1.5s infinite ease-in-out; }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
        .animate-shake { animation: shake 0.3s ease-in-out; }
      </style>
    </div>
  `;
};
