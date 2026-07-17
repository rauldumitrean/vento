import React, { useState } from 'react';
import axios from 'axios';
import { Shield, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '927415757542-344is6ge14qvn0jd2hd66dsan2g5gvrs.apps.googleusercontent.com';

const AdminLoginView = ({ setAdminToken }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const res = await axios.post(`${API_URL}/api/auth/login`, { email, password });
      
      if (res.data.user.role !== 'ADMIN') {
        setError('Acceso denegado: No tienes permisos de administrador.');
        setLoading(false);
        return;
      }

      setAdminToken(res.data.token);
    } catch (err) {
      setError(err.response?.data?.error || 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    setLoading(true);

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const res = await axios.post(`${API_URL}/api/auth/google`, { token: credentialResponse.credential });
      
      if (res.data.user.role !== 'ADMIN') {
        setError('Acceso denegado: ESTRICTAMENTE solo administradores pueden entrar aquí.');
        setLoading(false);
        return;
      }
      
      setAdminToken(res.data.token);
    } catch (err) {
      setError(err.response?.data?.error || 'Error con Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
    <div className="min-h-[100dvh] bg-gray-950 flex flex-col justify-center items-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="p-8 text-center border-b border-gray-800">
          <div className="mx-auto w-16 h-16 bg-purple-900/30 rounded-2xl flex items-center justify-center mb-4 border border-purple-500/30">
            <Shield className="text-purple-500 w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-widest uppercase">Ventoo Admin</h2>
          <p className="text-gray-500 mt-2 text-sm">Panel de Control Restringido</p>
        </div>

        <div className="p-8">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg text-sm text-center mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-gray-400 text-xs font-semibold mb-2 uppercase tracking-wider">Email Admin</label>
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                // FIX: Added placeholder for better UX
                placeholder="admin@ventoo.app"
                className="w-full p-3 bg-gray-950 border border-gray-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-shadow"
                required
              />
            </div>
            <div>
              <label className="block text-gray-400 text-xs font-semibold mb-2 uppercase tracking-wider">Contraseña</label>
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                // FIX: Added placeholder for better UX
                placeholder="Contraseña de administrador"
                className="w-full p-3 bg-gray-950 border border-gray-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-shadow"
                required
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full mt-6 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Verificando...' : <><Lock size={18} /> Iniciar Sesión Segura</>}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-800"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-900 text-gray-500 uppercase tracking-widest text-xs font-bold">Autenticación Segura</span>
              </div>
            </div>
            <div className="mt-6 flex justify-center opacity-90 hover:opacity-100 transition-opacity">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Error al conectar con Google')}
                useOneTap={false}
                theme="filled_black"
                shape="rectangular"
                size="large"
                width="100%"
              />
            </div>
          </div>

          <div className="mt-8 text-center">
            <button 
              onClick={() => {
                // FIX: Clear adminToken when navigating back to avoid stale session
                localStorage.removeItem('adminToken');
                navigate('/');
              }}
              className="text-gray-500 hover:text-white text-sm transition-colors"
            >
              ← Volver a Ventoo
            </button>
          </div>
        </div>
      </motion.div>
    </div>
    </GoogleOAuthProvider>
  );
};

export default AdminLoginView;
