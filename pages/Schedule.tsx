import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { GlassCard } from '../components/ui/GlassCard';
import { Calendar, ChevronLeft, ChevronRight, Check, Plus, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const Schedule: React.FC = () => {
  const today = new Date();
  const { songs, todaysScheduleIds, addToSchedule } = useData();
  
  // Local State for modal
  const [isScheduling, setIsScheduling] = useState(false);
  const [selectedSongId, setSelectedSongId] = useState('');

  // Derived state
  const sessionSongs = songs.filter(s => todaysScheduleIds.includes(s.id));
  const availableSongs = songs.filter(s => !todaysScheduleIds.includes(s.id));

  const handleAddSong = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSongId) {
      addToSchedule(selectedSongId);
    }
    setIsScheduling(false);
    setSelectedSongId('');
  };

  return (
    <div className="space-y-8 relative">
       {/* Schedule Modal */}
       <AnimatePresence>
        {isScheduling && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gray-900/20 backdrop-blur-sm"
              onClick={() => setIsScheduling(false)}
            />
            <motion.div
               initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
               className="w-full max-w-md z-10"
            >
               <GlassCard>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-light text-gray-900">Schedule Practice</h3>
                    <button onClick={() => setIsScheduling(false)} className="text-gray-400 hover:text-gray-900"><X size={20} /></button>
                  </div>
                  <form onSubmit={handleAddSong} className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Select Song</label>
                      <select 
                        required
                        value={selectedSongId}
                        onChange={(e) => setSelectedSongId(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gray-900 transition-colors appearance-none"
                      >
                        <option value="" disabled>Select a song...</option>
                        {availableSongs.map(s => (
                          <option key={s.id} value={s.id}>{s.title} - {s.artist}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                       <label className="block text-xs font-medium text-gray-500 mb-1">Focus Area</label>
                       <input 
                         placeholder="e.g. Solo speed, Intro timing..."
                         className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gray-900 transition-colors"
                       />
                    </div>
                    <button type="submit" disabled={!selectedSongId} className="w-full bg-gray-900 text-white py-3 rounded-xl font-medium hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                      Add to Schedule
                    </button>
                  </form>
               </GlassCard>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <header className="flex justify-between items-center">
        <h1 className="text-3xl font-light tracking-tight text-gray-900">Practice Schedule</h1>
        <div className="flex items-center gap-4">
           <button className="p-2 hover:bg-white rounded-full transition-colors"><ChevronLeft size={20} /></button>
           <span className="text-lg font-medium">October 2023</span>
           <button className="p-2 hover:bg-white rounded-full transition-colors"><ChevronRight size={20} /></button>
        </div>
      </header>

      {/* Calendar Strip */}
      <div className="grid grid-cols-7 gap-4">
        {Array.from({ length: 7 }).map((_, i) => {
           const d = new Date();
           d.setDate(today.getDate() - today.getDay() + i);
           const isToday = d.getDate() === today.getDate();
           
           return (
             <GlassCard 
                key={i} 
                className={`flex flex-col items-center justify-center py-6 gap-2 ${isToday ? 'ring-2 ring-gray-900 bg-white/90' : ''}`}
             >
                <span className="text-xs font-medium text-gray-400 uppercase tracking-widest">{DAYS[i]}</span>
                <span className={`text-2xl font-light ${isToday ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                  {d.getDate()}
                </span>
                {/* Dot indicators for tasks */}
                <div className="flex gap-1 mt-1">
                   {i % 2 === 0 && <div className="w-1 h-1 rounded-full bg-gray-900" />}
                   {i % 3 === 0 && <div className="w-1 h-1 rounded-full bg-gray-400" />}
                </div>
             </GlassCard>
           )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-light text-gray-900 mb-2">Today's Session</h2>
            
            {sessionSongs.length > 0 ? (
              sessionSongs.map((song, i) => (
                <GlassCard key={song.id} delay={0.2 + (i * 0.1)} className="flex items-center justify-between group">
                   <div className="flex items-center gap-4">
                      <button className="w-6 h-6 rounded-full border border-gray-300 text-transparent hover:border-gray-900 hover:text-gray-900 flex items-center justify-center transition-all">
                         <Check size={14} />
                      </button>
                      <div>
                         <h3 className="text-gray-900 font-medium">{song.title}</h3>
                         <p className="text-sm text-gray-500 font-light">20 mins • Focus on {song.components[0]?.name || 'General'}</p>
                      </div>
                   </div>
                   <div className="px-3 py-1 bg-gray-50 rounded-lg text-xs font-medium text-gray-500 border border-gray-100">
                      {song.difficulty}
                   </div>
                </GlassCard>
              ))
            ) : (
              <div className="py-12 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-3xl">
                 <p className="mb-4">No songs scheduled for today.</p>
              </div>
            )}

            <button 
              onClick={() => setIsScheduling(true)}
              className="w-full py-4 border-2 border-dashed border-gray-200 rounded-3xl text-gray-400 hover:text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-all font-medium text-sm"
            >
               + Schedule another song
            </button>
         </div>

         <div>
           <GlassCard className="h-full bg-gray-900 text-white border-none">
              <div className="flex items-center gap-3 mb-6">
                 <div className="p-2 bg-white/10 rounded-lg">
                    <Calendar size={20} />
                 </div>
                 <h3 className="font-medium">Streak</h3>
              </div>
              
              <div className="text-5xl font-light mb-2">12</div>
              <p className="text-gray-400 text-sm mb-8">days in a row. Keep it up!</p>
              
              <div className="h-32 flex items-end justify-between gap-2">
                 {[40, 70, 50, 90, 60, 80, 100].map((h, i) => (
                    <div key={i} className="w-full bg-white/20 rounded-t-sm relative group">
                       <div 
                         className="absolute bottom-0 w-full bg-white rounded-t-sm transition-all duration-500"
                         style={{ height: `${h}%` }}
                       />
                    </div>
                 ))}
              </div>
              <p className="text-center text-xs text-gray-500 mt-4">Last 7 days activity</p>
           </GlassCard>
         </div>
      </div>
    </div>
  );
};
