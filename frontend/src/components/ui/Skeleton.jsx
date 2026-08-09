import React from 'react';

const Skeleton = ({ className = '', rounded = 'rounded-xl', variant = 'dark', style = {} }) => {
  const isDark = variant === 'dark';
  const baseBg = isDark ? 'bg-white/5 border border-white/5' : 'bg-gray-200';
  const shimmerBg = isDark ? 'via-white/10' : 'via-white/50';

  return (
    <div 
      className={`relative overflow-hidden ${baseBg} ${rounded} ${className}`}
      style={style}
    >
      <div 
        className={`absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent ${shimmerBg} to-transparent animate-[shimmer_1.5s_infinite]`}
      ></div>
    </div>
  );
};

export default Skeleton;
