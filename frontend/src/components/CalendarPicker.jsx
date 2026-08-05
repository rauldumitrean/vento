import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

export default function CalendarPicker({ value, onChange, minDate, maxDate, placeholder, label }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date(value || minDate || Date.now()));
  const pickerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  // Adjust so Monday is 0, Sunday is 6
  const startingDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const dayNames = ["L", "M", "X", "J", "V", "S", "D"];

  const generateDays = () => {
    const days = [];
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i));
    }
    return days;
  };

  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));

  const handleSelectDate = (date) => {
    if (!date) return;
    
    // Normalize times to midnight for comparison
    const compareDate = new Date(date);
    compareDate.setHours(0,0,0,0);
    
    let isSelectable = true;
    if (minDate) {
      const min = new Date(minDate);
      min.setHours(0,0,0,0);
      if (compareDate < min) isSelectable = false;
    }
    if (maxDate) {
      const max = new Date(maxDate);
      max.setHours(0,0,0,0);
      if (compareDate > max) isSelectable = false;
    }

    if (isSelectable) {
      // Format as YYYY-MM-DD local time
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      onChange(`${year}-${month}-${day}`);
      setIsOpen(false);
    }
  };

  const isSelected = (date) => {
    if (!date || !value) return false;
    const [y, m, d] = value.split('-');
    return date.getFullYear() === parseInt(y) && date.getMonth() === parseInt(m) - 1 && date.getDate() === parseInt(d);
  };

  const isSelectable = (date) => {
    if (!date) return false;
    const compareDate = new Date(date);
    compareDate.setHours(0,0,0,0);
    
    if (minDate) {
      const min = new Date(minDate);
      min.setHours(0,0,0,0);
      if (compareDate < min) return false;
    }
    if (maxDate) {
      const max = new Date(maxDate);
      max.setHours(0,0,0,0);
      if (compareDate > max) return false;
    }
    return true;
  };

  // Format display value as DD/MM/YYYY
  const displayValue = value ? (() => {
    const [y, m, d] = value.split('-');
    return `${d}/${m}/${y}`;
  })() : '';

  return (
    <div className="relative" ref={pickerRef}>
      <label className="block text-sm font-medium text-gray-300 mb-2">
        <CalendarIcon size={14} className="inline mr-1.5 text-amber-400" />
        {label}
      </label>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white cursor-pointer hover:bg-white/10 transition-colors flex items-center justify-between"
      >
        <span className={value ? "text-white" : "text-gray-500"}>
          {displayValue || placeholder}
        </span>
        <CalendarIcon size={16} className="text-gray-400" />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute z-50 w-72 mt-2 p-4 bg-[#1a1c23] border border-white/10 rounded-2xl shadow-2xl"
          >
            <div className="flex justify-between items-center mb-4">
              <button type="button" onClick={prevMonth} className="p-1 hover:bg-white/10 rounded-lg text-gray-400 transition-colors">
                <ChevronLeft size={18} />
              </button>
              <div className="font-bold text-white text-sm">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </div>
              <button type="button" onClick={nextMonth} className="p-1 hover:bg-white/10 rounded-lg text-gray-400 transition-colors">
                <ChevronRight size={18} />
              </button>
            </div>
            
            <div className="grid grid-cols-7 gap-1 mb-2">
              {dayNames.map(day => (
                <div key={day} className="text-center text-xs font-bold text-gray-500 py-1">
                  {day}
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-1">
              {generateDays().map((date, i) => {
                const selectable = isSelectable(date);
                const selected = isSelected(date);
                return (
                  <div 
                    key={i} 
                    onClick={() => handleSelectDate(date)}
                    className={`
                      flex items-center justify-center w-8 h-8 rounded-full text-sm transition-colors
                      ${!date ? '' : 'cursor-pointer'}
                      ${!date ? 'bg-transparent' : 
                        selected ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white font-bold shadow-lg shadow-amber-500/30' : 
                        !selectable ? 'text-gray-600 cursor-not-allowed opacity-50' : 
                        'text-gray-300 hover:bg-white/10'}
                    `}
                  >
                    {date ? date.getDate() : ''}
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
