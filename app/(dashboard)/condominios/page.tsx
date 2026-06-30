import type { Metadata } from "next"
import { getAllCondominios } from "@/services/condominios"
import { CriarCondominioDialog } from "@/components/condominios/criar-condominio-dialog"
import { CondominiosList } from "@/components/condominios/condominios-list"
import type { Condominio } from "@/types"

export const metadata: Metadata = { title: "Condomínios" }

async function fetchCondominios(): Promise<Condominio[]> {
  try {
    return await getAllCondominios()
  } catch {
    return []
  }
}

export default async function CondominiosPage() {
  const condominios = await fetchCondominios()

  return (
    <div className="flex flex-col gap-6 p-6 pt-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Condomínios</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {condominios.length}{" "}
            {condominios.length === 1 ? "condomínio cadastrado" : "condomínios cadastrados"}
          </p>
        </div>
        <CriarCondominioDialog />
      </div>

      <CondominiosList condominios={condominios} />
    </div>
  )
}
