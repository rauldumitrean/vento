import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { User, Save, Shirt } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function ProfileSettings({ token, darkMode }) {
  const [name, setName] = useState(sessionStorage.getItem('userName') || '');
  const [gender, setGender] = useState(sessionStorage.getItem('userGender') || 'Mujer');
  const [estiloPersonal, setEstiloPersonal] = useState('');
  const [estiloDetalles, setEstiloDetalles] = useState('');
  const [historyCount, setHistoryCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.user) {
          setName(res.data.user.name || '');
          setGender(res.data.user.gender || 'Mujer');
          setEstiloPersonal(res.data.user.estiloPersonal || '');
          setEstiloDetalles(res.data.user.estiloDetalles || '');
          setHistoryCount(res.data.user.historyCount || 0);
        }
      } catch (err) {
        console.error("Error fetching profile", err);
      }
    };
    fetchProfile();
  }, [token]);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const res = await axios.put(`${API_URL}/api/auth/profile`, { name, gender, estiloPersonal, estiloDetalles }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      sessionStorage.setItem('userName', res.data.user.name);
      sessionStorage.setItem('userGender', res.data.user.gender);
      setMessage('Perfil actualizado con éxito');
      // FIX: Auto-dismiss success message after 4 seconds
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      setMessage('Error al actualizar el perfil');
      setTimeout(() => setMessage(''), 4000);
    } finally {
      setLoading(false);
    }
  };

  const handleDirectCheckout = async (plan) => {
    setCheckoutLoading(true);
    setMessage('');
    try {
      const res = await axios.post(`${API_URL}/api/payments/create-checkout-session`, { plan }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.url) {
        window.location.href = res.data.url;
      }
    } catch (err) {
      setMessage('Error iniciando el pago.');
      setCheckoutLoading(false);
      setTimeout(() => setMessage(''), 4000);
    }
  };

  return (
    <div className={`p-6 max-w-lg mx-auto rounded-3xl shadow-xl border backdrop-blur-xl ${darkMode ? 'bg-gray-900/50 border-white/10 shadow-black/50' : 'bg-white/70 border-white shadow-indigo-900/5'}`}>
      <div className="flex items-center gap-3 mb-6">
        <div className={`p-3 rounded-xl ${darkMode ? 'bg-indigo-900/50' : 'bg-indigo-100'}`}>
          <User className={`w-6 h-6 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
        </div>
        <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Ajustes de Perfil</h2>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div>
          <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Nombre</label>
          <input 
            type="text" 
            value={name}
            onChange={e => setName(e.target.value)}
            className={`w-full rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${darkMode ? 'bg-gray-800/80 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'} border shadow-sm`}
            required
          />
        </div>

        <div>
          <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Género</label>
          <select 
            value={gender}
            onChange={e => setGender(e.target.value)}
            className={`w-full rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${darkMode ? 'bg-gray-800/80 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'} border shadow-sm`}
          >
            <option value="Mujer">Mujer</option>
            <option value="Hombre">Hombre</option>
            <option value="Otro">Otro</option>
          </select>
          {/* FIX: Simplified useless ternary - both branches were 'text-gray-500' */}
          <p className="mt-2 text-xs text-gray-500">Esta información se usa para mejorar las recomendaciones de estilo.</p>
        </div>

        <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-indigo-900/10 border-indigo-500/20' : 'bg-indigo-50 border-indigo-100'}`}>
          <h3 className={`text-lg flex items-center font-bold mb-4 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
            <Shirt className="w-5 h-5 mr-2" /> Tu Tipo de Estilo
          </h3>
          
          <div className="mb-4">
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Estilo Principal</label>
            <select 
              value={estiloPersonal}
              onChange={e => setEstiloPersonal(e.target.value)}
              className={`w-full rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${darkMode ? 'bg-gray-800/80 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'} border shadow-sm`}
            >
              <option value="">No especificado</option>
              <option value="Urbano / Streetwear">Urbano / Streetwear</option>
              <option value="Casual">Casual</option>
              <option value="Elegante / Formal">Elegante / Formal</option>
              <option value="Minimalista">Minimalista</option>
              <option value="Deportivo">Deportivo</option>
              <option value="Vintage / Retro">Vintage / Retro</option>
              <option value="Bohemio / Boho">Bohemio / Boho</option>
              <option value="Gótico / Dark">Gótico / Dark</option>
              <option value="Y2K">Y2K</option>
              <option value="Preppy">Preppy</option>
            </select>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Detalles específicos (Opcional)</label>
            <textarea 
              value={estiloDetalles}
              onChange={e => setEstiloDetalles(e.target.value)}
              placeholder="Ej: Prefiero colores oscuros, ropa muy ancha, me encantan las chaquetas de cuero..."
              rows={3}
              className={`w-full rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${darkMode ? 'bg-gray-800/80 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'} border shadow-sm resize-none`}
            />
            <p className="mt-2 text-xs text-gray-500">La IA tendrá en cuenta todo esto al recomendarte outfits.</p>
          </div>
        </div>

        <div className={`p-4 rounded-xl border ${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
          <h3 className={`text-sm font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Tu Plan Actual</h3>
          {sessionStorage.getItem('isPremium') === 'true' ? (
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-indigo-500/20 text-indigo-500 text-xs font-bold rounded-full uppercase tracking-wider">
                {sessionStorage.getItem('premiumPlan') === 'lifetime' ? 'Premium (De por vida)' : 'Premium (Mensual)'}
              </span>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Disfrutando de todas las funciones PRO.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-gray-500/20 text-gray-500 text-xs font-bold rounded-full uppercase tracking-wider">
                  Básico (Gratis)
                </span>
              </div>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Mejora a Premium para obtener outfits ilimitados y funciones IA avanzadas.</p>
              <div className="flex gap-2 mt-1">
                <button 
                  type="button" 
                  disabled={checkoutLoading}
                  onClick={() => handleDirectCheckout('monthly')}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
                >
                  {checkoutLoading ? 'Procesando...' : 'Suscripción (1,99€/mes)'}
                </button>
                <button 
                  type="button"
                  disabled={checkoutLoading}
                  onClick={() => handleDirectCheckout('lifetime')} 
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
                >
                  {checkoutLoading ? 'Procesando...' : 'Pago único (20€)'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Límite de Historial */}
        <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}>
          <h3 className={`text-sm font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Tu Historial de Outfits</h3>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-sm">
              <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Outfits Guardados</span>
              <span className={`font-bold ${historyCount >= (sessionStorage.getItem('isPremium') === 'true' ? 50 : 15) ? 'text-red-500' : (darkMode ? 'text-white' : 'text-gray-900')}`}>
                {historyCount} / {sessionStorage.getItem('isPremium') === 'true' ? 50 : 15}
              </span>
            </div>
            <div className={`w-full h-2 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${historyCount >= (sessionStorage.getItem('isPremium') === 'true' ? 50 : 15) ? 'bg-red-500' : historyCount >= (sessionStorage.getItem('isPremium') === 'true' ? 40 : 10) ? 'bg-orange-500' : 'bg-indigo-500'}`}
                style={{ width: `${Math.min((historyCount / (sessionStorage.getItem('isPremium') === 'true' ? 50 : 15)) * 100, 100)}%` }}
              ></div>
            </div>
            <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
              {historyCount >= (sessionStorage.getItem('isPremium') === 'true' ? 50 : 15) 
                ? 'Has alcanzado tu límite. Para generar nuevos outfits, elimina algunos de tu historial.' 
                : 'Al alcanzar tu límite, no podrás generar nuevos outfits hasta que liberes espacio en tu historial.'}
            </p>
          </div>
        </div>

        {message && (
          <p className={`text-sm text-center ${message.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>
            {message}
          </p>
        )}

        <button 
          type="submit" 
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3 rounded-xl shadow-lg transition-all"
        >
          {loading ? 'Guardando...' : <><Save size={18} /> Guardar Cambios</>}
        </button>
      </form>
    </div>
  );
}
