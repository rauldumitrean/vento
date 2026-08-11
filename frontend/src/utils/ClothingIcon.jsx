import React from 'react';
import { Shirt } from 'lucide-react';

export const ClothingIcon = ({ tipo, size = 20, className = "" }) => {
  const t = (tipo || '').toLowerCase();
  
  if (t.includes('pantal')) return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M6 3h12l1 18-4-1-3-10-3 10-4 1 1-18z"/>
    </svg>
  );
  
  if (t.includes('zapat') || t.includes('zapa') || t.includes('bot') || t.includes('snaker') || t.includes('deportiva')) return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M4 16h16M4 16l2-4h12l2 4M8 12V8a4 4 0 0 1 8 0v4"/>
    </svg>
  );
  
  if (t.includes('chaquet') || t.includes('abrig') || t.includes('sudadera') || t.includes('jerse') || t.includes('cazadora')) return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.47a1 1 0 00.99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.47a2 2 0 00-1.34-2.23z"/>
      <path d="M12 2v20"/>
    </svg>
  );
  
  if (t.includes('gorra') || t.includes('sombrero') || t.includes('gorro')) return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 2a8 8 0 0 0-8 8v1h16v-1a8 8 0 0 0-8-8z"/><path d="M4 11h16v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2z"/>
    </svg>
  );

  if (t.includes('gafas') || t.includes('lentes') || t.includes('lentes de sol')) return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="6" cy="15" r="4"/><circle cx="18" cy="15" r="4"/><path d="M14 15a2 2 0 0 0-4 0"/><path d="M2 15l2-3 4-2"/><path d="M22 15l-2-3-4-2"/>
    </svg>
  );

  if (t.includes('bufanda') || t.includes('pañuelo')) return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 8h16v4a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V8z"/><path d="M8 16v6"/><path d="M16 16v4"/>
    </svg>
  );
  
  if (t.includes('bols') || t.includes('mochila')) return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>
  );

  return <Shirt size={size} className={className} />;
};

export default ClothingIcon;
