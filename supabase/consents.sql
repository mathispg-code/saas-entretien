create table public.consents (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  stripe_checkout_session_id text not null unique,
  plan text not null check (plan in ('unique', 'hebdo', 'mensuel')),
  cgv_version text not null,
  consent_text_id text not null,
  consent_text text not null,
  stripe_consent text check (stripe_consent is null or stripe_consent = 'accepted'),
  consented_at timestamptz not null,
  email text,
  generation_id uuid references public.generations (id) on delete set null,
  access_id uuid references public.access (id) on delete set null
);

create index consents_email_idx on public.consents (lower(email));
create index consents_generation_id_idx on public.consents (generation_id) where generation_id is not null;
create index consents_access_id_idx on public.consents (access_id) where access_id is not null;

alter table public.consents enable row level security;
alter table public.consents force row level security;

revoke all on public.consents from public;
revoke all on public.consents from anon;
revoke all on public.consents from authenticated;

grant select, insert on public.consents to service_role;
