# Tribute Band Song Tracker - Project Documentation

## Project Overview

**Tribute Band Song Tracker** is a minimalistic, black and white web application designed to help musicians track their progress learning songs for tribute band performances. The app provides comprehensive song management, practice tracking, and scheduling capabilities with an elegant, distraction-free interface.

### Key Goals
- Centralized system to manage song learning progress
- Detailed tracking of individual song components (rhythm, solos, sections)
- Practice scheduling system with daily reminders
- Beautiful, minimal UI that keeps musicians focused
- Support for multiple tribute band projects simultaneously

## Tech Stack

### Frontend
- **Framework:** React 19 with TypeScript
- **Build Tool:** Vite 6
- **Styling:** Tailwind CSS (customized black/white/gray theme)
- **State Management:** React Context + hooks
- **Routing:** React Router DOM v7 (HashRouter)
- **Icons:** Lucide React
- **Animations:** Framer Motion

### Backend & Database
- **Backend:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Database Storage:** Supabase (for files via Storage API)
- **Real-time:** Supabase Real-time subscriptions (optional)

### Package Management
- Node.js with npm
- ES modules

## Project Structure

```
/workspaces/Rehearse/
├── components/
│   ├── Layout.tsx              # Main layout with nav & auth header
│   ├── ProtectedRoute.tsx       # Auth guard for protected pages
│   ├── SongCard.tsx
│   ├── ui/
│   │   ├── GlassCard.tsx
│   │   ├── Knob.tsx
│   │   └── ...
│
├── pages/
│   ├── Dashboard.tsx            # Home page (today's schedule, needs attention)
│   ├── Projects.tsx             # Manage projects
│   ├── SongDetail.tsx           # Single song detail view
│   ├── Schedule.tsx             # Practice scheduling
│   ├── Tones.tsx                # Tone presets management
│   ├── SignIn.tsx               # Sign in page
│   └── SignUp.tsx               # Sign up page
│
├── context/
│   ├── AuthContext.tsx          # Auth state (user, session, sign in/up/out)
│   └── DataContext.tsx          # Data state (projects, songs, tones, schedules)
│
├── lib/
│   └── supabaseClient.ts        # Supabase client setup & helpers
│
├── supabase/
│   └── schema.sql               # Full database schema with RLS policies
│
├── scripts/
│   ├── seed.js                  # Seed sample data
│   ├── migrate.js               # Run migrations
│   └── README.md                # Setup guide
│
├── App.tsx                      # Main app with routing & providers
├── index.tsx                    # React entry point
├── index.html                   # HTML template
├── vite.config.ts               # Vite configuration
├── tsconfig.json                # TypeScript config
├── package.json                 # Dependencies & scripts
├── .env.example                 # Example environment variables
└── CLAUDE.md                    # This file
```

## Database Schema

### Tables

#### `profiles`
User profile information (extends Supabase auth.users)
```sql
- id (UUID, PK, FK to auth.users)
- email (TEXT)
- full_name (TEXT)
- avatar_url (TEXT)
- created_at, updated_at (TIMESTAMP)
```

#### `projects`
Tribute band projects/sets
```sql
- id (UUID, PK)
- user_id (UUID, FK to profiles)
- name (TEXT, UNIQUE per user)
- description (TEXT)
- band_name (TEXT)
- created_at, updated_at (TIMESTAMP)
```

#### `songs`
Individual songs within projects
```sql
- id (UUID, PK)
- project_id (UUID, FK to projects)
- title, artist, album (TEXT)
- key, tempo (TEXT, INTEGER)
- difficulty (Beginner|Intermediate|Advanced|Expert)
- status (Not Started|In Progress|Ready for Review|Performance Ready|Needs Work)
- tab_url, backing_track_url, reference_url (TEXT)
- tab_content (TEXT)
- notes (TEXT)
- last_played_at (TIMESTAMP)
- created_at, updated_at (TIMESTAMP)
```

#### `song_components`
Trackable sections/parts of each song
```sql
- id (UUID, PK)
- song_id (UUID, FK to songs)
- name (TEXT)
- type (Intro|Verse|Chorus|Bridge|Solo|Outro|Rhythm Guitar|Lead Guitar|Custom)
- progress (INTEGER 0-100)
- notes (TEXT)
- created_at, updated_at (TIMESTAMP)
```

#### `practice_videos`
Recording links for practice sessions
```sql
- id (UUID, PK)
- song_id (UUID, FK to songs)
- component_id (UUID, FK to song_components, optional)
- title, url, description (TEXT)
- recorded_at (TIMESTAMP)
- created_at (TIMESTAMP)
```

