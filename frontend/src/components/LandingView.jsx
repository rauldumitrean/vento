import { motion } from 'framer-motion';
import { Cloud, ArrowRight, CloudRain, Sun, Sparkles, Camera, MessageSquare, Zap, Star, Shield, Crown, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

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
                className="px-5 py-2 text-gray-300 font-medium hover:text-white transition-colors hidden sm:block"
              >
                Iniciar Sesión
              </button>
              <button 
                onClick={() => {
                  document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
                }}
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
              {token ? 'Entrar al Panel de Control' : 'Comenzar tu prueba gratuita'}
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
                <div className="space-y-4">
                  <div className="h-24 bg-gray-800 rounded-xl animate-pulse"></div>
                  <div className="flex gap-4">
                    <div className="w-1/2 h-40 bg-gray-800 rounded-xl animate-pulse delay-75"></div>
                    <div className="w-1/2 h-40 bg-gray-800 rounded-xl animate-pulse delay-150"></div>
                  </div>
                </div>
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
            <div className="bg-gray-900/50 border border-gray-800 rounded-3xl p-8 flex flex-col">
              <h3 className="text-xl font-bold mb-2">Básico</h3>
              <div className="text-4xl font-black mb-6">Gratis</div>
              <p className="text-gray-400 mb-8 border-b border-gray-800 pb-8 text-sm">Perfecto para probar la magia de Ventoo en tu día a día.</p>
              
              <ul className="space-y-4 mb-10 flex-1 text-sm">
                <li className="flex items-center gap-3"><Check className="text-indigo-400" size={18} /> <span>5 outfits generados por IA al día</span></li>
                <li className="flex items-center gap-3"><Check className="text-indigo-400" size={18} /> <span>Clima en tiempo real</span></li>
                <li className="flex items-center gap-3"><Check className="text-indigo-400" size={18} /> <span>Imágenes generadas de ropa</span></li>
                <li className="flex items-center gap-3"><Check className="text-indigo-400" size={18} /> <span>Armario virtual (limitado)</span></li>
              </ul>
              
              <button onClick={() => navigate(token ? '/app' : '/login', { state: { isRegister: true, plan: 'free' } })} className="w-full py-3 rounded-xl border border-gray-700 hover:bg-gray-800 font-bold transition-colors">
                {token ? 'Ver mi panel' : 'Crear cuenta gratis'}
              </button>
            </div>

            {/* Monthly Premium Plan */}
            <div className="bg-gradient-to-b from-indigo-900/40 to-gray-900 border border-indigo-500/50 rounded-3xl p-8 flex flex-col relative transform md:-translate-y-4 shadow-[0_0_50px_rgba(99,102,241,0.15)]">
              <h3 className="text-xl font-bold mb-2 text-indigo-100">Premium Mensual</h3>
              <div className="text-4xl font-black mb-6 text-white flex items-baseline gap-2">
                1,99€ <span className="text-base text-indigo-300 font-normal">/mes</span>
              </div>
              <p className="text-indigo-200/70 mb-8 border-b border-indigo-500/20 pb-8 text-sm">Desbloquea el potencial completo sin compromiso a largo plazo.</p>
              
              <ul className="space-y-4 mb-10 flex-1 text-indigo-50 text-sm">
                <li className="flex items-center gap-3"><Check className="text-indigo-400" size={18} /> <strong>Outfits ilimitados</strong></li>
                <li className="flex items-center gap-3"><Check className="text-indigo-400" size={18} /> <span className="flex items-center gap-2">Análisis de fotos con IA (Visión) <Zap size={16} className="text-yellow-400" fill="currentColor"/></span></li>
                <li className="flex items-center gap-3"><Check className="text-indigo-400" size={18} /> <span>Chatbot de moda sin límites</span></li>
                <li className="flex items-center gap-3"><Check className="text-indigo-400" size={18} /> <span>Armario virtual infinito</span></li>
                <li className="flex items-center gap-3"><Check className="text-indigo-400" size={18} /> <span>Soporte prioritario</span></li>
              </ul>
              
              <button onClick={() => navigate(token ? '/app?checkout=monthly' : '/login', { state: { isRegister: true, plan: 'monthly' } })} className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-white transition-colors shadow-lg shadow-indigo-900/50">
                {token ? 'Mejorar ahora' : 'Suscribirse por 1,99€'}
              </button>
            </div>

            {/* Lifetime Plan */}
            <div className="bg-gradient-to-b from-purple-900/40 to-gray-900 border border-purple-500/50 rounded-3xl p-8 flex flex-col relative transform md:-translate-y-4 shadow-[0_0_50px_rgba(168,85,247,0.15)]">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-purple-600 text-white px-4 py-1 rounded-full text-xs font-bold flex items-center gap-2 shadow-lg whitespace-nowrap">
                <Crown size={14} /> MEJOR VALOR
              </div>
              <h3 className="text-xl font-bold mb-2 text-purple-100">Premium Lifetime</h3>
              <div className="text-4xl font-black mb-6 text-white flex items-baseline gap-2">
                20€ <span className="text-base text-purple-300 font-normal">pago único</span>
              </div>
              <p className="text-purple-200/70 mb-8 border-b border-purple-500/20 pb-8 text-sm">Paga una vez y disfruta de Ventoo Premium para siempre.</p>
              
              <ul className="space-y-4 mb-10 flex-1 text-purple-50 text-sm">
                <li className="flex items-center gap-3"><Check className="text-purple-400" size={18} /> <strong>Todo lo del plan mensual</strong></li>
                <li className="flex items-center gap-3"><Check className="text-purple-400" size={18} /> <strong>Para toda la vida</strong></li>
                <li className="flex items-center gap-3"><Check className="text-purple-400" size={18} /> <span>Sin cuotas recurrentes</span></li>
                <li className="flex items-center gap-3"><Check className="text-purple-400" size={18} /> <span>Acceso a futuras mejoras pro</span></li>
              </ul>
              
              <button onClick={() => navigate(token ? '/app?checkout=lifetime' : '/login', { state: { isRegister: true, plan: 'lifetime' } })} className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 font-bold text-white transition-colors shadow-lg shadow-purple-900/50">
                {token ? 'Comprar de por vida' : 'Comprar por 20€'}
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
          <p className="text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} Ventoo. Diseñado por IA para el mundo real.
          </p>
        </div>
      </footer>
    </div>
  );
}
