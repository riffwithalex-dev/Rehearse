import React from 'react';

interface KnobProps {
  value: number; // 0-10
  label: string;
  size?: number;
}

export const Knob: React.FC<KnobProps> = ({ value, label, size = 48 }) => {
  // Map 0-10 to -135deg to 135deg
  const rotation = (value / 10) * 270 - 135;
  
  return (
    <div className="flex flex-col items-center gap-2">
      <div 
        className="relative rounded-full border border-gray-200 bg-gray-50 flex items-center justify-center shadow-inner"
        style={{ width: size, height: size }}
      >
        {/* Indicator */}
        <div 
          className="absolute w-1 h-1/2 bg-transparent top-0 left-1/2 -ml-0.5 origin-bottom transition-transform duration-500 ease-out"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
            <div className="w-1.5 h-1.5 bg-gray-900 rounded-full mx-auto -mt-0.5" />
        </div>
        
        {/* Center screw */}
        <div className="w-1/3 h-1/3 rounded-full border border-gray-200 bg-gray-100" />
      </div>
      <div className="text-center">
         <div className="text-[10px] uppercase font-bold tracking-widest text-gray-400">{label}</div>
         <div className="text-xs font-medium text-gray-900">{value}</div>
      </div>
    </div>
  );
};
