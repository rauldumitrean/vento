import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Cloud, Crown, Eye, EyeOff, ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';
import { useLocation } from 'react-router-dom';

// FIX: API_URL extracted once at module level, not duplicated inside try/catch blocks
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function AuthView({ setToken }) {
  const location = useLocation();
  const [isLogin, setIsLogin] = useState(!location.state?.isRegister);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [gender, setGender] = useState('Mujer');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [registerStep, setRegisterStep] = useState(1);
  const [age, setAge] = useState('');
  const [showPlans, setShowPlans] = useState(false);
  const [pendingAuth, setPendingAuth] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [isBannedError, setIsBannedError] = useState(false);
  const [banDetails, setBanDetails] = useState(null);

  useEffect(() => {
    const bannedData = localStorage.getItem('bannedData');
    if (bannedData) {
      try {
        const parsed = JSON.parse(bannedData);
        setIsBannedError(true);
        setBanDetails(parsed);
        localStorage.removeItem('bannedData');
      } catch (e) {
        localStorage.removeItem('bannedData');
      }
    }
  }, []);

  const handleAuth = async (e, endpoint) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}${endpoint}`, { email, password, name, gender, age });
      localStorage.setItem('userRole', res.data.user?.role || 'USER');
      if (res.data.user?.name) localStorage.setItem('userName', res.data.user.name);
      if (res.data.user?.gender) localStorage.setItem('userGender', res.data.user.gender);
      if (res.data.user?.age) localStorage.setItem('userAge', res.data.user.age);
      if (res.data.user?.isPremium !== undefined) localStorage.setItem('isPremium', res.data.user.isPremium);
      if (res.data.user?.premiumPlan) localStorage.setItem('premiumPlan', res.data.user.premiumPlan);
      
      if (location.state?.plan && location.state.plan !== 'free') {
        try {
          const checkoutRes = await axios.post(`${API_URL}/api/payments/create-checkout-session`, { plan: location.state.plan }, {
            headers: { Authorization: `Bearer ${res.data.token}` }
          });
          if (checkoutRes.data.url) {
            localStorage.setItem('token', res.data.token);
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

  const handleDirectCheckout = async (plan) => {
    setCheckoutLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/payments/create-checkout-session`, { plan }, {
        headers: { Authorization: `Bearer ${pendingAuth.token}` }
      });
      if (res.data.url) {
        localStorage.setItem('token', pendingAuth.token);
        window.location.href = res.data.url;
      }
    } catch (err) {
      alert('Error iniciando el pago.');
      setCheckoutLoading(false);
    }
  };

  const switchMode = (toLogin) => {
    setError('');
    setPassword('');
    setRegisterStep(1);
    setIsLogin(toLogin);
  };

  // ─── Plans screen ──────────────────────────────────────────────────────────
  if (showPlans && pendingAuth) {
    return (
      <div className="min-h-[100dvh] bg-black font-sans flex items-center justify-center p-4">
        <div className="max-w-5xl w-full">
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

  // ─── Banned screen ─────────────────────────────────────────────────────────
  if (isBannedError) {
    return (
      <div className="min-h-[100dvh] bg-gray-950 flex items-center justify-center p-4 font-sans">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full bg-gray-900 rounded-3xl shadow-2xl p-8 flex flex-col items-center text-center border border-red-900/30"
        >
          <motion.div
            initial={{ y: -50, rotate: -10 }}
            animate={{ y: 0, rotate: 0 }}
            transition={{ type: 'spring', bounce: 0.6, duration: 1 }}
            className="w-24 h-24 mb-6 text-red-500"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full drop-shadow-lg">
              <circle cx="12" cy="12" r="10" />
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
            </svg>
          </motion.div>
          <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-tight">Cuenta Bloqueada</h2>
          <p className="text-gray-400 mb-6">Tu cuenta ha sido suspendida por un administrador.</p>
          <div className="bg-red-950/50 text-red-300 p-4 rounded-xl w-full mb-8 font-medium border border-red-900/40">
            {banDetails?.bannedUntil ? (
              <p>El bloqueo expirará el: <br/><strong className="text-lg">{new Date(banDetails.bannedUntil).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</strong></p>
            ) : (
              <p className="text-lg font-bold">Bloqueo Permanente</p>
            )}
          </div>
          <button 
            onClick={() => { setIsBannedError(false); setBanDetails(null); }}
            className="text-sm font-semibold text-gray-500 hover:text-white transition-colors"
          >
            ← Volver al inicio de sesión
          </button>
        </motion.div>
      </div>
    );
  }

  // ─── Accent side panel content ─────────────────────────────────────────────
  const PanelContent = ({ isLoginPanel }) => (
    <div className="flex flex-col justify-center h-full px-10 py-12 text-white">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-8">
          <Cloud className="w-7 h-7 text-white/80" />
          <span className="text-white/60 text-xs font-bold tracking-[0.2em] uppercase">Ventoo</span>
        </div>
        <div className="mb-6">
          {/* Decorative floating card */}
          <div className="relative w-48 h-36">
            <div className="absolute inset-0 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 flex items-center justify-center">
              <Sparkles className="w-12 h-12 text-white/70" />
            </div>
            <div className="absolute -bottom-3 -right-3 bg-white/20 backdrop-blur-sm rounded-xl border border-white/20 px-3 py-2 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-white/90" />
              <span className="text-xs text-white/90 font-medium whitespace-nowrap">IA de Moda</span>
            </div>
          </div>
        </div>
      </div>

      {isLoginPanel ? (
        <>
          <p className="text-white/50 text-xs font-bold tracking-[0.15em] uppercase mb-3">Bienvenido de vuelta</p>
          <h2 className="text-4xl font-black leading-tight mb-4">¿Listo para tu outfit de hoy?</h2>
          <p className="text-white/60 text-sm leading-relaxed mb-10">Tu asistente de moda con IA te está esperando. Accede y descubre qué ponerte según el clima.</p>
        </>
      ) : (
        <>
          <p className="text-white/50 text-xs font-bold tracking-[0.15em] uppercase mb-3">¿Ya tienes cuenta?</p>
          <h2 className="text-4xl font-black leading-tight mb-4">Tu guardarropa inteligente te espera.</h2>
          <p className="text-white/60 text-sm leading-relaxed mb-10">Inicia sesión y recupera todas tus recomendaciones personalizadas.</p>
        </>
      )}

      <button
        onClick={() => switchMode(isLoginPanel ? false : true)}
        className="flex items-center gap-3 px-6 py-3 rounded-xl border border-white/30 hover:bg-white/10 transition-all text-sm font-semibold text-white w-fit group"
      >
        {isLoginPanel ? 'Crear una cuenta' : 'Iniciar sesión'}
        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
      </button>

      <p className="text-white/30 text-xs mt-8">Acceso seguro · Siempre sincronizado</p>
    </div>
  );

  // ─── Input helper ──────────────────────────────────────────────────────────
  const inputClass = "w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder-gray-400 transition-all text-sm";
  const labelClass = "block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5";

  return (
    <div
      className="min-h-[100dvh] font-sans flex items-center justify-center bg-gray-100 p-4"
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1rem)', paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)' }}
    >
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden flex">
        
        {/* ── Accent panel (left on login, right on register) ── */}
        <AnimatePresence mode="wait">
          {isLogin ? (
            <motion.div
              key="login-panel"
              initial={{ x: -40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -40, opacity: 0 }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
              className="hidden md:block w-[45%] flex-shrink-0 bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 relative overflow-hidden"
            >
              {/* Decorative blobs */}
              <div className="absolute -top-20 -left-20 w-64 h-64 bg-white/5 rounded-full blur-2xl" />
              <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-purple-400/10 rounded-full blur-xl" />
              <PanelContent isLoginPanel={true} />
            </motion.div>
          ) : (
            <motion.div
              key="register-panel"
              initial={{ x: 40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 40, opacity: 0 }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
              className="hidden md:block w-[45%] flex-shrink-0 bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-700 relative overflow-hidden order-last"
            >
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/5 rounded-full blur-2xl" />
              <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-indigo-400/10 rounded-full blur-xl" />
              <PanelContent isLoginPanel={false} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Form panel ── */}
        <div className="flex-1 px-8 py-10 sm:px-10 flex flex-col justify-center min-h-[600px]">
          {/* Mobile logo */}
          <div className="flex md:hidden items-center gap-2 mb-8 justify-center">
            <Cloud className="w-8 h-8 text-indigo-500" />
            <span className="text-xl font-black tracking-widest bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">VENTOO</span>
          </div>

          <AnimatePresence mode="wait">
            {isLogin ? (
              <motion.div
                key="login-form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <p className="text-indigo-600 text-xs font-bold tracking-[0.15em] uppercase mb-2">Tu workspace de moda</p>
                <h1 className="text-3xl font-black text-gray-900 mb-1">Bienvenido de nuevo</h1>
                <p className="text-gray-400 text-sm mb-8">Inicia sesión para continuar</p>

                <form onSubmit={(e) => handleAuth(e, '/api/auth/login')} className="space-y-5">
                  <div>
                    <label className={labelClass}>Correo electrónico</label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className={inputClass}
                      placeholder="tu@email.com"
                      required
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Contraseña</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className={inputClass + ' pr-11'}
                        placeholder="Introduce tu contraseña"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 text-sm text-center bg-red-50 py-2 px-4 rounded-lg">
                      {error}
                    </motion.p>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>Iniciar sesión <ArrowRight size={16} /></>
                    )}
                  </button>
                </form>

                <p className="text-gray-400 text-sm text-center mt-8">
                  ¿No tienes cuenta?{' '}
                  <button onClick={() => switchMode(false)} className="text-indigo-600 font-semibold hover:underline">
                    Crear cuenta gratis
                  </button>
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="register-form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <p className="text-purple-600 text-xs font-bold tracking-[0.15em] uppercase mb-2">Empieza en minutos</p>
                <h1 className="text-3xl font-black text-gray-900 mb-1">Crea tu cuenta</h1>
                <p className="text-gray-400 text-sm mb-8">Únete a la IA meteorológica de moda</p>

                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (registerStep === 1) setRegisterStep(2);
                  else handleAuth(e, '/api/auth/register');
                }} className="space-y-4">
                  {registerStep === 1 ? (
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className={labelClass}>Nombre</label>
                          <input type="text" value={name} onChange={e => setName(e.target.value)} className={inputClass} placeholder="Tu nombre" required />
                        </div>
                        <div>
                          <label className={labelClass}>Género</label>
                          <select value={gender} onChange={e => setGender(e.target.value)} className={inputClass}>
                            <option value="Mujer">Mujer</option>
                            <option value="Hombre">Hombre</option>
                            <option value="Otro">Otro</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className={labelClass}>Correo electrónico</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputClass} placeholder="tu@email.com" required />
                      </div>
                      <div>
                        <label className={labelClass}>Contraseña</label>
                        <div className="relative">
                          <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} className={inputClass + ' pr-11'} placeholder="Mínimo 6 caracteres" minLength={6} required />
                          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>

                        {/* Password strength checklist */}
                        <AnimatePresence>
                          {password.length > 0 && (() => {
                            const checks = [
                              { key: 'len',     label: 'Mínimo 6 caracteres',          ok: password.length >= 6 },
                              { key: 'upper',   label: 'Al menos una letra mayúscula', ok: /[A-Z]/.test(password) },
                              { key: 'number',  label: 'Al menos un número',           ok: /[0-9]/.test(password) },
                              { key: 'symbol',  label: 'Al menos un símbolo (!@#…)',   ok: /[^A-Za-z0-9]/.test(password) },
                            ];
                            const passed = checks.filter(c => c.ok).length;
                            const strengthColor = passed <= 1 ? '#ef4444' : passed === 2 ? '#f97316' : passed === 3 ? '#eab308' : '#22c55e';
                            const strengthLabel = passed <= 1 ? 'Muy débil' : passed === 2 ? 'Débil' : passed === 3 ? 'Buena' : '¡Fuerte!';

                            return (
                              <motion.div key="pw-checklist" initial={{ opacity: 0, y: -6, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, y: -6, height: 0 }} transition={{ duration: 0.25, ease: 'easeOut' }} className="overflow-hidden">
                                <div className="mt-3 p-3 rounded-xl bg-gray-50 border border-gray-100 space-y-2">
                                  <div className="flex items-center gap-2 mb-3">
                                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                      <motion.div className="h-full rounded-full" style={{ backgroundColor: strengthColor }} initial={{ width: 0 }} animate={{ width: `${(passed / 4) * 100}%` }} transition={{ duration: 0.4, ease: 'easeOut' }} />
                                    </div>
                                    <motion.span key={strengthLabel} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-[10px] font-bold w-16 text-right" style={{ color: strengthColor }}>{strengthLabel}</motion.span>
                                  </div>
                                  {checks.map(({ key, label, ok }) => (
                                    <motion.div key={key} className="flex items-center gap-2" initial={false}>
                                      <motion.svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" animate={{ scale: ok ? [1, 1.3, 1] : 1 }} transition={{ duration: 0.3 }}>
                                        <motion.circle cx="8" cy="8" r="7" animate={{ stroke: ok ? '#22c55e' : '#d1d5db', fill: ok ? '#f0fdf4' : '#f9fafb' }} transition={{ duration: 0.25 }} strokeWidth="1.5" />
                                        <AnimatePresence mode="wait">
                                          {ok ? <motion.path key="check" d="M5 8l2 2 4-4" stroke="#22c55e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} exit={{ pathLength: 0, opacity: 0 }} transition={{ duration: 0.3, ease: 'easeOut' }} /> : <motion.path key="dash" d="M5.5 8h5" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} />}
                                        </AnimatePresence>
                                      </motion.svg>
                                      <motion.span className="text-xs" animate={{ color: ok ? '#16a34a' : '#9ca3af' }} transition={{ duration: 0.25 }}>{label}</motion.span>
                                    </motion.div>
                                  ))}
                                </div>
                              </motion.div>
                            );
                          })()}
                        </AnimatePresence>
                      </div>

                      <button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-purple-500/20 transition-all flex items-center justify-center gap-2 mt-2">
                        Siguiente <ArrowRight size={16} />
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-4">
                      <div>
                        <label className={labelClass}>¿Qué edad tienes?</label>
                        <p className="text-xs text-gray-500 mb-2">Usaremos este dato para que la IA genere outfits apropiados para tu edad.</p>
                        <input type="number" value={age} onChange={e => setAge(e.target.value)} className={inputClass} placeholder="Ej: 25" min="13" max="100" required />
                      </div>
                      <div className="flex gap-3 mt-4">
                        <button type="button" onClick={() => setRegisterStep(1)} className="px-6 py-3.5 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-colors">
                          Atrás
                        </button>
                        <button type="submit" disabled={loading} className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-purple-500/20 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                          {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Crear cuenta <ArrowRight size={16} /></>}
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {error && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 text-sm text-center bg-red-50 py-2 px-4 rounded-lg">
                      {error}
                    </motion.p>
                  )}
                </form>

                <p className="text-gray-400 text-sm text-center mt-6">
                  ¿Ya tienes cuenta?{' '}
                  <button onClick={() => switchMode(true)} className="text-purple-600 font-semibold hover:underline">
                    Iniciar sesión aquí
                  </button>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
