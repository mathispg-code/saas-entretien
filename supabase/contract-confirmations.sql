create table public.contract_confirmations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  stripe_checkout_session_id text not null unique,
  status text not null default 'pending' check (
    status in ('pending', 'retry', 'sent', 'failed_permanent', 'skipped_no_email')
  ),
  attempts integer not null default 0,
  claimed_at timestamptz,
  sent_at timestamptz,
  resend_email_id text,
  last_error text,
  template_id text,
  cgv_version text,
  cgv_pdf_sha256 text,
  body_text text,
  consent_id uuid references public.consents (id) on delete set null
);

create index contract_confirmations_open_idx
  on public.contract_confirmations (created_at)
  where status in ('pending', 'retry');

alter table public.contract_confirmations enable row level security;
alter table public.contract_confirmations force row level security;

revoke all on public.contract_confirmations from public;
revoke all on public.contract_confirmations from anon;
revoke all on public.contract_confirmations from authenticated;

grant select, insert, update on public.contract_confirmations to service_role;
