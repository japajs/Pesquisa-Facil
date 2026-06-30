"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, Building2, LogOut, Settings, Vote } from "lucide-react"
import { cn } from "@/lib/utils"
import { logoutAction } from "@/app/actions/auth"
import { APP_NAME } from "@/lib/constants"

const NAV_ITEMS = [
  { href: "/dashboard",   label: "Dashboard",    icon: BarChart3  },
  { href: "/condominios", label: "Condomínios",  icon: Building2  },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
] as const

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex h-screen w-56 shrink-0 flex-col border-r border-border bg-sidebar">
      {/* Brand */}
      <div className="flex h-14 items-center gap-2.5 border-b border-border px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
          <Vote className="h-4 w-4 text-primary" />
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

      {/* Logout */}
      <div className="border-t border-border p-2.5">
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
