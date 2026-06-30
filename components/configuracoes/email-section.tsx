"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { CheckCircle2, Loader2, Save, Send, XCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  updateEmailNomeRemetenteAction,
  enviarEmailTesteAction,
} from "@/app/actions/configuracoes"

interface EmailSectionProps {
  fromEmail: string
  nomeRemetente: string
  apiKeyConfigured: boolean
}

export function EmailSection({ fromEmail, nomeRemetente, apiKeyConfigured }: EmailSectionProps) {
  const [nome, setNome] = useState(nomeRemetente)
  const [isSavingNome, startSavingNome] = useTransition()
  const [isSendingTest, startSendingTest] = useTransition()

  function handleSaveNome() {
    startSavingNome(async () => {
      const result = await updateEmailNomeRemetenteAction(nome)
      if (result.success) toast.success("Nome do remetente atualizado.")
      else toast.error(result.error)
    })
  }

  function handleTestEmail() {
    startSendingTest(async () => {
      const result = await enviarEmailTesteAction()
      if (result.success) toast.success("E-mail de teste enviado com sucesso.")
      else toast.error(result.error)
    })
  }

  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="text-base">Configuração de E-mail</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Status */}
        <div className="flex items-center gap-2.5 rounded-lg border border-border/60 bg-muted/30 px-4 py-3">
          {apiKeyConfigured ? (
            <>
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
              <span className="text-sm text-muted-foreground">
                Resend configurado — envio de e-mails ativo
              </span>
            </>
          ) : (
            <>
              <XCircle className="h-4 w-4 shrink-0 text-destructive" />
              <span className="text-sm text-muted-foreground">
                <span className="font-medium text-destructive">RESEND_API_KEY</span> não configurado — e-mails desativados
              </span>
            </>
          )}
        </div>

        {/* E-mail remetente (somente leitura — vem do env) */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">E-mail remetente (variável de ambiente)</Label>
          <Input value={fromEmail || "Não configurado"} readOnly className="max-w-sm bg-muted/30 text-muted-foreground cursor-default" />
          <p className="text-xs text-muted-foreground">
            Para alterar, edite <code className="text-xs">RESEND_FROM_EMAIL</code> nas variáveis de ambiente.
          </p>
        </div>

        {/* Nome do remetente (editável) */}
        <div className="space-y-1.5">
          <Label className="text-xs">Nome do remetente</Label>
          <div className="flex gap-2">
            <Input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Sistema de Votação"
              className="max-w-sm"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={handleSaveNome}
              disabled={isSavingNome || nome === nomeRemetente || !nome.trim()}
              className="gap-1.5"
            >
              {isSavingNome ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Salvar
            </Button>
          </div>
        </div>

        <div className="border-t border-border/40 pt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleTestEmail}
            disabled={!apiKeyConfigured || isSendingTest}
            className="gap-2"
          >
            {isSendingTest ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            Enviar e-mail de teste
          </Button>
          <p className="mt-2 text-xs text-muted-foreground">
            Envia um e-mail para o endereço do administrador configurado na seção Conta.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
