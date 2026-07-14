import type { Metadata } from "next"
import { getAllCondominios } from "@/services/condominios"
import { getCondominiosAutorizados } from "@/services/usuarios"
import { getSession } from "@/lib/auth"
import { ImportacaoWizard } from "@/components/importacao/importacao-wizard"
import type { Condominio } from "@/types"

export const metadata: Metadata = { title: "Importação" }

// Auditoria de desempenho: mesmo com o processamento em lotes paralelos da
// action de importação, uma planilha grande pode levar mais que o padrão da
// Vercel para uma Server Action. 60s é o teto aceito até no plano Hobby.
export const maxDuration = 60

// Escopo por condomínio (MASTER/PESSOAL): um usuário PESSOAL só pode
// escolher, para importar, um condomínio dentre os vinculados a ele.
async function fetchCondominios(): Promise<Condominio[]> {
  try {
    const session = await getSession()
    if (session && !session.acessoTotal) {
      const ids = await getCondominiosAutorizados(session.userId)
      return await getAllCondominios(ids)
    }
    return await getAllCondominios()
  } catch {
    return []
  }
}

export default async function ImportacaoPage() {
  const condominios = await fetchCondominios()

  return (
    <div className="flex flex-col gap-6 p-6 pt-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Importação de planilha</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Importe proprietários e unidades a partir de um arquivo .xlsx ou .csv
        </p>
      </div>

      <ImportacaoWizard condominios={condominios} />
    </div>
  )
}
