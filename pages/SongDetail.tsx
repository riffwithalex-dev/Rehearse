import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { GlassCard } from '../components/ui/GlassCard';
import { Knob } from '../components/ui/Knob';
import { ArrowLeft, Play, ExternalLink, MoreHorizontal, Video, Mic2, Sliders, Zap, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const SongDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { songs, updateSong, tonePresets } = useData();
  
  const song = songs.find(s => s.id === id);
  
  const [activeTab, setActiveTab] = useState<'progress' | 'tone'>('progress');
  const [isSelectingPreset, setIsSelectingPreset] = useState(false);

  if (!song) return <div className="p-8 text-center text-gray-500">Song not found</div>;

  const tonePreset = tonePresets.find(t => t.id === song.tonePresetId);

  const handleUpdateProgress = (componentId: string, newProgress: number) => {
    const updatedComponents = song.components.map(c => 
      c.id === componentId ? { ...c, progress: newProgress } : c
    );
    updateSong(song.id, { components: updatedComponents });
  };

  const handleSelectPreset = (presetId: string) => {
    updateSong(song.id, { tonePresetId: presetId });
    setIsSelectingPreset(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 relative">
      {/* Preset Selection Modal */}
      <AnimatePresence>
        {isSelectingPreset && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gray-900/20 backdrop-blur-sm"
              onClick={() => setIsSelectingPreset(false)}
            />
            <motion.div
               initial={{ opacity: 0, scale: 0.95, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: 20 }}
               className="w-full max-w-md z-10"
            >
               <GlassCard className="flex flex-col max-h-[80vh]">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                       <h3 className="text-xl font-light text-gray-900">Select Tone Preset</h3>
                       <p className="text-xs text-gray-500 mt-1">Choose a gear configuration for this song</p>
                    </div>
                    <button 
                      onClick={() => setIsSelectingPreset(false)} 
                      className="text-gray-400 hover:text-gray-900 p-2 hover:bg-gray-50 rounded-full transition-colors"
                    >
                       <X size={20} />
                    </button>
                  </div>
                  
                  <div className="space-y-3 overflow-y-auto pr-2 -mr-2 pb-2 custom-scrollbar">
                    {tonePresets.map(preset => {
                       const isSelected = song.tonePresetId === preset.id;
                       return (
                         <button 
                            key={preset.id}
                            onClick={() => handleSelectPreset(preset.id)}
                            className={`
                              w-full text-left p-4 rounded-xl border transition-all group relative
                              ${isSelected 
                                ? 'bg-gray-900 text-white border-gray-900 shadow-lg shadow-gray-200' 
                                : 'bg-white text-gray-900 border-gray-100 hover:border-gray-300 hover:bg-gray-50'}
                            `}
                         >
                            <div className="flex justify-between items-start mb-2">
                                <span className="font-medium">{preset.name}</span>
                                {isSelected && <Check size={16} />}
                            </div>
                            <div className={`text-xs ${isSelected ? 'text-gray-300' : 'text-gray-500'} mb-2 line-clamp-1`}>
                               {preset.description}
                            </div>
                            <div className="flex flex-wrap gap-1">
                               {preset.tags.slice(0, 3).map(tag => (
                                  <span 
                                    key={tag} 
                                    className={`text-[10px] px-1.5 py-0.5 rounded ${
                                       isSelected ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-500'
                                    }`}
                                  >
                                    #{tag}
                                  </span>
                               ))}
                            </div>
                         </button>
                       );
                    })}
                  </div>
               </GlassCard>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigate(-1)} 
          className="p-2 rounded-full hover:bg-white/50 text-gray-500 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
           <h1 className="text-3xl font-light text-gray-900 tracking-tight">{song.title}</h1>
           <p className="text-gray-500 text-lg font-light">{song.artist}</p>
        </div>
        <div className="flex gap-2">
           <button className="p-3 bg-gray-900 text-white rounded-full shadow-lg hover:bg-black transition-transform active:scale-95">
             <Play size={20} fill="currentColor" />
           </button>
           <button className="p-3 bg-white text-gray-900 border border-gray-200 rounded-full hover:bg-gray-50 transition-colors">
             <MoreHorizontal size={20} />
           </button>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-gray-200 mb-6">
         <button 
            onClick={() => setActiveTab('progress')}
            className={`pb-3 px-1 mr-6 text-sm font-medium transition-all relative ${activeTab === 'progress' ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
         >
            Progress
            {activeTab === 'progress' && <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 w-full h-0.5 bg-gray-900" />}
         </button>
         <button 
            onClick={() => setActiveTab('tone')}
            className={`pb-3 px-1 mr-6 text-sm font-medium transition-all relative ${activeTab === 'tone' ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
         >
            Gear & Tone
            {activeTab === 'tone' && <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 w-full h-0.5 bg-gray-900" />}
         </button>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col: Main Content (Swappable) */}
        <div className="lg:col-span-2 space-y-6">
           
           {activeTab === 'progress' && (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
               {song.components.map((component, idx) => (
                 <GlassCard key={component.id} delay={idx * 0.1} className="p-6">
                   <div className="flex justify-between items-center mb-4">
                     <div className="flex items-center gap-3">
                       <span className="w-8 h-8 rounded-full bg-gray-50 text-gray-500 flex items-center justify-center text-xs font-medium border border-gray-100">
                          {component.type[0]}
                       </span>
                       <span className="font-medium text-gray-900">{component.name}</span>
                     </div>
                     <span className="text-sm font-medium text-gray-500">{component.progress}%</span>
                   </div>
                   
                   {/* Interactive Slider / Progress Steps */}
                   <div className="relative h-12 flex items-center justify-between px-1">
                      {/* Background Line */}
                      <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-gray-100 -z-10" />
                      
                      {[0, 25, 50, 75, 100].map((step) => (
                        <button
                          key={step}
                          onClick={() => handleUpdateProgress(component.id, step)}
                          className={`
                            w-4 h-4 rounded-full border-2 transition-all duration-300 z-10
                            ${component.progress >= step 
                              ? 'border-gray-900 bg-gray-900 scale-125' 
                              : 'border-gray-300 bg-white hover:border-gray-400'}
                          `}
                        />
                      ))}
                   </div>
                 </GlassCard>
               ))}
             </motion.div>
           )}

           {activeTab === 'tone' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                 {tonePreset ? (
                   <GlassCard className="p-6">
                      <div className="flex justify-between items-start mb-6">
                         <div>
                            <div className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-1">Active Preset</div>
                            <h2 className="text-xl font-medium text-gray-900">{tonePreset.name}</h2>
                            <p className="text-gray-500 text-sm mt-1">{tonePreset.description}</p>
                         </div>
                         <button 
                           onClick={() => setIsSelectingPreset(true)}
                           className="text-xs border border-gray-200 rounded px-3 py-1.5 hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-all font-medium"
                         >
                           Change
                         </button>
                      </div>

                      <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100">
                         <div className="flex items-center gap-2 mb-4 text-xs font-medium text-gray-400 uppercase tracking-widest">
                            <Sliders size={12} /> Amp Settings
                         </div>
                         <div className="flex justify-between items-end gap-1">
                           <Knob label="Gain" value={tonePreset.ampSettings.gain} size={40} />
                           <Knob label="Bass" value={tonePreset.ampSettings.bass} size={40} />
                           <Knob label="Mid" value={tonePreset.ampSettings.mid} size={40} />
                           <Knob label="Treb" value={tonePreset.ampSettings.treble} size={40} />
                           <Knob label="Rev" value={tonePreset.ampSettings.reverb} size={40} />
                           <Knob label="Vol" value={tonePreset.ampSettings.volume} size={40} />
                         </div>
                      </div>

                      <div className="space-y-3">
                         <div className="flex items-center gap-2 text-xs font-medium text-gray-400 uppercase tracking-wider">
                             <Zap size={12} /> Signal Chain
                         </div>
                         <div className="flex flex-col gap-2">
                             {tonePreset.effects.map(effect => (
                                <div key={effect.id} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg">
                                   <div className="flex items-center gap-3">
                                      <div className={`w-2 h-2 rounded-full ${effect.isOn ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-gray-300'}`} />
                                      <span className={`font-medium ${effect.isOn ? 'text-gray-900' : 'text-gray-400 line-through'}`}>{effect.name}</span>
                                   </div>
                                   <span className="text-xs text-gray-400">{effect.type}</span>
                                </div>
                             ))}
                         </div>
                      </div>
                   </GlassCard>
                 ) : (
                   <GlassCard className="flex flex-col items-center justify-center py-12 border-dashed border-2 border-gray-200">
                      <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 mb-4">
                         <Sliders size={20} />
                      </div>
                      <h3 className="text-gray-900 font-medium mb-1">No Tone Preset Selected</h3>
                      <p className="text-gray-400 text-sm mb-4">Link a specific guitar tone to this song</p>
                      <button 
                        onClick={() => setIsSelectingPreset(true)}
                        className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm hover:bg-black transition-colors"
                      >
                         Select from Library
                      </button>
                   </GlassCard>
                 )}
                 
                 <div className="grid grid-cols-2 gap-4">
                    <GlassCard className="p-4">
                       <span className="text-xs text-gray-400 uppercase tracking-wider block mb-2">Guitar</span>
                       <span className="font-medium text-gray-900 block">{tonePreset?.guitarModel || 'Not specified'}</span>
                    </GlassCard>
                    <GlassCard className="p-4">
                       <span className="text-xs text-gray-400 uppercase tracking-wider block mb-2">Pickup</span>
                       <span className="font-medium text-gray-900 block">{tonePreset?.pickupPosition || 'Not specified'}</span>
                    </GlassCard>
                 </div>
              </motion.div>
           )}
        </div>

        {/* Right Col: Metadata & Resources (Sticky) */}
        <div className="space-y-6">
           {/* Details Card */}
           <GlassCard>
              <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wide mb-4">Details</h3>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between py-2 border-b border-gray-50">
                   <span className="text-gray-500">Difficulty</span>
                   <span className="font-medium">{song.difficulty}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-50">
                   <span className="text-gray-500">BPM</span>
                   <span className="font-medium">{song.bpm || '-'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-50">
                   <span className="text-gray-500">Key</span>
                   <span className="font-medium">Gm</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-50">
                   <span className="text-gray-500">Status</span>
                   <span className={`px-2 py-0.5 rounded text-xs ${
                     song.status === 'Performance Ready' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'
                   }`}>{song.status}</span>
                </div>
              </div>
           </GlassCard>

           {/* Resources Card */}
           <GlassCard>
              <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wide mb-4">Resources</h3>
              <div className="space-y-3">
                 <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors group border border-transparent hover:border-gray-100">
                    <div className="flex items-center gap-3">
                       <div className="p-2 bg-gray-100 text-gray-600 rounded-lg group-hover:bg-white group-hover:shadow-sm transition-all">
                          <ExternalLink size={16} />
                       </div>
                       <span className="text-sm font-medium text-gray-700">Guitar Tabs</span>
                    </div>
                    <ArrowLeft size={14} className="rotate-180 text-gray-300 group-hover:text-gray-900 transition-colors" />
                 </button>

                 <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors group border border-transparent hover:border-gray-100">
                    <div className="flex items-center gap-3">
                       <div className="p-2 bg-gray-100 text-gray-600 rounded-lg group-hover:bg-white group-hover:shadow-sm transition-all">
                          <Mic2 size={16} />
                       </div>
                       <span className="text-sm font-medium text-gray-700">Backing Track</span>
                    </div>
                    <ArrowLeft size={14} className="rotate-180 text-gray-300 group-hover:text-gray-900 transition-colors" />
                 </button>

                 <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors group border border-transparent hover:border-gray-100">
                    <div className="flex items-center gap-3">
                       <div className="p-2 bg-gray-100 text-gray-600 rounded-lg group-hover:bg-white group-hover:shadow-sm transition-all">
                          <Video size={16} />
                       </div>
                       <span className="text-sm font-medium text-gray-700">Practice Log</span>
                    </div>
                    <span className="text-xs text-gray-400">3 videos</span>
                 </button>
              </div>
           </GlassCard>
        </div>
      </div>
    </div>
  );
};
