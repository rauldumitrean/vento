import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Cloud, Send, CheckCircle2, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function SupportView({ token }) {
  const navigate = useNavigate();
  const [asunto, setAsunto] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!asunto.trim() || !mensaje.trim()) return;
    
    setLoading(true);
    setError('');
    try {
      await axios.post(`${API_URL}/api/tickets`, { asunto, mensaje }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess(true);
    } catch (err) {
      console.error(err);
      setError('Hubo un problema al enviar tu reporte. Inténtalo de nuevo más tarde.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6 text-white font-sans">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full bg-gray-900 border border-gray-800 rounded-3xl p-8 flex flex-col items-center text-center shadow-2xl"
        >
          <div className="w-20 h-20 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-2xl font-black mb-3">¡Ticket enviado!</h2>
          <p className="text-gray-400 mb-8">Hemos recibido tu reporte. Nuestro equipo lo revisará lo antes posible.</p>
          <button 
            onClick={() => navigate('/app')}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold transition-colors"
          >
            Volver al Inicio
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-lg">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 font-semibold mb-6 transition-colors"
        >
          <ArrowLeft size={20} /> Volver
        </button>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100"
        >
          <div className="p-8 bg-gradient-to-br from-indigo-600 to-purple-700 text-white text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            <Cloud size={40} className="mx-auto mb-4 text-indigo-200" />
            <h1 className="text-3xl font-black mb-2 relative z-10">Soporte Ventoo</h1>
            <p className="text-indigo-100 text-sm relative z-10">¿Tienes un problema o sugerencia? Cuéntanoslo.</p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Asunto</label>
              <input 
                type="text" 
                value={asunto}
                onChange={e => setAsunto(e.target.value)}
                placeholder="Ej: Problema al generar outfit"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                required
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Mensaje / Detalles</label>
              <textarea 
                value={mensaje}
                onChange={e => setMensaje(e.target.value)}
                placeholder="Describe el error con el mayor detalle posible..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm min-h-[150px] resize-y"
                required
              ></textarea>
            </div>

            {error && (
              <p className="text-red-500 text-sm bg-red-50 p-3 rounded-xl border border-red-100">{error}</p>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 hover:bg-black text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 mt-4 shadow-lg shadow-gray-900/20"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>Enviar Ticket <Send size={18} /></>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
