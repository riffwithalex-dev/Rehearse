-- Supabase schema for Tribute Band Song Tracker
-- Run this SQL in your Supabase project's SQL editor or via migration tool

-- Enable pgcrypto for gen_random_uuid()
create extension if not exists pgcrypto;

-- profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- projects
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  band_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, name)
);
CREATE INDEX idx_projects_user_id ON projects(user_id);

-- songs
CREATE TABLE songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  album TEXT,
  key TEXT,
  tempo INTEGER,
  difficulty TEXT CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced', 'Expert')),
  status TEXT CHECK (status IN ('Not Started', 'In Progress', 'Ready for Review', 'Performance Ready', 'Needs Work')) DEFAULT 'Not Started',
  tab_url TEXT,
  backing_track_url TEXT,
  reference_url TEXT,
  tab_content TEXT,
  notes TEXT,
  last_played_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_songs_project_id ON songs(project_id);
CREATE INDEX idx_songs_status ON songs(status);
CREATE INDEX idx_songs_last_played ON songs(last_played_at);

-- song_components
CREATE TABLE song_components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  song_id UUID NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('Intro', 'Verse', 'Chorus', 'Bridge', 'Solo', 'Outro', 'Rhythm Guitar', 'Lead Guitar', 'Custom')),
  progress INTEGER CHECK (progress >= 0 AND progress <= 100) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_song_components_song_id ON song_components(song_id);

-- practice_videos
CREATE TABLE practice_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  song_id UUID NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  component_id UUID REFERENCES song_components(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  recorded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_practice_videos_song_id ON practice_videos(song_id);
CREATE INDEX idx_practice_videos_component_id ON practice_videos(component_id);

-- practice_sessions
CREATE TABLE practice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  song_id UUID NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  duration_minutes INTEGER,
  notes TEXT,
  session_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_practice_sessions_song_id ON practice_sessions(song_id);
CREATE INDEX idx_practice_sessions_user_id ON practice_sessions(user_id);
CREATE INDEX idx_practice_sessions_date ON practice_sessions(session_date);

-- practice_schedule
CREATE TABLE practice_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  song_id UUID NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_practice_schedule_user_id ON practice_schedule(user_id);
CREATE INDEX idx_practice_schedule_song_id ON practice_schedule(song_id);
CREATE INDEX idx_practice_schedule_date ON practice_schedule(scheduled_date);
CREATE INDEX idx_practice_schedule_completed ON practice_schedule(completed);

-- tone_presets
CREATE TABLE tone_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  guitar_model TEXT,
  pickup_position TEXT,
  amp_settings JSONB,
  effects_chain JSONB,
  style_tags TEXT[],
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, name)
);
CREATE INDEX idx_tone_presets_user_id ON tone_presets(user_id);
CREATE INDEX idx_tone_presets_style_tags ON tone_presets USING GIN(style_tags);

-- song_tone_presets
CREATE TABLE song_tone_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  song_id UUID NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  preset_id UUID NOT NULL REFERENCES tone_presets(id) ON DELETE CASCADE,
  section_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(song_id, preset_id)
);
CREATE INDEX idx_song_tone_presets_song_id ON song_tone_presets(song_id);
CREATE INDEX idx_song_tone_presets_preset_id ON song_tone_presets(preset_id);

-- Row Level Security policies (examples)
-- Enable RLS on primary tables and add policies so users only see their own data

-- Projects RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  USING (auth.uid() = user_id);

-- Songs RLS
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own songs"
  ON songs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = songs.project_id
    AND projects.user_id = auth.uid()
  ));
CREATE POLICY "Users can insert own songs"
  ON songs FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = songs.project_id
    AND projects.user_id = auth.uid()
  ));
CREATE POLICY "Users can update own songs"
  ON songs FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = songs.project_id
    AND projects.user_id = auth.uid()
  ));
CREATE POLICY "Users can delete own songs"
  ON songs FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = songs.project_id
    AND projects.user_id = auth.uid()
  ));

-- Tone presets RLS
ALTER TABLE tone_presets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own tone presets"
  ON tone_presets FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tone presets"
  ON tone_presets FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tone presets"
  ON tone_presets FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tone presets"
  ON tone_presets FOR DELETE
  USING (auth.uid() = user_id);

-- Song tone presets RLS
ALTER TABLE song_tone_presets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own song tone presets"
  ON song_tone_presets FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM songs
    JOIN projects ON projects.id = songs.project_id
    WHERE songs.id = song_tone_presets.song_id
    AND projects.user_id = auth.uid()
  ));
CREATE POLICY "Users can insert own song tone presets"
  ON song_tone_presets FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM songs
    JOIN projects ON projects.id = songs.project_id
    WHERE songs.id = song_tone_presets.song_id
    AND projects.user_id = auth.uid()
  ));
CREATE POLICY "Users can update own song tone presets"
  ON song_tone_presets FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM songs
    JOIN projects ON projects.id = songs.project_id
    WHERE songs.id = song_tone_presets.song_id
    AND projects.user_id = auth.uid()
  ));
CREATE POLICY "Users can delete own song tone presets"
  ON song_tone_presets FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM songs
    JOIN projects ON projects.id = songs.project_id
    WHERE songs.id = song_tone_presets.song_id
    AND projects.user_id = auth.uid()
  ));

-- Note: Add RLS policies for song_components, practice_videos, practice_sessions, practice_schedule similarly as needed
