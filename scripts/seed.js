#!/usr/bin/env node
/**
 * Seed script for Tribute Band Song Tracker
 * 
 * Usage:
 *   npm run seed <user_id>
 * 
 * Example:
 *   npm run seed "550e8400-e29b-41d4-a716-446655440000"
 * 
 * The user_id must exist in your Supabase auth.users table.
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Load .env file
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, val] = line.split('=');
    if (key && val && !process.env[key.trim()]) {
      process.env[key.trim()] = val.trim();
    }
  });
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Error: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY env vars must be set.');
  console.error('Create a .env file in the project root with your Supabase credentials.');
  process.exit(1);
}

const userId = process.argv[2];
if (!userId) {
  console.error('Error: User ID required as first argument.');
  console.error('Usage: npm run seed <user_id>');
  process.exit(1);
}

// Use service role key if available (recommended for seeding)
// Otherwise use anon key (may fail due to RLS)
const apiKey = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;
const isServiceRole = !!SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, apiKey);

async function seed() {
  try {
    console.log('🌱 Seeding sample data...\n');
    
    if (!isServiceRole) {
      console.warn('⚠️  Using anon key - seeding may fail due to RLS policies.');
      console.warn('    For best results, add SUPABASE_SERVICE_ROLE_KEY to .env\n');
    }

    // 1. Ensure profile exists for the user
    const { data: profileData, error: profileCheckError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (!profileCheckError && profileData) {
      console.log('✓ User profile already exists');
    } else {
      // Create profile if it doesn't exist
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({ id: userId, email: 'user@example.com' });
      
      if (profileError) {
        console.warn('⚠️  Could not create profile (may already exist):', profileError.message);
      } else {
        console.log('✓ Created user profile');
      }
    }

    // 2. Create sample projects
    const projects = [
      { user_id: userId, name: 'Pink Floyd Covers', band_name: 'Floyd Tribute', description: 'Learning all Pink Floyd classics' },
      { user_id: userId, name: 'Led Zeppelin Set', band_name: 'Zeppelin Experience', description: 'Zeppelin tribute band setlist' },
    ];

    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .insert(projects)
      .select();

    if (projectError) throw projectError;
    console.log(`✓ Created ${projectData.length} projects`);

    // 3. Create sample songs
    const songs = [
      {
        project_id: projectData[0].id,
        title: 'Comfortably Numb',
        artist: 'Pink Floyd',
        album: 'The Wall',
        key: 'B minor',
        tempo: 120,
        difficulty: 'Advanced',
        status: 'In Progress',
        tab_url: 'https://tabs.ultimate-guitar.com',
        backing_track_url: 'https://example.com/backing',
        reference_url: 'https://example.com/original',
        notes: 'Focus on the solo section',
      },
      {
        project_id: projectData[0].id,
        title: 'Wish You Were Here',
        artist: 'Pink Floyd',
        album: 'Wish You Were Here',
        key: 'E major',
        tempo: 95,
        difficulty: 'Intermediate',
        status: 'Not Started',
        notes: 'Soulful bends required',
      },
      {
        project_id: projectData[1].id,
        title: 'Whole Lotta Love',
        artist: 'Led Zeppelin',
        album: 'Led Zeppelin II',
        key: 'A minor',
        tempo: 140,
        difficulty: 'Advanced',
        status: 'In Progress',
        notes: 'Heavy riff, lots of bends',
      },
    ];

    const { data: songData, error: songError } = await supabase
      .from('songs')
      .insert(songs)
      .select();

    if (songError) throw songError;
    console.log(`✓ Created ${songData.length} songs`);

    // 4. Create sample song components
    const components = [
      { song_id: songData[0].id, name: 'Intro', type: 'Intro', progress: 100 },
      { song_id: songData[0].id, name: 'Verse', type: 'Verse', progress: 75 },
      { song_id: songData[0].id, name: 'Chorus', type: 'Chorus', progress: 50 },
      { song_id: songData[0].id, name: 'Solo', type: 'Solo', progress: 25 },
      { song_id: songData[0].id, name: 'Outro', type: 'Outro', progress: 0 },
      { song_id: songData[1].id, name: 'Main Riff', type: 'Custom', progress: 0 },
      { song_id: songData[1].id, name: 'Rhythm Guitar', type: 'Rhythm Guitar', progress: 0 },
      { song_id: songData[2].id, name: 'Main Riff', type: 'Custom', progress: 75 },
      { song_id: songData[2].id, name: 'Verse', type: 'Verse', progress: 50 },
      { song_id: songData[2].id, name: 'Bridge', type: 'Bridge', progress: 25 },
    ];

    const { data: componentData, error: componentError } = await supabase
      .from('song_components')
      .insert(components)
      .select();

    if (componentError) throw componentError;
    console.log(`✓ Created ${componentData.length} song components`);

    // 5. Create sample tone presets
    const tonePresets = [
      {
        user_id: userId,
        name: 'Classic Rock Clean',
        description: 'Warm clean tone for rock ballads',
        guitar_model: 'Fender Stratocaster',
        pickup_position: 'Middle',
        amp_settings: { gain: 3, bass: 6, mid: 5, treble: 7, presence: 4, volume: 5 },
        effects_chain: [{ type: 'reverb', name: 'Hall Reverb', settings: { room: 8, level: 3 } }],
        style_tags: ['Clean', 'Rock', 'Ballad'],
        notes: 'Great for melodic passages',
      },
      {
        user_id: userId,
        name: 'Heavy Crunch',
        description: 'Aggressive crunch tone for riffs',
        guitar_model: 'Gibson Les Paul',
        pickup_position: 'Bridge',
        amp_settings: { gain: 8, bass: 7, mid: 4, treble: 6, presence: 7, volume: 6 },
        effects_chain: [
          { type: 'overdrive', name: 'Tube Screamer', settings: { drive: 7, tone: 6, level: 8 } },
          { type: 'delay', name: 'Boss DD-7', settings: { time: 375, feedback: 4, level: 3 } },
        ],
        style_tags: ['Crunch', 'Lead', 'Heavy'],
        notes: 'Perfect for hard rock and metal riffs',
      },
    ];

    const { data: presetData, error: presetError } = await supabase
      .from('tone_presets')
      .insert(tonePresets)
      .select();

    if (presetError) throw presetError;
    console.log(`✓ Created ${presetData.length} tone presets`);

    // 6. Link song tone presets
    const songToneLinks = [
      { song_id: songData[0].id, preset_id: presetData[0].id, section_note: 'Verses use clean tone' },
      { song_id: songData[0].id, preset_id: presetData[1].id, section_note: 'Solo section' },
      { song_id: songData[2].id, preset_id: presetData[1].id, section_note: 'Main riff' },
    ];

    const { error: linkError } = await supabase
      .from('song_tone_presets')
      .insert(songToneLinks);

    if (linkError) throw linkError;
    console.log(`✓ Linked ${songToneLinks.length} song-tone relationships`);

    console.log('\n✅ Seed complete! Your sample data is ready.\n');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

seed();
