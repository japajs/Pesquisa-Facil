"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Loader2, Save } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { updateVotacaoDefaultsAction } from "@/app/actions/configuracoes"
import type { Configuracoes } from "@/services/configuracoes"

type VotacaoDefaults = Pick<
  Configuracoes,
  | "votacao_resposta_unica"
  | "votacao_ponderada"
  | "votacao_permite_abstencao"
  | "votacao_encerramento_automatico"
>

interface VotacaoDefaultsSectionProps {
  defaults: VotacaoDefaults
}

const OPCOES: Array<{
  key: keyof VotacaoDefaults
  label: string
  descricao: string
  locked?: boolean
}> = [
  {
    key: "votacao_resposta_unica",
    label: "Permitir apenas uma resposta por proprietário",
    descricao: "Cada proprietário pode votar somente uma vez por votação. Garantido pelo banco de dados.",
    locked: true,
  },
  {
    key: "votacao_ponderada",
    label: "Votação ponderada por unidades",
    descricao: "O peso de cada voto é proporcional ao número de unidades do proprietário.",
  },
  {
    key: "votacao_permite_abstencao",
    label: "Permitir abstenção",
    descricao: "Proprietários podem registrar abstenção além de Sim ou Não.",
  },
  {
    key: "votacao_encerramento_automatico",
    label: "Encerrar automaticamente na data definida",
    descricao: "Quando a data de encerramento é atingida, a votação é fechada automaticamente para novos votos.",
  },
]

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
        checked ? "bg-primary" : "bg-input",
        disabled && "cursor-not-allowed opacity-50"
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

export function VotacaoDefaultsSection({ defaults }: VotacaoDefaultsSectionProps) {
  const [values, setValues] = useState<VotacaoDefaults>(defaults)
  const [isPending, startTransition] = useTransition()

  const hasChanges =
    values.votacao_ponderada !== defaults.votacao_ponderada ||
    values.votacao_permite_abstencao !== defaults.votacao_permite_abstencao ||
    values.votacao_encerramento_automatico !== defaults.votacao_encerramento_automatico

  function handleSave() {
    startTransition(async () => {
      const result = await updateVotacaoDefaultsAction(values)
      if (result.success) toast.success("Configurações de votação salvas.")
      else toast.error(result.error)
    })
  }

  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="text-base">Configuração da Votação</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {OPCOES.map((opcao, i) => (
          <div key={opcao.key}>
            {i > 0 && <div className="my-4 border-t border-border/30" />}
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium">{opcao.label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{opcao.descricao}</p>
              </div>
              <Toggle
                checked={values[opcao.key]}
                onChange={(v) => setValues((prev) => ({ ...prev, [opcao.key]: v }))}
                disabled={opcao.locked}
              />
            </div>
          </div>
        ))}

        <div className="pt-5">
          <Button
            size="sm"
            variant="outline"
            onClick={handleSave}
            disabled={isPending || !hasChanges}
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
