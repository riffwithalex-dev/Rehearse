import React from 'react';
import { motion } from 'framer-motion';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  delay?: number;
}

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(({ children, className = '', onClick, delay = 0 }, ref) => {
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: delay, ease: "easeOut" }}
      onClick={onClick}
      className={`
        bg-white/60
        backdrop-blur-xl
        border border-white/40
        shadow-[0_8px_30px_rgb(0,0,0,0.04)]
        rounded-3xl
        p-6
        transition-all
        duration-300
        hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]
        hover:bg-white/80
        ${onClick ? 'cursor-pointer hover:-translate-y-1' : ''}
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
});
