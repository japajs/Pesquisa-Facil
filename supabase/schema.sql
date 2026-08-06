-- ============================================================
-- VotoOnline — Schema SQL (recriação completa)
-- Execute este script inteiro, uma única vez, num projeto Supabase
-- novo/vazio: SQL Editor → New query → cole tudo → Run.
--
-- Este arquivo substitui o antigo log de migrações incrementais por um
-- único script consolidado, gerado a partir do estado real do código
-- (lib/supabase/types.ts + services/*) em 2026-08-06, depois que o projeto
-- anterior no Supabase foi excluído. Não inclui as tabelas antigas do
-- módulo "Pesquisa Fácil" (surveys/clients/survey_sends/survey_responses)
-- nem "condo_surveys*" — nenhuma delas tem referência no código atual
-- (o módulo de votação usa assembleias/pautas/assembleia_sends/
-- assembleia_respostas).
-- ============================================================

create extension if not exists "uuid-ossp";

-- ─── Função utilitária: updated_at automático ────────────────────────────
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ============================================================
-- Usuários do sistema (administradores/operadores/visualizadores)
-- ============================================================

create table if not exists usuarios (
  id            uuid        primary key default uuid_generate_v4(),
  nome          text        not null,
  email         text        not null unique,
  senha_hash    text        not null,
  cpf           text,
  celular       text,
  perfil        text        not null default 'operador'
                            check (perfil in ('administrador', 'operador', 'visualizador')),
  acesso_total  boolean     not null default true,
  ativo         boolean     not null default true,
  created_at    timestamptz not null default now()
);

-- ─── Tabela: condominios ───────────────────────────────────────
create table if not exists condominios (
  id              uuid        primary key default uuid_generate_v4(),
  nome            text        not null,
  endereco        text,
  sindico_nome    text,
  sindico_contato text,
  created_at      timestamptz not null default now()
);

-- Escopo por condomínio (MASTER/PESSOAL): quais condomínios um usuário com
-- acesso_total = false enxerga. Usuários MASTER (acesso_total = true) não
-- precisam de linhas aqui — veem tudo independente desta tabela.
create table if not exists usuario_condominios (
  usuario_id    uuid not null references usuarios(id)    on delete cascade,
  condominio_id uuid not null references condominios(id) on delete cascade,
  primary key (usuario_id, condominio_id)
);

-- ─── Tabela: configuracoes ──────────────────────────────────────────────
-- Chave-valor para configurações do sistema. Lida apenas server-side.
create table if not exists configuracoes (
  chave      text        primary key,
  valor      text        not null,
  updated_at timestamptz not null default now()
);

insert into configuracoes (chave, valor) values
  ('admin_nome',                      'Administrador'),
  ('admin_email',                     'admin@exemplo.com'),
  ('auth_password',                   ''),
  ('email_nome_remetente',            'Sistema de Votação'),
  ('votacao_resposta_unica',          'true'),
  ('votacao_ponderada',               'true'),
  ('votacao_permite_abstencao',       'true'),
  ('votacao_encerramento_automatico', 'false')
on conflict (chave) do nothing;

-- ─── Tabela: rate_limits ─────────────────────────────────────────────────
-- Janela deslizante para limitar tentativas de login e votação. Persistida
-- (em vez de Map em memória) porque cada instância serverless da Vercel tem
-- sua própria memória. Linhas com mais de 1 dia são expurgadas
-- oportunistamente pelo próprio app (ver lib/rate-limit.ts).
create table if not exists rate_limits (
  chave         text        primary key,
  contagem      integer     not null default 1,
  inicio_janela timestamptz not null default now()
);

-- ============================================================
-- Cadastro: proprietários e unidades
-- Peso de voto = número de unidades do proprietário, sempre calculado
-- dinamicamente (nunca armazenado em proprietarios/unidades) — ver
-- lib/peso.ts. O peso só é congelado no momento do voto, em
-- assembleia_respostas.peso / assembleia_sends.*_snapshot (ver abaixo).
-- ============================================================

create table if not exists proprietarios (
  id                    uuid        primary key default uuid_generate_v4(),
  condominio_id         uuid        not null references condominios(id) on delete cascade,
  nome                  text        not null,
  email                 text,
  cpf                   text,
  telefone              text,
  observacoes           text,
  historico_alteracoes  jsonb       not null default '[]'::jsonb,
  created_at            timestamptz not null default now()
);

-- numero_normalizado é coluna gerada: extrai letras (maiúsculas) e números
-- de bloco+numero e concatena letras-então-números, para que "C-0502",
-- "C0502", "c 0502" e "0502 C" sejam sempre a mesma chave de duplicidade.
-- Espelha exatamente lib/unidade-format.ts:normalizarChaveUnidade — se uma
-- mudar, a outra precisa mudar junto.
create table if not exists unidades (
  id                  uuid        primary key default uuid_generate_v4(),
  proprietario_id     uuid        not null references proprietarios(id) on delete cascade,
  condominio_id       uuid        not null references condominios(id)   on delete cascade,
  numero              text        not null,
  bloco               text,
  numero_normalizado  text        generated always as (
                        upper(regexp_replace(coalesce(bloco, '') || numero, '[^A-Za-z]', '', 'g'))
                        || regexp_replace(coalesce(bloco, '') || numero, '[^0-9]', '', 'g')
                      ) stored,
  created_at          timestamptz not null default now()
);

-- ============================================================
-- Votação: assembleias, pautas e opções
-- ============================================================

create table if not exists assembleias (
  id                 uuid        primary key default uuid_generate_v4(),
  condominio_id      uuid        not null references condominios(id) on delete cascade,
  titulo             text        not null,
  descricao          text,
  status             text        not null default 'rascunho'
                                 check (status in ('rascunho', 'aberta', 'encerrada')),
  data_abertura      timestamptz,
  data_encerramento  timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

drop trigger if exists assembleias_updated_at on assembleias;
create trigger assembleias_updated_at
  before update on assembleias
  for each row execute function update_updated_at();

-- status: ciclo de vida independente do status da assembleia. Toda pauta
-- nasce em "aberta" e sobe sozinha para "em_votacao" no 1º voto; só vira
-- "encerrada" quando a assembleia inteira encerra (nenhuma pauta fecha
-- isolada). "rascunho" existe só por simetria/futuro.
create table if not exists pautas (
  id                 uuid        primary key default uuid_generate_v4(),
  assembleia_id      uuid        not null references assembleias(id) on delete cascade,
  ordem              integer     not null,
  titulo             text        not null,
  descricao          text,
  ativa              boolean     not null default true,
  tipo               text        not null default 'sim_nao'
                                 check (tipo in ('sim_nao', 'multipla_escolha')),
  permite_abstencao  boolean     not null default true,
  status             text        not null default 'aberta'
                                 check (status in ('rascunho', 'aberta', 'em_votacao', 'encerrada')),
  created_at         timestamptz not null default now()
);

-- Opções de uma pauta de múltipla escolha (ex.: candidatos).
create table if not exists pauta_opcoes (
  id         uuid        primary key default uuid_generate_v4(),
  pauta_id   uuid        not null references pautas(id) on delete cascade,
  ordem      integer     not null,
  label      text        not null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Envio de link de votação e respostas
-- ============================================================

-- Um proprietário recebe no máximo um send por assembleia (upsert por
-- assembleia_id+proprietario_id — ver services/assembleia-votos.ts). As
-- colunas *_snapshot congelam a identidade/unidades/peso do proprietário no
-- momento em que ele registra o 1º voto — nunca recalculadas depois, mesmo
-- que o cadastro ou as unidades mudem em seguida.
create table if not exists assembleia_sends (
  id                             uuid        primary key default uuid_generate_v4(),
  assembleia_id                  uuid        not null references assembleias(id)   on delete cascade,
  proprietario_id                uuid        not null references proprietarios(id) on delete cascade,
  token                          text        not null unique,
  status                         text        not null default 'pending'
                                             check (status in ('pending', 'sent', 'failed')),
  sent_at                        timestamptz,
  nome_snapshot                  text,
  cpf_snapshot                   text,
  email_snapshot                 text,
  telefone_snapshot              text,
  quantidade_unidades_snapshot   integer,
  unidades_snapshot              jsonb,
  peso_snapshot                  integer,
  votado_em                      timestamptz,
  ip_snapshot                    text,
  user_agent_snapshot            text,
  created_at                     timestamptz not null default now(),
  unique (assembleia_id, proprietario_id)
);

-- Uma resposta por pauta por send. `resposta` é usada para pautas
-- "sim_nao" (ou abstenção em "multipla_escolha"); `opcao_id` para o voto
-- numa opção de pauta "multipla_escolha" — exatamente um dos dois é
-- preenchido (constraint XOR abaixo). `peso` é congelado no momento do
-- voto (ver lib/peso.ts) — nunca recalculado na apuração.
create table if not exists assembleia_respostas (
  id         uuid        primary key default uuid_generate_v4(),
  send_id    uuid        not null references assembleia_sends(id) on delete cascade,
  pauta_id   uuid        not null references pautas(id)           on delete cascade,
  resposta   text        check (resposta is null or resposta in ('Sim', 'Não', 'Abstenção')),
  opcao_id   uuid        references pauta_opcoes(id) on delete restrict,
  peso       integer     not null default 0,
  created_at timestamptz not null default now(),
  constraint assembleia_respostas_resposta_xor_opcao
    check ((resposta is not null)::int + (opcao_id is not null)::int = 1),
  unique (send_id, pauta_id)
);

-- ─── Índices ───────────────────────────────────────────────────────────────
create index if not exists idx_usuario_condominios_usuario_id     on usuario_condominios(usuario_id);
create index if not exists idx_usuario_condominios_condominio_id  on usuario_condominios(condominio_id);

create index if not exists idx_proprietarios_condominio_id        on proprietarios(condominio_id);

create index if not exists idx_unidades_proprietario_id           on unidades(proprietario_id);
create index if not exists idx_unidades_condominio_id             on unidades(condominio_id);
create index if not exists idx_unidades_condominio_normalizado    on unidades(condominio_id, numero_normalizado);

create index if not exists idx_assembleias_condominio_id          on assembleias(condominio_id);

create index if not exists idx_pautas_assembleia_id               on pautas(assembleia_id);

create index if not exists idx_pauta_opcoes_pauta_id              on pauta_opcoes(pauta_id);

create index if not exists idx_assembleia_sends_assembleia_id     on assembleia_sends(assembleia_id);
create index if not exists idx_assembleia_sends_proprietario_id   on assembleia_sends(proprietario_id);
create index if not exists idx_assembleia_sends_token             on assembleia_sends(token);
create index if not exists idx_assembleia_sends_status            on assembleia_sends(status);

create index if not exists idx_assembleia_respostas_send_id       on assembleia_respostas(send_id);
create index if not exists idx_assembleia_respostas_pauta_id      on assembleia_respostas(pauta_id);
create index if not exists idx_assembleia_respostas_opcao_id      on assembleia_respostas(opcao_id);

-- ─── Row Level Security ───────────────────────────────────────────────────
-- O service role key (usado pelo Next.js) bypassa o RLS automaticamente.
-- Nenhuma policy pública é criada — sem elas, a anon key não acessa nada.
-- Toda a comunicação ocorre via service role key no servidor Next.js.
alter table usuarios              enable row level security;
alter table usuario_condominios   enable row level security;
alter table condominios           enable row level security;
alter table configuracoes         enable row level security;
alter table rate_limits           enable row level security;
alter table proprietarios         enable row level security;
alter table unidades              enable row level security;
alter table assembleias           enable row level security;
alter table pautas                enable row level security;
alter table pauta_opcoes          enable row level security;
alter table assembleia_sends      enable row level security;
alter table assembleia_respostas  enable row level security;
