import React from 'react';
import { motion } from 'framer-motion';
import { Cloud, Search, Activity, User, LogOut, Star, MessageSquare, Archive, Settings, LayoutDashboard } from 'lucide-react';
import Cookies from 'js-cookie';

const SidebarItem = ({ icon: Icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium ${
      isActive 
        ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 shadow-lg shadow-indigo-900/20' 
        : 'text-gray-400 hover:text-white hover:bg-white/5'
    }`}
  >
    <Icon size={18} className={isActive ? 'text-indigo-400' : 'opacity-70'} />
    <span className="text-sm">{label}</span>
  </button>
);

const Sidebar = ({ view, setView, handleLogout, userName, isPremium, onNewConsulta }) => {
  return (
    <div className="hidden lg:flex flex-col w-[280px] h-full bg-black/40 border border-white/10 rounded-[2rem] p-6 shadow-2xl relative overflow-hidden shrink-0 z-20">
      {/* Decorative top glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-indigo-500/20 rounded-full mix-blend-screen filter blur-[50px] pointer-events-none" />

      {/* Header */}
      <a href="/" className="flex items-center gap-3 mb-10 relative z-10 cursor-pointer hover:opacity-80 transition-opacity">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 border border-white/20">
          <Cloud size={20} className="text-white" />
        </div>
        <span className="text-xl font-bold tracking-widest text-white">Ventoo</span>
      </a>

      {/* Create New Action */}
      <button 
        onClick={() => onNewConsulta ? onNewConsulta() : setView('dashboard')}
        className="w-full mb-8 flex items-center gap-3 px-4 py-3.5 bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl text-white font-medium transition-all duration-300 shadow-md group relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-indigo-500/10 to-purple-500/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
        <MessageSquare size={18} className="text-indigo-400 group-hover:scale-110 transition-transform" />
        <span className="text-sm">Nueva Consulta</span>
      </button>

      {/* Navigation */}
      <div className="flex flex-col gap-2 flex-1 relative z-10">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2 pl-2">Features</p>
        <SidebarItem icon={LayoutDashboard} label="Dashboard" isActive={view === 'dashboard'} onClick={() => setView('dashboard')} />
        <SidebarItem icon={Cloud} label="Asistente de Maleta" isActive={view === 'packing'} onClick={() => setView('packing')} />
        <SidebarItem icon={Archive} label="Mi Armario (Fotos)" isActive={view === 'armario'} onClick={() => setView('armario')} />
        <SidebarItem icon={Star} label="Ciudades Favoritas" isActive={view === 'favorites'} onClick={() => setView('favorites')} />
        <SidebarItem icon={Activity} label="Feed Comunidad" isActive={view === 'community'} onClick={() => setView('community')} />
      </div>

      {/* Upgrade Banner (if not premium) */}
      {!isPremium && (
        <div className="mt-auto mb-6 relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-indigo-500/20 p-5 group cursor-pointer" onClick={() => setView('profile')}>
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/20 rounded-full filter blur-[30px] group-hover:bg-purple-500/40 transition-colors" />
          <Star size={24} className="text-yellow-400 mb-3 relative z-10" />
          <h4 className="text-white font-bold text-sm mb-1 relative z-10">Upgrade to Premium</h4>
          <p className="text-xs text-gray-400 leading-relaxed mb-4 relative z-10">
            Mejora tu estilo con la IA sin límites y sin anuncios.
          </p>
          <button className="w-full py-2 bg-indigo-500/20 hover:bg-indigo-500/40 border border-indigo-400/30 rounded-lg text-indigo-300 text-xs font-bold transition-colors relative z-10">
            Upgrade
          </button>
        </div>
      )}

      {/* Footer / Profile */}
      <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between gap-3 relative z-10">
        <button onClick={() => setView('profile')} className="flex items-center gap-3 hover:bg-white/5 p-2 -ml-2 rounded-xl transition-colors flex-1">
          <div className="w-8 h-8 rounded-full bg-gray-700 overflow-hidden border border-gray-600 shrink-0">
            {Cookies.get('userProfilePicture') ? (
              <img src={Cookies.get('userProfilePicture')} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User size={16} className="text-gray-400 m-auto mt-2" />
            )}
          </div>
          <div className="flex flex-col items-start min-w-0">
            <span className="text-sm font-medium text-white truncate w-full">{userName || 'Usuario'}</span>
            <span className="text-[10px] text-gray-500 font-bold uppercase">{isPremium ? 'Premium' : 'Free Plan'}</span>
          </div>
        </button>
        <button onClick={handleLogout} className="p-2 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0">
          <LogOut size={16} />
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
