# Pesquisa Fácil

SaaS de pesquisas de satisfação por e-mail. Crie pesquisas, importe clientes, dispare por e-mail e colete respostas em um link único por cliente. Exporte dados para o Google Sheets quando precisar.

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | Tailwind CSS v4 + shadcn/ui (Base UI) |
| Banco de dados | Supabase (PostgreSQL) |
| E-mail | Resend |
| Exportação | Google Sheets API v4 |
| Auth | JWT (HS256) em cookie HttpOnly via `jose` |
| Deploy | Vercel (recomendado) |

---

## Pré-requisitos

- Node.js 18+
- Conta no [Supabase](https://supabase.com)
- Conta no [Resend](https://resend.com) com domínio verificado
- Conta Google Cloud com Google Sheets API habilitada *(opcional — só para exportação)*

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

1. Acesse [supabase.com/dashboard](https://supabase.com/dashboard)
2. Abra seu projeto → **SQL Editor** → **New query**
3. Cole o conteúdo de `supabase/schema.sql` e clique em **Run**

### 4. Rodar em desenvolvimento

```bash
npm run dev
```

Acesse `http://localhost:3000` — será redirecionado para `/login`.

---

## Variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha:

### Auth

| Variável | Descrição |
|---|---|
| `AUTH_PASSWORD` | Senha de acesso ao painel. Use algo forte (ex.: gerado por `openssl rand -base64 32`). |

### Supabase

Obtenha em **Dashboard → Settings → API**:

| Variável | Descrição |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto (`https://xxxx.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anon (pública) |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave service role (secreta — nunca exponha no cliente) |

### Resend

| Variável | Descrição |
|---|---|
| `RESEND_API_KEY` | API key do Resend (`re_...`) |
| `RESEND_FROM_EMAIL` | Remetente verificado (ex.: `Pesquisa Fácil <no-reply@seudominio.com>`) |

### Google Sheets *(opcional)*

Necessário apenas para usar o botão **Exportar** na página de Envios.

**Passo a passo:**

1. No [Google Cloud Console](https://console.cloud.google.com), crie um projeto
2. Ative a **Google Sheets API** (APIs & Services → Library)
3. Crie uma **Service Account** (IAM & Admin → Service Accounts)
4. Gere uma chave JSON para a Service Account (Keys → Add Key → JSON)
5. Abra sua planilha Google Sheets e compartilhe com o e-mail da Service Account (Editor)
6. Crie duas abas na planilha chamadas exatamente: `Envios` e `Respostas`

| Variável | Descrição |
|---|---|
| `GOOGLE_SHEETS_SPREADSHEET_ID` | ID da planilha (parte da URL após `/d/`) |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | E-mail da Service Account (`xxx@projeto.iam.gserviceaccount.com`) |
| `GOOGLE_PRIVATE_KEY` | Chave privada do JSON entre aspas, com `\n` literais (veja abaixo) |

**Como formatar `GOOGLE_PRIVATE_KEY` no `.env`:**

Abra o JSON baixado, copie o campo `private_key` e cole no `.env.local` entre aspas duplas — os `\n` do JSON devem permanecer como `\n` (não como quebras de linha reais):

```
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"
```

### App

| Variável | Descrição |
|---|---|
| `NEXT_PUBLIC_APP_URL` | URL pública da aplicação sem barra final (ex.: `https://pesquisa.seudominio.com`) |

---

## Deploy na Vercel

1. Faça push do projeto para um repositório GitHub/GitLab
2. Importe o repositório em [vercel.com/new](https://vercel.com/new)
3. Na etapa **Environment Variables**, adicione todas as variáveis do `.env.example`
4. Deploy — a Vercel detecta automaticamente o Next.js

> **Importante:** `SUPABASE_SERVICE_ROLE_KEY` e `GOOGLE_PRIVATE_KEY` são segredos — nunca as adicione em variáveis com prefixo `NEXT_PUBLIC_`.

### Checklist pré-deploy

- [ ] `AUTH_PASSWORD` definido com senha forte
- [ ] Tabelas criadas no Supabase (`supabase/schema.sql`)
- [ ] RLS habilitado (já incluso no schema)
- [ ] Domínio de e-mail verificado no Resend
- [ ] `RESEND_FROM_EMAIL` usa o domínio verificado
- [ ] `NEXT_PUBLIC_APP_URL` aponta para a URL de produção (sem barra final)
- [ ] Google Sheets compartilhado com a Service Account como **Editor**
- [ ] Abas `Envios` e `Respostas` criadas na planilha
- [ ] Build local limpo: `npm run build`

---

## Estrutura do projeto

```
app/
  (auth)/login/          # Página de login
  (dashboard)/           # Páginas protegidas (auth via proxy.ts)
    dashboard/           # Visão geral com métricas
    surveys/             # CRUD de pesquisas
    clients/             # Importação e listagem de clientes
    sends/               # Disparos de e-mail + exportação Sheets
  s/[token]/             # Página pública de resposta (sem auth)
  actions/               # Server Actions (surveys, clients, sends, sheets, responses)

components/
  layout/sidebar.tsx     # Navegação lateral
  surveys/               # Formulário e editor de perguntas
  clients/               # Importação via CSV
  sends/                 # Tabela, dialog de disparo, botão de exportação
  survey-response/       # Formulário público de resposta

services/                # Camada de acesso ao Supabase e Google Sheets
lib/                     # Auth, tokens, validações, cliente Supabase, Google Sheets
supabase/schema.sql      # Schema completo do banco de dados
```

---

## Funcionalidades

- **Pesquisas** — crie com até N perguntas de tipos: texto livre, nota 1–5, nota 1–10, sim/não, múltipla escolha
- **Clientes** — importe via CSV (suporte a cabeçalhos em pt/en) ou adicione manualmente
- **Disparos** — envie a pesquisa para clientes selecionados; e-mails em lote via Resend
- **Respostas** — link único por cliente (`/s/[token]`); resposta duplicada bloqueada no banco
- **Exportação** — exporte envios e respostas para Google Sheets com um clique
- **Dashboard** — métricas: total de pesquisas, clientes, envios e taxa de resposta
