-- A executer une fois dans le SQL Editor du projet Supabase (apres access.sql).
-- Recuperation d'acces par email (lien magique) : jetons a usage unique et
-- journal des demandes pour les limites anti-abus.

create table public.access_login_tokens (
  id uuid primary key default gen_random_uuid(),
  access_id uuid not null references public.access (id) on delete cascade,
  -- SHA-256 du jeton place dans le lien de l'email (le jeton n'est jamais stocke).
  token_hash text not null unique,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at timestamptz,
  constraint access_login_tokens_expiry_after_creation check (expires_at > created_at)
);

create index access_login_tokens_access_id_created_at_idx
  on public.access_login_tokens (access_id, created_at);
create index access_login_tokens_expires_at_idx
  on public.access_login_tokens (expires_at);

-- Une ligne par demande de recuperation, que l'adresse soit connue ou non :
-- les limites par adresse et par IP comptent les tentatives (aucune
-- difference visible entre adresse connue et inconnue). Le plafond global
-- quotidien ne compte que les envois reels (email_sent = true), pour qu'un
-- robot qui tape des adresses inconnues ne puisse pas bloquer les clients.
-- Adresse et IP ne sont conservees que sous forme d'empreinte (HMAC).
create table public.access_recovery_attempts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  email_hash text not null,
  ip_hash text not null,
  email_sent boolean not null default false
);

create index access_recovery_attempts_email_hash_created_at_idx
  on public.access_recovery_attempts (email_hash, created_at);
create index access_recovery_attempts_ip_hash_created_at_idx
  on public.access_recovery_attempts (ip_hash, created_at);
create index access_recovery_attempts_sent_created_at_idx
  on public.access_recovery_attempts (created_at) where email_sent;

-- Securite : RLS active et forcee, aucune policy, aucun droit pour anon ni
-- authenticated. Seul service_role (cote serveur Next.js) peut lire/ecrire.
-- DELETE est accorde sur ces 2 tables uniquement (donnees operationnelles) pour
-- permettre la purge quotidienne des jetons expires et des anciennes demandes.
alter table public.access_login_tokens enable row level security;
alter table public.access_login_tokens force row level security;
alter table public.access_recovery_attempts enable row level security;
alter table public.access_recovery_attempts force row level security;

revoke all on public.access_login_tokens from public;
revoke all on public.access_login_tokens from anon;
revoke all on public.access_login_tokens from authenticated;
revoke all on public.access_recovery_attempts from public;
revoke all on public.access_recovery_attempts from anon;
revoke all on public.access_recovery_attempts from authenticated;

grant select, insert, update, delete on public.access_login_tokens to service_role;
grant select, insert, update, delete on public.access_recovery_attempts to service_role;
