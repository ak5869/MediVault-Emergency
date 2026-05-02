/**
 * SUPABASE TABLE: access_logs
 * ──────────────────────────────────────────────────────────────
 * This file documents the Supabase table schema that replaces
 * the former Mongoose AccessLog model (which was incomplete).
 *
 * Run the following SQL in your Supabase SQL editor:
 *
 *   CREATE TABLE IF NOT EXISTS access_logs (
 *     id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
 *     user_id         UUID        REFERENCES users(id),
 *     hospital_name   TEXT,
 *     method          TEXT,       -- 'QR' or 'Code'
 *     accessed_at     TIMESTAMPTZ DEFAULT now(),
 *     status          TEXT
 *   );
 *
 * NOTE: Mongoose is no longer used. All queries go through
 * config/supabase.js using the @supabase/supabase-js client.
 */