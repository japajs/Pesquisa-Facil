import { CheckCircle2 } from "lucide-react"

interface ThankYouProps {
  surveyTitle: string
}

export function ThankYou({ surveyTitle }: ThankYouProps) {
  return (
    <div className="flex flex-col items-center gap-5 py-10 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-400/10 ring-1 ring-emerald-400/20">
        <CheckCircle2 className="h-8 w-8 text-emerald-400" />
      </div>
      <div className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight">Obrigado pelo seu feedback!</h2>
        <p className="text-sm text-muted-foreground">
          Suas respostas para{" "}
          <span className="font-medium text-foreground">{surveyTitle}</span>{" "}
          foram registradas com sucesso.
        </p>
      </div>
      <p className="text-xs text-muted-foreground/60">
        Você já pode fechar esta página.
      </p>
    </div>
  )
}
