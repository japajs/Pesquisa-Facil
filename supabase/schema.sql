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

-- ─── Tabela: configuracoes ──────────────────────────────────────────────────
-- Chave-valor para configurações do sistema. Lida apenas server-side.
create table if not exists configuracoes (
  chave      text        primary key,
  valor      text        not null,
  updated_at timestamptz not null default now()
);

-- Valores padrão (não sobrescreve se já existir)
insert into configuracoes (chave, valor) values
  ('admin_nome',                    'Administrador'),
  ('admin_email',                   'admin@exemplo.com'),
  ('auth_password',                 ''),
  ('email_nome_remetente',          'Sistema de Votação'),
  ('votacao_resposta_unica',        'true'),
  ('votacao_ponderada',             'true'),
  ('votacao_permite_abstencao',     'true'),
  ('votacao_encerramento_automatico', 'false')
on conflict (chave) do nothing;

alter table configuracoes enable row level security;

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

-- ============================================================
-- Migração: Etapa 7 — tabela configuracoes
-- ============================================================

create table if not exists configuracoes (
  chave      text        primary key,
  valor      text        not null,
  updated_at timestamptz not null default now()
);

insert into configuracoes (chave, valor) values
  ('admin_nome',                    'Administrador'),
  ('admin_email',                   'admin@exemplo.com'),
  ('auth_password',                 ''),
  ('email_nome_remetente',          'Sistema de Votação'),
  ('votacao_resposta_unica',        'true'),
  ('votacao_ponderada',             'true'),
  ('votacao_permite_abstencao',     'true'),
  ('votacao_encerramento_automatico', 'false')
on conflict (chave) do nothing;

alter table configuracoes enable row level security;

-- ============================================================
-- Migração: Etapa 1 (evolução de pautas) — Pautas de Múltipla Escolha
-- Execute este bloco no Supabase SQL Editor. É idempotente e aditivo:
-- toda pauta existente recebe tipo='sim_nao' automaticamente (default de
-- coluna) e nenhum voto já registrado é alterado.
--
-- NOTA: as tabelas reais deste módulo em produção são `assembleias`,
-- `pautas`, `assembleia_sends` e `assembleia_respostas` (não os nomes
-- `condo_surveys`/`condo_survey_*` usados mais acima neste arquivo — esse
-- bloco antigo ficou desatualizado quando o módulo foi renomeado e não foi
-- corrigido aqui; fica fora do escopo desta migração).
-- ============================================================

-- pautas: tipo da pauta e permissão de abstenção
alter table pautas add column if not exists tipo text not null default 'sim_nao';
alter table pautas add column if not exists permite_abstencao boolean not null default true;

alter table pautas drop constraint if exists pautas_tipo_check;
alter table pautas add constraint pautas_tipo_check
  check (tipo in ('sim_nao', 'multipla_escolha'));

