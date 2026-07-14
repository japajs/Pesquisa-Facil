"use client"

import { useTransition } from "react"
import { Users, ShieldCheck, Building2 } from "lucide-react"
import { toast } from "sonner"
import { updateUsuarioAtivoAction } from "@/app/actions/usuarios"
import { UsuarioDialog } from "@/components/usuarios/usuario-dialog"
import { RedefinirSenhaDialog } from "@/components/usuarios/redefinir-senha-dialog"
import type { Condominio, Usuario, UserPerfil } from "@/types"

const PERFIL_LABELS: Record<UserPerfil, string> = {
  administrador: "Administrador",
  operador: "Operador",
  visualizador: "Visualizador",
}

interface Props {
  usuarios: Usuario[]
  condominios: Condominio[]
  condominiosAutorizadosPorUsuario: Record<string, string[]>
}

export function UsuariosList({ usuarios, condominios, condominiosAutorizadosPorUsuario }: Props) {
  const [isPending, startTransition] = useTransition()

  function toggleAtivo(usuario: Usuario) {
    startTransition(async () => {
      const result = await updateUsuarioAtivoAction(usuario.id, !usuario.ativo)
      if (!result.success) toast.error(result.error)
    })
  }

  if (usuarios.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-10 text-center">
        <Users className="h-8 w-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">Nenhum usuário cadastrado ainda.</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border/60 bg-card divide-y divide-border/40">
      {usuarios.map((u) => {
        const condominiosDele = (condominiosAutorizadosPorUsuario[u.id] ?? [])
          .map((id) => condominios.find((c) => c.id === id)?.nome)
          .filter(Boolean)

        return (
          <div key={u.id} className="flex items-center gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-medium">{u.nome}</p>
                {!u.ativo && (
                  <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                    Inativo
                  </span>
                )}
              </div>
              <p className="truncate text-xs text-muted-foreground">{u.email}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-primary">
                  <ShieldCheck className="h-3 w-3" />
                  {PERFIL_LABELS[u.perfil]}
                </span>
                {u.acesso_total ? (
                  <span className="inline-flex items-center gap-1">
                    <Building2 className="h-3 w-3" /> MASTER — todos os condomínios
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    PESSOAL —{" "}
                    {condominiosDele.length > 0 ? condominiosDele.join(", ") : "nenhum condomínio"}
                  </span>
                )}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <UsuarioDialog
                condominios={condominios}
                usuario={u}
                condominiosAutorizadosIniciais={condominiosAutorizadosPorUsuario[u.id] ?? []}
              />
              <RedefinirSenhaDialog usuarioId={u.id} />
              <button
                type="button"
                onClick={() => toggleAtivo(u)}
                disabled={isPending}
                className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                {u.ativo ? "Desativar" : "Ativar"}
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
