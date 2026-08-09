import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCircle2, Clock } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function NotificationBell({ token }) {
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!token) return;
    const fetchNotifications = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/notifications`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setNotifications(res.data);
      } catch (err) {
        console.error("Error fetching notifications:", err);
      }
    };
    fetchNotifications();
    
    const interval = setInterval(fetchNotifications, 30000); // Polling every 30s
    return () => clearInterval(interval);
  }, [token]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAsRead = async () => {
    if (unreadCount === 0) return;
    try {
      await axios.put(`${API_URL}/api/notifications/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch(e) {}
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => { setShowDropdown(!showDropdown); if(!showDropdown) handleMarkAsRead(); }}
        className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-300 relative shadow-sm ${showDropdown ? 'bg-indigo-500 text-white shadow-indigo-500/30' : 'bg-white/10 hover:bg-white/20 text-gray-200 border border-white/5'}`}
      >
        <Bell size={20} className={unreadCount > 0 ? "animate-pulse" : ""} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-red-500 to-pink-500 rounded-full border-2 border-[#1a1c23] flex items-center justify-center text-[10px] font-black text-white shadow-lg shadow-red-500/40">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {showDropdown && (
          <motion.div 
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="absolute top-[calc(100%+12px)] right-0 md:left-0 md:right-auto w-80 bg-black/60 backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden z-[100]"
          >
            {/* Glossy top highlight */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none h-24" />
            
            <div className="p-5 border-b border-white/10 bg-black/20 flex justify-between items-center relative z-10">
              <h4 className="text-base font-black text-white tracking-wide">Notificaciones</h4>
              {unreadCount > 0 && (
                <span className="px-2.5 py-1 bg-white/20 text-white rounded-lg text-xs font-bold backdrop-blur-md">
                  {unreadCount} nuevas
                </span>
              )}
            </div>
            
            <div className="max-h-[350px] overflow-y-auto relative z-10 bg-transparent">
              {notifications.length === 0 ? (
                <div className="p-8 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 mb-4 rounded-full bg-white/5 flex items-center justify-center">
                    <CheckCircle2 size={32} className="text-gray-500/50" />
                  </div>
                  <p className="text-sm font-medium text-gray-400">Todo al día</p>
                  <p className="text-xs text-gray-500 mt-1">No tienes notificaciones nuevas.</p>
                </div>
              ) : (
                notifications.map(notif => (
                  <div 
                    key={notif.id} 
                    className={`p-4 border-b border-white/5 transition-all duration-200 group flex gap-3 ${!notif.isRead ? 'bg-indigo-500/15 hover:bg-indigo-500/25' : 'hover:bg-white/5'}`}
                  >
                    <div className="shrink-0 pt-0.5">
                      <div className={`w-2 h-2 rounded-full mt-1.5 ${!notif.isRead ? 'bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]' : 'bg-transparent'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-snug mb-1.5 ${!notif.isRead ? 'text-white font-medium' : 'text-gray-300'} break-words whitespace-pre-wrap`}>
                        {notif.content}
                      </p>
                      <div className="flex items-center gap-1.5 text-[11px] text-gray-500 font-medium">
                        <Clock size={10} />
                        {new Date(notif.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