-- pauta_opcoes: opções de uma pauta de múltipla escolha (ex.: candidatos)
create table if not exists pauta_opcoes (
  id         uuid        primary key default uuid_generate_v4(),
  pauta_id   uuid        not null references pautas(id) on delete cascade,
  ordem      integer     not null,
  label      text        not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_pauta_opcoes_pauta_id on pauta_opcoes(pauta_id);
alter table pauta_opcoes enable row level security;

-- assembleia_respostas: resposta fixa (Sim/Não/Abstenção) vira opcional,
-- e ganha opcao_id para votos em pautas de múltipla escolha. Toda linha
-- existente já tem `resposta` preenchido e `opcao_id` nulo, então a nova
-- constraint XOR abaixo já é satisfeita por todo o histórico de votos.
alter table assembleia_respostas alter column resposta drop not null;
alter table assembleia_respostas add column if not exists opcao_id uuid
  references pauta_opcoes(id) on delete restrict;
create index if not exists idx_assembleia_respostas_opcao_id on assembleia_respostas(opcao_id);

alter table assembleia_respostas drop constraint if exists assembleia_respostas_resposta_check;
alter table assembleia_respostas add constraint assembleia_respostas_resposta_check
  check (resposta is null or resposta in ('Sim', 'Não', 'Abstenção'));

alter table assembleia_respostas drop constraint if exists assembleia_respostas_resposta_xor_opcao;
alter table assembleia_respostas add constraint assembleia_respostas_resposta_xor_opcao
  check ((resposta is not null)::int + (opcao_id is not null)::int = 1);

-- ============================================================
-- Migração: Etapa 2 — Correção de cadastro + peso congelado no voto
-- Execute este bloco no Supabase SQL Editor. É idempotente e aditivo.
-- ============================================================

-- proprietarios: campo de observações internas
alter table proprietarios add column if not exists observacoes text;

-- audit_logs: histórico estruturado (campo alterado, valores, motivo).
-- Todas nullable — as ~15 chamadas existentes de logAudit continuam
-- funcionando sem preenchê-las.
alter table audit_logs add column if not exists campo text;
alter table audit_logs add column if not exists valor_anterior text;
alter table audit_logs add column if not exists valor_novo text;
alter table audit_logs add column if not exists motivo text;

-- assembleia_respostas: peso congelado no momento do voto — nunca mais
-- recalculado a partir das unidades atuais do proprietário. O backfill usa
-- a contagem ATUAL de unidades, que é exatamente o valor que a apuração já
-- vinha usando até aqui — nenhum resultado já exibido/exportado muda.
alter table assembleia_respostas add column if not exists peso integer;

update assembleia_respostas r
set peso = coalesce((
  select count(*)::integer from unidades u
  where u.proprietario_id = (
    select s.proprietario_id from assembleia_sends s where s.id = r.send_id
  )
), 0)
where r.peso is null;

alter table assembleia_respostas alter column peso set default 0;
alter table assembleia_respostas alter column peso set not null;

-- ============================================================
-- Migração: Etapa 3 — Snapshot histórico completo do voto
-- Execute este bloco no Supabase SQL Editor. É idempotente e aditivo.
--
-- O snapshot completo (identidade + unidades + peso + IP/user-agent no
-- momento do voto) fica em assembleia_sends — um envio = uma pessoa = uma
-- votação (todas as pautas respondidas juntas). Não mexe em
-- assembleia_respostas.peso (Etapa 2) nem na apuração, que continuam
-- exatamente como estão.
-- ============================================================

alter table assembleia_sends add column if not exists nome_snapshot text;
alter table assembleia_sends add column if not exists cpf_snapshot text;
alter table assembleia_sends add column if not exists email_snapshot text;
alter table assembleia_sends add column if not exists telefone_snapshot text;
alter table assembleia_sends add column if not exists quantidade_unidades_snapshot integer;
alter table assembleia_sends add column if not exists unidades_snapshot jsonb;
alter table assembleia_sends add column if not exists peso_snapshot integer;
alter table assembleia_sends add column if not exists votado_em timestamptz;
alter table assembleia_sends add column if not exists ip_snapshot text;
alter table assembleia_sends add column if not exists user_agent_snapshot text;

-- Backfill: só para sends que JÁ têm voto registrado (as demais continuam
-- null — ainda não votaram, não há o que congelar). Usa o `peso` que a
-- Etapa 2 já gravou por resposta (fonte única, evita recalcular nada) e o
-- cadastro/unidades atuais para o resto — mesmo argumento de segurança da
-- Etapa 2: é exatamente o dado que já estava sendo mostrado até agora.
-- ip_snapshot/user_agent_snapshot ficam null — não existe esse dado
-- histórico e não há como recriá-lo (não é perda de dado: nunca existiu).
-- Nota: `u` usa LEFT JOIN de propósito — um proprietário sem nenhuma unidade
-- (peso 0) não pode ficar de fora do backfill por causa de um inner join.
-- Nota 2: o Postgres não deixa a tabela alvo do UPDATE (`s`) ser referenciada
-- dentro de um JOIN ... ON do FROM — por isso todo o cálculo é montado numa
-- subconsulta independente (`combined`, com seu próprio alias `s2` para
-- assembleia_sends) e só correlacionada com `s` no WHERE.
update assembleia_sends s set
  peso_snapshot = combined.peso,
  votado_em = combined.primeiro_voto,
  nome_snapshot = combined.nome,
  cpf_snapshot = combined.cpf,
  email_snapshot = combined.email,
  telefone_snapshot = combined.telefone,
  quantidade_unidades_snapshot = combined.qtd,
  unidades_snapshot = combined.lista
from (
  select
    r.send_id,
    r.peso,
    r.primeiro_voto,
    p.nome,
    p.cpf,
    p.email,
    p.telefone,
    coalesce(u.qtd, 0) as qtd,
    coalesce(u.lista, '[]'::jsonb) as lista
  from (
    select send_id, max(peso) as peso, min(created_at) as primeiro_voto
    from assembleia_respostas
    group by send_id
  ) r
  join assembleia_sends s2 on s2.id = r.send_id
  join proprietarios p on p.id = s2.proprietario_id
  left join (
    select proprietario_id, count(*) as qtd,
           jsonb_agg(jsonb_build_object('numero', numero, 'bloco', bloco)) as lista
    from unidades
    group by proprietario_id
  ) u on u.proprietario_id = p.id
) combined
where s.id = combined.send_id
  and s.peso_snapshot is null;

-- ============================================================
-- Migração: Etapa 4 — Simplificação: remove módulo de auditoria
-- Execute este bloco no Supabase SQL Editor.
--
-- Histórico simples de alterações de cadastro, guardado no próprio
-- proprietário (sem motivo, IP, usuário ou sessão) — substitui os registros
-- que antes iam para audit_logs.
-- ============================================================

alter table proprietarios add column if not exists historico_alteracoes jsonb not null default '[]'::jsonb;

-- Validado em produção em 2026-07-08 (ver relatório da Etapa 4). Irreversível.
drop table if exists audit_logs;

-- ============================================================
-- Migração: Auditoria de Segurança — rate limiting persistente
-- Execute este bloco no Supabase SQL Editor.
--
-- O limitador de tentativas de login usava um Map em memória, que não
-- sobrevive entre instâncias serverless na Vercel (cada cold start reseta a
-- contagem). Passa a usar esta tabela, com uma janela deslizante simples.
-- ============================================================

create table if not exists rate_limits (
  chave         text        primary key,
  contagem      integer     not null default 1,
  inicio_janela timestamptz not null default now()
);

alter table rate_limits enable row level security;
