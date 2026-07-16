import { motion } from 'framer-motion';
import { Cloud, ArrowRight, CloudRain, Sun, Sparkles, Camera, MessageSquare, Zap, Star, Shield, Crown, Check, Briefcase, Search, CalendarDays, MonitorPlay, ThermometerSun, Image as ImageIcon, Archive, Infinity, Ban, MessageSquareText, Layers, Headset, Wand2, Gem, CreditCard, Gift, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

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
       {/* Search bar */}
       <div className="h-12 bg-gray-800 rounded-xl flex items-center px-4 border border-gray-700 shadow-inner">
         <Search size={18} className="text-gray-400 mr-3" />
         <span className="text-sm text-gray-300 font-medium">
           {step === 0 && <span className="animate-pulse">Escribe tu ciudad...|</span>}
           {step > 0 && "Madrid, España (25°C Soleado)"}
         </span>
       </div>
       
       {/* Content */}
       <div className="flex-1 flex gap-3">
         {step < 2 ? (
            <>
              <div className="flex-1 bg-gray-800 rounded-xl animate-pulse relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]"></div>
              </div>
              <div className="flex-1 bg-gray-800 rounded-xl animate-pulse relative overflow-hidden delay-75">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]"></div>
              </div>
              <div className="flex-1 bg-gray-800 rounded-xl animate-pulse relative overflow-hidden delay-150">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]"></div>
              </div>
            </>
         ) : (
            <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} className="w-full flex gap-3 h-full">
               <div className="flex-1 bg-gradient-to-b from-indigo-900/40 to-gray-800 border border-indigo-500/30 rounded-xl p-3 flex flex-col items-center justify-center relative overflow-hidden group">
                 <div className="absolute inset-0 bg-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                 <div className="w-12 h-12 bg-indigo-500/20 rounded-full flex items-center justify-center mb-3"><Cloud size={24} className="text-indigo-400"/></div>
                 <div className="h-2.5 w-20 bg-indigo-400/50 rounded-full mb-2"></div>
                 <div className="h-2 w-12 bg-indigo-400/30 rounded-full"></div>
               </div>
               <div className="flex-1 bg-gradient-to-b from-purple-900/40 to-gray-800 border border-purple-500/30 rounded-xl p-3 flex flex-col items-center justify-center relative overflow-hidden group">
                 <div className="absolute inset-0 bg-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                 <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mb-3"><Star size={24} className="text-purple-400"/></div>
                 <div className="h-2.5 w-20 bg-purple-400/50 rounded-full mb-2"></div>
                 <div className="h-2 w-12 bg-purple-400/30 rounded-full"></div>
               </div>
               <div className="flex-1 bg-gradient-to-b from-pink-900/40 to-gray-800 border border-pink-500/30 rounded-xl p-3 flex flex-col items-center justify-center relative overflow-hidden group">
                 <div className="absolute inset-0 bg-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                 <div className="w-12 h-12 bg-pink-500/20 rounded-full flex items-center justify-center mb-3"><Zap size={24} className="text-pink-400"/></div>
                 <div className="h-2.5 w-20 bg-pink-400/50 rounded-full mb-2"></div>
                 <div className="h-2 w-12 bg-pink-400/30 rounded-full"></div>
               </div>
            </motion.div>
         )}
       </div>
    </div>
  );
}

