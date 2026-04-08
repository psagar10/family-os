import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'
import { existsSync, mkdirSync } from 'fs'
import { dirname } from 'path'

const dbPath = process.env.DATABASE_PATH || './data/family-os.db'

// Ensure data directory exists
const dir = dirname(dbPath)
if (!existsSync(dir)) {
  mkdirSync(dir, { recursive: true })
}

const sqlite = new Database(dbPath)
sqlite.pragma('journal_mode = WAL')

export const db = drizzle(sqlite, { schema })

// Initialize tables if they don't exist
export function initializeDatabase() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS members (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      pin TEXT NOT NULL,
      avatar TEXT,
      role TEXT NOT NULL DEFAULT 'member',
      age INTEGER,
      biological_sex TEXT,
      weight REAL,
      height REAL,
      activity_level TEXT DEFAULT 'moderate',
      health_goal TEXT DEFAULT 'maintenance',
      dietary_restrictions TEXT,
      medical_notes TEXT,
      notification_channels TEXT,
      contact_info TEXT,
      weekly_capacity_minutes INTEGER DEFAULT 300,
      work_schedule TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS recipes (
      id TEXT PRIMARY KEY,
      canonical_id TEXT,
      version_name TEXT DEFAULT 'Original',
      name TEXT NOT NULL,
      description TEXT,
      cuisine_tag TEXT,
      meal_type TEXT NOT NULL,
      base_servings INTEGER NOT NULL DEFAULT 4,
      prep_mins INTEGER DEFAULT 0,
      cook_mins INTEGER DEFAULT 0,
      total_mins INTEGER DEFAULT 0,
      difficulty TEXT DEFAULT 'medium',
      is_shared_meal INTEGER DEFAULT 0,
      tags TEXT,
      source_url TEXT,
      source_type TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS recipe_ingredients (
      id TEXT PRIMARY KEY,
      recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit TEXT NOT NULL,
      prep_note TEXT,
      substitution TEXT,
      is_optional INTEGER DEFAULT 0,
      sort_order INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS recipe_steps (
      id TEXT PRIMARY KEY,
      recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
      sort_order INTEGER NOT NULL,
      instruction TEXT NOT NULL,
      is_passive INTEGER DEFAULT 0,
      timer_mins INTEGER,
      lead_time_mins INTEGER,
      lead_time_note TEXT
    );

    CREATE TABLE IF NOT EXISTS recipe_nutrition (
      recipe_id TEXT PRIMARY KEY REFERENCES recipes(id),
      per_servings INTEGER NOT NULL DEFAULT 1,
      calories REAL,
      protein_g REAL,
      carbs_g REAL,
      fat_g REAL,
      fibre_g REAL,
      sugar_g REAL,
      sodium_mg REAL,
      confidence REAL DEFAULT 0.7,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS meal_plans (
      id TEXT PRIMARY KEY,
      week_start TEXT NOT NULL,
      week_end TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS meal_plan_slots (
      id TEXT PRIMARY KEY,
      meal_plan_id TEXT NOT NULL REFERENCES meal_plans(id),
      day TEXT NOT NULL,
      meal_type TEXT NOT NULL,
      recipe_id TEXT REFERENCES recipes(id),
      is_leftover_of TEXT,
      portion_notes TEXT,
      status TEXT DEFAULT 'planned',
      actual_recipe_id TEXT REFERENCES recipes(id),
      feedback_note TEXT,
      rating INTEGER
    );

    CREATE TABLE IF NOT EXISTS pantry_items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      quantity REAL,
      unit TEXT,
      added_at INTEGER NOT NULL,
      expires_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS member_nutrition_targets (
      member_id TEXT PRIMARY KEY REFERENCES members(id),
      tdee_kcal REAL,
      goal_kcal REAL,
      protein_g REAL,
      carbs_g REAL,
      fat_g REAL,
      fibre_g REAL,
      calcium_mg REAL,
      iron_mg REAL,
      vitamin_d_mcg REAL,
      is_custom INTEGER DEFAULT 0,
      calculated_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS task_templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      estimated_minutes INTEGER DEFAULT 30,
      is_recurring INTEGER DEFAULT 0,
      recurrence_pattern TEXT,
      priority TEXT DEFAULT 'medium',
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      template_id TEXT REFERENCES task_templates(id),
      name TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      estimated_minutes INTEGER DEFAULT 30,
      priority TEXT DEFAULT 'medium',
      status TEXT NOT NULL DEFAULT 'pending',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS task_assignments (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL REFERENCES tasks(id),
      week_plan_id TEXT NOT NULL REFERENCES week_plans(id),
      assigned_to TEXT REFERENCES members(id),
      scheduled_date TEXT NOT NULL,
      variant TEXT DEFAULT 'standard',
      status TEXT DEFAULT 'pending',
      source TEXT DEFAULT 'manual',
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS week_plans (
      id TEXT PRIMARY KEY,
      week_start TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS rules (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      config TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS modes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      is_active INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS calendar_events (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      all_day INTEGER DEFAULT 1,
      source TEXT DEFAULT 'manual',
      external_id TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notification_log (
      id TEXT PRIMARY KEY,
      member_id TEXT REFERENCES members(id),
      channel TEXT NOT NULL,
      message TEXT NOT NULL,
      sent_at INTEGER NOT NULL,
      status TEXT NOT NULL
    );
  `)
}

// Run initialization
initializeDatabase()
