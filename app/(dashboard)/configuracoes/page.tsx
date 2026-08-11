import type { Metadata } from "next"
import { getAllConfiguracoes } from "@/services/configuracoes"
import { ContaSection } from "@/components/configuracoes/conta-section"
import { EmailSection } from "@/components/configuracoes/email-section"
import { VotacaoDefaultsSection } from "@/components/configuracoes/votacao-defaults-section"
import { SobreSection } from "@/components/configuracoes/sobre-section"

export const metadata: Metadata = { title: "Configurações" }

export default async function ConfiguracoesPage() {
  const config = await getAllConfiguracoes()

  const fromEmail = process.env.RESEND_FROM_EMAIL ?? ""
  const apiKeyConfigured = Boolean(process.env.RESEND_API_KEY)
  const ambiente = process.env.NODE_ENV ?? "development"

  return (
    <div className="flex flex-col gap-6 p-6 pt-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Configurações</h1>
        <p className="mt-1 text-sm text-muted-foreground">Administração do sistema</p>
      </div>

      <ContaSection adminNome={config.admin_nome} adminEmail={config.admin_email} />

      <EmailSection
        fromEmail={fromEmail}
        nomeRemetente={config.email_nome_remetente}
        apiKeyConfigured={apiKeyConfigured}
      />

      <VotacaoDefaultsSection
        defaults={{ votacao_encerramento_automatico: config.votacao_encerramento_automatico }}
      />

      <SobreSection ambiente={ambiente} />
    </div>
  )
}
