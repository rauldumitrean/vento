import React from 'react';
import { Search, Shirt, User, Sun, Moon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MobileNavBar = ({ view, setView, darkMode, setDarkMode }) => {
  const navigate = useNavigate();

  return (
    <div className="fixed bottom-6 left-0 right-0 z-[100] flex justify-center md:hidden px-4 pointer-events-none">
      <div className={`pointer-events-auto flex items-center justify-between gap-1 p-1.5 rounded-[2rem] shadow-2xl backdrop-blur-xl border w-full max-w-[340px] transition-all duration-300 ${darkMode ? 'bg-gray-900/80 border-white/10 shadow-black/50' : 'bg-white/80 border-white shadow-indigo-900/10'}`}>
        
        {/* Home / Buscar */}
        <button 
          onClick={() => { setView('dashboard'); navigate('/app', { replace: true }); }}
          className={`flex items-center justify-center flex-1 py-2.5 rounded-[1.5rem] transition-all duration-300 ${view === 'dashboard' ? (darkMode ? 'bg-gray-800 text-white shadow-sm' : 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-600 shadow-sm') : 'text-gray-400 hover:text-gray-600'}`}
        >
          <div className="flex items-center gap-2">
            <Search size={18} />
            {view === 'dashboard' && <span className="text-sm font-semibold tracking-wide">Inicio</span>}
          </div>
        </button>

        {/* Armario */}
        <button 
          onClick={() => { setView('armario'); navigate('/app', { replace: true }); }}
          className={`flex items-center justify-center flex-1 py-2.5 rounded-[1.5rem] transition-all duration-300 ${view === 'armario' ? (darkMode ? 'bg-gray-800 text-white shadow-sm' : 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-600 shadow-sm') : 'text-gray-400 hover:text-gray-600'}`}
        >
          <div className="flex items-center gap-2">
            <Shirt size={18} />
            {view === 'armario' && <span className="text-sm font-semibold tracking-wide">Armario</span>}
          </div>
        </button>

        {/* Perfil */}
        <button 
          onClick={() => setView('profile')}
          className={`flex items-center justify-center flex-1 py-2.5 rounded-[1.5rem] transition-all duration-300 ${view === 'profile' ? (darkMode ? 'bg-gray-800 text-white shadow-sm' : 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-600 shadow-sm') : 'text-gray-400 hover:text-gray-600'}`}
        >
          <div className="flex items-center gap-2">
            <User size={18} />
            {view === 'profile' && <span className="text-sm font-semibold tracking-wide">Perfil</span>}
          </div>
        </button>
        
        {/* Separator */}
        <div className={`w-[1px] h-8 mx-1 opacity-50 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>

        {/* Theme Toggle */}
        <button 
          onClick={() => setDarkMode(!darkMode)}
          className={`p-3 rounded-full transition-colors flex-shrink-0 flex items-center justify-center ${darkMode ? 'text-yellow-400 hover:bg-gray-800' : 'text-gray-400 hover:bg-gray-100'}`}
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

      </div>
    </div>
  );
};

export default MobileNavBar;
