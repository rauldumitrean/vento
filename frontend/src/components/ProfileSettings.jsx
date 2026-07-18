import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { User, Save, Shirt, ChevronDown, ChevronUp, CreditCard, Settings, Smartphone, AlertTriangle, LogOut, Camera } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function ProfileSettings({ token, darkMode, onLogout }) {
  const [name, setName] = useState(localStorage.getItem('userName') || '');
  const [gender, setGender] = useState(localStorage.getItem('userGender') || 'Mujer');
  const [age, setAge] = useState(localStorage.getItem('userAge') || '');
  const [estiloPersonal, setEstiloPersonal] = useState('');
  const [estiloDetalles, setEstiloDetalles] = useState('');
  const [profilePicture, setProfilePicture] = useState(localStorage.getItem('userProfilePicture') || '');
  const [historyCount, setHistoryCount] = useState(0);
  const [dailyCount, setDailyCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [reportMessage, setReportMessage] = useState('');
  const [reportStatus, setReportStatus] = useState('idle'); // idle | loading | success | error
  
  const [activeAccordion, setActiveAccordion] = useState('personal');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.user) {
          setName(res.data.user.name || '');
          setGender(res.data.user.gender || 'Mujer');
          setAge(res.data.user.age || '');
          setEstiloPersonal(res.data.user.estiloPersonal || '');
          setEstiloDetalles(res.data.user.estiloDetalles || '');
          setProfilePicture(res.data.user.profilePicture || '');
          localStorage.setItem('userProfilePicture', res.data.user.profilePicture || '');
          setHistoryCount(res.data.user.historyCount || 0);
          setDailyCount(res.data.user.dailyCount || 0);
        }
      } catch (err) {
        console.error("Error fetching profile", err);
      }
    };
    fetchProfile();
  }, [token]);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMessage('Por favor, selecciona una imagen válida.');
      setTimeout(() => setMessage(''), 4000);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage('La imagen es demasiado grande (máximo 5MB).');
      setTimeout(() => setMessage(''), 4000);
      return;
    }

    setUploadingAvatar(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const res = await axios.post(`${API_URL}/api/upload-avatar`, {
          imageBase64: reader.result
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.data.profilePicture) {
          setProfilePicture(res.data.profilePicture);
          localStorage.setItem('userProfilePicture', res.data.profilePicture);
          setMessage('Foto de perfil actualizada con éxito.');
        }
      } catch (err) {
        setMessage('Error al subir la foto de perfil.');
      } finally {
        setUploadingAvatar(false);
        setTimeout(() => setMessage(''), 4000);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const res = await axios.put(`${API_URL}/api/auth/profile`, { name, gender, age, estiloPersonal, estiloDetalles }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      localStorage.setItem('userName', res.data.user.name);
      localStorage.setItem('userGender', res.data.user.gender);
      localStorage.setItem('userAge', res.data.user.age || '');
      setDailyCount(res.data.user.dailyCount || 0);
      setMessage('Perfil actualizado con éxito');
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

  const handleCancelSubscription = async () => {
    if (!window.confirm('¿Estás seguro de que quieres cancelar tu suscripción mensual? Perderás el acceso Premium.')) return;
    
    setCheckoutLoading(true);
    setMessage('');
    try {
      const res = await axios.post(`${API_URL}/api/payments/cancel-subscription`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        localStorage.setItem('isPremium', 'false');
        localStorage.removeItem('premiumPlan');
        setMessage('Suscripción cancelada correctamente.');
        setTimeout(() => window.location.reload(), 2000);
      }
    } catch (err) {
      setMessage(err.response?.data?.error || 'Error al cancelar la suscripción.');
      setCheckoutLoading(false);
      setTimeout(() => setMessage(''), 4000);
    }
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!reportMessage.trim()) return;
    
    setReportStatus('loading');
    try {
      await axios.post(`${API_URL}/api/tickets`, { 
        asunto: 'Reporte desde la App (Ajustes)', 
        mensaje: reportMessage 
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReportStatus('success');
      setReportMessage('');
      setTimeout(() => setReportStatus('idle'), 3000);
    } catch (err) {
      setReportStatus('error');
      setTimeout(() => setReportStatus('idle'), 3000);
    }
  };

  // Helper para renderizar Widgets/Acordeones
  const WidgetSection = ({ id, title, icon: Icon, children }) => {
    const isOpen = activeAccordion === id;
    return (
      <div className={`rounded-2xl border overflow-hidden transition-all ${darkMode ? 'bg-gray-900/40 border-gray-700/50' : 'bg-white border-gray-200 shadow-sm'}`}>
        <button 
          type="button"
          onClick={() => setActiveAccordion(isOpen ? null : id)}
          className="w-full flex items-center justify-between p-4 md:pointer-events-none md:cursor-default"
        >
          <div className="flex items-center gap-3">
             <div className={`p-2 rounded-xl ${darkMode ? 'bg-indigo-900/40' : 'bg-indigo-50'}`}>
               <Icon className={`w-5 h-5 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
             </div>
             <h3 className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>{title}</h3>
          </div>
          <div className="md:hidden">
            {isOpen ? <ChevronUp size={20} className={darkMode ? 'text-gray-400' : 'text-gray-500'}/> : <ChevronDown size={20} className={darkMode ? 'text-gray-400' : 'text-gray-500'} />}
          </div>
        </button>
        
        <div className={`${isOpen ? 'block' : 'hidden'} md:block p-4 pt-0 md:pt-0`}>
          {children}
        </div>
      </div>
    );
  };

  const isPremium = localStorage.getItem('isPremium') === 'true';

  return (
    <div className={`p-4 md:p-8 max-w-6xl mx-auto rounded-3xl`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className={`text-2xl md:text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Ajustes de Perfil</h2>
          <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Gestiona tu cuenta, estilo y suscripción</p>
        </div>
        {message && (
          <div className={`px-4 py-2 rounded-lg text-sm font-medium ${message.includes('Error') ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>
            {message}
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        
        {/* WIDGET 1: Información Personal */}
        <WidgetSection id="personal" title="Información Personal" icon={User}>
          <div className="space-y-4">
            {/* Avatar Upload */}
            <div className="flex flex-col items-center sm:flex-row sm:items-start gap-4 pb-2">
              <div className="relative group cursor-pointer">
                <div className={`w-20 h-20 rounded-full overflow-hidden border-2 ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-100'} flex items-center justify-center relative`}>
                  {profilePicture ? (
                    <img src={profilePicture} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User size={32} className={darkMode ? 'text-gray-500' : 'text-gray-400'} />
                  )}
                  {uploadingAvatar && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 group-hover:scale-110 transition-transform">
                  <Camera size={14} />
                </div>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={handleAvatarUpload}
                  disabled={uploadingAvatar}
                />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h4 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Foto de perfil</h4>
                <p className={`text-xs mt-1 max-w-[200px] mx-auto sm:mx-0 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Sube una imagen para tu avatar (máx 5MB). Aparecerá en tu menú y consultas.</p>
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Nombre</label>
              <input 
                type="text" 
                value={name}
                onChange={e => setName(e.target.value)}
                className={`w-full rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} border`}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Género</label>
                <select 
                  value={gender}
                  onChange={e => setGender(e.target.value)}
                  className={`w-full rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} border`}
                >
                  <option value="Mujer">Mujer</option>
                  <option value="Hombre">Hombre</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Edad</label>
                <input 
                  type="number" 
                  min="1" max="120"
                  value={age}
                  onChange={e => setAge(e.target.value)}
                  className={`w-full rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} border`}
                  placeholder="Ej: 25"
                />
              </div>
            </div>
          </div>
        </WidgetSection>

        {/* WIDGET 2: Tu Estilo de Moda */}
        <WidgetSection id="estilo" title="Tu Estilo de Moda" icon={Shirt}>
          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Estilo Principal</label>
              <select 
                value={estiloPersonal}
                onChange={e => setEstiloPersonal(e.target.value)}
                className={`w-full rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} border`}
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
              <label className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Detalles específicos (Opcional)</label>
              <textarea 
                value={estiloDetalles}
                onChange={e => setEstiloDetalles(e.target.value)}
                placeholder="Ej: Colores oscuros, ropa muy ancha..."
                rows={3}
                className={`w-full rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${darkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'} border resize-none`}
              />
              <p className="mt-2 text-xs text-gray-500">La IA tendrá en cuenta esto para recomendarte prendas.</p>
            </div>
          </div>
        </WidgetSection>

        {/* WIDGET 3: Suscripción y Límites */}
        <WidgetSection id="plan" title="Plan y Consumo" icon={CreditCard}>
          <div className="space-y-5">
            {/* Plan Actual */}
            <div className={`p-4 rounded-xl border ${darkMode ? 'bg-gray-800/40 border-gray-700/50' : 'bg-gray-50/80 border-gray-200'}`}>
              <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Tu Plan Actual</h4>
              {isPremium ? (
                <div className="flex flex-col gap-1">
                  <span className="text-indigo-500 font-bold">
                    {localStorage.getItem('premiumPlan') === 'lifetime' ? 'Premium (De por vida)' : 'Premium (Mensual)'}
                  </span>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Disfrutando de todas las funciones PRO.</p>
                  {localStorage.getItem('premiumPlan') === 'monthly' && (
                    <button 
                      type="button" 
                      onClick={handleCancelSubscription} 
                      disabled={checkoutLoading}
                      className="mt-2 w-max px-3 py-1.5 border border-red-500/50 text-red-500 hover:bg-red-500/10 text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
                    >
                      Cancelar Suscripción
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <span className="text-gray-500 font-bold">Básico (Gratis)</span>
                  <div className="flex flex-col sm:flex-row gap-2 mt-1">
                    <button type="button" disabled={checkoutLoading} onClick={() => handleDirectCheckout('monthly')} className="flex-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors">
                      1,99€ / mes
                    </button>
                    <button type="button" disabled={checkoutLoading} onClick={() => handleDirectCheckout('lifetime')} className="flex-1 px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg transition-colors">
                      Único 20€
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Outfits Hoy */}
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Outfits Generados Hoy</span>
                <span className={`font-bold ${dailyCount >= (isPremium ? 999999 : 5) ? 'text-red-500' : (darkMode ? 'text-white' : 'text-gray-900')}`}>
                  {isPremium ? 'Ilimitado' : `${dailyCount} / 5`}
                </span>
              </div>
              {!isPremium && (
                <div className={`w-full h-1.5 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                  <div className={`h-1.5 rounded-full transition-all duration-500 ${dailyCount >= 5 ? 'bg-red-500' : dailyCount >= 3 ? 'bg-orange-500' : 'bg-indigo-500'}`} style={{ width: `${Math.min((dailyCount / 5) * 100, 100)}%` }}></div>
                </div>
              )}
            </div>

            {/* Historial */}
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Espacio en Historial</span>
                <span className={`font-bold ${historyCount >= (isPremium ? 50 : 15) ? 'text-red-500' : (darkMode ? 'text-white' : 'text-gray-900')}`}>
                  {historyCount} / {isPremium ? 50 : 15}
                </span>
              </div>
              <div className={`w-full h-1.5 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                <div className={`h-1.5 rounded-full transition-all duration-500 ${historyCount >= (isPremium ? 50 : 15) ? 'bg-red-500' : historyCount >= (isPremium ? 40 : 10) ? 'bg-orange-500' : 'bg-indigo-500'}`} style={{ width: `${Math.min((historyCount / (isPremium ? 50 : 15)) * 100, 100)}%` }}></div>
              </div>
            </div>
          </div>
        </WidgetSection>

        {/* WIDGET 4: Ajustes Extra */}
        <WidgetSection id="extra" title="Más Opciones" icon={Settings}>
          <div className="space-y-4">
            
            {/* Soporte */}
            <div className={`p-4 rounded-xl border ${darkMode ? 'bg-gray-800/40 border-gray-700/50' : 'bg-gray-50/80 border-gray-200'}`}>
              <h4 className={`flex items-center gap-2 text-sm font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                <AlertTriangle size={16} className="text-orange-500" /> Reportar un problema
              </h4>
              <div className="flex flex-col gap-2">
                <textarea 
                  value={reportMessage}
                  onChange={(e) => setReportMessage(e.target.value)}
                  placeholder="Describe el error..."
                  className={`w-full p-2.5 rounded-lg text-sm border focus:ring-2 focus:ring-indigo-500 transition-colors resize-none ${darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
                  rows="2"
                ></textarea>
                <button 
                  type="button"
                  onClick={handleReportSubmit}
                  disabled={reportStatus === 'loading' || !reportMessage.trim()}
                  className={`w-full py-2 rounded-lg text-sm font-bold transition-all ${reportStatus === 'success' ? 'bg-green-500 text-white' : reportStatus === 'error' ? 'bg-red-500 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800 disabled:opacity-50'}`}
                >
                  {reportStatus === 'loading' ? 'Enviando...' : reportStatus === 'success' ? 'Enviado' : 'Enviar Reporte'}
                </button>
              </div>
            </div>

            {/* iOS App Install */}
            {(() => {
              const userAgent = window.navigator.userAgent.toLowerCase();
              const isMacWithTouch = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
              const isIos = /iphone|ipad|ipod/.test(userAgent) || isMacWithTouch;
              return isIos ? (
                <button 
                  type="button"
                  onClick={() => window.dispatchEvent(new Event('show-ios-prompt'))}
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all border ${darkMode ? 'border-indigo-500/50 text-indigo-400 hover:bg-indigo-500/10' : 'border-indigo-200 text-indigo-600 hover:bg-indigo-50'}`}
                >
                  <Smartphone size={16} /> Instalar App en el Móvil
                </button>
              ) : null;
            })()}

            {/* Cerrar Sesión */}
            {onLogout && (
              <button 
                type="button" 
                onClick={onLogout}
                className={`w-full flex items-center justify-center gap-2 font-semibold py-3 rounded-xl border transition-all ${darkMode ? 'border-red-500/30 text-red-400 hover:bg-red-500/10' : 'border-red-200 text-red-500 hover:bg-red-50'}`}
              >
                <LogOut size={16} /> Cerrar Sesión
              </button>
            )}

          </div>
        </WidgetSection>

        {/* Action Button */}
        <div className="md:col-span-2 mt-4 md:mt-2">
          <button 
            type="submit" 
            disabled={loading}
            className="w-full md:max-w-md mx-auto flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-4 rounded-2xl shadow-xl transition-all"
          >
            {loading ? 'Guardando...' : <><Save size={20} /> Guardar todos los cambios</>}
          </button>
        </div>

      </form>
    </div>
  );
}
