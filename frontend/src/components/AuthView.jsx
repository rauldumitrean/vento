import { useState } from 'react';
import axios from 'axios';

export default function AuthView({ setToken }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    try {
      const res = await axios.post(`http://localhost:3000${endpoint}`, { email, password });
      setToken(res.data.token);
    } catch (err) {
      setError(err.response?.data?.error || 'Error de conexión');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white text-neutral-900 font-sans">
      <div className="w-full max-w-md p-8">
        <h1 className="text-3xl font-light tracking-tight text-center mb-8">
          {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
        </h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm text-neutral-500 mb-2">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full border-b border-neutral-200 py-2 focus:outline-none focus:border-neutral-900 transition-colors bg-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-neutral-500 mb-2">Contraseña</label>
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full border-b border-neutral-200 py-2 focus:outline-none focus:border-neutral-900 transition-colors bg-transparent"
              required
            />
          </div>
          
          {error && <p className="text-red-500 text-sm">{error}</p>}
          
          <button 
            type="submit" 
            className="w-full bg-neutral-900 text-white py-3 rounded hover:bg-neutral-800 transition-colors"
          >
            {isLogin ? 'Entrar' : 'Registrarse'}
          </button>
        </form>
        
        <div className="mt-8 text-center">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
          >
            {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
          </button>
        </div>
      </div>
    </div>
  );
}
