/**
 * SUPABASE TABLE: emergencies
 * ──────────────────────────────────────────────────────────────
 * This file documents the Supabase table schema that replaces
 * the former Mongoose Emergency model.
 *
 * Run the following SQL in your Supabase SQL editor:
 *
 *   CREATE TABLE IF NOT EXISTS emergencies (
 *     id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
 *     user_id     UUID        REFERENCES users(id),
 *     code        TEXT        NOT NULL,
 *     expires_at  TIMESTAMPTZ NOT NULL,
 *     is_active   BOOLEAN     DEFAULT true,
 *     created_at  TIMESTAMPTZ DEFAULT now()
 *   );
 *
 * NOTE: Mongoose is no longer used. All queries go through
 * config/supabase.js using the @supabase/supabase-js client.
 */