import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Sparkles, Shirt, Layers, Save, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import Skeleton from './ui/Skeleton';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function EstudioEstiloView({ token }) {
  const [prendas, setPrendas] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [tops, setTops] = useState([]);
  const [bottoms, setBottoms] = useState([]);
  const [calzado, setCalzado] = useState([]);
  
  const [topIndex, setTopIndex] = useState(0);
  const [bottomIndex, setBottomIndex] = useState(0);
  const [calzadoIndex, setCalzadoIndex] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const fetchArmario = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/armario`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (isMounted) {
          const items = res.data;
          setPrendas(items);
          setTops(items.filter(p => p.categoria.toUpperCase().includes('TOP') || p.categoria.toUpperCase().includes('CAMISA') || p.categoria.toUpperCase().includes('CHAQUETA') || p.categoria.toUpperCase().includes('ABRIGO') || p.categoria.toUpperCase().includes('SUDADERA')));
          setBottoms(items.filter(p => p.categoria.toUpperCase().includes('BOTTOM') || p.categoria.toUpperCase().includes('PANTALON') || p.categoria.toUpperCase().includes('SHORT')));
          setCalzado(items.filter(p => p.categoria.toUpperCase().includes('CALZADO') || p.categoria.toUpperCase().includes('ZAPATO') || p.categoria.toUpperCase().includes('SNEAKER')));
          setLoading(false);
        }
      } catch (err) {
        console.error("Error fetching armario", err);
        if (isMounted) setLoading(false);
      }
    };
    fetchArmario();
    return () => { isMounted = false; };
  }, [token]);

  const nextItem = (setter, items, currentIndex) => setter((currentIndex + 1) % items.length);
  const prevItem = (setter, items, currentIndex) => setter((currentIndex - 1 + items.length) % items.length);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 space-y-8">
        <Skeleton className="h-10 w-64 mx-auto mb-10" rounded="rounded-xl" variant="dark" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Skeleton className="h-72 w-full" rounded="rounded-3xl" variant="dark" />
          <Skeleton className="h-72 w-full" rounded="rounded-3xl" variant="dark" />
        </div>
      </div>
    );
  }

  if (tops.length === 0 && bottoms.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center">
        <Sparkles size={48} className="text-amber-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Estudio de Estilo</h2>
        <p className="text-gray-400">Necesitas añadir prendas a tu armario (Tops y Bottoms) para usar el Estudio de Estilo.</p>
      </div>
    );
  }

  const renderCarousel = (items, index, setIndex, title, icon) => {
    if (items.length === 0) return (
      <div className="flex flex-col items-center justify-center h-48 bg-white/5 border border-white/10 rounded-2xl w-full max-w-[280px] mx-auto">
        <p className="text-gray-500 text-sm">No hay {title.toLowerCase()} en tu armario</p>
      </div>
    );

    const item = items[index];

    return (
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-bold text-gray-300 flex items-center gap-2 mb-2 uppercase tracking-widest pl-2 justify-center">
          {icon} {title}
        </h3>
        <div className="relative group w-full max-w-[280px] mx-auto aspect-[3/4] bg-white/5 border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex items-center justify-center">
          {item.imageUrl ? (
            <img src={item.imageUrl} alt={item.descripcion} className="w-full h-full object-cover" />
          ) : (
            <div className="text-center p-4">
              <Shirt size={40} className="mx-auto text-gray-600 mb-2" />
              <p className="text-xs text-gray-400">{item.descripcion}</p>
            </div>
          )}
          
          <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/90 to-transparent">
            <p className="text-white font-bold text-sm truncate">{item.descripcion}</p>
            {item.color && <p className="text-xs text-gray-400">{item.color}</p>}
          </div>

          <div className="absolute inset-y-0 left-0 flex items-center">
            <button onClick={() => prevItem(setIndex, items, index)} className="p-2 m-2 rounded-full bg-black/50 text-white backdrop-blur border border-white/10 hover:bg-black/80 transition-colors">
              <ChevronLeft size={20} />
            </button>
          </div>
          <div className="absolute inset-y-0 right-0 flex items-center">
            <button onClick={() => nextItem(setIndex, items, index)} className="p-2 m-2 rounded-full bg-black/50 text-white backdrop-blur border border-white/10 hover:bg-black/80 transition-colors">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 lg:px-8 pb-[120px] lg:pb-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-white mb-3">Mix & Match Studio</h1>
        <p className="text-gray-400 max-w-lg mx-auto">Combina tus prendas de forma visual para planificar tus outfits de la semana.</p>
      </motion.div>

      <div className="flex flex-col md:flex-row items-center justify-center gap-6 lg:gap-12">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="w-full md:w-auto">
          {renderCarousel(tops, topIndex, setTopIndex, 'TOP', <Shirt size={16} className="text-amber-400" />)}
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="w-full md:w-auto">
          {renderCarousel(bottoms, bottomIndex, setBottomIndex, 'BOTTOM', <Layers size={16} className="text-indigo-400" />)}
        </motion.div>
      </div>
      
      <div className="mt-12 flex justify-center pb-12">
        <button className="px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl text-white font-bold shadow-lg shadow-amber-500/25 hover:scale-105 transition-transform flex items-center gap-3">
          <Save size={20} /> Guardar Combinación
        </button>
      </div>
    </div>
  );
}
