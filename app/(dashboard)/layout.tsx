import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { Sidebar } from "@/components/layout/sidebar"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect("/login")

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar user={session} />
      <main className="flex flex-1 flex-col overflow-y-auto">{children}</main>
    </div>
  )
}
