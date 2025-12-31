import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { GlassCard } from '../components/ui/GlassCard';
import { SongCard } from '../components/SongCard';
import { useNavigate } from 'react-router-dom';
import { generateUUID } from '../lib/uuid';
import { Plus, LayoutGrid, List, X, Trash2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Project, Song, Difficulty, SongStatus } from '../types';

export const Projects: React.FC = () => {
  const navigate = useNavigate();
  const { projects, songs: allSongs, addProject, removeProject, addSong, removeSong } = useData();
  
  const [activeProject, setActiveProject] = useState(projects[0]?.id || '');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Drag and drop state for list view - separate order for each project
  const [songOrders, setSongOrders] = useState<{ [projectId: string]: string[] }>({});

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // Modal States
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [isCreatingSong, setIsCreatingSong] = useState(false);

  // Form States
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectBand, setNewProjectBand] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');

  const [newSongTitle, setNewSongTitle] = useState('');
  const [newSongArtist, setNewSongArtist] = useState('');
  const [newSongDifficulty, setNewSongDifficulty] = useState<Difficulty>('Intermediate');
  const [newSongStatus, setNewSongStatus] = useState<SongStatus>('Not Started');

  // Filter songs for active project
  const songs = allSongs.filter(s => s.projectId === activeProject);
  const currentProject = projects.find(p => p.id === activeProject);

  // If no active project is selected but projects exist, select the first one
  if (!activeProject && projects.length > 0) {
    setActiveProject(projects[0].id);
  }

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    const newProject: Project = {
      id: generateUUID(),
      name: newProjectName,
      bandName: newProjectBand,
      description: newProjectDesc,
      songCount: 0,
      completedCount: 0,
    };
    addProject(newProject);
    setActiveProject(newProject.id);
    setIsCreatingProject(false);
    // Reset form
    setNewProjectName('');
    setNewProjectBand('');
    setNewProjectDesc('');
  };

  const handleCreateSong = (e: React.FormEvent) => {
    e.preventDefault();
    const newSong: Song = {
      id: generateUUID(),
      projectId: activeProject,
      title: newSongTitle,
      artist: newSongArtist,
      difficulty: newSongDifficulty,
      status: newSongStatus,
      components: [
        { id: generateUUID(), name: 'Intro', type: 'Intro', progress: 0 },
        { id: generateUUID(), name: 'Verse', type: 'Verse', progress: 0 },
        { id: generateUUID(), name: 'Chorus', type: 'Chorus', progress: 0 },
      ], // Default components
      lastPlayed: undefined,
    };
    addSong(newSong);
    setIsCreatingSong(false);
    // Reset form
    setNewSongTitle('');
    setNewSongArtist('');
    setNewSongDifficulty('Intermediate');
    setNewSongStatus('Not Started');
  };

  // Get current project's song order
  const getCurrentSongOrder = () => {
    return songOrders[activeProject] || null;
  };

  // Handle drag end events for song reordering
  const handleSongDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    if (active.id !== over.id) {
      setSongOrders((prev) => {
        const currentOrder = prev[activeProject] || songs.map(s => s.id);
        const oldIndex = currentOrder.indexOf(active.id as string);
        const newIndex = currentOrder.indexOf(over.id as string);
        const newOrder = arrayMove(currentOrder, oldIndex, newIndex);
        return {
          ...prev,
          [activeProject]: newOrder
        };
      });
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleSongDragEnd}
    >
      <div className="space-y-8 h-full relative">
      {/* Create Project Modal */}
      <AnimatePresence>
        {isCreatingProject && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gray-900/20 backdrop-blur-sm"
              onClick={() => setIsCreatingProject(false)}
            />
            <motion.div
               initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
               className="w-full max-w-md z-10"
            >
               <GlassCard>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-light text-gray-900">New Project</h3>
                    <button onClick={() => setIsCreatingProject(false)} className="text-gray-400 hover:text-gray-900"><X size={20} /></button>
                  </div>
                  <form onSubmit={handleCreateProject} className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Project Name</label>
                      <input 
                        required
                        value={newProjectName}
                        onChange={(e) => setNewProjectName(e.target.value)}
                        placeholder="e.g. Summer Tour 2024"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gray-900 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Band / Artist Name</label>
                      <input 
                        required
                        value={newProjectBand}
                        onChange={(e) => setNewProjectBand(e.target.value)}
                        placeholder="e.g. The Beatles Tribute"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gray-900 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
                      <textarea 
                        value={newProjectDesc}
                        onChange={(e) => setNewProjectDesc(e.target.value)}
                        placeholder="Goals, deadlines, or notes..."
                        rows={3}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gray-900 transition-colors resize-none"
                      />
                    </div>
                    <button type="submit" className="w-full bg-gray-900 text-white py-3 rounded-xl font-medium hover:bg-black transition-colors">
                      Create Project
                    </button>
                  </form>
               </GlassCard>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create Song Modal */}
      <AnimatePresence>
        {isCreatingSong && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gray-900/20 backdrop-blur-sm"
              onClick={() => setIsCreatingSong(false)}
            />
            <motion.div
               initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
               className="w-full max-w-md z-10"
            >
               <GlassCard>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-light text-gray-900">Add Song</h3>
                    <button onClick={() => setIsCreatingSong(false)} className="text-gray-400 hover:text-gray-900"><X size={20} /></button>
                  </div>
                  <form onSubmit={handleCreateSong} className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Title</label>
                      <input 
                        required
                        value={newSongTitle}
                        onChange={(e) => setNewSongTitle(e.target.value)}
                        placeholder="e.g. Bohemian Rhapsody"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gray-900 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Original Artist</label>
                      <input 
                        required
                        value={newSongArtist}
                        onChange={(e) => setNewSongArtist(e.target.value)}
                        placeholder="e.g. Queen"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gray-900 transition-colors"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Difficulty</label>
                        <select 
                          value={newSongDifficulty}
                          onChange={(e) => setNewSongDifficulty(e.target.value as Difficulty)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gray-900 transition-colors appearance-none"
                        >
                          <option value="Beginner">Beginner</option>
                          <option value="Intermediate">Intermediate</option>
                          <option value="Advanced">Advanced</option>
                          <option value="Expert">Expert</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                        <select 
                          value={newSongStatus}
                          onChange={(e) => setNewSongStatus(e.target.value as SongStatus)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gray-900 transition-colors appearance-none"
                        >
                          <option value="Not Started">Not Started</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Performance Ready">Performance Ready</option>
                        </select>
                      </div>
                    </div>
                    <button type="submit" className="w-full bg-gray-900 text-white py-3 rounded-xl font-medium hover:bg-black transition-colors">
                      Add to Project
                    </button>
                  </form>
               </GlassCard>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-light tracking-tight text-gray-900 mb-2">Projects</h1>
          <p className="text-gray-500 font-light max-w-md">Manage your setlists and track repertoire progress for each band.</p>
        </div>
        <div className="flex gap-3">
          <div className="flex bg-gray-100 p-1 rounded-full">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-full transition-all ${viewMode === 'grid' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
               <LayoutGrid size={18} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-full transition-all ${viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
               <List size={18} />
            </button>
          </div>
          <button 
            onClick={() => setIsCreatingProject(true)}
            className="bg-gray-900 text-white hover:bg-black transition-colors px-5 py-2.5 rounded-full text-sm font-medium flex items-center gap-2 shadow-lg shadow-gray-200"
          >
            <Plus size={16} /> New Project
          </button>
        </div>
      </header>

      {/* Project Tabs */}
      <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
        {projects.map((project) => (
          <button
            key={project.id}
            onClick={() => setActiveProject(project.id)}
            className={`
              whitespace-nowrap px-6 py-3 rounded-2xl text-sm font-medium transition-all duration-300
              ${activeProject === project.id
                ? 'bg-white text-gray-900 shadow-md shadow-gray-100 ring-1 ring-gray-100'
                : 'bg-transparent text-gray-400 hover:bg-white/50 hover:text-gray-600'}
            `}
          >
            {project.name}
          </button>
        ))}
      </div>

      {currentProject && (
        <div className="space-y-6">
           <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                 <span className="font-medium text-gray-900">{songs.length}</span> songs in repertoire
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to delete the project "${currentProject.name}"? This will also delete all songs in this project.`)) {
                      removeProject(currentProject.id);
                    }
                  }}
                  className="text-sm font-medium text-red-600 hover:text-red-700 flex items-center gap-1"
                >
                  <Trash2 size={14} />
                  Delete Project
                </button>
                <button
                  onClick={() => setIsCreatingSong(true)}
                  className="text-sm font-medium text-gray-900 hover:text-gray-600 underline decoration-gray-300 underline-offset-4"
                >
                  Add Song
                </button>
              </div>
           </div>

           {songs.length === 0 && (
             <div className="py-12 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-3xl">
               <p className="mb-4">No songs in this project yet.</p>
               <button 
                  onClick={() => setIsCreatingSong(true)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg text-sm transition-colors"
                >
                  Add First Song
                </button>
             </div>
           )}

           {viewMode === 'grid' ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {songs.map((song, idx) => (
                 <SongCard
                  key={song.id}
                  song={song}
                  index={idx}
                  viewMode="grid"
                  onClick={(id) => navigate(`/song/${id}`)}
                  onDelete={removeSong}
                 />
               ))}
               
               {/* Add New Song Card */}
               <GlassCard 
                 onClick={() => setIsCreatingSong(true)}
                 className="flex flex-col items-center justify-center min-h-[200px] border-dashed border-2 border-gray-200 bg-transparent hover:bg-gray-50 hover:border-gray-300 group cursor-pointer"
               >
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-white group-hover:shadow-md transition-all mb-3">
                    <Plus size={20} />
                  </div>
                  <span className="text-sm font-medium text-gray-400 group-hover:text-gray-600">Add New Song</span>
               </GlassCard>
             </div>
           ) : (
             <SortableContext
               items={getCurrentSongOrder() || songs.map(s => s.id)}
               strategy={verticalListSortingStrategy}
             >
               <div className="space-y-3">
                 {(getCurrentSongOrder()
                   ? getCurrentSongOrder()!.map(id => songs.find(s => s.id === id)).filter(Boolean)
                   : songs
                 ).map((song) => (
                   <SongCard
                     key={song!.id}
                     song={song!}
                     viewMode="list"
                     onClick={(id) => navigate(`/song/${id}`)}
                     onDelete={removeSong}
                   />
                 ))}
                 <div className="pt-2">
                   <button
                     onClick={() => setIsCreatingSong(true)}
                     className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 hover:text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-all font-medium text-sm flex items-center justify-center gap-2"
                   >
                      <Plus size={16} /> Add New Song
                   </button>
                 </div>
               </div>
             </SortableContext>
           )}
       </div>
     )}
     </div>
   </DndContext>
 );
};
