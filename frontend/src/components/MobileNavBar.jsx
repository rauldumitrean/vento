import React from 'react';
import { Search, Shirt, User, Sun, Moon, LogOut, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const MobileNavBar = ({ view, setView, darkMode, setDarkMode, handleLogout }) => {
  const navigate = useNavigate();

  const navItems = [
    { id: 'dashboard', icon: Search, label: 'Inicio' },
    { id: 'chat', icon: MessageSquare, label: 'Chat' },
    { id: 'armario', icon: Shirt, label: 'Armario' },
    { id: 'profile', icon: User, label: 'Perfil' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] md:hidden flex justify-center"
      style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}>
      <div className="px-4 w-full">
        <div
          className={`
            flex items-center justify-between gap-1 p-1.5 rounded-2xl shadow-2xl border mx-auto
            transition-all duration-300 max-w-sm
            ${darkMode
              ? 'bg-gray-900/90 border-white/10 shadow-black/60'
              : 'bg-white/90 border-white/80 shadow-indigo-200/40'
            }
          `}
          style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
        >
          {/* Nav items */}
          {navItems.map(({ id, icon: Icon, label }) => {
            const isActive = view === id;
            return (
              <button
                key={id}
                onClick={() => {
                  setView(id);
                  navigate('/app', { replace: true });
                }}
                className={`relative flex-1 flex items-center justify-center py-2.5 px-2 rounded-xl transition-all duration-300 ${
                  isActive ? '' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-pill"
                    className={`absolute inset-0 rounded-xl ${
                      darkMode
                        ? 'bg-indigo-600/20 border border-indigo-500/30'
                        : 'bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100'
                    }`}
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <div className="relative flex items-center gap-1.5">
                  <Icon
                    size={18}
                    className={isActive
                      ? darkMode ? 'text-indigo-400' : 'text-indigo-600'
                      : ''
                    }
                  />
                  <AnimatePresence mode="wait">
                    {isActive && (
                      <motion.span
                        key={id + '-label'}
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.2 }}
                        className={`text-xs font-semibold overflow-hidden whitespace-nowrap ${
                          darkMode ? 'text-indigo-400' : 'text-indigo-600'
                        }`}
                      >
                        {label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </button>
            );
          })}

          {/* Separator */}
          <div className={`h-6 w-px flex-shrink-0 ${darkMode ? 'bg-white/10' : 'bg-gray-200'}`} />

          {/* Dark mode toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2.5 rounded-xl transition-all duration-300 ${
              darkMode
                ? 'text-yellow-400 hover:bg-yellow-400/10'
                : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700'
            }`}
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileNavBar;
