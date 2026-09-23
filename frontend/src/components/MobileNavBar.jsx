import Cookies from 'js-cookie';
import React, { useState } from 'react';
import {
  Search, Shirt, Users, Sun, Moon, MessageSquare, Luggage,
  User, Star, Calendar, Clock, ChevronRight, X, MoreHorizontal,
  Palette, ShieldCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const MobileNavBar = ({ view, setView, setWeather, setOutfit, setLocation, darkMode, setDarkMode }) => {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const profilePicture = Cookies.get('userProfilePicture');
  const userName = Cookies.get('userName') || '';
  const isAdmin = Cookies.get('userRole') === 'ADMIN';

  const goTo = (id) => {
    setView(id);
    navigate('/app', { replace: true });
    setDrawerOpen(false);
  };

  // 5 essential items that always show in the bottom bar
  const primaryNav = [
    { id: 'dashboard', icon: Search, label: 'Buscar' },
    { id: 'armario', icon: Shirt, label: 'Armario' },
    { id: 'community', icon: Users, label: 'Feed' },
    { id: 'chat', icon: MessageSquare, label: 'Chat IA' },
  ];

  // Secondary items that go in the "More" drawer
  const secondaryNav = [
    { id: 'packing', icon: Luggage, label: 'Asistente de Maleta' },
    { id: 'historial', icon: Clock, label: 'Historial' },
    { id: 'calendario', icon: Calendar, label: 'Calendario' },
    { id: 'favorites', icon: Star, label: 'Ciudades Favoritas' },
    { id: 'studio', icon: Palette, label: 'Mix & Match Studio' },
    { id: 'friends', icon: Users, label: 'Amigos y Chat' },
    { id: 'profile', icon: User, label: 'Mi Perfil' },
    ...(isAdmin ? [{ id: 'admin', icon: ShieldCheck, label: 'Panel Admin' }] : []),
  ];

  const isMoreActive = secondaryNav.some(item => item.id === view);

  // bg colors based on darkMode
  const bg = darkMode
    ? 'bg-[#0f0f13]/95 border-white/10 shadow-black/60'
    : 'bg-white/95 border-black/10 shadow-black/10';

  const activeIconColor = darkMode ? 'text-indigo-400' : 'text-indigo-600';
  const inactiveIconColor = darkMode ? 'text-gray-500' : 'text-gray-400';
  const activePill = darkMode
    ? 'bg-indigo-500/20 border border-indigo-500/30'
    : 'bg-indigo-50 border border-indigo-100';
  const activeLabel = darkMode ? 'text-indigo-400' : 'text-indigo-600';
  const inactiveLabel = darkMode ? 'text-gray-500' : 'text-gray-400';

  return (
    <>
      {/* Backdrop when drawer is open */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[110] bg-black/50 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* More Drawer — slides up from bottom */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 40 }}
            className={`fixed bottom-[80px] left-0 right-0 z-[120] mx-3 rounded-3xl border shadow-2xl overflow-hidden ${bg}`}
            style={{ backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }}
          >
            {/* Drawer header */}
            <div className={`flex items-center justify-between px-5 pt-4 pb-3 border-b ${darkMode ? 'border-white/8' : 'border-black/8'}`}>
              <div className="flex items-center gap-3">
                {profilePicture ? (
                  <img src={profilePicture} alt="Avatar" className="w-8 h-8 rounded-full object-cover border-2 border-indigo-500/50" />
                ) : (
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${darkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}>
                    {userName.charAt(0).toUpperCase() || '?'}
                  </div>
                )}
                <div>
                  <p className={`text-sm font-semibold leading-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {userName || 'Mi cuenta'}
                  </p>
                  <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Ventoo</p>
                </div>
              </div>
              {/* Dark mode toggle inside drawer */}
              <button
                onClick={() => {
                  const next = !darkMode;
                  setDarkMode(next);
                  Cookies.set('darkMode', next ? 'true' : 'false', { expires: 365 });
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                  darkMode
                    ? 'bg-yellow-400/10 text-yellow-400 hover:bg-yellow-400/20'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {darkMode ? <Sun size={16} /> : <Moon size={16} />}
                <span>{darkMode ? 'Modo Claro' : 'Modo Oscuro'}</span>
              </button>
            </div>

            {/* Drawer items grid */}
            <div className="grid grid-cols-2 gap-2 p-3">
              {secondaryNav.map(({ id, icon: Icon, label }) => {
                const isActive = view === id;
                return (
                  <button
                    key={id}
                    onClick={() => goTo(id)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all duration-200 ${
                      isActive
                        ? darkMode
                          ? 'bg-indigo-500/20 border border-indigo-500/30 text-indigo-400'
                          : 'bg-indigo-50 border border-indigo-100 text-indigo-600'
                        : darkMode
                        ? 'hover:bg-white/5 text-gray-300'
                        : 'hover:bg-gray-50 text-gray-600'
                    }`}
                  >
                    <Icon size={18} className={isActive ? (darkMode ? 'text-indigo-400' : 'text-indigo-600') : ''} />
                    <span className="text-sm font-medium leading-tight">{label}</span>
                    {isActive && <ChevronRight size={14} className="ml-auto opacity-60" />}
                  </button>
                );
              })}
            </div>

            {/* Drawer bottom handle */}
            <div className={`flex justify-center py-3 border-t ${darkMode ? 'border-white/8' : 'border-black/8'}`}>
              <div className={`w-10 h-1 rounded-full ${darkMode ? 'bg-white/20' : 'bg-black/15'}`} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation Bar */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[100] md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="px-3 pb-2">
          <div
            className={`flex items-center justify-around p-1.5 rounded-2xl shadow-xl border transition-all duration-300 ${bg}`}
            style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
          >
            {/* Primary nav items */}
            {primaryNav.map(({ id, icon: Icon, label }) => {
              const isActive = view === id;
              return (
                <button
                  key={id}
                  onClick={() => { goTo(id); setDrawerOpen(false); }}
                  className="relative flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all duration-200 min-w-[3.5rem]"
                >
                  {isActive && (
                    <motion.div
                      layoutId="mobile-nav-pill"
                      className={`absolute inset-0 rounded-xl ${activePill}`}
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                  <div className="relative flex flex-col items-center gap-0.5">
                    <Icon size={22} className={isActive ? activeIconColor : inactiveIconColor} />
                    <span className={`text-[10px] font-medium ${isActive ? activeLabel : inactiveLabel}`}>{label}</span>
                  </div>
                </button>
              );
            })}

            {/* Divider */}
            <div className={`h-8 w-px flex-shrink-0 ${darkMode ? 'bg-white/10' : 'bg-black/10'}`} />

            {/* "More" button */}
            <button
              onClick={() => setDrawerOpen(prev => !prev)}
              className="relative flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all duration-200 min-w-[3.5rem]"
            >
              {isMoreActive && !drawerOpen && (
                <motion.div
                  layoutId="mobile-nav-pill"
                  className={`absolute inset-0 rounded-xl ${activePill}`}
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <div className="relative flex flex-col items-center gap-0.5">
                {drawerOpen
                  ? <X size={22} className={activeIconColor} />
                  : <MoreHorizontal size={22} className={isMoreActive ? activeIconColor : inactiveIconColor} />
                }
                <span className={`text-[10px] font-medium ${isMoreActive || drawerOpen ? activeLabel : inactiveLabel}`}>
                  {drawerOpen ? 'Cerrar' : 'Más'}
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileNavBar;
