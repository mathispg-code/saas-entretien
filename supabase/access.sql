-- A executer une fois dans le SQL Editor du projet Supabase (apres schema.sql).
-- Acces "Pass hebdo" (paiement unique, 7 jours) et "Illimite" (abonnement
-- mensuel) : un acces est rattache a un acheteur (email du Checkout Stripe)
-- et a son appareil via un cookie dont seul le hash est stocke ici.

create table public.access (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Email saisi par l'acheteur dans Stripe Checkout (sert a la recuperation
  -- d'acces par email, etape suivante).
  email text,

  plan text not null check (plan in ('hebdo', 'mensuel')),

  -- Pass hebdo : toujours 'active' (la validite se lit dans expires_at).
  -- Abonnement : statut Stripe de l'abonnement, tel quel.
  status text not null default 'active' check (
    status in (
      'active', 'trialing', 'past_due', 'unpaid',
      'canceled', 'incomplete', 'incomplete_expired', 'paused'
    )
  ),

  -- Pass hebdo : date de fin (paiement + 7 jours). Obligatoire pour ce plan.
  expires_at timestamptz,
  -- Abonnement : fin de la periode en cours, et resiliation programmee.
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,

  -- Identifiants Stripe. La session Checkout est unique : elle garantit
  -- l'idempotence du webhook et l'usage unique de la "reclamation" du cookie.
  stripe_checkout_session_id text not null unique,
  stripe_customer_id text,
  stripe_subscription_id text unique,

  -- SHA-256 du jeton place dans le cookie de l'acheteur (le jeton lui-meme
  -- n'est jamais stocke). Null tant que l'acces n'a pas ete reclame.
  token_hash text unique,
  claimed_at timestamptz,

  constraint access_hebdo_needs_expiry check (plan <> 'hebdo' or expires_at is not null),
  constraint access_mensuel_needs_subscription check (plan <> 'mensuel' or stripe_subscription_id is not null)
);

create index access_stripe_customer_id_idx on public.access (stripe_customer_id);
create index access_email_idx on public.access (lower(email));

-- Securite : RLS active, aucune policy, aucun droit pour anon ni
-- authenticated. Seul service_role (cote serveur Next.js) peut lire/ecrire.
alter table public.access enable row level security;
alter table public.access force row level security;

revoke all on public.access from public;
revoke all on public.access from anon;
revoke all on public.access from authenticated;

grant select, insert, update on public.access to service_role;

-- Plafond anti-abus ("usage raisonnable") : chaque generation creee grace a un
-- acces illimite est rattachee a cet acces, pour compter les generations des
-- dernieres 24 h.
alter table public.generations
  add column access_id uuid references public.access (id) on delete set null;

create index generations_access_id_created_at_idx
  on public.generations (access_id, created_at);

-- Verification (a lancer apres) : doit montrer relrowsecurity = true et
-- UNIQUEMENT service_role (select, insert, update) dans les droits.
--
--   select relname, relrowsecurity, relforcerowsecurity
--     from pg_class where oid = 'public.access'::regclass;
--
--   select grantee, privilege_type
--     from information_schema.role_table_grants
--    where table_schema = 'public' and table_name = 'access'
--    order by grantee, privilege_type;
