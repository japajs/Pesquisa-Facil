import type { Metadata } from "next"
import { getAllCondominios } from "@/services/condominios"
import { resolveCondominioScope } from "@/lib/auth"
import { CriarCondominioDialog } from "@/components/condominios/criar-condominio-dialog"
import { CondominiosList } from "@/components/condominios/condominios-list"
import type { Condominio } from "@/types"

export const metadata: Metadata = { title: "Condomínios" }

// Usuário PESSOAL (acessoTotal: false) só vê os condomínios vinculados a ele
// em usuario_condominios — MASTER/sessão antiga continua vendo todos.
async function fetchCondominios(): Promise<Condominio[]> {
  try {
    const condominioIds = await resolveCondominioScope()
    return await getAllCondominios(condominioIds)
  } catch {
    return []
  }
}

export default async function CondominiosPage() {
  const condominios = await fetchCondominios()

  return (
    <div className="flex flex-col gap-6 p-6 pt-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Condomínios</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {condominios.length}{" "}
            {condominios.length === 1 ? "condomínio cadastrado" : "condomínios cadastrados"}
          </p>
        </div>
        <div className="shrink-0">
          <CriarCondominioDialog />
        </div>
      </div>

      <CondominiosList condominios={condominios} />
    </div>
  )
}
