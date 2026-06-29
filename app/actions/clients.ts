"use server"

import { revalidatePath } from "next/cache"
import { createManyClients, deleteClient } from "@/services/clients"
import { clientSchema } from "@/lib/validations"
import { ROUTES } from "@/lib/constants"
import type { ParsedClient } from "@/utils/csv"

export async function importClientsAction(
  rawClients: ParsedClient[]
): Promise<{ inserted: number; skipped: number; error?: string }> {
  if (rawClients.length === 0) {
    return { inserted: 0, skipped: 0, error: "Nenhum cliente para importar." }
  }

  // Filter rows that pass basic validation
  const valid = rawClients.filter((c) => clientSchema.safeParse(c).success)
  const invalidCount = rawClients.length - valid.length

  if (valid.length === 0) {
    return {
      inserted: 0,
      skipped: rawClients.length,
      error: "Nenhum cliente válido encontrado. Verifique os dados do CSV.",
    }
  }

  try {
    const result = await createManyClients(valid)
    revalidatePath(ROUTES.clients)
    revalidatePath(ROUTES.dashboard)
    return {
      inserted: result.inserted,
      skipped: result.skipped + invalidCount,
    }
  } catch (err) {
    return {
      inserted: 0,
      skipped: rawClients.length,
      error: err instanceof Error ? err.message : "Erro ao importar clientes.",
    }
  }
}

export async function deleteClientAction(id: string): Promise<{ error?: string }> {
  try {
    await deleteClient(id)
    revalidatePath(ROUTES.clients)
    revalidatePath(ROUTES.dashboard)
    return {}
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erro ao excluir cliente." }
  }
}
