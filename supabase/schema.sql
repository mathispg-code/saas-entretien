-- A executer une fois dans le SQL Editor du projet Supabase.
-- Trace chaque generation de questions (gratuite ou payante) pour permettre,
-- a l'etape 3, de verifier si une generation a ete payee (via Stripe).

create extension if not exists pgcrypto;

create table generations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  paid boolean not null default false,
  stripe_session_id text
);

alter table generations enable row level security;
-- Aucune policy creee : seul service_role (qui bypass RLS) peut lire/ecrire.
-- Le client ne parle jamais directement a Supabase, uniquement via nos
-- routes Next.js (qui utilisent la cle service_role cote serveur).

-- Necessaire en plus de BYPASSRLS : Postgres verifie d'abord les grants de
-- table, avant meme d'evaluer RLS. Sans ce GRANT explicite, service_role se
-- prend un "permission denied for table" malgre le bypass RLS (comportement
-- rencontre sur ce projet, meme avec la nouvelle cle secrete sb_secret_...).
grant select, insert, update on public.generations to service_role;
