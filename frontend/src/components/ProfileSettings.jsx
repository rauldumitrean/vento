import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { User, Save } from 'lucide-react';

export default function ProfileSettings({ token, darkMode }) {
  const [name, setName] = useState(sessionStorage.getItem('userName') || '');
  const [gender, setGender] = useState(sessionStorage.getItem('userGender') || 'Mujer');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const res = await axios.put(`${API_URL}/api/auth/profile`, { name, gender }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      sessionStorage.setItem('userName', res.data.user.name);
      sessionStorage.setItem('userGender', res.data.user.gender);
      setMessage('Perfil actualizado con éxito');
    } catch (err) {
      setMessage('Error al actualizar el perfil');
    } finally {
      setLoading(false);
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
          <p className={`mt-2 text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>Esta información se usa para mejorar las recomendaciones de estilo de la inteligencia artificial.</p>
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