#### `practice_sessions`
Log of practice sessions
```sql
- id (UUID, PK)
- song_id (UUID, FK to songs)
- user_id (UUID, FK to profiles)
- duration_minutes (INTEGER)
- notes (TEXT)
- session_date (DATE)
- created_at (TIMESTAMP)
```

#### `practice_schedule`
Scheduled practice sessions
```sql
- id (UUID, PK)
- user_id (UUID, FK to profiles)
- song_id (UUID, FK to songs)
- scheduled_date (DATE)
- completed (BOOLEAN)
- completed_at (TIMESTAMP)
- notes (TEXT)
- created_at, updated_at (TIMESTAMP)
```

#### `tone_presets`
Guitar tone and equipment configurations
```sql
- id (UUID, PK)
- user_id (UUID, FK to profiles)
- name (TEXT, UNIQUE per user)
- description (TEXT)
- guitar_model (TEXT)
- pickup_position (TEXT)
- amp_settings (JSONB) - e.g., {gain, bass, mid, treble, presence, volume}
- effects_chain (JSONB) - e.g., [{type, name, settings}, ...]
- style_tags (TEXT[]) - e.g., [Clean, Rock, Ballad]
- notes (TEXT)
- created_at, updated_at (TIMESTAMP)
```

#### `song_tone_presets`
Junction table linking songs to tone presets
```sql
- id (UUID, PK)
- song_id (UUID, FK to songs)
- preset_id (UUID, FK to tone_presets)
- section_note (TEXT)
- created_at (TIMESTAMP)
```

### Row Level Security (RLS)

All tables have RLS enabled with policies:
- **Projects:** Users can only access their own projects
- **Songs:** Users can only access songs in their projects
- **Tone Presets:** Users can only access their own presets
- **Song Tone Presets:** Users can only access links to their songs
- Other tables: Similar user-based access control

## Features Implemented

### 1. Authentication
- ✅ Sign up with email & password
- ✅ Sign in with email & password
- ✅ Sign out
- ✅ Session persistence
- ✅ Protected routes (redirect to signin if unauthenticated)
- ✅ Header shows auth state (user email, sign out button)

### 2. Project Management
- ✅ CRUD operations for projects
- ✅ Display projects in UI
- ✅ Organize songs by project
- ✅ Project statistics (song count, completion)

### 3. Song Management
- ✅ CRUD operations for songs
- ✅ Song details: title, artist, album, key, tempo, difficulty
- ✅ External links: tab URL, backing track URL, reference URL
- ✅ Song status tracking (Not Started → Performance Ready)
- ✅ Last played timestamp
- ✅ Notes and metadata

### 4. Song Component Tracking
- ✅ Define trackable components per song (Intro, Verse, Chorus, etc.)
- ✅ Progress tracking (0-100%)
- ✅ Custom component types
- ✅ Overall song completion calculated from components

### 5. Tone Presets
- ✅ CRUD tone presets (name, description, guitar model, pickup position)
- ✅ Amp settings (gain, bass, mid, treble, presence, volume)
- ✅ Effects chain (pedals with settings)
- ✅ Style tags (Clean, Crunch, Lead, Rhythm, etc.)
- ✅ Link presets to songs and sections
- ✅ Reuse presets across multiple songs

### 6. Practice Scheduling
- ✅ Schedule songs for specific dates
- ✅ Track completion status
- ✅ Add notes to practice sessions
- ✅ Daily schedule view

### 7. UI/UX
- ✅ Minimalistic black/white/gray design
- ✅ Responsive (mobile, tablet, desktop)
- ✅ Sidebar navigation (desktop)
- ✅ Bottom navigation (mobile)
- ✅ Card-based layout for songs
- ✅ Clean forms and input fields

## Setup Instructions

