"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Loader2, Save } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { updateVotacaoDefaultsAction } from "@/app/actions/configuracoes"

interface VotacaoDefaultsSectionProps {
  defaults: { votacao_encerramento_automatico: boolean }
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
        checked ? "bg-primary" : "bg-input"
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform",
          checked ? "translate-x-4" : "translate-x-0"
        )}
      />
    </button>
  )
}

// Auditoria de configurações: esta seção tinha 4 toggles, mas 3 delas
// (resposta única, votação ponderada, permitir abstenção) eram globais e
// nunca eram lidas pelo cálculo de peso/voto de verdade — desde a Fase 1 da
// auditoria de assembleias, peso é decidido por condominios.criterio_peso e
// abstenção por pautas.permite_abstencao, ambos por condomínio/pauta, não
// globalmente. Restou só o encerramento automático, que é lido de verdade
// em app/v/[token]/page.tsx.
export function VotacaoDefaultsSection({ defaults }: VotacaoDefaultsSectionProps) {
  const [checked, setChecked] = useState(defaults.votacao_encerramento_automatico)
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    startTransition(async () => {
      const result = await updateVotacaoDefaultsAction({ votacao_encerramento_automatico: checked })
      if (result.success) toast.success("Configuração salva.")
      else toast.error(result.error)
    })
  }

  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="text-base">Configuração da Votação</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium">Encerrar automaticamente na data definida</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Quando a data de encerramento é atingida, a votação é fechada automaticamente para
              novos votos.
            </p>
          </div>
          <Toggle checked={checked} onChange={setChecked} />
        </div>

        <div className="pt-5">
          <Button
            size="sm"
            variant="outline"
            onClick={handleSave}
            disabled={isPending || checked === defaults.votacao_encerramento_automatico}
            className="gap-1.5"
          >
            {isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            Salvar configurações
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
