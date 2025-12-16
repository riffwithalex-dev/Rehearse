import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { GlassCard } from '../components/ui/GlassCard';
import { SongCard } from '../components/SongCard';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, Activity, Trophy, Award, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  useDroppable,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

export const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const { songs, projects, todaysScheduleIds, scheduledSongs, addToSchedule } = useData();

   // Drag and drop state
   const [needsWorkSongsOrder, setNeedsWorkSongsOrder] = useState<string[] | null>(null);
   const [projectsOrder, setProjectsOrder] = useState<string[] | null>(null);

   const sensors = useSensors(
     useSensor(PointerSensor),
     useSensor(KeyboardSensor, {
       coordinateGetter: sortableKeyboardCoordinates,
     })
   );

   const { isOver, setNodeRef } = useDroppable({ id: 'schedule-now' });

   const needsWorkSongs = songs.filter(s => s.status === 'In Progress' || (s.lastPlayed && new Date(s.lastPlayed).getTime() < Date.now() - 1000 * 60 * 60 * 24 * 7));
   const scheduledCount = todaysScheduleIds.length;

   // Calculate stats
   const totalSongs = songs.length;
   const completedSongs = songs.filter(s => s.status === 'Performance Ready').length;
   const masteryPercentage = totalSongs > 0 ? Math.round((completedSongs / totalSongs) * 100) : 0;

   // Calculate day streak
   const calculateDayStreak = () => {
     let streak = 0;
     const today = new Date();
     let currentDate = new Date(today);

     while (true) {
       const dateStr = currentDate.toISOString().slice(0, 10);
       const daySchedule = scheduledSongs[dateStr];

       if (!daySchedule || !daySchedule.some(item => item.completed)) {
         break;
       }

       streak++;
       currentDate.setDate(currentDate.getDate() - 1);
     }

     return streak;
   };

   const dayStreak = calculateDayStreak();

   // Calculate accurate project stats from actual songs data
   const getProjectStats = (projectId: string) => {
     const projectSongs = songs.filter(song => song.projectId === projectId);
     const totalSongs = projectSongs.length;
     const completedSongs = projectSongs.filter(song => song.status === 'Performance Ready').length;
     return { totalSongs, completedSongs };
   };

   // Handle drag end events
   const handleDragEnd = (event: DragEndEvent) => {
     const { active, over } = event;

     if (!over) return;

     if (over.id === 'schedule-now' && active.data.current?.type === 'song') {
       addToSchedule(active.id as string);
       return;
     }

     if (active.id !== over.id) {
       if (active.data.current?.type === 'song') {
         setNeedsWorkSongsOrder((items) => {
           const currentItems = items || needsWorkSongs.map(s => s.id);
           const oldIndex = currentItems.indexOf(active.id as string);
           const newIndex = currentItems.indexOf(over.id as string);
           return arrayMove(currentItems, oldIndex, newIndex);
         });
       } else if (active.data.current?.type === 'project') {
         setProjectsOrder((items) => {
           const currentItems = items || projects.map(p => p.id);
           const oldIndex = currentItems.indexOf(active.id as string);
           const newIndex = currentItems.indexOf(over.id as string);
           return arrayMove(currentItems, oldIndex, newIndex);
         });
       }
     }
   };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-10">
      <header className="space-y-1">
        <motion.h1 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl md:text-4xl font-light tracking-tight text-gray-900"
        >
          Good afternoon, <span className="font-medium">Alex</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-gray-500 font-light"
        >
          You have {scheduledCount} songs scheduled for today. <Link to="/schedule" className="text-gray-500 hover:text-gray-700 font-light underline ml-1">View Schedule</Link>
        </motion.p>
      </header>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <GlassCard delay={0.2} className="flex items-center gap-4">
          <div className="p-3 bg-gray-50 rounded-2xl text-gray-900">
            <Activity strokeWidth={1.5} />
          </div>
          <div>
            <div className="text-2xl font-semibold">{dayStreak}</div>
            <div className="text-xs text-gray-400 uppercase tracking-wider font-medium">Day Streak</div>
          </div>
        </GlassCard>
        
        <GlassCard delay={0.3} className="flex items-center gap-4">
          <div className="p-3 bg-gray-50 rounded-2xl text-gray-900">
            <Trophy strokeWidth={1.5} />
          </div>
          <div>
            <div className="text-2xl font-semibold">{masteryPercentage}%</div>
            <div className="text-xs text-gray-400 uppercase tracking-wider font-medium">Mastery</div>
          </div>
        </GlassCard>

        <GlassCard delay={0.4} className="flex items-center gap-4">
            <div className="p-3 bg-gray-50 rounded-2xl text-gray-900">
              <Award strokeWidth={1.5} />
            </div>
            <div>
              <div className="text-2xl font-semibold">{completedSongs}</div>
              <div className="text-xs text-gray-400 uppercase tracking-wider font-medium">Songs Learned</div>
            </div>
          </GlassCard>

        <GlassCard
          delay={0.5}
          ref={setNodeRef}
          className={`flex items-center gap-4 cursor-pointer transition-all ${isOver ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}
        >
          <div className={`p-3 rounded-2xl text-gray-900 transition-colors ${isOver ? 'bg-blue-100' : 'bg-gray-50'}`}>
            <Calendar strokeWidth={1.5} />
          </div>
          <div>
            <div className="text-2xl font-semibold">{scheduledCount}</div>
            <div className="text-xs text-gray-400 uppercase tracking-wider font-medium">Schedule Now</div>
          </div>
        </GlassCard>
      </div>

      {/* Needs Attention Section */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-light text-gray-900">Needs Attention</h2>
          <button className="text-xs font-medium text-gray-400 hover:text-gray-900 flex items-center gap-1 transition-colors">
            View All <ArrowRight size={12} />
          </button>
        </div>
        <SortableContext
          items={needsWorkSongsOrder || needsWorkSongs.map(s => s.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(needsWorkSongsOrder
              ? needsWorkSongsOrder.map(id => needsWorkSongs.find(s => s.id === id)).filter(Boolean)
              : needsWorkSongs
            ).slice(0, 3).map((song, idx) => (
              <SongCard
                key={song!.id}
                song={song!}
                index={idx}
                onClick={(id) => navigate(`/song/${id}`)}
              />
            ))}
            {needsWorkSongs.length === 0 && (
              <div className="col-span-full py-12 text-center text-gray-400 font-light italic bg-white/30 rounded-3xl border border-dashed border-gray-200">
                Nothing needs urgent attention. Great job!
              </div>
            )}
          </div>
        </SortableContext>
      </section>

      {/* Projects Overview */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-light text-gray-900">Active Projects</h2>
        </div>
        <SortableContext
          items={projectsOrder || projects.map(p => p.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(projectsOrder
              ? projectsOrder.map(id => projects.find(p => p.id === id)).filter(Boolean)
              : projects
            ).map((project, idx) => {
              const { totalSongs, completedSongs } = getProjectStats(project!.id);
              return (
                <GlassCard key={project!.id} delay={0.5 + (idx * 0.1)} onClick={() => navigate('/projects')} className="group cursor-pointer">
                   <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-medium group-hover:text-black transition-colors">{project!.name}</h3>
                        <p className="text-sm text-gray-500 font-light mb-4">{project!.bandName}</p>
                      </div>
                      <div className="w-8 h-8 rounded-full border border-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-gray-900 group-hover:text-white transition-all">
                        <ArrowRight size={14} />
                      </div>
                   </div>
                   <div className="space-y-2">
                     <div className="flex justify-between text-xs text-gray-400">
                       <span>Progress</span>
                       <span>{totalSongs > 0 ? Math.round((completedSongs / totalSongs) * 100) : 0}%</span>
                     </div>
                     <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                       <div
                         className="h-full bg-gray-900 rounded-full"
                         style={{ width: `${totalSongs > 0 ? (completedSongs / totalSongs) * 100 : 0}%` }}
                       />
                     </div>
                     <div className="text-xs text-gray-400 pt-2 font-light">
                       {completedSongs} of {totalSongs} songs mastered
                     </div>
                   </div>
                </GlassCard>
              );
            })}
          </div>
        </SortableContext>
      </section>
      </div>
    </DndContext>
  );
};
