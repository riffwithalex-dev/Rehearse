-- Migration: add tone_preset_id to songs
ALTER TABLE IF EXISTS songs
ADD COLUMN IF NOT EXISTS tone_preset_id UUID REFERENCES tone_presets(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_songs_tone_preset_id ON songs(tone_preset_id);
