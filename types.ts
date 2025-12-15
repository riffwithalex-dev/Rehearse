export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';

export type SongStatus = 'Not Started' | 'In Progress' | 'Ready for Review' | 'Performance Ready' | 'Needs Work';

export interface SongComponent {
  id: string;
  name: string;
  type: 'Intro' | 'Verse' | 'Chorus' | 'Bridge' | 'Solo' | 'Outro' | 'Rhythm' | 'Lead' | 'Custom';
  progress: number; // 0 to 100
}

export interface AmpSettings {
  gain: number;
  bass: number;
  mid: number;
  treble: number;
  reverb: number;
  volume: number;
}

export interface EffectPedal {
  id: string;
  name: string;
  type: string;
  isOn: boolean;
}

export interface TonePreset {
  id: string;
  name: string;
  description?: string;
  guitarModel: string;
  pickupPosition: string; // e.g. "Neck", "Bridge", "Position 4"
  ampSettings: AmpSettings;
  effects: EffectPedal[];
  tags: string[];
}

export interface Song {
  id: string;
  projectId: string;
  title: string;
  artist: string;
  difficulty: Difficulty;
  status: SongStatus;
  components: SongComponent[];
  lastPlayed?: Date;
  duration?: string;
  bpm?: number;
  key?: string;
  tabUrl?: string;
  tabContent?: string;
  backingTrackUrl?: string;
  referenceUrl?: string;
  notes?: string;
  tonePresetId?: string; // Link to a tone preset
}

export interface Project {
  id: string;
  name: string;
  bandName: string;
  description: string;
  songCount: number;
  completedCount: number;
}

export interface PracticeSession {
  id: string;
  date: Date;
  songId: string;
  durationMinutes: number;
}

export interface PracticeVideo {
  id: string;
  songId: string;
  title: string;
  url: string;
  description?: string | null;
  recordedAt: Date;
}
