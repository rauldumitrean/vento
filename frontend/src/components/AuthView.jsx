import { useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Cloud, Crown, Zap } from 'lucide-react';
import { useLocation } from 'react-router-dom';

// FIX: API_URL extracted once at module level, not duplicated inside try/catch blocks
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function AuthView({ setToken }) {
  const location = useLocation();
  const [isLogin, setIsLogin] = useState(!location.state?.isRegister);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [gender, setGender] = useState('Mujer');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPlans, setShowPlans] = useState(false);
  const [pendingAuth, setPendingAuth] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [isBannedError, setIsBannedError] = useState(false);
  const [banDetails, setBanDetails] = useState(null);

  const handleAuth = async (e, endpoint) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}${endpoint}`, { email, password, name, gender });
      sessionStorage.setItem('userRole', res.data.user?.role || 'USER');
      if (res.data.user?.name) sessionStorage.setItem('userName', res.data.user.name);
      if (res.data.user?.gender) sessionStorage.setItem('userGender', res.data.user.gender);
      if (res.data.user?.isPremium !== undefined) sessionStorage.setItem('isPremium', res.data.user.isPremium);
      if (res.data.user?.premiumPlan) sessionStorage.setItem('premiumPlan', res.data.user.premiumPlan);
      
      if (location.state?.plan && location.state.plan !== 'free') {
        try {
          const checkoutRes = await axios.post(`${API_URL}/api/payments/create-checkout-session`, { plan: location.state.plan }, {
            headers: { Authorization: `Bearer ${res.data.token}` }
          });
          if (checkoutRes.data.url) {
            sessionStorage.setItem('token', res.data.token);
            window.location.href = checkoutRes.data.url;
            return;
          }
        } catch (e) {
          console.error(e);
          setError('Error iniciando el pago. Puedes intentarlo desde los ajustes de perfil.');
        }
      }
      
      if (!isLogin && (!location.state?.plan || location.state?.plan === 'free')) {
        setPendingAuth({ token: res.data.token });
        setShowPlans(true);
        return;
      }
      
      setToken(res.data.token);
    } catch (err) {
      if (err.response?.data?.error === 'BANNED') {
        setIsBannedError(true);
        setBanDetails(err.response.data);
      } else {
        setError(err.response?.data?.error || 'Error de conexión');
      }
    } finally {
      setLoading(false);
    }
  };

  const variants = {
    enter: (direction) => {
      return {
        x: direction > 0 ? 300 : -300,
        opacity: 0,
      };
    },
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction) => {
      return {
        zIndex: 0,
        x: direction < 0 ? 300 : -300,
        opacity: 0,
      };
    }
  };

  const handleDirectCheckout = async (plan) => {
    setCheckoutLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/payments/create-checkout-session`, { plan }, {
        headers: { Authorization: `Bearer ${pendingAuth.token}` }
      });
      if (res.data.url) {
        sessionStorage.setItem('token', pendingAuth.token);
        window.location.href = res.data.url;
      }
    } catch (err) {
      alert('Error iniciando el pago.');
      setCheckoutLoading(false);
    }
  };

  const direction = isLogin ? -1 : 1;

  if (showPlans && pendingAuth) {
    return (
      <div className="min-h-screen bg-black font-sans flex items-center justify-center p-4">
        <div className="max-w-5xl w-full">
          {/* FIX: Added back button to avoid being stuck on plan selection */}
          <button
            onClick={() => { setShowPlans(false); setPendingAuth(null); }}
            className="text-gray-400 hover:text-white text-sm flex items-center gap-2 mb-8 transition-colors"
          >
            ← Volver al registro
          </button>
          <h2 className="text-4xl md:text-5xl font-black text-white text-center mb-12">¡Cuenta creada! Elige tu plan</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Básico */}
            <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 flex flex-col hover:border-gray-700 transition-all">
              <h3 className="text-xl font-bold mb-2 text-white">Básico</h3>
              <div className="text-4xl font-black mb-6 text-white">Gratis</div>
              <p className="text-gray-400 mb-8 border-b border-gray-800 pb-8 text-sm flex-1">Perfecto para empezar a probar Ventoo. <br/><span className="text-gray-500 mt-2 block font-medium">Contiene anuncios obligatorios.</span></p>
              <button onClick={() => setToken(pendingAuth.token)} className="w-full py-3 rounded-xl border border-gray-700 hover:bg-gray-800 text-white font-bold transition-colors">
                Empezar gratis
              </button>
            </div>

            {/* Mensual */}
            <div className="bg-indigo-900/40 border border-indigo-500/50 rounded-3xl p-8 flex flex-col relative shadow-[0_0_50px_rgba(99,102,241,0.15)]">
              <h3 className="text-xl font-bold mb-2 text-indigo-100">Premium Mensual</h3>
              <div className="text-4xl font-black mb-6 text-white flex items-baseline gap-2">
                1,99€ <span className="text-base text-indigo-300 font-normal">/mes</span>
              </div>
              <p className="text-indigo-200/70 mb-8 border-b border-indigo-500/20 pb-8 text-sm flex-1">Outfits ilimitados, IA de visión y chat sin límites. <br/><strong className="text-indigo-300 mt-2 block">100% Sin anuncios.</strong></p>
              <button 
                disabled={checkoutLoading}
                onClick={() => handleDirectCheckout('monthly')} 
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-white transition-colors shadow-lg shadow-indigo-900/50 disabled:opacity-50"
              >
                {checkoutLoading ? 'Procesando...' : 'Suscribirse por 1,99€'}
              </button>
            </div>

            {/* Lifetime */}
            <div className="bg-purple-900/40 border border-purple-500/50 rounded-3xl p-8 flex flex-col relative shadow-[0_0_50px_rgba(168,85,247,0.15)]">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600 text-white px-4 py-1 rounded-full text-xs font-bold flex items-center gap-2 shadow-lg whitespace-nowrap">
                <Crown size={14} /> MEJOR VALOR
              </div>
              <h3 className="text-xl font-bold mb-2 text-purple-100">Premium Lifetime</h3>
              <div className="text-4xl font-black mb-6 text-white flex items-baseline gap-2">
                20€ <span className="text-base text-purple-300 font-normal">pago único</span>
              </div>
              <p className="text-purple-200/70 mb-8 border-b border-purple-500/20 pb-8 text-sm flex-1">Todo premium para siempre. Sin cuotas recurrentes. <br/><strong className="text-purple-300 mt-2 block">100% Sin anuncios.</strong></p>
              <button 
                disabled={checkoutLoading}
                onClick={() => handleDirectCheckout('lifetime')} 
                className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 font-bold text-white transition-colors shadow-lg shadow-purple-900/50 disabled:opacity-50"
              >
                {checkoutLoading ? 'Procesando...' : 'Comprar por 20€'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isBannedError) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4 font-sans overflow-hidden">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 flex flex-col items-center text-center relative overflow-hidden border border-red-100 dark:border-red-900/30"
        >
          {/* Background pulse effect */}
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 bg-red-500/10 rounded-full blur-3xl -z-10"
          />

          <motion.div
            initial={{ y: -50, rotate: -10 }}
            animate={{ y: 0, rotate: 0 }}
            transition={{ type: 'spring', bounce: 0.6, duration: 1 }}
            className="w-32 h-32 mb-6 text-red-500"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full drop-shadow-lg">
              <circle cx="12" cy="12" r="10" />
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
            </svg>
          </motion.div>

          <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2 uppercase tracking-tight">Cuenta Bloqueada</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            No puedes acceder a Ventoo. Tu cuenta ha sido suspendida por un administrador.
          </p>

          <div className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 p-4 rounded-xl w-full mb-8 font-medium">
            {banDetails?.bannedUntil ? (
              <p>El bloqueo expirará el: <br/><strong className="text-lg">{new Date(banDetails.bannedUntil).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</strong></p>
            ) : (
              <p className="text-lg font-bold">Bloqueo Permanente</p>
            )}
          </div>

          <button 
            onClick={() => { setIsBannedError(false); setBanDetails(null); }}
            className="text-sm font-semibold text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            ← Volver al inicio de sesión
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4 font-sans overflow-hidden">
      
      <div className="w-full max-w-md relative flex items-center justify-center">
        <AnimatePresence mode="wait" custom={direction}>
          {isLogin ? (
            <motion.div
              key="login"
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="w-full bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-6 sm:p-8"
            >
              <div className="flex flex-col items-center mb-8">
                <Cloud className="w-12 h-12 text-indigo-500 mb-2" />
                <h1 className="text-2xl font-bold tracking-widest bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">VENTOO</h1>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 text-center">Iniciar Sesión</h2>
              <p className="text-gray-500 dark:text-gray-400 text-center mb-8">Entra para descubrir tu outfit ideal</p>
              
              <form onSubmit={(e) => handleAuth(e, '/api/auth/login')} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Correo</label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white transition-all"
                    placeholder="tu@email.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Contraseña</label>
                  <input 
                    type="password" 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white transition-all"
                    placeholder="••••••••"
                    required
                  />
                </div>
                
                {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3 rounded-xl shadow-lg transition-all"
                >
                  {loading ? 'Cargando...' : 'Entrar'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-gray-500 dark:text-gray-400 text-sm">¿Nuevo aquí?</p>
                <button 
                  onClick={() => {
                    setError('');
                    // FIX: Clear password when switching to avoid carrying over stale credentials
                    setPassword('');
                    setIsLogin(false);
                  }} 
                  className="text-indigo-500 font-semibold mt-1"
                >
                  Crear una cuenta gratis
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="register"
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="w-full bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-6 sm:p-8"
            >
              <div className="flex flex-col items-center mb-8">
                <Cloud className="w-12 h-12 text-purple-500 mb-2" />
                <h1 className="text-2xl font-bold tracking-widest bg-gradient-to-r from-purple-500 to-indigo-600 bg-clip-text text-transparent">VENTOO</h1>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 text-center">Regístrate</h2>
              <p className="text-gray-500 dark:text-gray-400 text-center mb-8">Únete a nuestra IA meteorológica</p>
              
              <form onSubmit={(e) => handleAuth(e, '/api/auth/register')} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white transition-all"
                    placeholder="Tu nombre"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Género</label>
                  <select 
                    value={gender}
                    onChange={e => setGender(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white transition-all"
                  >
                    <option value="Mujer">Mujer</option>
                    <option value="Hombre">Hombre</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Correo</label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white transition-all"
                    placeholder="tu@email.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contraseña</label>
                  <input 
                    type="password" 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white transition-all"
                    placeholder="Mínimo 6 caracteres"
                    minLength={6}
                    required
                  />
                </div>
                
                {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-3 rounded-xl shadow-lg transition-all"
                >
                  {loading ? 'Cargando...' : 'Crear cuenta'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-gray-500 dark:text-gray-400 text-sm">¿Ya formas parte de Ventoo?</p>
                <button 
                  onClick={() => {
                    setError('');
                    // FIX: Clear password when switching to avoid carrying over stale credentials
                    setPassword('');
                    setIsLogin(true);
                  }} 
                  className="text-purple-500 font-semibold mt-1"
                >
                  Inicia sesión aquí
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
