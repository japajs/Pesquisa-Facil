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

-- ============================================================
-- Módulo: Votação de Condomínio (peso por unidades)
-- Fluxo separado de surveys/clients — não afeta o existente.
-- ============================================================

-- ─── Tabela: condominios ───────────────────────────────────────
create table if not exists condominios (
  id         uuid        primary key default uuid_generate_v4(),
  nome       text        not null,
  created_at timestamptz not null default now()
);

-- ─── Tabela: proprietarios ──────────────────────────────────────
-- Cadastro permanente. Peso é sempre calculado a partir de unidades —
-- nunca armazenado aqui ou em qualquer outra tabela.
create table if not exists proprietarios (
  id            uuid        primary key default uuid_generate_v4(),
  condominio_id uuid        not null references condominios(id) on delete cascade,
  nome          text        not null,
  email         text        not null,
  telefone      text,
  created_at    timestamptz not null default now(),
  unique (condominio_id, email)
);

-- ─── Tabela: unidades ────────────────────────────────────────────
-- Vendeu/comprou apartamento? Só mexe aqui. Nenhuma pesquisa precisa
-- ser atualizada — o peso é recalculado dinamicamente em toda consulta.
create table if not exists unidades (
  id              uuid        primary key default uuid_generate_v4(),
  proprietario_id uuid        not null references proprietarios(id) on delete cascade,
  numero          text        not null,
  bloco           text,
  created_at      timestamptz not null default now()
);

-- ─── Tabela: condo_surveys ────────────────────────────────────────
-- Votação de pergunta única (Sim/Não/Abstenção) escopada a um condomínio.
create table if not exists condo_surveys (
  id               uuid        primary key default uuid_generate_v4(),
  condominio_id    uuid        not null references condominios(id) on delete cascade,
  titulo           text        not null,
  descricao        text,
  pergunta         text        not null,
  status           text        not null default 'rascunho'
                               check (status in ('rascunho', 'aberta', 'encerrada')),
  data_abertura    timestamptz,
  data_encerramento timestamptz,
  created_at       timestamptz not null default now()
);

-- ─── Tabela: condo_survey_sends ────────────────────────────────────
create table if not exists condo_survey_sends (
  id              uuid        primary key default uuid_generate_v4(),
  condo_survey_id uuid        not null references condo_surveys(id) on delete cascade,
  proprietario_id uuid        not null references proprietarios(id) on delete cascade,
  token           text        not null unique,
  status          text        not null default 'pending'
                              check (status in ('pending', 'sent', 'failed')),
  sent_at         timestamptz,
  created_at      timestamptz not null default now()
);

-- ─── Tabela: condo_survey_responses ─────────────────────────────────
-- send_id é UNIQUE: cada proprietário responde uma única vez por votação.
-- SEM coluna de peso — peso é sempre calculado a partir de unidades
-- no momento da apuração (ver lib/peso.ts).
create table if not exists condo_survey_responses (
  id         uuid        primary key default uuid_generate_v4(),
  send_id    uuid        not null unique references condo_survey_sends(id) on delete cascade,
  resposta   text        not null check (resposta in ('Sim', 'Não', 'Abstenção')),
  created_at timestamptz not null default now()
);

-- ─── Índices ─────────────────────────────────────────────────────────
create index if not exists idx_proprietarios_condominio_id        on proprietarios(condominio_id);
create index if not exists idx_unidades_proprietario_id           on unidades(proprietario_id);
create index if not exists idx_condo_surveys_condominio_id        on condo_surveys(condominio_id);
create index if not exists idx_condo_survey_sends_condo_survey_id on condo_survey_sends(condo_survey_id);
create index if not exists idx_condo_survey_sends_proprietario_id on condo_survey_sends(proprietario_id);
create index if not exists idx_condo_survey_sends_token           on condo_survey_sends(token);
create index if not exists idx_condo_survey_responses_send_id     on condo_survey_responses(send_id);

-- ─── Row Level Security ─────────────────────────────────────────────
alter table condominios            enable row level security;
alter table proprietarios          enable row level security;
alter table unidades               enable row level security;
alter table condo_surveys          enable row level security;
alter table condo_survey_sends     enable row level security;
alter table condo_survey_responses enable row level security;

-- Sem políticas públicas = sem acesso via anon key (mesmo padrão acima)

-- ============================================================
-- Migração: Etapa 3 — novos campos
-- Execute este bloco no Supabase SQL Editor se as tabelas já existem.
-- ============================================================

-- proprietarios: adiciona telefone (opcional)
alter table proprietarios add column if not exists telefone text;

-- condo_surveys: adiciona status e datas
alter table condo_surveys add column if not exists status text not null default 'rascunho';
alter table condo_surveys add column if not exists data_abertura timestamptz;
alter table condo_surveys add column if not exists data_encerramento timestamptz;

-- Remove o CHECK antigo e recria com os três valores
do $$
begin
  if exists (
    select 1 from pg_constraint
    where conname = 'condo_surveys_status_check'
      and conrelid = 'condo_surveys'::regclass
  ) then
    alter table condo_surveys drop constraint condo_surveys_status_check;
  end if;
end $$;
alter table condo_surveys
  add constraint condo_surveys_status_check
  check (status in ('rascunho', 'aberta', 'encerrada'));

-- condo_survey_responses: atualiza CHECK de resposta para incluir Abstenção
alter table condo_survey_responses drop constraint if exists condo_survey_responses_resposta_check;
alter table condo_survey_responses
  add constraint condo_survey_responses_resposta_check
  check (resposta in ('Sim', 'Não', 'Abstenção'));
