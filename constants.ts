import { Project, Song, TonePreset } from './types';

export const MOCK_PROJECTS: Project[] = [
  {
    id: 'p1',
    name: 'The Dark Side Project',
    bandName: 'Pink Floyd Tribute',
    description: 'Preparing for the summer festival circuit. Focus on accuracy and tone.',
    songCount: 12,
    completedCount: 4,
  },
  {
    id: 'p2',
    name: 'Neon Nights',
    bandName: '80s Synth Pop Cover',
    description: 'High energy setlist for club gigs.',
    songCount: 25,
    completedCount: 18,
  }
];

export const MOCK_TONE_PRESETS: TonePreset[] = [
  {
    id: 't1',
    name: 'Gilmour Lead',
    description: 'Sustainy, smooth lead tone for solos. High compression.',
    guitarModel: 'Black Strat',
    pickupPosition: 'Bridge',
    ampSettings: { gain: 8, bass: 6, mid: 4, treble: 7, reverb: 4, volume: 9 },
    effects: [
      { id: 'e1', name: 'Big Muff', type: 'Fuzz', isOn: true },
      { id: 'e2', name: 'Elec. Mistress', type: 'Flanger', isOn: true },
      { id: 'e3', name: 'Delay 440ms', type: 'Delay', isOn: true }
    ],
    tags: ['Lead', 'High Gain', 'Atmospheric']
  },
  {
    id: 't2',
    name: 'Funky Clean',
    description: 'Crystal clear rhythm tone for chopping chords.',
    guitarModel: 'Fender Strat',
    pickupPosition: 'Position 4',
    ampSettings: { gain: 3, bass: 5, mid: 6, treble: 8, reverb: 3, volume: 7 },
    effects: [
      { id: 'e4', name: 'Dyna Comp', type: 'Compression', isOn: true },
      { id: 'e5', name: 'CE-2', type: 'Chorus', isOn: false }
    ],
    tags: ['Clean', 'Rhythm', 'Funk']
  },
  {
    id: 't3',
    name: '80s Power Saw',
    description: 'Thick, saturated distortion with chorus.',
    guitarModel: 'Les Paul',
    pickupPosition: 'Bridge',
    ampSettings: { gain: 9, bass: 7, mid: 3, treble: 6, reverb: 2, volume: 8 },
    effects: [
      { id: 'e6', name: 'Tube Screamer', type: 'Overdrive', isOn: true },
      { id: 'e7', name: 'Chorus', type: 'Chorus', isOn: true }
    ],
    tags: ['Distortion', 'Rhythm']
  }
];

export const MOCK_SONGS: Song[] = [
  {
    id: 's1',
    projectId: 'p1',
    title: 'Comfortably Numb',
    artist: 'Pink Floyd',
    difficulty: 'Expert',
    status: 'In Progress',
    bpm: 64,
    lastPlayed: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
    tonePresetId: 't1',
    components: [
      { id: 'c1', name: 'Intro', type: 'Intro', progress: 100 },
      { id: 'c2', name: 'Verse 1', type: 'Verse', progress: 100 },
      { id: 'c3', name: 'Chorus', type: 'Chorus', progress: 100 },
      { id: 'c4', name: 'Solo 1', type: 'Solo', progress: 75 },
      { id: 'c5', name: 'Solo 2 (Outro)', type: 'Solo', progress: 25 },
    ]
  },
  {
    id: 's2',
    projectId: 'p1',
    title: 'Time',
    artist: 'Pink Floyd',
    difficulty: 'Advanced',
    status: 'Needs Work',
    bpm: 120,
    lastPlayed: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8), // 8 days ago (Needs Work)
    tonePresetId: 't2',
    components: [
      { id: 'c6', name: 'Intro (Clocks)', type: 'Intro', progress: 50 },
      { id: 'c7', name: 'Verse Rhythm', type: 'Rhythm', progress: 90 },
      { id: 'c8', name: 'Solo', type: 'Solo', progress: 40 },
    ]
  },
  {
    id: 's3',
    projectId: 'p1',
    title: 'Money',
    artist: 'Pink Floyd',
    difficulty: 'Intermediate',
    status: 'Performance Ready',
    bpm: 120,
    lastPlayed: new Date(),
    tonePresetId: 't2',
    components: [
      { id: 'c9', name: 'Bass Riff', type: 'Rhythm', progress: 100 },
      { id: 'c10', name: 'Sax Solo Section', type: 'Rhythm', progress: 100 },
      { id: 'c11', name: 'Guitar Solo', type: 'Solo', progress: 100 },
    ]
  }
];
