# Supabase Scripts

This directory contains helper scripts for setting up and maintaining the Tribute Band Song Tracker database.

## Setup Steps

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign in or create an account
3. Create a new project
4. Copy your `Project URL` and `Anon Key`

### 2. Set Environment Variables

Create a `.env` file in the project root (copy from `.env.example`):

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Run Migrations

Run the SQL schema to create all tables and policies:

**Option A (Recommended): Manual via Supabase UI**
1. Open [Supabase Dashboard](https://app.supabase.com)
2. Go to SQL Editor
3. Click "New Query"
4. Copy the contents of `supabase/schema.sql` and paste into the editor
5. Click "Run"

**Option B: Via script (requires additional setup)**
```bash
npm run migrate
```

### 4. Create Your First User

1. Sign up at `http://localhost:3001/#/signup`
2. Create a new account with email and password
3. In Supabase Dashboard → Authentication → Users, copy your user's UUID

### 5. Seed Sample Data

After creating a user, seed sample projects, songs, and tone presets:

```bash
npm run seed <user_uuid>
```

Example:
```bash
npm run seed "550e8400-e29b-41d4-a716-446655440000"
```

This will create:
- 2 sample projects (Pink Floyd, Led Zeppelin)
- 3 sample songs with components
- 2 tone presets linked to songs

## Scripts

### `seed.js`
Populates the database with sample data (projects, songs, components, tone presets).

**Usage:**
```bash
node scripts/seed.js <user_id>
```

**Required:** User must exist in `auth.users` table.

### `migrate.js`
Runs the schema migrations (creates tables, indexes, and RLS policies).

**Usage:**
```bash
node scripts/migrate.js
```

**Note:** This script has limited functionality due to Supabase API restrictions. For best results, manually run schema.sql in the SQL Editor.

## Troubleshooting

**"Supabase not configured"**
- Ensure `.env` file is created with valid URL and key
- Restart dev server after changing env vars

**"User not found" during seed**
- User UUID must exist in `auth.users` table
- Create account via signup page first, then copy UUID from Supabase Dashboard

**RLS policy errors**
- Ensure migrations were run successfully
- Check Supabase Dashboard → Authentication → Policies

## Next Steps

- Open the app: `http://localhost:3001`
- Sign in with your account
- Seed sample data to start exploring features
- Build your song tracker!
