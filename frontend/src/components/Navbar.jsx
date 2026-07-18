import React from 'react';
// FIX: Removed unused imports: Wind, MapPin
import { Sun, Moon, Shirt, LogOut, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Navbar = ({ view, setView, darkMode, setDarkMode, handleLogout }) => {
  const navigate = useNavigate();

  const profilePicture = localStorage.getItem('userProfilePicture');

  return (
    <nav className={`w-full hidden md:flex flex-wrap items-center justify-between gap-4 p-4 mb-4 sm:mb-8 backdrop-blur-md sticky top-0 z-50 transition-colors border-b ${darkMode ? 'bg-gray-950/60 border-white/10' : 'bg-white/70 border-white shadow-sm'}`}>
      <div className="flex items-center gap-4 sm:gap-6">
        <button 
          onClick={() => navigate('/')} 
          className="flex items-center gap-2 sm:gap-3 cursor-pointer hover:opacity-80 transition-opacity"
        >
          <div className={`w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center border shadow-sm ${darkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-white'}`}>
            <img src="/favicon.svg" alt="Ventoo" className="w-full h-full object-cover p-1" />
          </div>
          <h1 className="text-xl font-bold tracking-widest bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent hidden sm:block">Ventoo</h1>
        </button>
        
        <div className="flex items-center gap-2 sm:gap-4 ml-2 sm:ml-8">
          <button 
            // FIX: Use replace:true to avoid polluting browser history with same-page navigation
            onClick={() => { setView('dashboard'); navigate('/app', { replace: true }); }}
            className={`flex items-center gap-2 text-sm font-medium transition-colors ${view === 'dashboard' ? (darkMode ? 'text-white' : 'text-gray-900') : 'text-gray-500 hover:text-gray-400'}`}
          >
            <Search size={16} /> <span className="hidden sm:inline">Buscar</span>
          </button>
          
          <button 
            // FIX: Use replace:true to avoid polluting browser history
            onClick={() => { setView('armario'); navigate('/app', { replace: true }); }}
            className={`flex items-center gap-2 text-sm font-medium transition-colors ${view === 'armario' ? (darkMode ? 'text-white' : 'text-gray-900') : 'text-gray-500 hover:text-gray-400'}`}
          >
            <Shirt size={16} /> <span className="hidden sm:inline">Armario & Historial</span>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button 
          onClick={() => setView('profile')}
          // FIX: Added active state for profile button to match other nav buttons
          className={`p-2 rounded-full transition-colors overflow-hidden ${view === 'profile' ? (darkMode ? 'bg-indigo-900/50 text-indigo-400' : 'bg-indigo-100 text-indigo-600') : (darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}`}
          title="Ajustes de Perfil"
          aria-label="Ajustes de Perfil"
        >
          {profilePicture ? (
            <img src={profilePicture} alt="Avatar" className="w-5 h-5 rounded-full object-cover" />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
          )}
        </button>

        <button 
          onClick={() => setDarkMode(!darkMode)}
          className={`p-2 rounded-full transition-colors ${darkMode ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-500 transition-colors"
        >
          <LogOut size={16} /> <span className="hidden sm:inline">Salir</span>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
