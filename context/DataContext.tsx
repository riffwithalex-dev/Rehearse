import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Project, Song, TonePreset } from '../types';
import { MOCK_PROJECTS, MOCK_SONGS, MOCK_TONE_PRESETS } from '../constants';

interface DataContextType {
  projects: Project[];
  songs: Song[];
  tonePresets: TonePreset[];
  todaysScheduleIds: string[];
  addProject: (project: Project) => void;
  addSong: (song: Song) => void;
  addTonePreset: (preset: TonePreset) => void;
  updateSong: (id: string, updates: Partial<Song>) => void;
  addToSchedule: (songId: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);
  const [songs, setSongs] = useState<Song[]>(MOCK_SONGS);
  const [tonePresets, setTonePresets] = useState<TonePreset[]>(MOCK_TONE_PRESETS);
  // Initialize schedule with first 3 mock songs
  const [todaysScheduleIds, setTodaysScheduleIds] = useState<string[]>(MOCK_SONGS.slice(0, 3).map(s => s.id));

  const addProject = (project: Project) => {
    setProjects(prev => [...prev, project]);
  };

  const addSong = (song: Song) => {
    setSongs(prev => [...prev, song]);
    // Update the project's song count
    setProjects(prev => prev.map(p => 
      p.id === song.projectId ? { ...p, songCount: p.songCount + 1 } : p
    ));
  };

  const addTonePreset = (preset: TonePreset) => {
    setTonePresets(prev => [...prev, preset]);
  };

  const updateSong = (id: string, updates: Partial<Song>) => {
    setSongs(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const addToSchedule = (songId: string) => {
    if (!todaysScheduleIds.includes(songId)) {
      setTodaysScheduleIds(prev => [...prev, songId]);
    }
  };

  return (
    <DataContext.Provider value={{
      projects,
      songs,
      tonePresets,
      todaysScheduleIds,
      addProject,
      addSong,
      addTonePreset,
      updateSong,
      addToSchedule
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
