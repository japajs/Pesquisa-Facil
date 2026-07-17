# VotoOnline

Sistema de Assembleias Eletrônicas para Condomínios.

Gerencie assembleias, proprietários, unidades e votações eletrônicas de múltiplos condomínios em uma única plataforma.

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | Tailwind CSS v4 + shadcn/ui (Base UI) |
| Banco de dados | Supabase (PostgreSQL) |
| E-mail | Resend |
| Auth | JWT (HS256) em cookie HttpOnly via `jose` + bcryptjs |
| Deploy | Vercel (recomendado) |

---

## Pré-requisitos

- Node.js 18+
- Conta no [Supabase](https://supabase.com)
- Conta no [Resend](https://resend.com) com domínio verificado

---

## Configuração local

### 1. Instalar dependências

```bash
npm install
```

### 2. Criar arquivo de variáveis de ambiente

```bash
cp .env.example .env.local
```

Preencha todas as variáveis conforme descrito em [Variáveis de ambiente](#variáveis-de-ambiente).

### 3. Criar tabelas no Supabase

Acesse **Dashboard → SQL Editor** e execute o schema em `supabase/schema.sql`.

### 4. Primeiro acesso

```bash
npm run dev
```

Acesse `http://localhost:3000` — será redirecionado para `/setup` para criar o primeiro administrador.

---

## Variáveis de ambiente

### Supabase

Obtenha em **Dashboard → Settings → API**:

| Variável | Descrição |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto (`https://xxxx.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anon (pública) |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave service role (secreta) |

### Resend

| Variável | Descrição |
|---|---|
| `RESEND_API_KEY` | API key do Resend (`re_...`) |
| `RESEND_FROM_EMAIL` | Remetente verificado (ex.: `VotoOnline <no-reply@seudominio.com>`) |

### Auth

| Variável | Descrição |
|---|---|
| `AUTH_PASSWORD` | Segredo para assinatura JWT. Use `openssl rand -base64 32`. |

### App

| Variável | Descrição |
|---|---|
| `NEXT_PUBLIC_APP_URL` | URL pública sem barra final (ex.: `https://votoonline.vercel.app`) |

---

## Deploy na Vercel

1. Faça push para GitHub/GitLab
2. Importe em [vercel.com/new](https://vercel.com/new)
3. Adicione todas as variáveis de ambiente
4. Deploy automático

### Checklist pré-deploy

- [ ] Tabelas criadas no Supabase
- [ ] Domínio de e-mail verificado no Resend
- [ ] `RESEND_FROM_EMAIL` usa o domínio verificado
- [ ] `NEXT_PUBLIC_APP_URL` aponta para a URL de produção (sem barra final)
- [ ] `AUTH_PASSWORD` definido com valor forte
- [ ] Build local limpo: `npm run build`

---

## Estrutura do projeto

```
app/
  (auth)/login/          # Página de login
  (auth)/setup/          # Configuração inicial (primeiro admin)
  (dashboard)/           # Páginas protegidas
    dashboard/           # Métricas gerais
    condominios/         # CRUD de condomínios, proprietários e assembleias
    importacao/          # Importação de proprietários via XLSX/CSV
    auditoria/           # Log de auditoria de todas as ações
    configuracoes/       # Configurações do sistema
  api/condominios/       # Routes de exportação XLSX
  v/[token]/             # Página pública de votação (sem auth)

components/
  assembleias/           # Formulários, apuração, votação
  condominios/           # Lista, info card, exportação
  proprietarios/         # Formulários e listagem
  configuracoes/         # Seções de configurações
  layout/sidebar.tsx     # Navegação lateral
  ui/donut-chart.tsx     # Gráfico de rosca SVG (sem dependência externa)

services/                # Camada de acesso ao Supabase
lib/                     # Auth JWT, constantes, tokens, supabase client
```

---

## Funcionalidades

- **Condomínios** — cadastro com endereço e síndico, exportação XLSX de proprietários
- **Proprietários e Unidades** — importação via XLSX/CSV com detecção inteligente de colunas
- **Assembleias** — criação com múltiplas pautas, controle de status (rascunho → aberta → encerrada)
- **Votação Eletrônica** — link único por proprietário, apuração por participantes e ponderada por unidades
- **Apuração** — gráficos de rosca por pauta, impressão/PDF nativo do navegador
- **Auditoria** — log imutável de todas as ações com filtros por módulo, ação e período
- **Usuários** — sistema multi-usuário com perfis (administrador / operador / visualizador)
- **Dashboard** — métricas de participação com gráfico visual
