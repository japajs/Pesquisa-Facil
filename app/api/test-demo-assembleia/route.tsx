import React from "react"
import { NextRequest, NextResponse } from "next/server"
import { renderToBuffer } from "@react-pdf/renderer"
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"
import { createServerClient } from "@/lib/supabase/server"
import { deleteCondominio } from "@/services/condominios"
import { createAssembleia, updateAssembleiaStatus } from "@/services/assembleias"
import { createPautasBatch } from "@/services/pautas"
import { upsertAssembleiaSend, updateAssembleiaSendStatus } from "@/services/assembleia-votos"
import { sendAssembleiaEmailBatch } from "@/services/email"
import { generateSurveyToken } from "@/lib/tokens"
import { ROUTES } from "@/lib/constants"

// Rota temporária: (1) apaga o condomínio fictício da primeira tentativa de
// demonstração, (2) cria uma assembleia real dentro do condomínio real onde
// "ORGANIZAÇÕES TEMA LTDA ME" já é proprietário de verdade, com um PDF de
// convocação anexado — a pedido do usuário, pra ver o fluxo completo com o
// peso real (7 unidades). Será removida em seguida.
const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 12 },
  titulo: { fontSize: 18, marginBottom: 12, fontWeight: 700 },
  paragrafo: { marginBottom: 8, lineHeight: 1.5 },
})

function ConvocacaoPDF({ assembleiaTitulo }: { assembleiaTitulo: string }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.titulo}>Edital de Convocação</Text>
        <Text style={styles.paragrafo}>{assembleiaTitulo}</Text>
        <Text style={styles.paragrafo}>
          Documento de teste anexado ao e-mail de convite, para demonstração do fluxo de disparo
          com anexo em PDF.
        </Text>
      </Page>
    </Document>
  )
}

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key")
  if (key !== "demo-fase9-cleiton-2026") {
    return NextResponse.json({ error: "not found" }, { status: 404 })
  }

  const appUrl = "https://votoonline.online"
  const emailDestino = "cleitonsalazargomes@gmail.com"
  const nomeProprietario = "ORGANIZAÇÕES TEMA LTDA ME"

  const db = createServerClient()

  try {
    // 1) Apaga o condomínio fictício criado na primeira tentativa.
    const { data: fake } = await db.from("condominios").select("id").eq("nome", nomeProprietario)
    for (const c of fake ?? []) {
      await deleteCondominio((c as { id: string }).id)
    }

    // 2) Localiza o proprietário REAL (mesmo nome + e-mail) e seu condomínio real.
    const { data: proprietarios, error: propError } = await db
      .from("proprietarios")
      .select("id, nome, email, condominio_id")
      .eq("nome", nomeProprietario)
      .eq("email", emailDestino)

    if (propError) throw new Error(propError.message)
    if (!proprietarios || proprietarios.length === 0) {
      return NextResponse.json(
        { error: `Nenhum proprietário real encontrado com nome "${nomeProprietario}" e e-mail ${emailDestino}.` },
        { status: 404 }
      )
    }
    if (proprietarios.length > 1) {
      return NextResponse.json(
        { error: "Mais de um proprietário encontrado com esse nome/e-mail — ambíguo.", candidatos: proprietarios },
        { status: 409 }
      )
    }

    const proprietario = proprietarios[0] as { id: string; nome: string; email: string; condominio_id: string }

    // 3) Cria a assembleia real dentro do condomínio real.
    const assembleia = await createAssembleia({
      condominio_id: proprietario.condominio_id,
      titulo: "Assembleia Geral Ordinária 2026",
      descricao: "Assembleia de demonstração criada no condomínio real, a pedido do usuário.",
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

    // 4) PDF de teste, anexado ao disparo.
    const pdfBuffer = await renderToBuffer(<ConvocacaoPDF assembleiaTitulo={assembleia.titulo} />)

    const token = generateSurveyToken()
    const send = await upsertAssembleiaSend({
      assembleia_id: assembleia.id,
      proprietario_id: proprietario.id,
      token,
    })

    const votoUrl = `${appUrl}${ROUTES.publicCondoVoto(token)}`

    const { sent, failed } = await sendAssembleiaEmailBatch(
      [
        {
          sendId: send.id,
          to: emailDestino,
          proprietarioNome: proprietario.nome,
          assembleiaTitulo: assembleia.titulo,
          assembleiaDescricao: assembleia.descricao,
          pautas: [{ titulo: "Aprovação do orçamento para 2026" }, { titulo: "Eleição do síndico" }],
          votoUrl,
        },
      ],
      { filename: "convocacao-teste.pdf", content: pdfBuffer }
    )

    const now = new Date().toISOString()
    if (sent.length > 0) await updateAssembleiaSendStatus(send.id, "sent", now)
    if (failed.length > 0) await updateAssembleiaSendStatus(send.id, "failed")

    return NextResponse.json({
      emailEnviado: sent.length > 0,
      votoUrl,
      condominioId: proprietario.condominio_id,
      assembleiaId: assembleia.id,
      proprietarioUnidades: "ver painel — deve ser 7",
    })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
