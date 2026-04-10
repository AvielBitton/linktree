import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const envPath = resolve(__dirname, '..', '.env')
const envContent = readFileSync(envPath, 'utf-8')
const env = {}
for (const line of envContent.split('\n')) {
  const idx = line.indexOf('=')
  if (idx > 0) env[line.slice(0, idx).trim()] = line.slice(idx + 1).trim()
}

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

async function run() {
  console.log('Attempting to seed workout templates...')
  console.log('URL:', env.SUPABASE_URL)

  const gymDataPath = resolve(__dirname, '..', 'lib', 'gym-data.js')
  const gymDataModule = await import(gymDataPath)
  const WORKOUT_TEMPLATES = gymDataModule.WORKOUT_TEMPLATES

  const rows = WORKOUT_TEMPLATES.map(t => ({
    id: t.id,
    name: t.name,
    name_he: t.name_he,
    color: t.color,
    muscles: t.muscles,
    sort_order: t.sort_order,
    exercises: t.exercises,
  }))

  const { error: seedError, data } = await supabase
    .from('workout_templates')
    .upsert(rows, { onConflict: 'id' })
    .select()

  if (seedError) {
    console.error('Seed error:', seedError.message)
    console.log('')
    console.log('Tables likely do not exist. Run this SQL in the Supabase SQL Editor:')
    printSQL()
    process.exit(1)
  }

  console.log(`Seeded ${data.length} workout templates.`)

  const { data: verify } = await supabase
    .from('workout_templates')
    .select('id, name, sort_order')
    .order('sort_order')

  console.log('Verification:', verify)
  console.log('Done!')
}

function printSQL() {
  console.log(`
CREATE TABLE workout_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_he TEXT,
  color TEXT,
  muscles JSONB DEFAULT '[]',
  sort_order INTEGER DEFAULT 0,
  exercises JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE workout_sessions (
  id TEXT PRIMARY KEY,
  template_id TEXT NOT NULL REFERENCES workout_templates(id),
  started_at TIMESTAMPTZ NOT NULL,
  finished_at TIMESTAMPTZ,
  duration_sec INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE exercise_logs (
  id SERIAL PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
  exercise_key TEXT NOT NULL,
  set_number INTEGER NOT NULL,
  weight_kg REAL DEFAULT 0,
  reps INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE weight_logs (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  weight_kg REAL NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_exercise_logs_session ON exercise_logs(session_id);
CREATE INDEX idx_exercise_logs_key ON exercise_logs(exercise_key);
CREATE INDEX idx_workout_sessions_template ON workout_sessions(template_id);
CREATE INDEX idx_weight_logs_date ON weight_logs(date DESC);
  `)
}

run().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
