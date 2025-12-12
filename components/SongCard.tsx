import React from 'react';
import { Song } from '../types';
import { GlassCard } from './ui/GlassCard';
import { PlayCircle, AlertCircle, CheckCircle2, Music2, Clock, GripVertical } from 'lucide-react';

interface SongCardProps {
  song: Song;
  onClick: (id: string) => void;
  index?: number;
  viewMode?: 'grid' | 'list';
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Performance Ready': return 'text-gray-900 bg-gray-100 border-gray-200';
    case 'Needs Work': return 'text-gray-900 bg-gray-100 border-gray-300 ring-1 ring-gray-200';
    case 'In Progress': return 'text-gray-500 bg-white border-gray-200';
    default: return 'text-gray-400 bg-transparent border-gray-100';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'Performance Ready': return <CheckCircle2 size={14} className="mr-1.5" />;
    case 'Needs Work': return <AlertCircle size={14} className="mr-1.5" />;
    default: return <div className="w-1.5 h-1.5 rounded-full bg-current mr-2" />;
  }
};

export const SongCard: React.FC<SongCardProps> = ({ song, onClick, index = 0, viewMode = 'grid' }) => {
  // Calculate total progress
  const totalProgress = Math.round(
    song.components.reduce((acc, curr) => acc + curr.progress, 0) / (song.components.length || 1)
  );

  if (viewMode === 'list') {
    return (
      <GlassCard 
        onClick={() => onClick(song.id)} 
        delay={0} // Disable delay for list reordering performance
        className="group relative overflow-hidden flex items-center gap-4 p-4 hover:shadow-md transition-all active:scale-[0.99]"
      >
        <div className="text-gray-300 cursor-grab active:cursor-grabbing hover:text-gray-500">
          <GripVertical size={20} />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-base font-medium text-gray-900 tracking-tight truncate">
            {song.title}
          </h3>
          <p className="text-xs text-gray-500 font-light truncate">{song.artist}</p>
        </div>

        <div className="hidden md:flex items-center gap-4 flex-1">
             <div className="flex-1 max-w-[120px]">
                <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div 
                    className="h-full bg-gray-900 transition-all duration-1000 ease-out rounded-full"
                    style={{ width: `${totalProgress}%` }}
                    />
                </div>
             </div>
             <div className="text-xs text-gray-400 font-medium w-10 text-right">{totalProgress}%</div>
        </div>

        <div className="hidden sm:flex items-center gap-2">
            <div className={`
            flex items-center px-2 py-1 rounded-full text-[10px] font-medium border whitespace-nowrap
            ${getStatusColor(song.status)}
            `}>
            {getStatusIcon(song.status)}
            {song.status}
            </div>
             <div className="text-[10px] font-medium text-gray-400 px-2 py-0.5 rounded border border-gray-100 bg-white">
              {song.difficulty}
           </div>
        </div>

        {/* Hover Gradient Overlay */}
        <div className="absolute top-0 right-0 w-20 h-full bg-gradient-to-l from-white/50 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
      </GlassCard>
    );
  }

  return (
    <GlassCard onClick={() => onClick(song.id)} delay={index * 0.05} className="group relative overflow-hidden h-full flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-start mb-4">
            <div>
            <h3 className="text-lg font-medium text-gray-900 tracking-tight group-hover:text-black transition-colors">
                {song.title}
            </h3>
            <p className="text-sm text-gray-500 font-light">{song.artist}</p>
            </div>
            <div className={`
            flex items-center px-2.5 py-1 rounded-full text-xs font-medium border
            ${getStatusColor(song.status)}
            `}>
            {getStatusIcon(song.status)}
            {song.status}
            </div>
        </div>

        <div className="space-y-4">
            {/* Progress Bar */}
            <div>
            <div className="flex justify-between text-xs text-gray-400 mb-1.5 font-light">
                <span>Mastery</span>
                <span>{totalProgress}%</span>
            </div>
            <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                <div 
                className="h-full bg-gray-900 transition-all duration-1000 ease-out rounded-full"
                style={{ width: `${totalProgress}%` }}
                />
            </div>
            </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 mt-2 border-t border-gray-100">
           <div className="flex items-center gap-3 text-xs text-gray-400">
              {song.bpm && (
                <div className="flex items-center gap-1">
                   <Music2 size={12} /> {song.bpm} BPM
                </div>
              )}
              {song.lastPlayed && (
                 <div className="flex items-center gap-1">
                    <Clock size={12} /> 
                    {Math.floor((Date.now() - new Date(song.lastPlayed).getTime()) / (1000 * 60 * 60 * 24))}d ago
                 </div>
              )}
           </div>
           
           <div className="text-xs font-medium text-gray-400 px-2 py-0.5 rounded border border-gray-100">
              {song.difficulty}
           </div>
        </div>
      
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-gray-100/50 to-transparent rounded-bl-full -mr-10 -mt-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
    </GlassCard>
  );
};
