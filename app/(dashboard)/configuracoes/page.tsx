import type { Metadata } from "next"
import { Settings } from "lucide-react"

export const metadata: Metadata = { title: "Configurações" }

export default function ConfiguracoesPage() {
  return (
    <div className="flex flex-col gap-8 p-6 pt-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Configurações</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configurações gerais da aplicação
        </p>
      </div>

      <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border py-16 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Settings className="h-6 w-6 text-muted-foreground" />
        </div>
        <div>
          <p className="font-medium text-foreground">Em breve</p>
          <p className="mt-1 text-sm text-muted-foreground">
            As configurações estarão disponíveis em breve.
          </p>
        </div>
      </div>
    </div>
  )
}
