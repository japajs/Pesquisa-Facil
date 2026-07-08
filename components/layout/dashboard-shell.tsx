"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { Gavel, Menu } from "lucide-react"
import { Sidebar } from "./sidebar"
import { cn } from "@/lib/utils"
import { APP_NAME, APP_VERSION } from "@/lib/constants"
import type { SessionUser } from "@/types"

interface Props {
  user: SessionUser
  children: React.ReactNode
}

export function DashboardShell({ user, children }: Props) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // Close sidebar on navigation
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // Auditoria de responsividade: o menu mobile é um overlay (drawer) — sem
  // isso, um usuário de teclado não tinha como fechá-lo além de encontrar o
  // botão "Fechar", sem o atalho Esc já esperado nesse padrão.
  useEffect(() => {
    if (!open) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [open])

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar wrapper — fixed overlay on mobile, static on desktop */}
      <div
        role="dialog"
        aria-modal={open ? true : undefined}
        aria-label="Menu de navegação"
        className={cn(
          "fixed inset-y-0 left-0 z-40 transition-transform duration-200 ease-in-out",
          "lg:static lg:inset-auto lg:z-auto lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <Sidebar user={user} open={open} onClose={() => setOpen(false)} />
      </div>

      {/* Content area */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Mobile top header */}
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background px-4 lg:hidden print:hidden">
          <button
            onClick={() => setOpen(true)}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10">
              <Gavel className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="text-sm font-semibold tracking-tight">{APP_NAME}</span>
          </div>
        </header>

        <main className="flex flex-1 flex-col overflow-y-auto">
          <div className="flex-1">{children}</div>
          <footer className="shrink-0 border-t border-border/40 px-6 py-3 print:hidden">
            <p className="text-center text-xs text-muted-foreground/50">
              {APP_NAME} · Versão {APP_VERSION} · © Todos os direitos reservados.
            </p>
          </footer>
        </main>
      </div>
    </div>
  )
}
