import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { Sidebar } from "@/components/layout/sidebar"
import { APP_NAME, APP_VERSION } from "@/lib/constants"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect("/login")

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar user={session} />
      <main className="flex flex-1 flex-col overflow-y-auto">
        <div className="flex-1">{children}</div>
        <footer className="shrink-0 border-t border-border/40 px-6 py-3 print:hidden">
          <p className="text-center text-xs text-muted-foreground/50">
            {APP_NAME} · Versão {APP_VERSION} · © Todos os direitos reservados.
          </p>
        </footer>
      </main>
    </div>
  )
}
