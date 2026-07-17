import React, { useEffect } from 'react';

const VerticalAd = ({ className = "" }) => {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error("AdSense error", e);
    }
  }, []);

  return (
    <div className={`hidden xl:flex w-[200px] bg-gray-900 border border-gray-800 rounded-xl overflow-hidden flex-col items-center justify-center relative p-4 ${className}`}>
      <span className="absolute top-2 left-2 text-[10px] text-gray-500 uppercase tracking-widest">Publicidad</span>
      <div className="w-full h-full flex flex-col items-center justify-center opacity-30 text-center">
        <div className="w-12 h-12 border-2 border-dashed border-gray-600 rounded flex items-center justify-center mb-2">
          <span className="text-gray-500 font-bold text-xs">AD</span>
        </div>
        <p className="text-xs text-gray-500 font-medium">Espacio para anuncio (Skyscraper)</p>
      </div>
      
      {/* Real AdSense Slot */}
      <div className="absolute inset-0 z-10 p-2 pt-8">
        <ins className="adsbygoogle"
             style={{ display: 'block', width: '100%', height: '100%' }}
             data-ad-client="ca-pub-7031196086140700"
             data-ad-slot="4164504071"
             data-ad-format="vertical"
             data-full-width-responsive="true"></ins>
      </div>
    </div>
  );
};

export default VerticalAd;
