import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Project, Song, TonePreset } from '../types';
import { MOCK_PROJECTS, MOCK_SONGS, MOCK_TONE_PRESETS } from '../constants';
import { hasSupabase, getSupabase } from '../lib/supabaseClient';

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
        if (pData) setProjects(pData as Project[]);

        const { data: sData, error: sErr } = await supabase.from('songs').select('*');
        if (sErr) throw sErr;
        if (sData) setSongs(sData as Song[]);

        const { data: tData, error: tErr } = await supabase.from('tone_presets').select('*');
        if (tErr) throw tErr;
        if (tData) setTonePresets(tData as TonePreset[]);
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
        const payload = {
          id: project.id,
          user_id: (project as any).userId ?? null,
          name: project.name,
          description: project.description ?? null,
          band_name: project.bandName ?? null,
        };
        const { data, error } = await supabase.from('projects').insert(payload).select().single().catch((e) => ({ data: null, error: e }));
        if (error) {
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
        const payload: any = {
          project_id: song.projectId,
          title: song.title,
          artist: song.artist,
          album: (song as any).album ?? null,
          key: (song as any).key ?? null,
          tempo: (song as any).tempo ?? (song as any).bpm ?? null,
          difficulty: song.difficulty ?? null,
          status: song.status ?? null,
          tab_url: (song as any).tabUrl ?? (song as any).tab_url ?? null,
          backing_track_url: (song as any).backingTrackUrl ?? (song as any).backing_track_url ?? null,
          reference_url: (song as any).referenceUrl ?? (song as any).reference_url ?? null,
          tab_content: (song as any).tabContent ?? null,
          notes: (song as any).notes ?? null,
          last_played_at: song.lastPlayed ? new Date(song.lastPlayed).toISOString() : null,
        };

        const { data, error } = await supabase.from('songs').insert(payload).select().single().catch((e) => ({ data: null, error: e }));
        if (error) {
          // eslint-disable-next-line no-console
          console.error('Supabase insert song error:', error);
          setDbError((error as any)?.message ? String((error as any).message) : 'Error inserting song');
        } else if (data) {
          // update local state: replace temp id with DB id and merge any returned fields
          setSongs(prev => prev.map(s => s.id === song.id ? ({ ...s, id: data.id, created_at: data.created_at, updated_at: data.updated_at }) : s));
        }
      })();
    }
  };

  const addTonePreset = (preset: TonePreset) => {
    setTonePresets(prev => [...prev, preset]);
    if (hasSupabase()) {
      const supabase = getSupabase();
      (async () => {
        const payload: any = {
          id: preset.id,
          user_id: (preset as any).userId ?? null,
          name: preset.name,
          description: preset.description ?? null,
          guitar_model: preset.guitarModel ?? null,
          pickup_position: preset.pickupPosition ?? null,
          amp_settings: (preset as any).ampSettings ?? (preset as any).amp_settings ?? null,
          effects_chain: (preset as any).effects ?? (preset as any).effects_chain ?? null,
          style_tags: (preset as any).tags ?? (preset as any).style_tags ?? null,
          notes: (preset as any).notes ?? null,
        };
        const { data, error } = await supabase.from('tone_presets').insert(payload).select().single().catch((e) => ({ data: null, error: e }));
        if (error) {
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
        const payload: any = { ...updates };
        // map camelCase to snake_case for known fields
        if ((updates as any).projectId) { payload.project_id = (updates as any).projectId; delete payload.projectId; }
        if ((updates as any).bpm) { payload.tempo = (updates as any).bpm; delete payload.bpm; }
        if ((updates as any).tabUrl) { payload.tab_url = (updates as any).tabUrl; delete payload.tabUrl; }
        if ((updates as any).backingTrackUrl) { payload.backing_track_url = (updates as any).backingTrackUrl; delete payload.backingTrackUrl; }
        if ((updates as any).referenceUrl) { payload.reference_url = (updates as any).referenceUrl; delete payload.referenceUrl; }
        if ((updates as any).lastPlayed) { payload.last_played_at = (updates as any).lastPlayed; delete payload.lastPlayed; }

        const { data, error } = await supabase.from('songs').update(payload).eq('id', id).select().single().catch((e) => ({ data: null, error: e }));
        if (error) {
          // eslint-disable-next-line no-console
          console.error('Supabase update song error:', error);
          setDbError((error as any)?.message ? String((error as any).message) : 'Error updating song');
        }
        if (data) {
          setSongs(prev => prev.map(s => s.id === id ? ({ ...s, ...data } as any) : s));
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
          const payload: any = { song_id: songId, scheduled_date: new Date().toISOString().slice(0,10) };
          const { data, error } = await supabase.from('practice_schedule').insert(payload).select().single().catch((e) => ({ data: null, error: e }));
          if (error) {
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
