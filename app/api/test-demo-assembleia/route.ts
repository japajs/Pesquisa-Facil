import { NextRequest, NextResponse } from "next/server"
import { createCondominio } from "@/services/condominios"
import { createProprietario } from "@/services/proprietarios"
import { createUnidade } from "@/services/unidades"
import { createAssembleia, updateAssembleiaStatus } from "@/services/assembleias"
import { createPautasBatch } from "@/services/pautas"
import { upsertAssembleiaSend, updateAssembleiaSendStatus } from "@/services/assembleia-votos"
import { sendAssembleiaEmailBatch } from "@/services/email"
import { generateSurveyToken } from "@/lib/tokens"
import { ROUTES } from "@/lib/constants"

// Rota temporária, só pra gerar uma assembleia de demonstração real (com
// e-mail de convite de verdade) a pedido do usuário, e ser removida logo em
// seguida — mesmo padrão das rotas de teste de cada fase, só que sem limpar
// os dados no final (o usuário quer explorar a assembleia criada pela UI).
export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key")
  if (key !== "demo-fase9-cleiton-2026") {
    return NextResponse.json({ error: "not found" }, { status: 404 })
  }

  const appUrl = "https://votoonline.online"
  const emailDestino = "cleitonsalazargomes@gmail.com"

  try {
    const condominio = await createCondominio({ nome: "ORGANIZAÇÕES TEMA LTDA ME" })

    const proprietario = await createProprietario({
      condominio_id: condominio.id,
      nome: "Cleiton Salazar",
      email: emailDestino,
      telefone: null,
    })

    const unidade = await createUnidade({ proprietario_id: proprietario.id, numero: "101", bloco: null })

    const assembleia = await createAssembleia({
      condominio_id: condominio.id,
      titulo: "Assembleia Geral Ordinária — Demonstração",
      descricao: "Assembleia de teste criada para demonstrar o fluxo de votação por e-mail.",
      data_abertura: null,
      data_encerramento: null,
      quorum_minimo: null,
      data_1a_convocacao: null,
      quorum_minimo_2a: null,
    })

    await updateAssembleiaStatus(assembleia.id, "aberta")

    await createPautasBatch([
      {
        assembleia_id: assembleia.id,
        ordem: 1,
        titulo: "Aprovação do orçamento para 2026",
        descricao: "Aprovação do orçamento anual apresentado pela administração.",
        tipo: "sim_nao",
      },
      {
        assembleia_id: assembleia.id,
        ordem: 2,
        titulo: "Eleição do síndico",
        descricao: "Escolha do síndico para o próximo mandato.",
        tipo: "multipla_escolha",
        opcoes: ["Candidato A", "Candidato B", "Candidato C"],
      },
    ])

    const token = generateSurveyToken()
    const send = await upsertAssembleiaSend({
      assembleia_id: assembleia.id,
      proprietario_id: proprietario.id,
      token,
    })

    const votoUrl = `${appUrl}${ROUTES.publicCondoVoto(token)}`

    const { sent, failed } = await sendAssembleiaEmailBatch([
      {
        sendId: send.id,
        to: emailDestino,
        proprietarioNome: proprietario.nome,
        assembleiaTitulo: assembleia.titulo,
        assembleiaDescricao: assembleia.descricao,
        pautas: [{ titulo: "Aprovação do orçamento para 2026" }, { titulo: "Eleição do síndico" }],
        votoUrl,
      },
    ])

    const now = new Date().toISOString()
    if (sent.length > 0) await updateAssembleiaSendStatus(send.id, "sent", now)
    if (failed.length > 0) await updateAssembleiaSendStatus(send.id, "failed")

    return NextResponse.json({
      emailEnviado: sent.length > 0,
      votoUrl,
      condominioId: condominio.id,
      assembleiaId: assembleia.id,
    })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
