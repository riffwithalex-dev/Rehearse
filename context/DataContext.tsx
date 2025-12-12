import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Project, Song, TonePreset } from '../types';
import { MOCK_PROJECTS, MOCK_SONGS, MOCK_TONE_PRESETS } from '../constants';
import { hasSupabase, getSupabase } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';

// Normalization functions: convert snake_case DB rows to camelCase app types
function normalizeSong(row: any): Song {
  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    artist: row.artist,
    difficulty: row.difficulty,
    status: row.status,
    components: row.components ?? [],
    lastPlayed: row.last_played_at ? new Date(row.last_played_at) : undefined,
    duration: row.duration,
    bpm: row.tempo,
    tabUrl: row.tab_url,
    tonePresetId: row.tone_preset_id,
    album: row.album,
    key: row.key,
  };
}

function normalizeProject(row: any): Project {
  return {
    id: row.id,
    name: row.name,
    bandName: row.band_name,
    description: row.description,
    songCount: row.song_count ?? 0,
    completedCount: row.completed_count ?? 0,
  };
}

function normalizeTonePreset(row: any): TonePreset {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    guitarModel: row.guitar_model,
    pickupPosition: row.pickup_position,
    ampSettings: row.amp_settings ?? { gain: 0, bass: 0, mid: 0, treble: 0, reverb: 0, volume: 0 },
    effects: row.effects_chain ?? [],
    tags: row.style_tags ?? [],
  };
}

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
  dbError?: string | null;
  clearDbError: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);
  const [songs, setSongs] = useState<Song[]>(MOCK_SONGS);
  const [tonePresets, setTonePresets] = useState<TonePreset[]>(MOCK_TONE_PRESETS);
  // Initialize schedule with first 3 mock songs
  const [todaysScheduleIds, setTodaysScheduleIds] = useState<string[]>(MOCK_SONGS.slice(0, 3).map(s => s.id));
  const [dbError, setDbError] = useState<string | null>(null);

  // If Supabase env vars are present, load data from Supabase and use it as the source of truth.
  useEffect(() => {
    if (!hasSupabase()) return;
    const supabase = getSupabase();

    async function load() {
      try {
        const { data: pData, error: pErr } = await supabase.from('projects').select('*');
        if (pErr) throw pErr;
        if (pData) setProjects(pData.map(normalizeProject));

        const { data: sData, error: sErr } = await supabase.from('songs').select('*');
        if (sErr) throw sErr;
        if (sData) {
          // Load components for each song
          const songsWithComponents = await Promise.all(
            sData.map(async (song: any) => {
              const { data: compData, error: compErr } = await supabase
                .from('song_components')
                .select('*')
                .eq('song_id', song.id);
              return normalizeSong({ ...song, components: compErr ? [] : (compData || []) });
            })
          );
          setSongs(songsWithComponents);
        }

        const { data: tData, error: tErr } = await supabase.from('tone_presets').select('*');
        if (tErr) throw tErr;
        if (tData) setTonePresets(tData.map(normalizeTonePreset));
      } catch (e) {
        // keep mock fallback
        // store error for UI
        // eslint-disable-next-line no-console
        console.error('Error loading data from Supabase:', e);
        setDbError((e as any)?.message ? String((e as any).message) : 'Error loading data from Supabase');
      }
    }

    load();
  }, []);

  const addProject = (project: Project) => {
    setProjects(prev => [...prev, project]);
    if (hasSupabase()) {
      const supabase = getSupabase();
      (async () => {
        try {
          const payload = {
            id: project.id,
            user_id: user?.id ?? null,
            name: project.name,
            description: project.description ?? null,
            band_name: project.bandName ?? null,
          };
          const { data, error } = await supabase.from('projects').insert(payload).select().single();
          if (error) throw error;
        } catch (error) {
          // log and surface to UI
          // eslint-disable-next-line no-console
          console.error('Supabase insert project error:', error);
          setDbError((error as any)?.message ? String((error as any).message) : 'Error inserting project');
        }
      })();
    }
  };

  const addSong = (song: Song) => {
    // optimistic add
    setSongs(prev => [...prev, song]);
    // Update the project's song count
    setProjects(prev => prev.map(p => 
      p.id === song.projectId ? { ...p, songCount: p.songCount + 1 } : p
    ));
    if (hasSupabase()) {
      const supabase = getSupabase();
      (async () => {
        try {
          const payload: any = {
            project_id: song.projectId,
            title: song.title,
            artist: song.artist,
            album: (song as any).album ?? null,
            key: (song as any).key ?? null,
            tempo: song.bpm ?? null,
            difficulty: song.difficulty ?? null,
            status: song.status ?? null,
            tab_url: song.tabUrl ?? null,
            backing_track_url: (song as any).backingTrackUrl ?? null,
            reference_url: (song as any).referenceUrl ?? null,
            tab_content: (song as any).tabContent ?? null,
            notes: (song as any).notes ?? null,
            last_played_at: song.lastPlayed ? new Date(song.lastPlayed).toISOString() : null,
          };

          const { data, error } = await supabase.from('songs').insert(payload).select().single();
          if (error) throw error;
          if (data) {
            // Insert components for this song
            if (song.components && song.components.length > 0) {
              const componentPayloads = song.components.map(comp => ({
                song_id: data.id,
                name: comp.name,
                type: comp.type,
                progress: comp.progress ?? 0,
                notes: (comp as any).notes ?? null,
              }));
              const { error: compErr } = await supabase.from('song_components').insert(componentPayloads);
              if (compErr) throw compErr;
            }
            // update local state: replace temp id with DB id and merge any returned fields
            const normalized = normalizeSong({ ...data, components: song.components });
            setSongs(prev => prev.map(s => s.id === song.id ? normalized : s));
          }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Supabase insert song error:', error);
          setDbError((error as any)?.message ? String((error as any).message) : 'Error inserting song');
        }
      })();
    }
  };

  const addTonePreset = (preset: TonePreset) => {
    setTonePresets(prev => [...prev, preset]);
    if (hasSupabase()) {
      const supabase = getSupabase();
      (async () => {
        try {
          const payload: any = {
            id: preset.id,
            user_id: user?.id ?? null,
            name: preset.name,
            description: preset.description ?? null,
            guitar_model: preset.guitarModel ?? null,
            pickup_position: preset.pickupPosition ?? null,
            amp_settings: preset.ampSettings ?? null,
            effects_chain: preset.effects ?? null,
            style_tags: preset.tags ?? null,
            notes: (preset as any).notes ?? null,
          };
          const { data, error } = await supabase.from('tone_presets').insert(payload).select().single();
          if (error) throw error;
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Supabase insert tone_preset error:', error);
          setDbError((error as any)?.message ? String((error as any).message) : 'Error inserting tone preset');
        }
      })();
    }
  };

  const updateSong = (id: string, updates: Partial<Song>) => {
    setSongs(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    if (hasSupabase()) {
      const supabase = getSupabase();
      (async () => {
        try {
          // If only components are being updated, update song_components instead
          if (updates.components && Object.keys(updates).length === 1) {
            const components = updates.components;
            for (const comp of components) {
              const { error: compErr } = await supabase
                .from('song_components')
                .update({ progress: comp.progress })
                .eq('id', comp.id);
              if (compErr) throw compErr;
            }
            return;
          }

          const payload: any = {};
          // map camelCase to snake_case for known fields
          if (updates.projectId !== undefined) payload.project_id = updates.projectId;
          if (updates.bpm !== undefined) payload.tempo = updates.bpm;
          if (updates.tabUrl !== undefined) payload.tab_url = updates.tabUrl;
          if (updates.lastPlayed !== undefined) payload.last_played_at = updates.lastPlayed ? new Date(updates.lastPlayed).toISOString() : null;
          if (updates.title !== undefined) payload.title = updates.title;
          if (updates.artist !== undefined) payload.artist = updates.artist;
          if (updates.difficulty !== undefined) payload.difficulty = updates.difficulty;
          if (updates.status !== undefined) payload.status = updates.status;
            if (updates.tonePresetId !== undefined) payload.tone_preset_id = updates.tonePresetId;

          // Only call update if there are actual song fields to update
          if (Object.keys(payload).length > 0) {
            const { data, error } = await supabase.from('songs').update(payload).eq('id', id).select().single();
            if (error) throw error;
            if (data) {
              const normalized = normalizeSong(data);
              setSongs(prev => prev.map(s => s.id === id ? normalized : s));
            }
          }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Supabase update song error:', error);
          setDbError((error as any)?.message ? String((error as any).message) : 'Error updating song');
        }
      })();
    }
  };

  const addToSchedule = (songId: string) => {
    if (!todaysScheduleIds.includes(songId)) {
      setTodaysScheduleIds(prev => [...prev, songId]);
      if (hasSupabase()) {
        const supabase = getSupabase();
        // This app uses a practice_schedule table; insert a simple schedule for the current user.
        (async () => {
          try {
            const payload: any = { song_id: songId, scheduled_date: new Date().toISOString().slice(0,10) };
            const { data, error } = await supabase.from('practice_schedule').insert(payload).select().single();
            if (error) throw error;
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Supabase insert practice_schedule error:', error);
            setDbError((error as any)?.message ? String((error as any).message) : 'Error adding to schedule');
          }
        })();
      }
    }
  };

  const clearDbError = () => setDbError(null);

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
      ,
      dbError,
      clearDbError
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
