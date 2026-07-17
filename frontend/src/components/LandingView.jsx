import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { Cloud, ArrowRight, Sparkles, Camera, MessageSquare, Zap, Star, Crown, Check, Search, CalendarDays, MonitorPlay, ThermometerSun, Image as ImageIcon, Archive, Infinity as InfinityIcon, Ban, MessageSquareText, Layers, Wand2, Gem, CreditCard, Gift, History, Shield, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import VerticalAd from './VerticalAd';

// ─── Animated Icons (preserved) ───────────────────────────────────────────────
const AnimatedWeatherIcon = () => (
  <div className="relative w-10 h-10 flex items-center justify-center">
    <motion.div className="absolute top-1" animate={{ y: [0, -3, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
      <Cloud size={28} className="text-indigo-400 relative z-10 drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]" fill="currentColor" fillOpacity={0.1} />
    </motion.div>
    <div className="absolute top-6 flex gap-1.5 z-0">
      <motion.div className="w-[3px] h-[8px] bg-indigo-400 rounded-full shadow-[0_0_5px_rgba(99,102,241,0.8)]" animate={{ y: [0, 12], opacity: [0, 1, 0] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0 }} />
      <motion.div className="w-[3px] h-[8px] bg-indigo-400 rounded-full shadow-[0_0_5px_rgba(99,102,241,0.8)]" animate={{ y: [0, 12], opacity: [0, 1, 0] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }} />
      <motion.div className="w-[3px] h-[8px] bg-indigo-400 rounded-full shadow-[0_0_5px_rgba(99,102,241,0.8)]" animate={{ y: [0, 12], opacity: [0, 1, 0] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0.8 }} />
    </div>
  </div>
);

const AnimatedScannerIcon = () => (
  <div className="relative w-10 h-10 flex items-center justify-center">
    <Camera size={28} className="text-purple-400" />
    <motion.div className="absolute top-0 right-0 origin-center" animate={{ scale: [1, 1.4, 1], rotate: [0, 180, 360], opacity: [0.6, 1, 0.6] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
      <Star size={12} className="text-purple-300 drop-shadow-[0_0_5px_rgba(168,85,247,0.8)]" fill="currentColor" />
    </motion.div>
  </div>
);

const AnimatedChatIcon = () => (
  <div className="relative w-10 h-10 flex items-center justify-center">
    <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
      <MessageSquare size={28} className="text-pink-400" />
    </motion.div>
    <div className="absolute inset-0 flex items-center justify-center gap-[3px] pb-1.5">
      <motion.div className="w-1.5 h-1.5 bg-pink-400 rounded-full shadow-[0_0_5px_rgba(244,114,182,0.8)]" animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0 }} />
      <motion.div className="w-1.5 h-1.5 bg-pink-400 rounded-full shadow-[0_0_5px_rgba(244,114,182,0.8)]" animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }} />
      <motion.div className="w-1.5 h-1.5 bg-pink-400 rounded-full shadow-[0_0_5px_rgba(244,114,182,0.8)]" animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 1.5, repeat: Infinity, delay: 1 }} />
    </div>
  </div>
);

