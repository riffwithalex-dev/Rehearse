import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { GlassCard } from '../components/ui/GlassCard';
import { Calendar, ChevronLeft, ChevronRight, Check, Plus, X, Trash2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const Schedule: React.FC = () => {
   const today = new Date();
   const { songs, scheduledSongs, addToScheduleForDate, removeFromSchedule, updateScheduleItem } = useData();

   // Local State
   const [selectedDate, setSelectedDate] = useState(new Date());
   const [currentMonth, setCurrentMonth] = useState(new Date());
   const [isScheduling, setIsScheduling] = useState(false);
   const [selectedSongId, setSelectedSongId] = useState('');
   const [focusArea, setFocusArea] = useState('');

   // Derived state
   const selectedDateStr = selectedDate.toISOString().slice(0, 10);
   const sessionItems = scheduledSongs[selectedDateStr] || [];
   const sessionSongs = sessionItems.map(si => ({ ...songs.find(s => s.id === si.songId)!, ...si })).filter(s => s.id);
   const availableSongs = songs.filter(s => !sessionItems.find(si => si.songId === s.id));

  const handlePrevMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleAddSong = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSongId) {
      addToScheduleForDate(selectedSongId, selectedDateStr, focusArea);
    }
    setIsScheduling(false);
    setSelectedSongId('');
    setFocusArea('');
  };

  const handleRemoveSong = (songId: string) => {
    removeFromSchedule(songId, selectedDateStr);
  };

  const handleToggleCompleted = (songId: string, completed: boolean) => {
    updateScheduleItem(songId, selectedDateStr, { completed });
  };

  const handleUpdateNotes = (songId: string, notes: string) => {
    updateScheduleItem(songId, selectedDateStr, { notes });
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
                         value={focusArea}
                         onChange={e => setFocusArea(e.target.value)}
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
           <button onClick={handlePrevMonth} className="p-2 hover:bg-white rounded-full transition-colors"><ChevronLeft size={20} /></button>
           <span className="text-lg font-medium">{currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
           <button onClick={handleNextMonth} className="p-2 hover:bg-white rounded-full transition-colors"><ChevronRight size={20} /></button>
        </div>
      </header>

      {/* Calendar */}
      <div className="grid grid-cols-7 gap-2">
        {DAYS.map(day => (
          <div key={day} className="text-center text-xs font-medium text-gray-400 uppercase tracking-widest py-2">
            {day}
          </div>
        ))}
        {(() => {
          const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
          const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
          const days = [];
          for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="py-4"></div>);
          }
          for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
            const dateStr = date.toISOString().slice(0, 10);
            const isToday = date.toDateString() === today.toDateString();
            const isSelected = date.toDateString() === selectedDate.toDateString();
            const hasSchedule = scheduledSongs[dateStr] && scheduledSongs[dateStr].length > 0;
            days.push(
              <GlassCard
                key={day}
                className={`flex flex-col items-center justify-center py-4 gap-1 cursor-pointer transition-all ${
                  isSelected ? 'ring-2 ring-gray-900 bg-white/90' : isToday ? 'ring-1 ring-gray-400' : ''
                }`}
                onClick={() => setSelectedDate(date)}
              >
                <span className={`text-lg font-light ${isToday || isSelected ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                  {day}
                </span>
                {hasSchedule && (
                  <div className="flex gap-1">
                    {scheduledSongs[dateStr].slice(0, 3).map((_, idx) => (
                      <div key={idx} className="w-1 h-1 rounded-full bg-gray-900"></div>
                    ))}
                    {scheduledSongs[dateStr].length > 3 && <span className="text-xs text-gray-400">+{scheduledSongs[dateStr].length - 3}</span>}
                  </div>
                )}
              </GlassCard>
            );
          }
          return days;
        })()}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-light text-gray-900 mb-2">
              {selectedDate.toDateString() === today.toDateString() ? "Today's Session" : `Session for ${selectedDate.toLocaleDateString()}`}
            </h2>

            {sessionSongs.length > 0 ? (
              sessionSongs.map((song, i) => (
                <GlassCard key={song.songId} delay={0.2 + (i * 0.1)} className="p-4">
                   <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-4">
                         <button
                           onClick={() => handleToggleCompleted(song.songId, !song.completed)}
                           className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                             song.completed ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-300 hover:border-gray-900'
                           }`}
                         >
                            {song.completed && <Check size={14} />}
                         </button>
                         <div>
                            <h3 className={`font-medium ${song.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>{song.title}</h3>
                            <p className="text-sm text-gray-500 font-light">Focus: {song.notes || 'General'}</p>
                         </div>
                      </div>
                      <div className="flex items-center gap-2">
                         <div className="px-3 py-1 bg-gray-50 rounded-lg text-xs font-medium text-gray-500 border border-gray-100">
                            {song.difficulty}
                         </div>
                         <button
                           onClick={() => handleRemoveSong(song.songId)}
                           className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                         >
                            <Trash2 size={16} />
                         </button>
                      </div>
                   </div>
                   <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-500">Notes:</label>
                      <input
                        value={song.notes}
                        onChange={e => handleUpdateNotes(song.songId, e.target.value)}
                        placeholder="Add notes..."
                        className="flex-1 bg-gray-50 border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:border-gray-900"
                      />
                   </div>
                </GlassCard>
              ))
            ) : (
              <div className="py-12 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-3xl">
                 <p className="mb-4">No songs scheduled for this date.</p>
              </div>
            )}

            <button
              onClick={() => setIsScheduling(true)}
              className="w-full py-4 border-2 border-dashed border-gray-200 rounded-3xl text-gray-400 hover:text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-all font-medium text-sm"
            >
               + Schedule a song
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
