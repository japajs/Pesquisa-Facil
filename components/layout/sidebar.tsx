"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  Building2,
  FileSpreadsheet,
  Gavel,
  LogOut,
  Settings,
  Shield,
  UserCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { logoutAction } from "@/app/actions/auth"
import { APP_NAME } from "@/lib/constants"
import type { SessionUser, UserPerfil } from "@/types"

const NAV_ITEMS = [
  { href: "/dashboard",     label: "Dashboard",    icon: BarChart3        },
  { href: "/condominios",   label: "Condomínios",  icon: Building2        },
  { href: "/importacao",    label: "Importação",   icon: FileSpreadsheet  },
  { href: "/auditoria",     label: "Auditoria",    icon: Shield           },
  { href: "/configuracoes", label: "Configurações", icon: Settings        },
] as const

const PERFIL_LABELS: Record<UserPerfil, string> = {
  administrador: "Administrador",
  operador: "Operador",
  visualizador: "Visualizador",
}

const PERFIL_COLORS: Record<UserPerfil, string> = {
  administrador: "bg-primary/10 text-primary",
  operador: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  visualizador: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
}

interface Props {
  user: SessionUser
}

export function Sidebar({ user }: Props) {
  const pathname = usePathname()

  return (
    <aside className="flex h-screen w-56 shrink-0 flex-col border-r border-border bg-sidebar">
      {/* Brand */}
      <div className="flex h-14 items-center gap-2.5 border-b border-border px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
          <Gavel className="h-4 w-4 text-primary" />
        </div>
        <span className="text-sm font-semibold tracking-tight text-foreground">{APP_NAME}</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 p-2.5">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/")
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* User + Logout */}
      <div className="space-y-1 border-t border-border p-2.5">
        {/* Info do usuário */}
        <div className="flex items-center gap-2.5 rounded-md px-3 py-2">
          <UserCircle className="h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-foreground">{user.nome}</p>
            <span
              className={cn(
                "mt-0.5 inline-block rounded px-1 py-0.5 text-[10px] font-semibold leading-tight",
                PERFIL_COLORS[user.perfil]
              )}
            >
              {PERFIL_LABELS[user.perfil]}
            </span>
          </div>
        </div>

        {/* Logout */}
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-all duration-150 hover:bg-accent hover:text-foreground"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Sair
          </button>
        </form>
      </div>
    </aside>
  )
}