const AnimatedStepIndicator = ({ number }) => (
  <div className="relative w-12 h-12 shrink-0 flex items-center justify-center">
    <motion.div className="absolute inset-0 border-2 border-indigo-500 rounded-full" animate={{ scale: [1, 1.5], opacity: [1, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0 }} />
    <motion.div className="absolute inset-0 border-2 border-indigo-500 rounded-full" animate={{ scale: [1, 1.5], opacity: [1, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 1 }} />
    <div className="absolute inset-0 bg-indigo-600 rounded-full flex items-center justify-center font-bold text-xl shadow-[0_0_15px_rgba(99,102,241,0.5)] z-10">{number}</div>
  </div>
);

// ─── App preview animation ─────────────────────────────────────────────────────
const AppPreviewAnimation = () => {
  const [step, setStep] = useState(0);
  useEffect(() => {
    let timers = [];
    if (step === 0) timers.push(setTimeout(() => setStep(1), 1500));
    if (step === 1) timers.push(setTimeout(() => setStep(2), 3000));
    if (step === 2) timers.push(setTimeout(() => setStep(3), 5000));
    if (step === 3) timers.push(setTimeout(() => setStep(0), 8000));
    return () => timers.forEach(clearTimeout);
  }, [step]);

  return (
    <div className="h-[240px] flex flex-col gap-4">
      <div className="h-12 bg-gray-800 rounded-xl flex items-center px-4 border border-gray-700 shadow-inner">
        <Search size={18} className="text-gray-400 mr-3" />
        <span className="text-sm text-gray-300 font-medium">
          {step === 0 && <span className="animate-pulse">Escribe tu ciudad...|</span>}
          {step > 0 && "Madrid, España (25°C Soleado)"}
        </span>
      </div>
      <div className="flex-1 flex gap-3">
        {step < 2 ? (
          <>
            <div className="flex-1 bg-gray-800 rounded-xl animate-pulse relative overflow-hidden"><div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]"></div></div>
            <div className="flex-1 bg-gray-800 rounded-xl animate-pulse relative overflow-hidden delay-75"><div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]"></div></div>
            <div className="flex-1 bg-gray-800 rounded-xl animate-pulse relative overflow-hidden delay-150"><div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]"></div></div>
          </>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full flex gap-3 h-full">
            <div className="flex-1 bg-gradient-to-b from-indigo-900/40 to-gray-800 border border-indigo-500/30 rounded-xl p-3 flex flex-col items-center justify-center relative overflow-hidden group">
              <div className="w-12 h-12 bg-indigo-500/20 rounded-full flex items-center justify-center mb-3"><Cloud size={24} className="text-indigo-400"/></div>
              <div className="h-2.5 w-20 bg-indigo-400/50 rounded-full mb-2"></div>
              <div className="h-2 w-12 bg-indigo-400/30 rounded-full"></div>
            </div>
            <div className="flex-1 bg-gradient-to-b from-purple-900/40 to-gray-800 border border-purple-500/30 rounded-xl p-3 flex flex-col items-center justify-center relative overflow-hidden group">
              <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mb-3"><Star size={24} className="text-purple-400"/></div>
              <div className="h-2.5 w-20 bg-purple-400/50 rounded-full mb-2"></div>
              <div className="h-2 w-12 bg-purple-400/30 rounded-full"></div>
            </div>
            <div className="flex-1 bg-gradient-to-b from-pink-900/40 to-gray-800 border border-pink-500/30 rounded-xl p-3 flex flex-col items-center justify-center relative overflow-hidden group">
              <div className="w-12 h-12 bg-pink-500/20 rounded-full flex items-center justify-center mb-3"><Zap size={24} className="text-pink-400"/></div>
              <div className="h-2.5 w-20 bg-pink-400/50 rounded-full mb-2"></div>
              <div className="h-2 w-12 bg-pink-400/30 rounded-full"></div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
// ─── FAQ Component ─────────────────────────────────────────────────────────────
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
    q: "¿Cómo funciona la recomendación por IA?",
    a: "Nuestra Inteligencia Artificial analiza la temperatura, clima actual y tus preferencias de estilo para crear instantáneamente el look perfecto que combine con el tiempo."
  },
  {
    q: "¿Puedo subir fotos de mi propia ropa?",
    a: "¡Sí! Con el plan Premium puedes subir imágenes de tus prendas. La IA las procesa usando visión artificial para armar conjuntos reales basándose en tu propio armario."
  },
  {
    q: "¿Tengo que instalar algo?",
    a: "No. Ventoo es una Web App que funciona en cualquier navegador (PC, Mac, iPhone, Android). Además, en móviles te permite instalarla en tu pantalla de inicio como una app nativa en segundos."
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


// ─── Stat counter ──────────────────────────────────────────────────────────────
const StatCard = ({ value, label, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.6, delay }}
    className="text-center"
  >
    <div className="text-4xl md:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400 mb-1">{value}</div>
    <div className="text-gray-500 text-sm font-medium uppercase tracking-widest">{label}</div>
  </motion.div>
);

// ─── Feature card ──────────────────────────────────────────────────────────────
const FeatureCard = ({ icon, title, desc, accent, delay = 0 }) => {
  const colors = {
    indigo: 'border-indigo-500/20 hover:border-indigo-500/60 group-hover:bg-indigo-500/10',
    purple: 'border-purple-500/20 hover:border-purple-500/60 group-hover:bg-purple-500/10',
    pink:   'border-pink-500/20   hover:border-pink-500/60   group-hover:bg-pink-500/10',
  };
  const iconBg = {
    indigo: 'bg-indigo-500/10 group-hover:bg-indigo-500/20',
    purple: 'bg-purple-500/10 group-hover:bg-purple-500/20',
    pink:   'bg-pink-500/10   group-hover:bg-pink-500/20',
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      className={`group relative bg-white/[0.03] border rounded-2xl p-8 hover:bg-white/[0.06] transition-all duration-300 cursor-default ${colors[accent]}`}
    >
      {/* Glow on hover */}
      <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${iconBg[accent]}`} />
      <div className={`relative w-14 h-14 rounded-xl flex items-center justify-center mb-6 transition-colors duration-300 ${iconBg[accent]}`}>
        {icon}
      </div>
      <h3 className="relative text-xl font-bold text-white mb-3">{title}</h3>
      <p className="relative text-gray-400 leading-relaxed text-sm">{desc}</p>
    </motion.div>
  );
};

// ─── Pricing card ──────────────────────────────────────────────────────────────
const PricingCard = ({ plan, price, period, desc, features, cta, accent, badge, lifted = false, onClick }) => {
  const styles = {
    gray:   { wrap: 'border-white/10 bg-white/[0.03] hover:border-white/20', btn: 'border border-white/20 hover:bg-white/10 text-white', badge: '' },
    indigo: { wrap: 'border-indigo-500/40 bg-gradient-to-b from-indigo-900/30 to-transparent hover:border-indigo-500/70 shadow-[0_0_40px_rgba(99,102,241,0.15)]', btn: 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/50', badge: 'bg-indigo-600' },
    purple: { wrap: 'border-purple-500/40 bg-gradient-to-b from-purple-900/30 to-transparent hover:border-purple-500/70 shadow-[0_0_40px_rgba(168,85,247,0.15)]', btn: 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/50', badge: 'bg-purple-600' },
  };
  const s = styles[accent];
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className={`relative flex flex-col border rounded-2xl p-8 transition-all duration-300 ${s.wrap} ${lifted ? 'md:-translate-y-4' : ''}`}
    >
      {badge && (
        <div className={`absolute -top-3 left-1/2 -translate-x-1/2 ${s.badge} text-white px-4 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg whitespace-nowrap z-10`}>
          {badge}
        </div>
      )}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-white mb-1">{plan}</h3>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-black text-white">{price}</span>
          {period && <span className="text-gray-400 text-sm">{period}</span>}
        </div>
        <p className="text-gray-500 text-sm mt-3 leading-relaxed border-b border-white/5 pb-6">{desc}</p>
      </div>
      <ul className="space-y-3 mb-8 flex-1 text-sm">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-3">
            <Check size={16} className={`mt-0.5 shrink-0 ${accent === 'gray' ? 'text-gray-600' : accent === 'indigo' ? 'text-indigo-400' : 'text-purple-400'}`} />
            <span className={accent === 'gray' ? 'text-gray-400' : 'text-gray-300'}>{f}</span>
          </li>
        ))}
      </ul>
      <button onClick={onClick} className={`w-full py-3.5 rounded-xl font-bold transition-all ${s.btn}`}>{cta}</button>
    </motion.div>
  );
};

// ─── Main Landing ──────────────────────────────────────────────────────────────
export default function LandingView({ setToken }) {
  const navigate = useNavigate();
  const { scrollY } = useScroll();
  const containerRef = useRef(null);

  // Comprobar si hay un usuario premium conectado para ocultar anuncios
  const isPremium = localStorage.getItem('isPremium') === 'true';
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);
  const heroY = useTransform(scrollY, [0, 400], [0, -60]);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const goAuth = (opts = {}) => navigate(localStorage.getItem('token') ? '/app' : '/login', { state: opts });

  return (
    <div className="min-h-[100dvh] bg-[#0A0A0B] text-white selection:bg-indigo-500/30 selection:text-indigo-200 overflow-x-hidden flex justify-center">
      
      {/* Left Ad - Solo si no es premium */}
      {!isPremium && (
        <div className="hidden 2xl:flex w-[250px] shrink-0 sticky top-0 h-screen p-4 py-24">
          <VerticalAd className="w-full h-full" />
        </div>
      )}

      {/* Main Content Container */}
      <div className="flex-1 max-w-7xl mx-auto w-full" ref={containerRef}>
      {/* ── Background ── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.15),transparent)]" />
        <div className="absolute top-1/3 left-1/4 w-[600px] h-[600px] bg-indigo-600/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-600/8 rounded-full blur-[100px]" />
        {/* Grid */}
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      </div>

      {/* ── Navbar ── */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/40 backdrop-blur-xl transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Cloud className="text-indigo-400" size={26} />
            <span className="text-lg font-black tracking-widest text-white">VENTOO</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-400">
            <a href="#features" className="hover:text-white transition-colors">Funciones</a>
            <a href="#how" className="hover:text-white transition-colors">Cómo funciona</a>
            <a href="#pricing" className="hover:text-white transition-colors">Precios</a>
          </div>
          <div className="flex items-center gap-3">
            {!localStorage.getItem('token') ? (
              <>
                <button onClick={() => navigate('/login')} className="px-4 py-2 text-gray-300 text-sm font-medium hover:text-white transition-colors">Entrar</button>
                <button onClick={() => navigate('/login', { state: { isRegister: true } })} className="px-5 py-2 bg-white text-black text-sm font-bold rounded-lg hover:bg-gray-100 transition-colors">
                  Registrarse
                </button>
              </>
            ) : (
              <button onClick={() => navigate('/app')} className="px-5 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-500 transition-colors flex items-center gap-2">
                Panel <ArrowRight size={15} />
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative z-10 pt-32 pb-24 px-6 min-h-[100dvh] flex flex-col justify-center items-center text-center">
        <motion.div style={{ opacity: heroOpacity, y: heroY }} className="max-w-5xl mx-auto">

          {/* Badge */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/[0.04] text-indigo-300 text-xs font-bold mb-10 uppercase tracking-[0.15em]"
          >
            <motion.span className="w-1.5 h-1.5 rounded-full bg-indigo-400" animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
            Tu asistente de moda con IA
          </motion.div>

          {/* Headline */}
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1 }}
            className="text-5xl sm:text-7xl md:text-8xl font-black leading-[1.05] tracking-tighter mb-8"
          >
            Vístete para<br />
            <span className="relative inline-block">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                el éxito.
              </span>
            </span>
            <br />
            <span className="text-gray-500">Sin importar el clima.</span>
          </motion.h1>

          {/* Sub */}
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.3 }}
            className="text-lg md:text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed"
          >
            Ventoo cruza datos meteorológicos en tiempo real con inteligencia artificial para generar tu outfit ideal, cada día.
          </motion.p>

          {/* CTA */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button
              onClick={() => goAuth({ isRegister: true, plan: 'free' })}
              className="group w-full sm:w-auto px-8 py-4 bg-white text-black font-bold rounded-xl hover:bg-gray-100 transition-all flex items-center justify-center gap-3 text-base shadow-[0_0_40px_rgba(255,255,255,0.1)]"
            >
              Empezar gratis
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => { const el = document.getElementById('pricing'); el?.scrollIntoView({ behavior: 'smooth' }); }}
              className="w-full sm:w-auto px-8 py-4 border border-white/15 text-gray-300 font-medium rounded-xl hover:border-white/30 hover:text-white transition-all text-base"
            >
              Ver precios
            </button>
          </motion.div>

          {/* Trust bar */}
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.9 }}
            className="mt-10 text-xs text-gray-600 flex items-center justify-center gap-2"
          >
            <Shield size={12} className="text-gray-700" />
            Sin tarjeta de crédito · Gratis para siempre · Sin anuncios en Premium
          </motion.p>
        </motion.div>
      </section>

      {/* ── Stats strip ── */}
      <section className="relative z-10 py-16 border-y border-white/[0.06] bg-white/[0.02]">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-10">
          <StatCard value="100K+" label="Outfits generados" delay={0} />
          <StatCard value="3s" label="Tiempo de respuesta" delay={0.1} />
          <StatCard value="98%" label="Satisfacción de usuarios" delay={0.2} />
          <StatCard value="150+" label="Ciudades activas" delay={0.3} />
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="relative z-10 py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-16">
            <p className="text-indigo-400 text-xs font-bold tracking-[0.2em] uppercase mb-4">Tecnología de vanguardia</p>
            <h2 className="text-4xl md:text-5xl font-black mb-4">El Futuro de la Moda</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Nuestra IA va mucho más allá de sugerir "ponte un abrigo".</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard
              accent="indigo" delay={0}
              icon={<AnimatedWeatherIcon />}
              title="Clima Milimétrico"
              desc="Cruzamos temperatura, humedad, viento y probabilidad de lluvia de tu ciudad exacta para evitar sorpresas meteorológicas."
            />
            <FeatureCard
              accent="purple" delay={0.1}
              icon={<AnimatedScannerIcon />}
              title="Visión por IA"
              desc="Sube una foto de tu propia ropa. Nuestra IA analiza colores y texturas para decirte exactamente con qué combina."
            />
            <FeatureCard
              accent="pink" delay={0.2}
              icon={<AnimatedChatIcon />}
              title="Chatbot de Estilo"
              desc="¿No te gusta el pantalón sugerido? Díselo al chat. Obtendrás una alternativa instantánea con imagen y enlace de compra."
            />
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how" className="relative z-10 py-32 px-6 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-20 items-center">
            <div className="w-full lg:w-1/2">
              <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
                <p className="text-indigo-400 text-xs font-bold tracking-[0.2em] uppercase mb-4">Proceso simple</p>
                <h2 className="text-4xl md:text-5xl font-black mb-12 leading-tight">
                  Pruébalo ahora.<br/>
                  <span className="text-gray-500">Sal perfecto.</span>
                </h2>
                <div className="space-y-10">
                  {[
                    { n: '1', t: 'Busca tu ciudad', d: 'Introduce dónde estás o adónde vas. Nosotros nos encargamos de los radares meteorológicos.' },
                    { n: '2', t: 'Recibe el Outfit', d: 'En milisegundos obtienes una sugerencia completa (superior, inferior, calzado) con imágenes de IA.' },
                    { n: '3', t: 'Modifica a tu gusto', d: 'Guarda prendas en tu armario virtual o chatea para pedir cambios específicos a tu estilo.' },
                  ].map(({ n, t, d }) => (
                    <motion.div key={n} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: Number(n) * 0.1 }} className="flex gap-6 items-start">
                      <AnimatedStepIndicator number={n} />
                      <div>
                        <h4 className="text-lg font-bold mb-1">{t}</h4>
                        <p className="text-gray-500 text-sm leading-relaxed">{d}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }} className="w-full lg:w-1/2">
              <div className="relative">
                {/* Glow behind card */}
                <div className="absolute -inset-4 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 rounded-3xl blur-2xl" />
                <div className="relative bg-[#0d0d14] border border-white/10 rounded-2xl p-6 shadow-2xl overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500/70" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                      <div className="w-3 h-3 rounded-full bg-green-500/70" />
                    </div>
                    <span className="text-[10px] text-gray-600 font-mono">Ventoo AI Engine</span>
                  </div>
                  <AppPreviewAnimation />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="relative z-10 py-32 px-6 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-16">
            <p className="text-purple-400 text-xs font-bold tracking-[0.2em] uppercase mb-4">Planes y precios</p>
            <h2 className="text-4xl md:text-5xl font-black mb-4">Elige tu plan</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Comienza gratis, sube de nivel cuando estés listo.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            <PricingCard
              accent="gray" plan="Básico" price="Gratis" period=""
              desc="Perfecto para probar Ventoo. Financiado con anuncios."
              features={['5 outfits diarios', 'Análisis climático básico', 'Imágenes IA estándar', 'Armario virtual (hasta 20 prendas)', 'Historial de 15 outfits']}
              cta={localStorage.getItem('token') ? 'Ir a mi panel' : 'Comenzar gratis'}
              onClick={() => goAuth({ isRegister: true, plan: 'free' })}
            />
            <PricingCard
              accent="indigo" plan="Premium Mensual" price="1,99€" period="/mes"
              desc="Todo el potencial de Ventoo sin compromiso a largo plazo."
              features={['Outfits ilimitados', '100% sin anuncios', 'Visión por IA (sube fotos)', 'Chatbot de estilo avanzado', 'Armario virtual infinito', 'Historial de 50 outfits', 'Acceso a funciones beta']}
              cta={localStorage.getItem('token') ? 'Mejorar a Mensual' : 'Suscribirse por 1,99€'}
              badge={<><Zap size={13} fill="currentColor" /> POPULAR</>}
              lifted onClick={() => goAuth({ isRegister: true, plan: 'monthly' })}
            />
            <PricingCard
              accent="purple" plan="Premium Lifetime" price="20€" period=" pago único"
              desc="Paga una sola vez y disfruta de Ventoo Premium para siempre."
              features={['Todo lo incluido en Mensual', 'Pago único sin recurrencias', 'Acceso vitalicio garantizado', 'Todas las mejoras futuras', 'Estatus de Usuario Fundador']}
              cta={localStorage.getItem('token') ? 'Comprar pase vitalicio' : 'Adquirir por 20€'}
              badge={<><Crown size={13} fill="currentColor" /> MEJOR VALOR</>}
              lifted onClick={() => goAuth({ isRegister: true, plan: 'lifetime' })}
            />
          </div>
        </div>
      </section>

      {/* ── Preguntas Frecuentes ── */}
      <section id="faq" className="relative z-10 py-24 px-6 border-t border-white/[0.06]">
        <div className="max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black mb-4">Preguntas Frecuentes</h2>
            <p className="text-gray-400">Resolvemos tus dudas sobre el asistente de estilo IA.</p>
          </motion.div>
          <div className="flex flex-col gap-3">
            {faqs.map((faq, idx) => (
              <FaqItem key={idx} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA banner ── */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative rounded-3xl overflow-hidden border border-white/10 p-12 text-center"
            style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(168,85,247,0.15) 100%)' }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.12),transparent_70%)]" />
            <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} className="inline-block mb-6">
              <Sparkles className="w-10 h-10 text-indigo-400 mx-auto" />
            </motion.div>
            <h2 className="relative text-3xl md:text-4xl font-black mb-4">¿Listo para vestirte con IA?</h2>
            <p className="relative text-gray-400 mb-8 max-w-md mx-auto">Únete a miles de personas que ya confían en Ventoo para elegir su outfit perfecto cada mañana.</p>
            <button
              onClick={() => goAuth({ isRegister: true, plan: 'free' })}
              className="relative inline-flex items-center gap-3 px-8 py-4 bg-white text-black font-bold rounded-xl hover:bg-gray-100 transition-all text-base group"
            >
              Comenzar ahora, es gratis
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-white/[0.06] py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Cloud className="text-indigo-400" size={20} />
            <span className="text-base font-black tracking-widest text-white">VENTOO</span>
          </div>
          <span className="text-gray-600 text-sm">© 2026 Ventoo. Desarrollado por Raul. Todos los derechos reservados.</span>
          <div className="flex items-center gap-5 text-xs text-gray-600">
            <button onClick={() => navigate('/support')} className="hover:text-gray-300 transition-colors">Soporte</button>
            <span className="text-gray-800">•</span>
            <button onClick={() => navigate('/terms')} className="hover:text-gray-300 transition-colors">Términos de Servicio</button>
            <span className="text-gray-800">•</span>
            <button onClick={() => navigate('/privacy')} className="hover:text-gray-300 transition-colors">Política de Privacidad</button>
          </div>
        </div>
      </footer>
      </div>

      {/* Right Ad - Solo si no es premium */}
      {!isPremium && (
        <div className="hidden 2xl:flex w-[250px] shrink-0 sticky top-0 h-screen p-4 py-24">
          <VerticalAd className="w-full h-full" />
        </div>
      )}

    </div>
  );
}
