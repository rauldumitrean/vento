import React from 'react';
import { Sun, Moon, Shirt, MapPin, LogOut, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Navbar = ({ view, setView, darkMode, setDarkMode, handleLogout }) => {
  const navigate = useNavigate();

  return (
    <nav className={`w-full flex flex-wrap items-center justify-between gap-4 p-4 mb-4 sm:mb-8 border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
      <div className="flex items-center gap-4 sm:gap-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center border shadow-sm">
            <img src="/favicon.svg" alt="Ventoo" className="w-full h-full object-cover p-1 bg-white" />
          </div>
          <h1 className="text-xl font-bold tracking-widest bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent hidden sm:block">Ventoo</h1>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4 ml-2 sm:ml-8">
          <button 
            onClick={() => { setView('dashboard'); navigate('/'); }}
            className={`flex items-center gap-2 text-sm font-medium transition-colors ${view === 'dashboard' ? (darkMode ? 'text-white' : 'text-gray-900') : 'text-gray-500 hover:text-gray-400'}`}
          >
            <Search size={16} /> <span className="hidden sm:inline">Buscar</span>
          </button>
          
          <button 
            onClick={() => { setView('armario'); navigate('/'); }}
            className={`flex items-center gap-2 text-sm font-medium transition-colors ${view === 'armario' ? (darkMode ? 'text-white' : 'text-gray-900') : 'text-gray-500 hover:text-gray-400'}`}
          >
            <Shirt size={16} /> <span className="hidden sm:inline">Armario & Historial</span>
          </button>

          {localStorage.getItem('userRole') === 'ADMIN' && (
            <button 
              onClick={() => { setView('admin'); navigate('/admin'); }}
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${view === 'admin' ? 'text-purple-500' : 'text-gray-500 hover:text-purple-400'}`}
            >
              <span className="hidden sm:inline">Admin Panel</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
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
