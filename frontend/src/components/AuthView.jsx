import { useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Cloud, Wind, Sun } from 'lucide-react';

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

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4 overflow-hidden font-sans transition-colors duration-300">
      <div className="w-full max-w-5xl h-[600px] bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden relative flex">
        
        <motion.div 
          className="flex w-[200%] h-full"
          animate={{ x: isLogin ? "0%" : "-50%" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          
          {/* PANEL 1: INICIAR SESIÓN */}
          <div className="w-1/2 h-full flex">
            {/* Formulario Login */}
            <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-center relative">
              <div className="absolute top-8 left-8 flex items-center gap-2">
                <Cloud className="w-8 h-8 text-indigo-500" />
                <span className="font-bold tracking-widest text-xl text-gray-900 dark:text-white">VENTOO</span>
              </div>
              
              <h2 className="text-4xl font-bold mb-2 text-gray-900 dark:text-white">Bienvenido</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-8">Inicia sesión para ver tu clima y estilo</p>
              
              <form onSubmit={(e) => handleAuth(e, '/api/auth/login')} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Correo Electrónico</label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-gray-900 dark:text-white"
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
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-gray-900 dark:text-white"
                    placeholder="••••••••"
                    required
                  />
                </div>
                
                {error && <p className="text-red-500 text-sm">{error}</p>}
                
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3 rounded-xl transition-all transform active:scale-[0.98] shadow-lg flex justify-center items-center"
                >
                  {loading ? 'Cargando...' : 'Entrar'}
                </button>
              </form>

              <div className="mt-8 text-center md:hidden">
                <p className="text-gray-500 dark:text-gray-400">¿No tienes cuenta?</p>
                <button onClick={() => setIsLogin(false)} className="text-indigo-500 font-semibold mt-2">Crear una cuenta nueva</button>
              </div>
            </div>

            {/* Branding Login (Lado derecho del panel 1) */}
            <div className="hidden md:flex w-1/2 bg-gradient-to-br from-indigo-600 to-purple-700 p-12 flex-col items-center justify-center text-white text-center relative overflow-hidden">
              <Sun className="absolute top-10 right-10 w-24 h-24 text-white opacity-10" />
              <Wind className="absolute bottom-10 left-10 w-32 h-32 text-white opacity-10" />
              
              <h2 className="text-4xl font-bold mb-4 z-10">¿Nuevo aquí?</h2>
              <p className="text-lg text-indigo-100 mb-8 z-10 max-w-sm">
                Regístrate para que nuestra Inteligencia Artificial te recomiende el outfit perfecto según el clima de tu ciudad.
              </p>
              <button 
                onClick={() => setIsLogin(false)}
                className="px-8 py-3 border-2 border-white/80 hover:bg-white hover:text-indigo-600 rounded-xl font-bold transition-all z-10"
              >
                Crear una cuenta
              </button>
            </div>
          </div>

          {/* PANEL 2: REGISTRO */}
          <div className="w-1/2 h-full flex">
            {/* Branding Registro (Lado izquierdo del panel 2) */}
            <div className="hidden md:flex w-1/2 bg-gradient-to-br from-purple-700 to-indigo-600 p-12 flex-col items-center justify-center text-white text-center relative overflow-hidden">
              <Cloud className="absolute top-20 left-10 w-24 h-24 text-white opacity-10" />
              <Sun className="absolute bottom-20 right-10 w-24 h-24 text-white opacity-10" />
              
              <h2 className="text-4xl font-bold mb-4 z-10">¡Hola de nuevo!</h2>
              <p className="text-lg text-indigo-100 mb-8 z-10 max-w-sm">
                Si ya formas parte de Ventoo, inicia sesión para acceder a tu armario inteligente y a tus favoritos guardados.
              </p>
              <button 
                onClick={() => setIsLogin(true)}
                className="px-8 py-3 border-2 border-white/80 hover:bg-white hover:text-purple-600 rounded-xl font-bold transition-all z-10"
              >
                Iniciar Sesión
              </button>
            </div>

            {/* Formulario Registro */}
            <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-center relative">
              <div className="absolute top-8 right-8 flex items-center gap-2">
                <span className="font-bold tracking-widest text-xl text-gray-900 dark:text-white">VENTOO</span>
                <Cloud className="w-8 h-8 text-purple-500" />
              </div>

              <h2 className="text-4xl font-bold mb-2 text-gray-900 dark:text-white">Regístrate</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-8">Crea tu cuenta gratis en segundos</p>
              
              <form onSubmit={(e) => handleAuth(e, '/api/auth/register')} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Correo Electrónico</label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-gray-900 dark:text-white"
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
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-gray-900 dark:text-white"
                    placeholder="••••••••"
                    required
                  />
                </div>
                
                {error && <p className="text-red-500 text-sm">{error}</p>}
                
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-3 rounded-xl transition-all transform active:scale-[0.98] shadow-lg flex justify-center items-center"
                >
                  {loading ? 'Cargando...' : 'Crear Cuenta'}
                </button>
              </form>

              <div className="mt-8 text-center md:hidden">
                <p className="text-gray-500 dark:text-gray-400">¿Ya tienes cuenta?</p>
                <button onClick={() => setIsLogin(true)} className="text-purple-500 font-semibold mt-2">Inicia sesión aquí</button>
              </div>
            </div>
          </div>

        </motion.div>
      </div>
    </div>
  );
}
