import { redirect } from "next/navigation"
import { getSession, resolveCondominioScope } from "@/lib/auth"
import { getAllCondominios } from "@/services/condominios"
import { RelatoriosClient } from "@/components/relatorios/relatorios-client"

export const metadata = { title: "Relatórios" }

export default async function RelatoriosPage() {
  const session = await getSession()
  if (!session) redirect("/login")

  // Escopo por condomínio (MASTER/PESSOAL): PESSOAL só pode gerar relatório
  // dos condomínios vinculados a ele.
  const condominios = await getAllCondominios(await resolveCondominioScope())

  return (
    <div className="flex flex-col gap-6 p-6 pt-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Relatórios</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Exporte dados de assembleias em PDF ou planilha Excel.
        </p>
      </div>

      <RelatoriosClient condominios={condominios} perfil={session.perfil} />
    </div>
  )
}
