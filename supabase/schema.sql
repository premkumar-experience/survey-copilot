-- Survey Copilot — Supabase schema.
--
-- Run this once in the Supabase SQL editor (Dashboard → SQL Editor → New
-- query). There is no migration tooling for the hackathon; this file is the
-- source of truth for the table shape.
--
-- Then put the project URL and the SERVICE ROLE key in .env.local:
--
--   SUPABASE_URL=https://<project>.supabase.co
--   SUPABASE_SERVICE_ROLE_KEY=<service role key>
--
-- Neither is NEXT_PUBLIC_*. The service role key bypasses row-level security
-- and must never reach the browser.

create table if not exists public.surveys (
  -- The app's own id (e.g. 'svy_3a7f2k'), not a uuid: lib/survey/helpers.ts
  -- mints it client-side, so reusing it here keeps the upsert idempotent with
  -- no second identity to reconcile.
  id          text primary key,

  -- Extracted from `data` on every write purely so the dashboard list query
  -- never has to pull the whole document.
  title       text not null default 'Untitled Survey',
  status      text not null default 'draft',

  -- The whole Survey object: sections, questions, logic, emails, meta.
  data        jsonb not null,

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- The dashboard lists most-recently-edited first.
create index if not exists surveys_updated_at_idx
  on public.surveys (updated_at desc);

-- RLS on with NO policies, deliberately.
--
-- This app has no auth: every request is served by the Next.js server holding
-- the service role key, which bypasses RLS. Enabling RLS without policies
-- means the anon and authenticated keys can read and write *nothing*, so the
-- table stays closed even if a public key is later added to the client.
--
-- Do not add `create policy ... using (true)` to "make it work" — that turns
-- "no auth" into a world-writable table.
alter table public.surveys enable row level security;
