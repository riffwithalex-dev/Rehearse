import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Project, Song, TonePreset, PracticeSession } from '../types';
import { PracticeVideo } from '../types';
import { MOCK_PROJECTS, MOCK_SONGS, MOCK_TONE_PRESETS } from '../constants';
import { hasSupabase, getSupabase } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';
import { generateUUID } from '../lib/uuid';

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
    tabContent: row.tab_content ?? undefined,
    backingTrackUrl: row.backing_track_url ?? undefined,
    referenceUrl: row.reference_url ?? undefined,
    notes: row.notes ?? undefined,
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

function normalizePracticeSession(row: any): PracticeSession {
  return {
    id: row.id,
    date: new Date(row.session_date || row.created_at),
    songId: row.song_id,
    durationMinutes: row.duration_minutes,
  };
}

interface DataContextType {
   projects: Project[];
   songs: Song[];
   tonePresets: TonePreset[];
   todaysScheduleIds: string[];
   scheduledSongs: { [date: string]: Array<{ songId: string, completed: boolean, notes?: string }> };
   practiceSessions: { [songId: string]: PracticeSession[] };
   practiceVideos: { [songId: string]: PracticeVideo[] };
   addProject: (project: Project) => void;
   addSong: (song: Song) => void;
   addTonePreset: (preset: TonePreset) => void;
   updateSong: (id: string, updates: Partial<Song>) => void;
   addToSchedule: (songId: string) => void;
   addToScheduleForDate: (songId: string, date: string, notes?: string) => void;
   removeFromSchedule: (songId: string, date: string) => void;
   updateScheduleItem: (songId: string, date: string, updates: { completed?: boolean, notes?: string }) => void;
   addPracticeSession: (songId: string, durationMinutes: number, notes?: string, mediaFile?: File | null, mediaTitle?: string) => void;
   addSongResource: (songId: string, resources: { tabUrl?: string; backingTrackUrl?: string; tabContent?: string }) => void;
   getPracticeSessionsForSong: (songId: string) => PracticeSession[];
   getPracticeVideosForSong: (songId: string) => PracticeVideo[];
   dbError?: string | null;
   clearDbError: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);
  const [songs, setSongs] = useState<Song[]>(MOCK_SONGS);
  const [tonePresets, setTonePresets] = useState<TonePreset[]>(MOCK_TONE_PRESETS);
  const [todaysScheduleIds, setTodaysScheduleIds] = useState<string[]>(MOCK_SONGS.slice(0, 3).map(s => s.id));
  const [scheduledSongs, setScheduledSongs] = useState<{ [date: string]: Array<{ songId: string, completed: boolean, notes?: string }> }>({});
  const [practiceSessions, setPracticeSessions] = useState<{ [songId: string]: PracticeSession[] }>({});
  const [practiceVideos, setPracticeVideos] = useState<{ [songId: string]: PracticeVideo[] }>({});
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    if (!hasSupabase() || !user?.id) return;
    const supabase = getSupabase();

    async function load() {
      try {
        const { data: pData, error: pErr } = await supabase
          .from('projects')
          .select('*')
          .eq('user_id', user.id);
        if (pErr) throw pErr;
        if (pData && pData.length > 0) {
          setProjects(pData.map(normalizeProject));
        }

        if (pData && pData.length > 0) {
          const projectIds = pData.map(p => p.id);
          const { data: sData, error: sErr } = await supabase
            .from('songs')
            .select('*')
            .in('project_id', projectIds);
          if (sErr) throw sErr;
          if (sData && sData.length > 0) {
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

            // Load practice videos for these songs
            const songIds = songsWithComponents.map((s: Song) => s.id);
            if (songIds.length > 0) {
              const { data: vidData, error: vidErr } = await supabase
                .from('practice_videos')
                .select('*')
                .in('song_id', songIds);
              if (!vidErr && vidData && vidData.length > 0) {
                const grouped: { [songId: string]: PracticeVideo[] } = {};
                vidData.forEach((v: any) => {
                  const pv: PracticeVideo = {
                    id: v.id,
                    songId: v.song_id,
                    title: v.title,
                    url: v.url,
                    description: v.description ?? null,
                    recordedAt: new Date(v.recorded_at || v.created_at),
                  };
                  grouped[pv.songId] = grouped[pv.songId] ?? [];
                  grouped[pv.songId].push(pv);
                });
                setPracticeVideos(prev => ({ ...prev, ...grouped }));
              }
            }
          }
        }

        const { data: tData, error: tErr } = await supabase
          .from('tone_presets')
          .select('*')
          .eq('user_id', user.id);
        if (tErr) throw tErr;
        if (tData && tData.length > 0) {
          setTonePresets(tData.map(normalizeTonePreset));
        }

        const { data: schedData, error: schedErr } = await supabase
          .from('practice_schedule')
          .select('*')
          .eq('user_id', user.id);
        if (!schedErr && schedData) {
          const grouped: { [date: string]: Array<{ songId: string, completed: boolean, notes?: string }> } = {};
          schedData.forEach((s: any) => {
            const dateStr = s.scheduled_date;
            if (!grouped[dateStr]) grouped[dateStr] = [];
            grouped[dateStr].push({ songId: s.song_id, completed: s.completed || false, notes: s.notes });
          });
          setScheduledSongs(grouped);
          // Update todaysScheduleIds
          const todayStr = new Date().toISOString().slice(0, 10);
          setTodaysScheduleIds(grouped[todayStr]?.map(s => s.songId) || []);
        }
      } catch (e) {
        console.error('Error loading data from Supabase:', e);
        setDbError((e as any)?.message ? String((e as any).message) : 'Error loading data from Supabase');
      }
    }

    load();
  }, [user?.id]);

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
          const { error } = await supabase.from('projects').insert(payload);
          if (error) throw error;
        } catch (error) {
          console.error('Supabase insert project error:', error);
          setDbError((error as any)?.message ? String((error as any).message) : 'Error inserting project');
        }
      })();
    }
  };

  const addSong = (song: Song) => {
    setSongs(prev => [...prev, song]);
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
            const normalized = normalizeSong({ ...data, components: song.components });
            setSongs(prev => prev.map(s => s.id === song.id ? normalized : s));
          }
        } catch (error) {
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
          const { error } = await supabase.from('tone_presets').insert(payload);
          if (error) throw error;
        } catch (error) {
          console.error('Supabase insert tone_preset error:', error);
          setDbError((error as any)?.message ? String((error as any).message) : 'Error inserting tone preset');
        }
      })();
    }
  };

  const updateTonePreset = (id: string, updates: Partial<TonePreset>) => {
    setTonePresets(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    if (hasSupabase()) {
      const supabase = getSupabase();
      (async () => {
        try {
          const payload: any = {};
          if (updates.name !== undefined) payload.name = updates.name;
          if (updates.description !== undefined) payload.description = updates.description;
          if (updates.guitarModel !== undefined) payload.guitar_model = updates.guitarModel;
          if (updates.pickupPosition !== undefined) payload.pickup_position = updates.pickupPosition;
          if (updates.ampSettings !== undefined) payload.amp_settings = updates.ampSettings;
          if (updates.effects !== undefined) payload.effects_chain = updates.effects;
          if (updates.tags !== undefined) payload.style_tags = updates.tags;
          if (Object.keys(payload).length > 0) {
            const { error } = await supabase.from('tone_presets').update(payload).eq('id', id);
            if (error) throw error;
          }
        } catch (error) {
          console.error('Supabase update tone_preset error:', error);
          setDbError((error as any)?.message ? String((error as any).message) : 'Error updating tone preset');
        }
      })();
    }
  };

  const deleteTonePreset = (id: string) => {
    setTonePresets(prev => prev.filter(p => p.id !== id));
    if (hasSupabase()) {
      const supabase = getSupabase();
      (async () => {
        try {
          const { error } = await supabase.from('tone_presets').delete().eq('id', id);
          if (error) throw error;
        } catch (error) {
          console.error('Supabase delete tone_preset error:', error);
          setDbError((error as any)?.message ? String((error as any).message) : 'Error deleting tone preset');
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
          if (updates.projectId !== undefined) payload.project_id = updates.projectId;
          if (updates.bpm !== undefined) payload.tempo = updates.bpm;
          if (updates.tabUrl !== undefined) payload.tab_url = updates.tabUrl;
          if (updates.lastPlayed !== undefined) payload.last_played_at = updates.lastPlayed ? new Date(updates.lastPlayed).toISOString() : null;
          if (updates.title !== undefined) payload.title = updates.title;
          if (updates.artist !== undefined) payload.artist = updates.artist;
          if (updates.difficulty !== undefined) payload.difficulty = updates.difficulty;
          if (updates.status !== undefined) payload.status = updates.status;
          if (updates.tonePresetId !== undefined) payload.tone_preset_id = updates.tonePresetId;
          if (updates.key !== undefined) payload.key = updates.key;

          if (Object.keys(payload).length > 0) {
            const { data, error } = await supabase.from('songs').update(payload).eq('id', id).select().single();
            if (error) throw error;
            if (data) {
              const normalized = normalizeSong(data);
              setSongs(prev => prev.map(s => s.id === id ? { ...normalized, components: s.components } : s));
            }
          }
        } catch (error) {
          console.error('Supabase update song error:', error);
          setDbError((error as any)?.message ? String((error as any).message) : 'Error updating song');
        }
      })();
    }
  };

  const addToSchedule = (songId: string) => {
    const todayStr = new Date().toISOString().slice(0, 10);
    addToScheduleForDate(songId, todayStr);
  };

  const addToScheduleForDate = (songId: string, date: string, notes?: string) => {
    setScheduledSongs(prev => {
      const newPrev = { ...prev };
      if (!newPrev[date]) newPrev[date] = [];
      if (!newPrev[date].find(s => s.songId === songId)) {
        newPrev[date].push({ songId, completed: false, notes: notes || '' });
      }
      return newPrev;
    });
    setTodaysScheduleIds(prev => {
      const todayStr = new Date().toISOString().slice(0, 10);
      if (date === todayStr && !prev.includes(songId)) {
        return [...prev, songId];
      }
      return prev;
    });
    if (hasSupabase()) {
      const supabase = getSupabase();
      (async () => {
        try {
          const payload: any = { song_id: songId, scheduled_date: date, user_id: user?.id, notes: notes || null };
          const { error } = await supabase.from('practice_schedule').insert(payload);
          if (error) throw error;
        } catch (error) {
          console.error('Supabase insert practice_schedule error:', error);
          setDbError((error as any)?.message ? String((error as any).message) : 'Error adding to schedule');
        }
      })();
    }
  };

  const removeFromSchedule = (songId: string, date: string) => {
    setScheduledSongs(prev => {
      const newPrev = { ...prev };
      if (newPrev[date]) {
        newPrev[date] = newPrev[date].filter(s => s.songId !== songId);
      }
      return newPrev;
    });
    setTodaysScheduleIds(prev => {
      const todayStr = new Date().toISOString().slice(0, 10);
      if (date === todayStr) {
        return prev.filter(id => id !== songId);
      }
      return prev;
    });
    if (hasSupabase()) {
      const supabase = getSupabase();
      (async () => {
        try {
          const { error } = await supabase
            .from('practice_schedule')
            .delete()
            .eq('song_id', songId)
            .eq('scheduled_date', date)
            .eq('user_id', user?.id);
          if (error) throw error;
        } catch (error) {
          console.error('Supabase delete practice_schedule error:', error);
          setDbError((error as any)?.message ? String((error as any).message) : 'Error removing from schedule');
        }
      })();
    }
  };

  const updateScheduleItem = (songId: string, date: string, updates: { completed?: boolean, notes?: string }) => {
    setScheduledSongs(prev => {
      const newPrev = { ...prev };
      if (newPrev[date]) {
        newPrev[date] = newPrev[date].map(s => s.songId === songId ? { ...s, ...updates } : s);
      }
      return newPrev;
    });
    if (hasSupabase()) {
      const supabase = getSupabase();
      (async () => {
        try {
          const payload: any = {};
          if (updates.completed !== undefined) {
            payload.completed = updates.completed;
            if (updates.completed) payload.completed_at = new Date().toISOString();
          }
          if (updates.notes !== undefined) payload.notes = updates.notes;
          if (Object.keys(payload).length > 0) {
            const { error } = await supabase
              .from('practice_schedule')
              .update(payload)
              .eq('song_id', songId)
              .eq('scheduled_date', date)
              .eq('user_id', user?.id);
            if (error) throw error;
          }
        } catch (error) {
          console.error('Supabase update practice_schedule error:', error);
          setDbError((error as any)?.message ? String((error as any).message) : 'Error updating schedule');
        }
      })();
    }
  };

  const uploadToCloudinary = async (file: File): Promise<string | null> => {
    try {
      const cloudName = (import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string) || '';
      const uploadPreset = (import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string) || '';
      if (!cloudName || !uploadPreset) return null;
      const fd = new FormData();
      fd.append('file', file);
      fd.append('upload_preset', uploadPreset);
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, { method: 'POST', body: fd });
      if (!res.ok) return null;
      const json = await res.json();
      return json.secure_url ?? null;
    } catch (e) {
      console.error('Cloudinary upload error', e);
      return null;
    }
  };

  const addPracticeSession = (songId: string, durationMinutes: number, notes?: string, mediaFile?: File | null, mediaTitle?: string) => {
    const newSession: PracticeSession = {
      id: generateUUID(),
      date: new Date(),
      songId,
      durationMinutes,
    };
    setPracticeSessions(prev => ({
      ...prev,
      [songId]: [...(prev[songId] ?? []), newSession],
    }));
    if (hasSupabase()) {
      const supabase = getSupabase();
      (async () => {
        try {
          const payload: any = {
            id: newSession.id,
            song_id: songId,
            user_id: user?.id,
            duration_minutes: durationMinutes,
            notes: notes ?? null,
            session_date: new Date().toISOString().slice(0, 10),
          };
          const { error } = await supabase.from('practice_sessions').insert(payload);
          if (error) throw error;
          // If a media file was provided, upload to Cloudinary and insert a practice_videos row
          if (mediaFile) {
            const url = await uploadToCloudinary(mediaFile);
            if (url) {
              const videoPayload: any = {
                id: generateUUID(),
                song_id: songId,
                component_id: null,
                title: mediaTitle ?? 'Practice Recording',
                url,
                description: notes ?? null,
                recorded_at: new Date().toISOString(),
              };
              const { error: vidErr } = await supabase.from('practice_videos').insert(videoPayload);
              if (vidErr) console.error('practice_videos insert error', vidErr);
              else {
                const pv: PracticeVideo = {
                  id: videoPayload.id,
                  songId: songId,
                  title: videoPayload.title,
                  url: videoPayload.url,
                  description: videoPayload.description ?? null,
                  recordedAt: new Date(videoPayload.recorded_at),
                };
                setPracticeVideos(prev => ({ ...prev, [songId]: [...(prev[songId] ?? []), pv] }));
              }
            }
          }
        } catch (error) {
          console.error('Supabase insert practice_session error:', error);
          setDbError((error as any)?.message ? String((error as any).message) : 'Error logging practice session');
        }
      })();
    }
  };

  const addSongResource = (songId: string, resources: { tabUrl?: string; backingTrackUrl?: string; tabContent?: string }) => {
    setSongs(prev => prev.map(s => s.id === songId ? {
      ...s,
      tabUrl: resources.tabUrl !== undefined ? resources.tabUrl : s.tabUrl,
      tabContent: resources.tabContent !== undefined ? resources.tabContent : (s as any).tabContent,
      backingTrackUrl: resources.backingTrackUrl !== undefined ? resources.backingTrackUrl : (s as any).backingTrackUrl,
    } : s));
    if (hasSupabase()) {
      const supabase = getSupabase();
      (async () => {
        try {
          const payload: any = {};
          if (resources.tabUrl !== undefined) payload.tab_url = resources.tabUrl;
          if (resources.backingTrackUrl !== undefined) payload.backing_track_url = resources.backingTrackUrl;
          if (resources.tabContent !== undefined) payload.tab_content = resources.tabContent;
          if (Object.keys(payload).length === 0) return;
          const { data, error } = await supabase.from('songs').update(payload).eq('id', songId).select().single();
          if (error) throw error;
          if (data) {
            const normalized = normalizeSong(data);
            setSongs(prev => prev.map(s => s.id === songId ? { ...normalized, components: s.components } : s));
          }
        } catch (error) {
          console.error('Supabase update song resources error:', error);
          setDbError((error as any)?.message ? String((error as any).message) : 'Error updating song resources');
        }
      })();
    }
  };

  const getPracticeSessionsForSong = (songId: string): PracticeSession[] => {
    return practiceSessions[songId] ?? [];
  };

  const getPracticeVideosForSong = (songId: string): PracticeVideo[] => {
    return practiceVideos[songId] ?? [];
  };

  const clearDbError = () => setDbError(null);

  return (
    <DataContext.Provider value={{
      projects,
      songs,
      tonePresets,
      todaysScheduleIds,
      scheduledSongs,
      practiceSessions,
      practiceVideos,
      addProject,
      addSong,
      addTonePreset,
      updateTonePreset,
      deleteTonePreset,
      updateSong,
      addToSchedule,
      addToScheduleForDate,
      removeFromSchedule,
      updateScheduleItem,
      addPracticeSession,
      addSongResource,
      getPracticeSessionsForSong,
      getPracticeVideosForSong,
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