### 1. Prerequisites
- Node.js 16+ and npm
- Supabase account (free tier available at https://supabase.com)

### 2. Clone & Install
```bash
cd /workspaces/Rehearse
npm install
```

### 3. Create Supabase Project
1. Go to https://supabase.com and sign up
2. Create a new project
3. Copy your **Project URL** and **Anon Key**
4. (Optional but recommended) Get your **Service Role Key** for seeding

### 4. Set Environment Variables
```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # Optional, for seeding
```

### 5. Run Database Migrations
1. Open your Supabase project dashboard
2. Go to **SQL Editor** → **New Query**
3. Copy contents of `supabase/schema.sql` and paste into the editor
4. Click **Run**

This creates all tables, indexes, and RLS policies.

### 6. Start Development Server
```bash
npm run dev
```

Visit http://localhost:3001 (or the URL shown in terminal)

### 7. Create Your Account
1. Click "Sign up" on the signin page
2. Enter email, password, and full name
3. Account created! You're now signed in.

### 8. Get Your User ID
1. Go to Supabase dashboard
2. **Authentication** → **Users**
3. Copy your user's **UUID**

### 9. Seed Sample Data
```bash
npm run seed <your-user-uuid>
```

Example:
```bash
npm run seed "d20c01d0-685a-4c45-9ef2-0c0f6f0e5bff"
```

This creates:
- 2 sample projects (Pink Floyd Covers, Led Zeppelin Set)
- 3 sample songs with components
- 2 tone presets linked to songs

## Available Scripts

```bash
npm run dev          # Start dev server (Vite)
npm run build        # Build for production
npm run preview      # Preview production build
npm run seed <uuid>  # Seed sample data (requires SUPABASE_SERVICE_ROLE_KEY)
npm run migrate      # Run database migrations
```

## Important Files & Components

### Context Providers
- **`AuthContext.tsx`** - Manages user authentication state (sign in/up/out, session persistence)
- **`DataContext.tsx`** - Manages app data (projects, songs, tone presets, schedules)
  - Loads from Supabase if configured
  - Falls back to mock data if Supabase not available
  - Provides CRUD helper functions

### Key Components
- **`Layout.tsx`** - Main layout with sidebar/bottom nav, header with auth state
- **`ProtectedRoute.tsx`** - Route guard that redirects unauthenticated users to signin
- **`SongCard.tsx`** - Displays individual song with progress
- **`GlassCard.tsx`** - Glass-morphism UI card component

### Key Pages
- **`Dashboard.tsx`** - Landing page showing today's schedule and needs attention
- **`Projects.tsx`** - Manage projects (create, edit, delete)
- **`SongDetail.tsx`** - Single song detail with components and tone presets
- **`Schedule.tsx`** - Calendar/schedule view for practice sessions
- **`Tones.tsx`** - Manage tone presets

## Design System

### Color Palette
- Background: `#FAFAFA` (Off-white)
- Primary Text: `#111827` (Black)
- Secondary Text: `#6B7280` (Dark Gray)
- Borders: `#E5E7EB` (Light Gray)
- Interactive: Dark gray with subtle hover states

### Typography
- Font: Inter (sans-serif)
- Scale: Minimal hierarchy using font weights (200-600)
- Card-based layout with rounded corners (16px-32px)

### Responsive Breakpoints
- Mobile: < 768px (bottom navigation)
- Desktop: ≥ 768px (sidebar navigation)

## Development Notes

### State Management Pattern
- **AuthContext** - Authentication and user session state
- **DataContext** - Application data with Supabase integration
  - Falls back to mock data if Supabase not configured
  - Async data loading on mount
  - Basic CRUD operations without error handling (silent failures)

### Data Flow
1. App mounts → `AuthProvider` loads user session
2. If authenticated → `DataProvider` loads data from Supabase
3. Components consume via `useAuth()` and `useData()` hooks
4. Data changes are synced to Supabase

### Testing
- No automated tests configured yet
- Manual testing recommended (UI-driven)
- Mock data available in `constants.ts` for offline testing

## Troubleshooting

### "Supabase not configured"
- Ensure `.env` file exists in project root
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set
- Restart dev server after changing env vars

### "RLS policy violation" when seeding
- Add `SUPABASE_SERVICE_ROLE_KEY` to `.env`
- Service role key bypasses RLS policies (safe for seeding)
- Get it from Supabase Dashboard → Settings → API

### "User profile not found"
- Ensure the user UUID exists in Supabase `auth.users`
- Create account via signup page first
- Copy the correct UUID from Supabase Dashboard

### Blank page or 404
- Ensure Vite dev server is running (`npm run dev`)
- Check browser console for errors
- Verify routes in `App.tsx` are correct

## Future Enhancements

### Phase 2
- Collaborative features (share projects with band members)
- Setlist builder (create and order performance setlists)
- Built-in metronome and practice tools
- Direct audio recording and storage
- Mobile app (React Native)
- AI-powered practice schedule recommendations

### Phase 3
- Progress analytics and charts
- Social features (share progress with community)
- Export/print PDF songbooks
- AI tone matching suggestions
- Equipment database integration

## Security & Performance

### Security
- RLS policies enforce user-level data isolation
- All external links should be validated before display
- Consider adding rate limiting for auth endpoints
- Sanitize user input in notes/descriptions

### Performance
- Implement pagination for large song lists
- Lazy load video thumbnails
- Consider virtual scrolling for long lists
- Supabase real-time subscriptions (optional, use sparingly)

### Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Responsive design for mobile, tablet, desktop
- PWA-ready (can be enhanced in future)

## Contact & Support

For questions or issues, refer to:
- [Supabase Documentation](https://supabase.com/docs)
- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [Tailwind CSS](https://tailwindcss.com)

---

**Last Updated:** December 12, 2025  
**Project Name:** Tribute Band Song Tracker  
**Status:** MVP Ready
