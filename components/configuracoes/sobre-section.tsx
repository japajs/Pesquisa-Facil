import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { APP_NAME, APP_VERSION } from "@/lib/constants"

interface SobreSectionProps {
  ambiente: string
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border/40 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium tabular-nums">{value}</span>
    </div>
  )
}

export function SobreSection({ ambiente }: SobreSectionProps) {
  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="text-base">Sobre o Sistema</CardTitle>
      </CardHeader>
      <CardContent>
        <Row label="Aplicação" value={APP_NAME} />
        <Row label="Versão" value={APP_VERSION} />
        <Row label="Ambiente" value={ambiente === "production" ? "Produção" : "Desenvolvimento"} />
        <Row label="Banco de dados" value="Supabase (PostgreSQL)" />
        <Row label="E-mail" value="Resend" />
        <Row label="Hospedagem" value="Vercel" />
        <Row label="Documentação" value="Não disponível" />
      </CardContent>
    </Card>
  )
}
