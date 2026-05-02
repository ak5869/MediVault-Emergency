/**
 * SUPABASE TABLE: patients
 * ──────────────────────────────────────────────────────────────
 * This file documents the Supabase table schema that replaces
 * the former Mongoose Patient model.
 *
 * Run the following SQL in your Supabase SQL editor:
 *
 *   CREATE TABLE IF NOT EXISTS patients (
 *     id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
 *     user_id             UUID        REFERENCES users(id),
 *     name                TEXT        NOT NULL,
 *     blood_group         TEXT,
 *     date_of_birth       DATE,
 *     gender              TEXT,
 *     height_cm           NUMERIC,
 *     weight_kg           NUMERIC,
 *     allergies           TEXT[],
 *     conditions          TEXT[],
 *     medications         JSONB,       -- [{ name, dosage }]
 *     emergency_contact   JSONB,       -- { name, phone }
 *     attendance          INTEGER     DEFAULT 0,
 *     created_at          TIMESTAMPTZ DEFAULT now(),
 *     updated_at          TIMESTAMPTZ DEFAULT now()
 *   );
 *
 * ─── Migration SQL (if table already exists): ────────────────
 *
 *   ALTER TABLE patients ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);
 *   ALTER TABLE patients ADD COLUMN IF NOT EXISTS date_of_birth DATE;
 *   ALTER TABLE patients ADD COLUMN IF NOT EXISTS gender TEXT;
 *   ALTER TABLE patients ADD COLUMN IF NOT EXISTS height_cm NUMERIC;
 *   ALTER TABLE patients ADD COLUMN IF NOT EXISTS weight_kg NUMERIC;
 *   ALTER TABLE patients ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
 *
 * NOTE: Mongoose is no longer used. All queries go through
 * config/supabase.js using the @supabase/supabase-js client.
 */