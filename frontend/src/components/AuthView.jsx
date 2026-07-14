import { useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Cloud } from 'lucide-react';

export default function AuthView({ setToken }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e, endpoint) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const res = await axios.post(`${API_URL}${endpoint}`, { email, password });
      setToken(res.data.token);
    } catch (err) {
      setError(err.response?.data?.error || 'Error de conexión');
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

  const direction = isLogin ? -1 : 1;

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
              className="w-full bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8"
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
              className="w-full bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8"
            >
              <div className="flex flex-col items-center mb-8">
                <Cloud className="w-12 h-12 text-purple-500 mb-2" />
                <h1 className="text-2xl font-bold tracking-widest bg-gradient-to-r from-purple-500 to-indigo-600 bg-clip-text text-transparent">VENTOO</h1>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 text-center">Regístrate</h2>
              <p className="text-gray-500 dark:text-gray-400 text-center mb-8">Únete a nuestra IA meteorológica</p>
              
              <form onSubmit={(e) => handleAuth(e, '/api/auth/register')} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Correo</label>
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Contraseña</label>
                  <input 
                    type="password" 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white transition-all"
                    placeholder="••••••••"
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
