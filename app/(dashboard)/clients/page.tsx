import type { Metadata } from "next"
import { ClientsTable } from "@/components/clients/clients-table"
import { ImportCSVDialog } from "@/components/clients/import-csv-dialog"
import { getAllClients } from "@/services/clients"
import type { Client } from "@/types"

export const metadata: Metadata = { title: "Clientes" }

async function fetchClients(): Promise<Client[]> {
  try {
    return await getAllClients()
  } catch {
    return []
  }
}

export default async function ClientsPage() {
  const clients = await fetchClients()

  return (
    <div className="flex flex-col gap-6 p-6 pt-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Clientes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {clients.length} {clients.length === 1 ? "cliente cadastrado" : "clientes cadastrados"}
          </p>
        </div>
        <ImportCSVDialog />
      </div>

      <ClientsTable clients={clients} />
    </div>
  )
}
