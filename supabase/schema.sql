-- ============================================================
-- Pesquisa Fácil — Schema SQL
-- Execute este script no SQL Editor do Supabase:
-- https://supabase.com/dashboard → SQL Editor → New query
-- ============================================================

-- Habilita a extensão de UUID
create extension if not exists "uuid-ossp";

-- ─── Tabela: surveys ─────────────────────────────────────────
create table if not exists surveys (
  id          uuid        primary key default uuid_generate_v4(),
  title       text        not null,
  description text,
  questions   jsonb       not null default '[]'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ─── Tabela: clients ─────────────────────────────────────────
create table if not exists clients (
  id         uuid        primary key default uuid_generate_v4(),
  name       text        not null,
  company    text,
  email      text        not null unique,
  created_at timestamptz not null default now()
);

-- ─── Tabela: survey_sends ────────────────────────────────────
create table if not exists survey_sends (
  id         uuid        primary key default uuid_generate_v4(),
  survey_id  uuid        not null references surveys(id)  on delete cascade,
  client_id  uuid        not null references clients(id)  on delete cascade,
  token      text        not null unique,
  status     text        not null default 'pending'
                         check (status in ('pending', 'sent', 'failed')),
  sent_at    timestamptz,
  created_at timestamptz not null default now()
);

-- ─── Tabela: survey_responses ────────────────────────────────
-- send_id é UNIQUE: garante que cada link só pode ser respondido uma vez
create table if not exists survey_responses (
  id           uuid        primary key default uuid_generate_v4(),
  send_id      uuid        not null unique references survey_sends(id) on delete cascade,
  answers      jsonb       not null default '[]'::jsonb,
  responded_at timestamptz not null default now()
);

-- ─── Trigger: atualiza updated_at em surveys ─────────────────
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists surveys_updated_at on surveys;
create trigger surveys_updated_at
  before update on surveys
  for each row execute function update_updated_at();

-- ─── Índices ─────────────────────────────────────────────────
create index if not exists idx_survey_sends_survey_id   on survey_sends(survey_id);
create index if not exists idx_survey_sends_client_id   on survey_sends(client_id);
create index if not exists idx_survey_sends_token        on survey_sends(token);
create index if not exists idx_survey_sends_status       on survey_sends(status);
create index if not exists idx_survey_responses_send_id  on survey_responses(send_id);

-- ─── Row Level Security ───────────────────────────────────────
-- O service role key (usado pelo Next.js) bypassa o RLS automaticamente.
-- Isso garante que nenhum acesso direto via anon key funcione.
alter table surveys         enable row level security;
alter table clients         enable row level security;
alter table survey_sends    enable row level security;
alter table survey_responses enable row level security;

-- Sem políticas públicas = sem acesso via anon key
-- Toda a comunicação ocorre via service role key no servidor Next.js.
