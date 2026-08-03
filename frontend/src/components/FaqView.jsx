import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ArrowLeft, Cloud } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const faqs = [
  {
    q: "¿Ventoo es completamente gratis?",
    a: "Sí, tenemos un plan Básico gratuito que te permite generar hasta 5 outfits diarios basados en el clima de tu zona y guardar 15 conjuntos en tu historial."
  },
  {
    q: "¿Qué me ofrece el plan Premium?",
    a: "El plan Premium te da outfits ilimitados, te permite subir fotos para que la IA reconozca tus prendas, elimina la publicidad, aumenta tu historial y desbloquea el asistente de estilo avanzado."
  },
  {
    q: "¿Puedo chatear y añadir amigos?",
    a: "¡Sí! Hemos añadido una nueva red social dentro de Ventoo. Puedes añadir amigos compartiendo tu código único o escaneando su código QR, y usar el chat privado para enviar y recibir outfits."
  },
  {
    q: "¿Cómo funciona la recomendación por IA?",
    a: "Nuestra Inteligencia Artificial analiza la temperatura, clima actual y tus preferencias de estilo para crear instantáneamente el look perfecto que combine con el tiempo."
  },
  {
    q: "¿Puedo subir fotos de mi propia ropa?",
    a: "¡Por supuesto! Con el plan Premium puedes subir imágenes de tus prendas. La IA las procesa usando visión artificial para armar conjuntos reales basándose en tu propio armario."
  },
  {
    q: "¿Qué hacéis con mi privacidad y la comunidad?",
    a: "Tu privacidad está protegida. Tenemos un sistema estricto de moderación automática. Si recibes mensajes inapropiados, puedes reportar al usuario, y el sistema aplicará bloqueos temporales o permanentes."
  },
  {
    q: "¿En qué ciudades está disponible Ventoo?",
    a: "Ventoo funciona a nivel mundial. Simplemente busca cualquier ciudad o permite que la web acceda a tu geolocalización, y la IA adaptará las recomendaciones al clima exacto de esa ubicación en tiempo real."
  },
  {
    q: "¿Cómo puedo cancelar mi suscripción Premium?",
    a: "Puedes cancelarla en cualquier momento de forma sencilla desde los ajustes de tu cuenta. No hay contratos a largo plazo ni cargos ocultos."
  },
  {
    q: "¿Las prendas recomendadas se pueden comprar?",
    a: "Sí, en los planes Premium incluimos enlaces directos de compra para que puedas adquirir rápidamente las prendas que te sugiere la IA en las mejores tiendas online."
  },
  {
    q: "¿Puedo organizar mi ropa para distintas ocasiones?",
    a: "Totalmente. Ventoo te permite guardar outfits no solo para el día a día, sino categorizados para eventos, escapadas o fiestas, creando un catálogo personal."
  },
  {
    q: "¿Puedo comprar la ropa que me recomienda la IA?",
    a: "¡Sí! Nuestra IA integra enlaces directos de compra en Amazon y otras tiendas para las prendas sugeridas, facilitándote renovar tu armario con un solo clic según el look generado."
  },
  {
    q: "¿Tengo que instalar algo?",
    a: "No. Ventoo es una Web App que funciona en cualquier navegador. Además, en móviles te permite instalarla en tu pantalla de inicio como una app nativa en segundos para un acceso más rápido."
  }
];

const FaqItem = ({ q, a }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border border-white/[0.08] bg-gray-900/40 rounded-2xl overflow-hidden backdrop-blur-sm transition-all hover:border-white/[0.15]">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="w-full px-6 py-5 flex items-center justify-between text-left"
      >
        <span className="font-bold text-white pr-4">{q}</span>
        <ChevronDown className={`text-gray-400 transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180' : ''}`} size={20} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }} 
            animate={{ height: 'auto', opacity: 1 }} 
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-5 text-gray-400 text-sm leading-relaxed">
              {a}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function FaqView() {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-[100dvh] bg-[#0A0A0B] text-white flex flex-col font-sans relative">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full mix-blend-screen filter blur-[120px] opacity-30 bg-indigo-600/20"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full mix-blend-screen filter blur-[150px] opacity-30 bg-purple-600/20"></div>
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      </div>

      <nav className="relative z-10 p-6 flex items-center justify-between border-b border-white/5 bg-black/40 backdrop-blur-xl">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <Cloud className="text-indigo-400" size={24} />
          <span className="font-black tracking-widest">VENTOO</span>
        </div>
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-semibold transition-colors"
        >
          <ArrowLeft size={16} />
          Volver
        </button>
      </nav>

      <main className="flex-1 relative z-10 flex flex-col w-full max-w-3xl mx-auto p-6 py-12 md:py-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black mb-4">Preguntas Frecuentes</h1>
          <p className="text-gray-400 text-lg">Todo lo que necesitas saber sobre el asistente de estilo IA.</p>
        </motion.div>

        <div className="flex flex-col gap-3">
          {faqs.map((faq, idx) => (
            <FaqItem key={idx} q={faq.q} a={faq.a} />
          ))}
        </div>
      </main>
      
      <footer className="relative z-10 border-t border-white/[0.06] py-10 px-6 mt-12">
        <div className="max-w-3xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-gray-600">
          <span className="font-semibold text-gray-500">© 2026 Ventoo</span>
          <div className="flex gap-6">
             <button onClick={() => navigate('/support')} className="hover:text-gray-300 transition-colors">Soporte</button>
             <button onClick={() => navigate('/terms')} className="hover:text-gray-300 transition-colors">Términos</button>
             <button onClick={() => navigate('/privacy')} className="hover:text-gray-300 transition-colors">Privacidad</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
