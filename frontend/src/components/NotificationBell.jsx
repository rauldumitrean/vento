import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell } from 'lucide-react';
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
    
    const interval = setInterval(fetchNotifications, 15000); // Polling every 15 seconds
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
        className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-gray-300 transition-colors relative"
      >
        <Bell size={18} className={unreadCount > 0 ? "animate-pulse text-amber-400" : ""} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-[#1a1c23] flex items-center justify-center text-[9px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {showDropdown && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-12 right-0 md:left-0 md:right-auto w-72 bg-[#1a1c23] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50"
          >
            <div className="p-3 border-b border-white/10 bg-white/5 flex justify-between items-center">
              <h4 className="text-sm font-bold text-white">Notificaciones</h4>
            </div>
            <div className="max-h-80 overflow-y-auto hide-scrollbar">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-sm text-gray-400">
                  No tienes notificaciones nuevas
                </div>
              ) : (
                notifications.map(notif => (
                  <div key={notif.id} className={`p-4 border-b border-white/5 transition-colors ${!notif.isRead ? 'bg-indigo-500/10' : 'hover:bg-white/5'}`}>
                    <p className="text-xs text-gray-300 leading-relaxed mb-1">{notif.content}</p>
                    <span className="text-[10px] text-gray-500">{new Date(notif.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
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