export default function LandingView({ token }) {
  const navigate = useNavigate();

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-black text-gray-100 font-sans selection:bg-indigo-500/30 overflow-x-hidden">
      
      {/* Background cinematic effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-black to-black"></div>
        <div className="absolute top-1/4 -left-1/4 w-[500px] h-[500px] bg-indigo-600/20 rounded-full mix-blend-screen filter blur-[120px] opacity-50 animate-pulse"></div>
        <div className="absolute bottom-1/4 -right-1/4 w-[600px] h-[600px] bg-purple-600/10 rounded-full mix-blend-screen filter blur-[150px] opacity-50 animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Cloud className="text-purple-500" size={32} />
            <span className="text-2xl font-black tracking-widest text-white">VENTOO</span>
          </div>
          <div className="flex gap-4">
            {!token ? (
            <>
              <button 
                onClick={() => navigate('/login')}
                // FIX: Removed 'hidden sm:block' — mobile users need to be able to log in too
                className="px-5 py-2 text-gray-300 font-medium hover:text-white transition-colors"
              >
                Iniciar Sesión
              </button>
              <button 
                onClick={() => navigate('/login', { state: { isRegister: true } })}
                className="px-6 py-2 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.3)]"
              >
                Registrarse
              </button>
            </>
          ) : (
            <button 
              onClick={() => navigate('/app')}
              className="px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold rounded-full hover:from-indigo-400 hover:to-purple-400 transition-colors shadow-[0_0_15px_rgba(99,102,241,0.5)] flex items-center gap-2"
            >
              Ir al Panel <ArrowRight size={18} />
            </button>
          )}
        </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-40 pb-20 px-6 min-h-screen flex flex-col justify-center items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-indigo-400 text-sm font-semibold mb-8 uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></span>
            La revolución del estilismo por IA
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black mb-8 leading-[1.1] tracking-tighter">
            Vístete para el éxito.<br/>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 animate-gradient-x">
              Sin importar el clima.
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-2xl mx-auto font-light leading-relaxed">
            Ventoo cruza datos meteorológicos en tiempo real con inteligencia artificial avanzada para generar tu outfit ideal.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <button 
              onClick={() => navigate(token ? '/app' : '/login')}
              className="w-full sm:w-auto px-10 py-5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-full font-bold text-lg transition-all shadow-[0_0_30px_rgba(99,102,241,0.5)] hover:shadow-[0_0_50px_rgba(99,102,241,0.7)] flex items-center justify-center gap-3 group hover:-translate-y-1"
            >
              {token ? 'Entrar al Panel de Control' : 'Comenzar ahora mismo'}
              <ArrowRight className="group-hover:translate-x-2 transition-transform" />
            </button>
          </div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 py-32 px-6 bg-black">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black mb-6">El Futuro de la Moda</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">Nuestra tecnología va mucho más allá de sugerir "ponte un abrigo".</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-gradient-to-b from-white/[0.05] to-transparent p-1 border border-white/10 rounded-3xl hover:border-indigo-500/50 transition-colors group">
              <div className="bg-black p-8 rounded-[23px] h-full">
                <div className="w-14 h-14 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <CloudRain size={28} />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Clima Milimétrico</h3>
                <p className="text-gray-400 leading-relaxed">Cruzamos datos de temperatura, humedad, viento y probabilidad de lluvia de tu ciudad exacta para evitar sorpresas meteorológicas.</p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="bg-gradient-to-b from-white/[0.05] to-transparent p-1 border border-white/10 rounded-3xl hover:border-purple-500/50 transition-colors group">
              <div className="bg-black p-8 rounded-[23px] h-full">
                <div className="w-14 h-14 bg-purple-500/10 text-purple-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Camera size={28} />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Visión por IA</h3>
                <p className="text-gray-400 leading-relaxed">Sube una foto de tu propia ropa. Nuestra IA analiza los píxeles, colores y texturas para decirte exactamente con qué combina.</p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="bg-gradient-to-b from-white/[0.05] to-transparent p-1 border border-white/10 rounded-3xl hover:border-pink-500/50 transition-colors group">
              <div className="bg-black p-8 rounded-[23px] h-full">
                <div className="w-14 h-14 bg-pink-500/10 text-pink-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <MessageSquare size={28} />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Chatbot de Estilo</h3>
                <p className="text-gray-400 leading-relaxed">¿No te gusta el pantalón sugerido? Díselo al chat. Te generará instantáneamente una alternativa con imagen y enlace de compra real.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="relative z-10 py-32 px-6 border-t border-white/5 bg-gradient-to-b from-black to-indigo-950/20">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-16 items-center">
            <div className="w-full lg:w-1/2">
              <h2 className="text-4xl md:text-5xl font-black mb-8">Pruébalo ahora.<br/>Sal a la calle perfecto.</h2>
              <div className="space-y-8">
                <div className="flex gap-4">
                  <div className="w-12 h-12 shrink-0 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-xl shadow-[0_0_15px_rgba(99,102,241,0.5)]">1</div>
                  <div>
                    <h4 className="text-xl font-bold mb-2">Busca tu ciudad</h4>
                    <p className="text-gray-400">Introduce dónde estás o dónde vas a ir. Nosotros nos encargamos de los radares meteorológicos.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 shrink-0 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-xl shadow-[0_0_15px_rgba(99,102,241,0.5)]">2</div>
                  <div>
                    <h4 className="text-xl font-bold mb-2">Recibe el Outfit</h4>
                    <p className="text-gray-400">En milisegundos, obtienes una sugerencia completa (Parte Superior, Inferior, Calzado) con imágenes generadas por IA.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 shrink-0 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-xl shadow-[0_0_15px_rgba(99,102,241,0.5)]">3</div>
                  <div>
                    <h4 className="text-xl font-bold mb-2">Modifica a tu gusto</h4>
                    <p className="text-gray-400">Guarda las prendas en tu armario virtual o chatea para pedir cambios específicos si prefieres otro estilo hoy.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="w-full lg:w-1/2">
              {/* Mockup UI */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <div className="text-xs text-gray-500">Ventoo AI Engine</div>
                </div>
                <AppPreviewAnimation />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing / Premium */}
      <section id="pricing" className="relative z-10 py-32 px-6 border-t border-white/5 bg-black">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black mb-6">Elige tu plan</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">Comienza gratis, sube de nivel cuando estés listo para dominar la moda.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Free Plan */}
            <div className="bg-gray-900/40 backdrop-blur-xl border border-gray-800 hover:border-gray-700 rounded-3xl p-8 flex flex-col transition-all duration-300">
              <h3 className="text-xl font-bold mb-2 text-gray-300">Básico</h3>
              <div className="text-4xl font-black mb-4 text-white">Gratis</div>
              <p className="text-gray-400 mb-8 border-b border-gray-800 pb-8 text-sm leading-relaxed">Perfecto para probar la magia de Ventoo en tu día a día y conocer el motor de IA.</p>
              
              <ul className="space-y-5 mb-10 flex-1 text-sm text-gray-300">
                <li className="flex items-start gap-3">
                  <CalendarDays className="text-gray-500 mt-0.5 shrink-0" size={18} /> 
                  <span><strong>5 outfits diarios</strong> generados por nuestra IA basados en el clima actual.</span>
                </li>
                <li className="flex items-start gap-3">
                  <MonitorPlay className="text-gray-500 mt-0.5 shrink-0" size={18} /> 
                  <span className="text-gray-500 font-medium">Financiado con anuncios durante el uso de la plataforma.</span>
                </li>
                <li className="flex items-start gap-3">
                  <ThermometerSun className="text-gray-500 mt-0.5 shrink-0" size={18} /> 
                  <span><strong>Análisis climático básico</strong> en tiempo real para tu ubicación.</span>
                </li>
                <li className="flex items-start gap-3">
                  <ImageIcon className="text-gray-500 mt-0.5 shrink-0" size={18} /> 
                  <span>Imágenes estándar generadas para ilustrar cada prenda sugerida.</span>
                </li>
                <li className="flex items-start gap-3">
                  <Archive className="text-gray-500 mt-0.5 shrink-0" size={18} /> 
                  <span><strong>Armario virtual limitado</strong> (hasta 20 prendas guardadas).</span>
                </li>
                <li className="flex items-start gap-3">
                  <History className="text-gray-500 mt-0.5 shrink-0" size={18} /> 
                  <span>Historial de los últimos <strong>15 outfits</strong>.</span>
                </li>
              </ul>
              
              <button onClick={() => navigate(token ? '/app' : '/login', { state: { isRegister: true, plan: 'free' } })} className="w-full py-4 rounded-xl border border-gray-700 hover:bg-gray-800 font-bold transition-colors">
                {token ? 'Ir a mi panel' : 'Comenzar gratis'}
              </button>
            </div>

            {/* Monthly Premium Plan */}
            <div className="bg-gradient-to-b from-indigo-900/60 to-gray-900 border border-indigo-500/50 rounded-3xl p-8 flex flex-col relative transform md:-translate-y-4 shadow-[0_0_40px_rgba(99,102,241,0.2)] hover:shadow-[0_0_60px_rgba(99,102,241,0.3)] transition-all duration-300">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-indigo-600 text-white px-4 py-1 rounded-full text-xs font-bold flex items-center gap-2 shadow-lg whitespace-nowrap">
                <Zap size={14} fill="currentColor" /> POPULAR
              </div>
              <h3 className="text-xl font-bold mb-2 text-indigo-200">Premium Mensual</h3>
              <div className="text-4xl font-black mb-4 text-white flex items-baseline gap-2">
                1,99€ <span className="text-base text-indigo-400 font-normal">/mes</span>
              </div>
              <p className="text-indigo-200/70 mb-8 border-b border-indigo-500/20 pb-8 text-sm leading-relaxed">Desbloquea el potencial completo de tu armario personal sin compromiso a largo plazo.</p>
              
              <ul className="space-y-5 mb-10 flex-1 text-sm text-indigo-50">
                <li className="flex items-start gap-3">
                  <Infinity className="text-indigo-400 mt-0.5 shrink-0" size={18} /> 
                  <span><strong>Generación ilimitada</strong> de outfits sin restricciones diarias.</span>
                </li>
                <li className="flex items-start gap-3">
                  <Ban className="text-indigo-400 mt-0.5 shrink-0" size={18} /> 
                  <span>Experiencia <strong>100% libre de anuncios</strong> para mayor fluidez.</span>
                </li>
                <li className="flex items-start gap-3">
                  <Camera className="text-indigo-400 mt-0.5 shrink-0" size={18} /> 
                  <span><strong>Visión por IA:</strong> Sube fotos de tu propia ropa y la IA te dirá con qué combinarla.</span>
                </li>
                <li className="flex items-start gap-3">
                  <MessageSquareText className="text-indigo-400 mt-0.5 shrink-0" size={18} /> 
                  <span><strong>Chatbot de estilo avanzado</strong> para interactuar y modificar prendas sin límites.</span>
                </li>
                <li className="flex items-start gap-3">
                  <Layers className="text-indigo-400 mt-0.5 shrink-0" size={18} /> 
                  <span><strong>Armario virtual infinito</strong> para digitalizar toda tu colección real.</span>
                </li>
                <li className="flex items-start gap-3">
                  <History className="text-indigo-400 mt-0.5 shrink-0" size={18} /> 
                  <span>Historial ampliado a los últimos <strong>50 outfits</strong>.</span>
                </li>
                <li className="flex items-start gap-3">
                  <Wand2 className="text-indigo-400 mt-0.5 shrink-0" size={18} /> 
                  <span>Acceso anticipado a nuevas funciones experimentales de IA.</span>
                </li>
              </ul>
              
              <button onClick={() => navigate(token ? '/app?checkout=monthly' : '/login', { state: { isRegister: true, plan: 'monthly' } })} className="w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-white transition-colors shadow-lg shadow-indigo-900/50">
                {token ? 'Mejorar a Mensual' : 'Suscribirse por 1,99€'}
              </button>
            </div>

            {/* Lifetime Plan */}
            <div className="bg-gradient-to-b from-purple-900/60 to-gray-900 border border-purple-500/50 rounded-3xl p-8 flex flex-col relative transform md:-translate-y-4 shadow-[0_0_40px_rgba(168,85,247,0.2)] hover:shadow-[0_0_60px_rgba(168,85,247,0.3)] transition-all duration-300">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-purple-600 text-white px-4 py-1 rounded-full text-xs font-bold flex items-center gap-2 shadow-lg whitespace-nowrap">
                <Crown size={14} fill="currentColor" /> MEJOR VALOR
              </div>
              <h3 className="text-xl font-bold mb-2 text-purple-200">Premium Lifetime</h3>
              <div className="text-4xl font-black mb-4 text-white flex items-baseline gap-2">
                20€ <span className="text-base text-purple-400 font-normal">pago único</span>
              </div>
              <p className="text-purple-200/70 mb-8 border-b border-purple-500/20 pb-8 text-sm leading-relaxed">Paga una sola vez y disfruta de todos los beneficios de Ventoo Premium para siempre.</p>
              
              <ul className="space-y-5 mb-10 flex-1 text-sm text-purple-50">
                <li className="flex items-start gap-3">
                  <Gem className="text-purple-400 mt-0.5 shrink-0" size={18} /> 
                  <span><strong>Absolutamente todo</strong> lo incluido en el plan Premium Mensual.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CreditCard className="text-purple-400 mt-0.5 shrink-0" size={18} /> 
                  <span><strong>Pago único definitivo:</strong> Olvídate para siempre de las suscripciones y cuotas recurrentes.</span>
                </li>
                <li className="flex items-start gap-3">
                  <Infinity className="text-purple-400 mt-0.5 shrink-0" size={18} /> 
                  <span><strong>Acceso vitalicio</strong> a la plataforma sin fecha de caducidad.</span>
                </li>
                <li className="flex items-start gap-3">
                  <Sparkles className="text-purple-400 mt-0.5 shrink-0" size={18} /> 
                  <span>Actualizaciones y futuras <strong>mejoras Pro garantizadas</strong> sin coste adicional.</span>
                </li>
                <li className="flex items-start gap-3">
                  <Gift className="text-purple-400 mt-0.5 shrink-0" size={18} /> 
                  <span>Estatus exclusivo de <strong>Usuario Fundador</strong> en tu perfil.</span>
                </li>
              </ul>
              
              <button onClick={() => navigate(token ? '/app?checkout=lifetime' : '/login', { state: { isRegister: true, plan: 'lifetime' } })} className="w-full py-4 rounded-xl bg-purple-600 hover:bg-purple-500 font-bold text-white transition-colors shadow-lg shadow-purple-900/50">
                {token ? 'Comprar pase vitalicio' : 'Adquirir por 20€'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 bg-black py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Cloud className="text-indigo-500 fill-indigo-500/20" size={24} strokeWidth={2.5} />
            <span className="text-xl font-black tracking-widest text-white">VENTOO</span>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-2 text-gray-500 text-sm">
            <span>&copy; 2026 Ventoo. Desarrollado por Raul. Todos los derechos reservados.</span>
          </div>
          {/* FIX: Added legal links required for payment-accepting apps */}
          <div className="flex items-center gap-4 text-xs text-gray-600">
            <button onClick={() => navigate('/terms')} className="hover:text-gray-400 transition-colors">Términos de Servicio</button>
            <span>•</span>
            <button onClick={() => navigate('/privacy')} className="hover:text-gray-400 transition-colors">Política de Privacidad</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
