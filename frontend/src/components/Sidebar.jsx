import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Cloud, Search, Activity, User, LogOut, Star, MessageSquare, Archive, Settings, LayoutDashboard, Menu } from 'lucide-react';
import Cookies from 'js-cookie';
import NotificationBell from './NotificationBell';

const SidebarItem = ({ icon: Icon, label, isActive, onClick, isCollapsed }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center ${isCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3'} rounded-xl transition-all duration-300 font-medium ${
      isActive 
        ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 shadow-lg shadow-indigo-900/20' 
        : 'text-gray-400 hover:text-white hover:bg-white/5'
    }`}
    title={isCollapsed ? label : undefined}
  >
    <Icon size={18} className={isActive ? 'text-indigo-400 shrink-0' : 'opacity-70 shrink-0'} />
    {!isCollapsed && <span className="text-sm truncate">{label}</span>}
  </button>
);

const Sidebar = ({ view, setView, handleLogout, userName, isPremium, userPoints, userLevel, onNewConsulta, token }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className={`hidden lg:flex flex-col ${isCollapsed ? 'w-[88px]' : 'w-[280px]'} transition-all duration-300 h-full bg-black/40 border border-white/10 rounded-[2rem] shadow-2xl relative shrink-0 z-50`}>
      {/* Decorative top glow */}
      <div className="absolute inset-0 overflow-hidden rounded-[2rem] pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-indigo-500/20 rounded-full mix-blend-screen filter blur-[50px]" />
      </div>

      {/* ── FIXED HEADER ── */}
      <div className={`shrink-0 ${isCollapsed ? 'p-4' : 'p-6'} pb-0 relative z-10`}>
        {/* Logo + Bell + Toggle */}
        <div className={`flex items-center ${isCollapsed ? 'flex-col gap-6' : 'justify-between'} mb-6`}>
          <a href="/" className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity" title="Ventoo">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 border border-white/20 shrink-0">
              <Cloud size={20} className="text-white" />
            </div>
            {!isCollapsed && <span className="text-xl font-bold tracking-widest text-white">Ventoo</span>}
          </a>
          
          <div className={`flex items-center ${isCollapsed ? 'flex-col gap-4' : 'gap-3'}`}>
            {!isCollapsed && <NotificationBell token={token} />}
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)} 
              className="text-gray-400 hover:text-white transition-colors p-1"
              title={isCollapsed ? "Expandir" : "Colapsar"}
            >
              <Menu size={20} />
            </button>
          </div>
        </div>

        {/* New Consulta button */}
        <button 
          onClick={() => onNewConsulta ? onNewConsulta() : setView('dashboard')}
          className={`w-full mb-4 flex items-center justify-center ${isCollapsed ? 'p-3' : 'gap-3 px-4 py-3.5'} bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl text-white font-medium transition-all duration-300 shadow-md group relative overflow-hidden`}
          title={isCollapsed ? "Nueva Consulta" : undefined}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-indigo-500/10 to-purple-500/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          <MessageSquare size={18} className="text-indigo-400 group-hover:scale-110 transition-transform shrink-0" />
          {!isCollapsed && <span className="text-sm truncate">Nueva Consulta</span>}
        </button>
      </div>

      {/* ── SCROLLABLE NAVIGATION ── */}
      <div className={`flex-1 overflow-y-auto hide-scrollbar ${isCollapsed ? 'px-4' : 'px-6'} py-2 relative z-10`}>
        <div className="flex flex-col gap-2">
          {!isCollapsed && <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2 pl-2">Features</p>}
          <SidebarItem isCollapsed={isCollapsed} icon={LayoutDashboard} label="Dashboard" isActive={view === 'dashboard'} onClick={() => setView('dashboard')} />
          <SidebarItem isCollapsed={isCollapsed} icon={Cloud} label="Asistente de Maleta" isActive={view === 'packing'} onClick={() => setView('packing')} />
          <SidebarItem isCollapsed={isCollapsed} icon={Archive} label="Armario & Calendario" isActive={view === 'armario'} onClick={() => setView('armario')} />
          <SidebarItem isCollapsed={isCollapsed} icon={Star} label="Ciudades Favoritas" isActive={view === 'favorites'} onClick={() => setView('favorites')} />
          <SidebarItem isCollapsed={isCollapsed} icon={Activity} label="Feed Comunidad" isActive={view === 'community'} onClick={() => setView('community')} />
          <SidebarItem isCollapsed={isCollapsed} icon={MessageSquare} label="Mix & Match Studio" isActive={view === 'studio'} onClick={() => setView('studio')} />
          
          {!isCollapsed && <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2 pl-2 mt-4">Social</p>}
          <SidebarItem isCollapsed={isCollapsed} icon={User} label="Amigos y Chat" isActive={view === 'friends'} onClick={() => setView('friends')} />
        </div>
      </div>

      {/* ── FIXED FOOTER ── */}
      <div className={`shrink-0 ${isCollapsed ? 'px-4' : 'px-6'} pb-6 pt-2 relative z-10`}>
        {/* Upgrade Banner */}
        {!isPremium && !isCollapsed && (
          <div
            className="mb-4 relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-indigo-500/20 p-4 group cursor-pointer"
            onClick={() => setView('profile')}
          >
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/20 rounded-full filter blur-[30px] group-hover:bg-purple-500/40 transition-colors" />
            <div className="flex items-center gap-2 mb-2 relative z-10">
              <Star size={18} className="text-yellow-400 shrink-0" />
              <h4 className="text-white font-bold text-sm">Upgrade to Premium</h4>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed mb-3 relative z-10">
              IA sin límites y sin anuncios.
            </p>
            <button className="w-full py-2 bg-indigo-500/20 hover:bg-indigo-500/40 border border-indigo-400/30 rounded-lg text-indigo-300 text-xs font-bold transition-colors relative z-10">
              Upgrade
            </button>
          </div>
        )}
        {!isPremium && isCollapsed && (
          <div className="mb-4 flex justify-center">
            <button onClick={() => setView('profile')} className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-indigo-500/20 flex items-center justify-center hover:bg-indigo-900/60 transition-colors" title="Upgrade to Premium">
              <Star size={18} className="text-yellow-400" />
            </button>
          </div>
        )}

        {/* Profile row */}
        <div className={`pt-3 border-t border-white/5 flex items-center ${isCollapsed ? 'flex-col gap-4' : 'justify-between gap-3'}`}>
          <button onClick={() => setView('profile')} className={`flex items-center ${isCollapsed ? 'justify-center p-1' : 'gap-3 hover:bg-white/5 p-2 -ml-2'} rounded-xl transition-colors flex-1 min-w-0`} title={isCollapsed ? "Perfil" : undefined}>
            <div className="w-8 h-8 rounded-full bg-gray-700 overflow-hidden border border-gray-600 shrink-0">
              {Cookies.get('userProfilePicture') ? (
                <img src={Cookies.get('userProfilePicture')} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User size={16} className="text-gray-400 m-auto mt-2" />
              )}
            </div>
            {!isCollapsed && (
              <div className="flex flex-col items-start min-w-0">
                <div className="flex items-center gap-1.5 w-full">
                  <span className="text-sm font-medium text-white truncate">{userName || 'Usuario'}</span>
                  {isPremium && <Star size={10} className="text-yellow-400 shrink-0" />}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-sm ${
                    userLevel === 'Icono de Moda' ? 'bg-yellow-500/20 text-yellow-400' :
                    userLevel === 'Creador de Tendencias' ? 'bg-purple-500/20 text-purple-400' :
                    userLevel === 'Aficionado' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {userLevel}
                  </span>
                  <span className="text-[10px] text-gray-400 font-medium">{userPoints} pts</span>
                </div>
              </div>
            )}
          </button>
          <button onClick={handleLogout} className="p-2 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0" title={isCollapsed ? "Cerrar sesión" : undefined}>
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
