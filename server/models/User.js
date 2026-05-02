/**
 * SUPABASE TABLE: users
 * ──────────────────────────────────────────────────────────────
 * This file documents the Supabase table schema that replaces
 * the former Mongoose User model.
 *
 * Run the following SQL in your Supabase SQL editor to create
 * (or verify) this table:
 *
 *   CREATE TABLE IF NOT EXISTS users (
 *     id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
 *     name        TEXT        NOT NULL,
 *     email       TEXT        UNIQUE NOT NULL,
 *     password    TEXT        NOT NULL,   -- bcrypt hash
 *     phone       TEXT,
 *     created_at  TIMESTAMPTZ DEFAULT now()
 *   );
 *
 * NOTE: Mongoose is no longer used. All queries go through
 * config/supabase.js using the @supabase/supabase-js client.
 */
