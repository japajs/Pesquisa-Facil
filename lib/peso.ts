import type { CriterioPeso } from "@/types"

// Peso de um proprietário, calculado a partir das unidades vinculadas a ele.
// Nunca armazenado no cadastro — sempre recalculado a partir das unidades
// atuais, para que vendas/compras de apartamento reflitam automaticamente em
// qualquer pesquisa futura sem exigir nenhuma atualização manual.
//
// Depende de condominios.criterio_peso (ver auditoria de assembleias — Fase 1):
// "unidade" (padrão/histórico) = 1 unidade = peso 1, sempre. "fracao_ideal" =
// soma de unidades.fracao_ideal, a regra padrão de condomínio no Brasil salvo
// disposição diversa na convenção. Unidade sem fracao_ideal preenchida conta
// como 0 nesse modo — cabe à tela de cadastro avisar que falta preencher.
//
// Exceção: uma vez que um voto é registrado, o peso usado NAQUELE voto é
// congelado em `assembleia_respostas.peso` (ver services/assembleia-votos.ts)
// — transferências de unidade depois do voto nunca alteram um resultado já
// apurado. Esta função só serve para peso "ao vivo" (antes de votar, ou para
// exibição fora do contexto de uma votação específica).
export function getPesoParticipante(
  proprietario: { unidades?: { fracao_ideal?: number | null }[] },
  criterioPeso: CriterioPeso = "unidade"
): number {
  const unidades = proprietario.unidades ?? []
  if (criterioPeso === "fracao_ideal") {
    return unidades.reduce((soma, u) => soma + (u.fracao_ideal ?? 0), 0)
  }
  return unidades.length
}

// Peso total do condomínio inteiro (todas as unidades de todos os
// proprietários, independente de quem foi convidado pra uma assembleia) —
// é o denominador do quórum mínimo (assembleias.quorum_minimo). Precisa ser
// TODAS as unidades do condomínio, não só as de quem recebeu convite —
// senão um proprietário sem e-mail cadastrado infla artificialmente o
// percentual de quórum atingido.
export function getPesoTotalCondominio(
  unidades: { fracao_ideal?: number | null }[],
  criterioPeso: CriterioPeso = "unidade"
): number {
  if (criterioPeso === "fracao_ideal") {
    return unidades.reduce((soma, u) => soma + (u.fracao_ideal ?? 0), 0)
  }
  return unidades.length
}
