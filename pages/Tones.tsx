import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { GlassCard } from '../components/ui/GlassCard';
import { Knob } from '../components/ui/Knob';
import { Plus, Sliders, Zap, Tag, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { TonePreset, EffectPedal } from '../types';
import { generateUUID } from '../lib/uuid';

export const Tones: React.FC = () => {
  const { tonePresets: presets, addTonePreset, updateTonePreset, deleteTonePreset } = useData();
  const [filter, setFilter] = useState('All');
  
  // Create Modal State
  const [isCreating, setIsCreating] = useState(false);
  
  // Form State
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newGuitar, setNewGuitar] = useState('');
  const [newPickup, setNewPickup] = useState('');
  const [newAmp, setNewAmp] = useState({ gain: 5, bass: 5, mid: 5, treble: 5, reverb: 3, volume: 5 });
  const [newEffects, setNewEffects] = useState<EffectPedal[]>([]);
  const [newTags, setNewTags] = useState<string[]>(['Custom']);
  const [isEditing, setIsEditing] = useState(false);
  const [editingPreset, setEditingPreset] = useState<TonePreset | null>(null);
  const [search, setSearch] = useState('');

  const allTags = Array.from(new Set(presets.flatMap(t => (t as any).tags ?? (t as any).style_tags ?? [])));

  const handleEdit = (preset: TonePreset) => {
    setEditingPreset(preset);
    setNewName(preset.name);
    setNewDesc(preset.description || '');
    setNewGuitar(preset.guitarModel);
    setNewPickup(preset.pickupPosition);
    setNewAmp(preset.ampSettings);
    setNewEffects(preset.effects);
    setNewTags(preset.tags);
    setIsEditing(true);
  };

  const resetForm = () => {
    setNewName('');
    setNewDesc('');
    setNewGuitar('');
    setNewPickup('');
    setNewAmp({ gain: 5, bass: 5, mid: 5, treble: 5, reverb: 3, volume: 5 });
    setNewEffects([]);
    setNewTags(['Custom']);
    setEditingPreset(null);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const preset: TonePreset = {
      id: isEditing && editingPreset ? editingPreset.id : generateUUID(),
      name: newName,
      description: newDesc,
      guitarModel: newGuitar,
      pickupPosition: newPickup,
      ampSettings: newAmp,
      effects: newEffects,
      tags: newTags,
    };
    if (isEditing && editingPreset) {
      updateTonePreset(editingPreset.id, preset);
      setIsEditing(false);
    } else {
      addTonePreset(preset);
      setIsCreating(false);
    }
    resetForm();
  };

  return (
    <div className="space-y-8 relative">
      <AnimatePresence>
        {(isCreating || isEditing) && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gray-900/20 backdrop-blur-sm"
              onClick={() => { if (isCreating) setIsCreating(false); else if (isEditing) setIsEditing(false); }}
            />
            <motion.div
               initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
               className="w-full max-w-2xl z-10"
            >
               <GlassCard className="max-h-[80vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-light text-gray-900">{isEditing ? 'Edit Tone Preset' : 'New Tone Preset'}</h3>
                    <button onClick={() => { if (isCreating) setIsCreating(false); else if (isEditing) setIsEditing(false); }} className="text-gray-400 hover:text-gray-900"><X size={20} /></button>
                  </div>
                  <form onSubmit={handleCreate} className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Preset Name</label>
                      <input 
                        required
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="e.g. Crunchy Rhythm"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gray-900 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
                      <input 
                        value={newDesc}
                        onChange={(e) => setNewDesc(e.target.value)}
                        placeholder="Brief description of the sound..."
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gray-900 transition-colors"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Guitar Model</label>
                        <input 
                          value={newGuitar}
                          onChange={(e) => setNewGuitar(e.target.value)}
                          placeholder="e.g. Stratocaster"
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gray-900 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Pickup Position</label>
                        <input 
                          value={newPickup}
                          onChange={(e) => setNewPickup(e.target.value)}
                          placeholder="e.g. Bridge"
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gray-900 transition-colors"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-2">Amp Settings</label>
                      <div className="grid grid-cols-3 gap-4 bg-gray-50 p-4 rounded-xl">
                        <div className="flex flex-col items-center">
                          <Knob label="Gain" value={newAmp.gain} onChange={v => setNewAmp({...newAmp, gain: v})} />
                          <input type="range" min="0" max="10" value={newAmp.gain} onChange={e => setNewAmp({...newAmp, gain: +e.target.value})} className="w-full mt-2 accent-gray-900" />
                        </div>
                        <div className="flex flex-col items-center">
                          <Knob label="Bass" value={newAmp.bass} onChange={v => setNewAmp({...newAmp, bass: v})} />
                          <input type="range" min="0" max="10" value={newAmp.bass} onChange={e => setNewAmp({...newAmp, bass: +e.target.value})} className="w-full mt-2 accent-gray-900" />
                        </div>
                        <div className="flex flex-col items-center">
                          <Knob label="Mid" value={newAmp.mid} onChange={v => setNewAmp({...newAmp, mid: v})} />
                          <input type="range" min="0" max="10" value={newAmp.mid} onChange={e => setNewAmp({...newAmp, mid: +e.target.value})} className="w-full mt-2 accent-gray-900" />
                        </div>
                        <div className="flex flex-col items-center">
                          <Knob label="Treb" value={newAmp.treble} onChange={v => setNewAmp({...newAmp, treble: v})} />
                          <input type="range" min="0" max="10" value={newAmp.treble} onChange={e => setNewAmp({...newAmp, treble: +e.target.value})} className="w-full mt-2 accent-gray-900" />
                        </div>
                        <div className="flex flex-col items-center">
                          <Knob label="Rev" value={newAmp.reverb} onChange={v => setNewAmp({...newAmp, reverb: v})} />
                          <input type="range" min="0" max="10" value={newAmp.reverb} onChange={e => setNewAmp({...newAmp, reverb: +e.target.value})} className="w-full mt-2 accent-gray-900" />
                        </div>
                        <div className="flex flex-col items-center">
                          <Knob label="Vol" value={newAmp.volume} onChange={v => setNewAmp({...newAmp, volume: v})} />
                          <input type="range" min="0" max="10" value={newAmp.volume} onChange={e => setNewAmp({...newAmp, volume: +e.target.value})} className="w-full mt-2 accent-gray-900" />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-2">Effects</label>
                      <div className="space-y-3">
                        {newEffects.map((effect, idx) => (
                          <div key={idx} className="border border-gray-200 rounded p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <label className="text-xs text-gray-500 w-12">Name:</label>
                              <input value={effect.name} onChange={e => {
                                const newEff = [...newEffects];
                                newEff[idx].name = e.target.value;
                                setNewEffects(newEff);
                              }} className="flex-1 bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm" />
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                              <label className="text-xs text-gray-500 w-12">Type:</label>
                              <input value={effect.type} onChange={e => {
                                const newEff = [...newEffects];
                                newEff[idx].type = e.target.value;
                                setNewEffects(newEff);
                              }} className="flex-1 bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm" />
                            </div>
                            <div className="flex items-center gap-2">
                              <label className="text-xs text-gray-500 w-12">On:</label>
                              <input type="checkbox" checked={effect.isOn} onChange={e => {
                                const newEff = [...newEffects];
                                newEff[idx].isOn = e.target.checked;
                                setNewEffects(newEff);
                              }} />
                              <button onClick={() => setNewEffects(newEffects.filter((_, i) => i !== idx))} className="ml-auto p-1 bg-red-100 text-red-600 rounded hover:bg-red-200"><X size={14} /></button>
                            </div>
                          </div>
                        ))}
                        <button onClick={() => setNewEffects([...newEffects, { id: generateUUID(), name: '', type: '', isOn: true }])} className="text-xs text-gray-500 border border-gray-200 rounded px-3 py-1">Add Effect</button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Tags (comma separated)</label>
                      <input value={newTags.join(', ')} onChange={e => setNewTags(e.target.value.split(',').map(s => s.trim()).filter(s => s))} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gray-900 transition-colors" />
                    </div>
                    <button type="submit" className="w-full bg-gray-900 text-white py-3 rounded-xl font-medium hover:bg-black transition-colors">
                      {isEditing ? 'Update Preset' : 'Create Preset'}
                    </button>
                  </form>
               </GlassCard>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-light tracking-tight text-gray-900 mb-2">Tone Library</h1>
          <p className="text-gray-500 font-light max-w-md">Collection of amp settings, pedal chains, and guitar configurations.</p>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="bg-gray-900 text-white hover:bg-black transition-colors px-5 py-2.5 rounded-full text-sm font-medium flex items-center gap-2 shadow-lg shadow-gray-200"
        >
          <Plus size={16} /> New Preset
        </button>
      </header>

      <div className="flex gap-4 mb-4">
        <input
          type="text"
          placeholder="Search presets..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-gray-900 transition-colors"
        />
      </div>

      {/* Filter Chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
         <button 
           onClick={() => setFilter('All')}
           className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-colors ${filter === 'All' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}
         >
           All
         </button>
         {allTags.map(tag => (
           <button 
             key={tag}
             onClick={() => setFilter(tag)}
             className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-colors ${filter === tag ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}
           >
             {tag}
           </button>
         ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {presets.filter(t => {
          const tags = (t as any).tags ?? (t as any).style_tags ?? [];
          const matchesFilter = filter === 'All' || tags.includes(filter);
          const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase()) || (t.description || '').toLowerCase().includes(search.toLowerCase());
          return matchesFilter && matchesSearch;
        }).map((preset, idx) => {
          const amp = (preset as any).ampSettings ?? (preset as any).amp_settings ?? { gain: 5, bass: 5, mid: 5, treble: 5, reverb: 3, volume: 5 };
          const effects = (preset as any).effects ?? (preset as any).effects_chain ?? [];
          const tags = (preset as any).tags ?? (preset as any).style_tags ?? [];
          return (
          <GlassCard key={preset.id} delay={idx * 0.1} className="group">
             <div className="flex justify-between items-start mb-6">
                <div>
                   <h3 className="text-lg font-medium text-gray-900 group-hover:text-black transition-colors">{preset.name}</h3>
                   <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                      <span>{preset.guitarModel}</span>
                      {preset.pickupPosition && (
                        <>
                          <span className="w-1 h-1 bg-gray-300 rounded-full" />
                          <span>{preset.pickupPosition}</span>
                        </>
                      )}
                   </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(preset)} className="p-2 bg-gray-50 rounded-xl text-gray-400 hover:text-gray-900 transition-colors">
                    <Sliders size={16} />
                  </button>
                  <button onClick={() => deleteTonePreset(preset.id)} className="p-2 bg-gray-50 rounded-xl text-red-400 hover:text-red-900 transition-colors">
                    <X size={16} />
                  </button>
                </div>
             </div>

             {/* Amp Settings */}
             <div className="bg-white/50 rounded-2xl p-4 mb-6 border border-gray-100/50">
                <div className="flex justify-between items-end gap-2">
                   <Knob label="Gain" value={amp.gain} />
                   <Knob label="Bass" value={amp.bass} />
                   <Knob label="Mid" value={amp.mid} />
                   <Knob label="Treb" value={amp.treble} />
                   <Knob label="Rev" value={amp.reverb} />
                   <Knob label="Vol" value={amp.volume} />
                </div>
             </div>
               {/* Pedal Chain */}
               {effects.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-medium text-gray-400 uppercase tracking-wider">
                    <Zap size={12} /> Signal Chain
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {effects.map((effect: any) => (
                      <div 
                        key={effect.id || effect.name}
                        className={`
                         px-3 py-2 rounded-lg text-xs font-medium border flex items-center gap-2
                         ${effect.isOn 
                          ? 'bg-gray-900 text-white border-gray-900' 
                          : 'bg-white text-gray-400 border-gray-200 line-through decoration-gray-300'}
                        `}
                      >
                        {effect.name}
                      </div>
                    ))}
                  </div>
                </div>
               )}
             
             {/* Tags footer */}
             <div className="mt-6 pt-4 border-t border-gray-100 flex gap-2">
                 {tags.map((tag: string) => (
                   <span key={tag} className="text-[10px] text-gray-500 bg-gray-100 px-2 py-1 rounded">#{tag}</span>
                 ))}
             </div>
             </GlassCard>
             );
            })}

        {/* Add New Card Placeholder */}
        <GlassCard 
          onClick={() => setIsCreating(true)}
          className="flex flex-col items-center justify-center min-h-[300px] border-dashed border-2 border-gray-200 bg-transparent hover:bg-gray-50 hover:border-gray-300 group cursor-pointer transition-colors"
        >
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-white group-hover:shadow-md transition-all mb-4">
              <Plus size={24} />
            </div>
            <span className="text-base font-medium text-gray-400 group-hover:text-gray-600">Create Custom Preset</span>
        </GlassCard>
      </div>
    </div>
  );
};
