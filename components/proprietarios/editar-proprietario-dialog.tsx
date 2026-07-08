"use client"

import { useState, useTransition } from "react"
import { Pencil, History, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { updateProprietarioAction, transferUnidadeAction } from "@/app/actions/proprietarios"
import type { Proprietario } from "@/types"

interface Props {
  proprietario: Proprietario
  condominioId: string
  todosProprietarios: Proprietario[]
  jaVotou: boolean
  isAdmin: boolean
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function EditarProprietarioDialog({
  proprietario,
  condominioId,
  todosProprietarios,
  jaVotou,
  isAdmin,
}: Props) {
  const [open, setOpen] = useState(false)

  const [nome, setNome] = useState(proprietario.nome)
  const [email, setEmail] = useState(proprietario.email ?? "")
  const [telefone, setTelefone] = useState(proprietario.telefone ?? "")
  const [cpf, setCpf] = useState(proprietario.cpf ?? "")
  const [observacoes, setObservacoes] = useState(proprietario.observacoes ?? "")
  const [confirmarCpf, setConfirmarCpf] = useState(false)

  const [transferindoUnidadeId, setTransferindoUnidadeId] = useState<string | null>(null)
  const [destinoTipo, setDestinoTipo] = useState<"existente" | "novo">("existente")
  const [destinoProprietarioId, setDestinoProprietarioId] = useState("")
  const [novoNome, setNovoNome] = useState("")
  const [novoEmail, setNovoEmail] = useState("")
  const [novoTelefone, setNovoTelefone] = useState("")

  const [vincularUnidadeId, setVincularUnidadeId] = useState("")

  const [isPendingSalvar, startSalvarTransition] = useTransition()
  const [isPendingTransferir, startTransferirTransition] = useTransition()
  const [isPendingVincular, startVincularTransition] = useTransition()

  // Sincroniza os campos sempre que os dados do proprietário mudarem (ex.:
  // após uma transferência revalidar a página) — o modal fica aberto entre
  // ações para permitir várias correções na mesma sessão. Ajuste de estado
  // durante a renderização (não em um efeito), como recomendado pelo React
  // para "resetar estado quando uma prop muda".
  const [proprietarioSincronizado, setProprietarioSincronizado] = useState(proprietario)
  if (proprietarioSincronizado !== proprietario) {
    setProprietarioSincronizado(proprietario)
    setNome(proprietario.nome)
    setEmail(proprietario.email ?? "")
    setTelefone(proprietario.telefone ?? "")
    setCpf(proprietario.cpf ?? "")
    setObservacoes(proprietario.observacoes ?? "")
  }

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) {
      setConfirmarCpf(false)
      setTransferindoUnidadeId(null)
      setVincularUnidadeId("")
    }
  }

  const cpfBloqueado = jaVotou && !(isAdmin && confirmarCpf)
  const algumCampoMudou =
    nome.trim() !== proprietario.nome ||
    (email.trim() || null) !== (proprietario.email ?? null) ||
    (telefone.trim() || null) !== (proprietario.telefone ?? null) ||
    (cpf.trim() || null) !== (proprietario.cpf ?? null) ||
    (observacoes.trim() || null) !== (proprietario.observacoes ?? null)
  const canSalvar = algumCampoMudou && nome.trim().length > 0

  function handleSalvarDados() {
    startSalvarTransition(async () => {
      const result = await updateProprietarioAction({
        id: proprietario.id,
        condominioId,
        nome,
        email,
        telefone,
        cpf,
        observacoes,
        confirmarCpfAposVoto: confirmarCpf,
      })
      if (result.success) {
        toast.success("Cadastro atualizado.")
      } else {
        toast.error(result.error)
      }
    })
  }

  const outrosProprietarios = todosProprietarios.filter((p) => p.id !== proprietario.id)
  const unidadesDeOutros = outrosProprietarios.flatMap((p) =>
    (p.unidades ?? []).map((u) => ({ ...u, proprietarioNome: p.nome }))
  )

  function handleTransferir() {
    if (!transferindoUnidadeId) return
    startTransferirTransition(async () => {
      const result = await transferUnidadeAction({
        unidadeId: transferindoUnidadeId,
        condominioId,
        novoProprietarioId: destinoTipo === "existente" ? destinoProprietarioId : undefined,
        novoProprietario:
          destinoTipo === "novo"
            ? { nome: novoNome, email: novoEmail, telefone: novoTelefone }
            : undefined,
      })
      if (result.success) {
        toast.success("Unidade transferida.")
        setTransferindoUnidadeId(null)
        setDestinoProprietarioId("")
        setNovoNome("")
        setNovoEmail("")
        setNovoTelefone("")
      } else {
        toast.error(result.error)
      }
    })
  }

  function handleVincular() {
    if (!vincularUnidadeId) return
    startVincularTransition(async () => {
      const result = await transferUnidadeAction({
        unidadeId: vincularUnidadeId,
        condominioId,
        novoProprietarioId: proprietario.id,
      })
      if (result.success) {
        toast.success("Unidade vinculada.")
        setVincularUnidadeId("")
      } else {
        toast.error(result.error)
      }
    })
  }

  const transferDestinoValido =
    destinoTipo === "existente" ? !!destinoProprietarioId : novoNome.trim() && novoEmail.trim()

  const historico = [...proprietario.historico_alteracoes].reverse()

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0 text-muted-foreground hover:text-foreground"
          />
        }
      >
        <Pencil className="h-3.5 w-3.5" />
        <span className="sr-only">Editar Cadastro</span>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar Cadastro</DialogTitle>
        </DialogHeader>

        <div className="max-h-[68vh] overflow-y-auto space-y-5 px-1">
          {/* Dados cadastrais */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-nome">Nome</Label>
              <Input id="edit-nome" value={nome} onChange={(e) => setNome(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-email">E-mail</Label>
              <Input
                id="edit-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-telefone">WhatsApp</Label>
              <Input
                id="edit-telefone"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-cpf">CPF</Label>
              <Input
                id="edit-cpf"
                value={cpf}
                disabled={cpfBloqueado}
                onChange={(e) => setCpf(e.target.value)}
              />
              {jaVotou && (
                <div className="flex items-start gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {isAdmin ? (
                    <label className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={confirmarCpf}
                        onChange={(e) => setConfirmarCpf(e.target.checked)}
                        className="accent-primary"
                      />
                      Este proprietário já votou. Confirmo a alteração do CPF mesmo assim.
                    </label>
                  ) : (
                    <span>
                      Este proprietário já votou — alterar o CPF exige confirmação de um
                      administrador.
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-obs">Observações</Label>
              <Textarea
                id="edit-obs"
                rows={2}
                className="resize-none"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
              />
            </div>
          </div>

          <Button
            onClick={handleSalvarDados}
            disabled={isPendingSalvar || !canSalvar}
            className="w-full"
          >
            {isPendingSalvar ? "Salvando…" : "Salvar dados cadastrais"}
          </Button>

          {/* Unidades */}
          <div className="space-y-3 border-t border-border/40 pt-4">
            <Label>Unidades deste proprietário</Label>
            <div className="space-y-2">
              {(proprietario.unidades ?? []).length === 0 && (
                <p className="text-xs text-muted-foreground">Nenhuma unidade vinculada.</p>
              )}
              {(proprietario.unidades ?? []).map((u) => (
                <div key={u.id} className="rounded-lg border border-border/60 p-2.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{u.numero}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setTransferindoUnidadeId(transferindoUnidadeId === u.id ? null : u.id)
                      }
                      className="text-xs text-primary hover:underline"
                    >
                      {transferindoUnidadeId === u.id ? "Cancelar" : "Transferir…"}
                    </button>
                  </div>

                  {transferindoUnidadeId === u.id && (
                    <div className="space-y-2 rounded-md bg-muted/30 p-2">
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => setDestinoTipo("existente")}
                          className={`flex-1 rounded-md border px-2 py-1 text-xs ${destinoTipo === "existente" ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground"}`}
                        >
                          Proprietário existente
                        </button>
                        <button
                          type="button"
                          onClick={() => setDestinoTipo("novo")}
                          className={`flex-1 rounded-md border px-2 py-1 text-xs ${destinoTipo === "novo" ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground"}`}
                        >
                          Novo proprietário
                        </button>
                      </div>

                      {destinoTipo === "existente" ? (
                        <select
                          value={destinoProprietarioId}
                          onChange={(e) => setDestinoProprietarioId(e.target.value)}
                          className="h-9 w-full rounded-md border border-input bg-background px-2 text-xs"
                        >
                          <option value="">Selecione o novo proprietário…</option>
                          {outrosProprietarios.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.nome}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="space-y-1.5">
                          <Input
                            placeholder="Nome"
                            value={novoNome}
                            onChange={(e) => setNovoNome(e.target.value)}
                            className="h-9 text-xs"
                          />
                          <Input
                            placeholder="E-mail"
                            value={novoEmail}
                            onChange={(e) => setNovoEmail(e.target.value)}
                            className="h-9 text-xs"
                          />
                          <Input
                            placeholder="WhatsApp (opcional)"
                            value={novoTelefone}
                            onChange={(e) => setNovoTelefone(e.target.value)}
                            className="h-9 text-xs"
                          />
                        </div>
                      )}

                      <Button
                        size="sm"
                        className="w-full"
                        disabled={isPendingTransferir || !transferDestinoValido}
                        onClick={handleTransferir}
                      >
                        {isPendingTransferir ? "Transferindo…" : "Confirmar transferência"}
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {unidadesDeOutros.length > 0 && (
              <div className="space-y-1.5 rounded-lg border border-dashed border-border/60 p-2.5">
                <Label className="text-xs">Vincular unidade existente a este proprietário</Label>
                <select
                  value={vincularUnidadeId}
                  onChange={(e) => setVincularUnidadeId(e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-background px-2 text-xs"
                >
                  <option value="">Selecione uma unidade…</option>
                  {unidadesDeOutros.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.numero} — atualmente com {u.proprietarioNome}
                    </option>
                  ))}
                </select>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  disabled={isPendingVincular || !vincularUnidadeId}
                  onClick={handleVincular}
                >
                  {isPendingVincular ? "Vinculando…" : "Vincular"}
                </Button>
              </div>
            )}
          </div>

          {/* Histórico recente */}
          <div className="space-y-2 border-t border-border/40 pt-4">
            <div className="flex items-center gap-1.5">
              <History className="h-3.5 w-3.5 text-muted-foreground" />
              <Label className="text-xs">Histórico de alterações</Label>
            </div>
            {historico.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nenhuma alteração registrada ainda.</p>
            ) : (
              <ul className="space-y-1.5">
                {historico.map((h, i) => (
                  <li key={i} className="text-xs text-muted-foreground">
                    <span className="font-mono">{formatDate(h.data)}</span> ·{" "}
                    <span className="text-foreground">{h.campo}</span>: &quot;
                    {h.valor_anterior ?? "—"}&quot; → &quot;{h.valor_novo ?? "—"}&quot;
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => handleOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
