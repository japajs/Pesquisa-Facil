// Peso de um proprietário = quantidade de unidades vinculadas a ele. Nunca
// armazenado no cadastro — sempre recalculado a partir das unidades atuais,
// para que vendas/compras de apartamento reflitam automaticamente em
// qualquer pesquisa futura sem exigir nenhuma atualização manual.
//
// Exceção: uma vez que um voto é registrado, o peso usado NAQUELE voto é
// congelado em `assembleia_respostas.peso` (ver services/assembleia-votos.ts)
// — transferências de unidade depois do voto nunca alteram um resultado já
// apurado. Esta função só serve para peso "ao vivo" (antes de votar, ou para
// exibição fora do contexto de uma votação específica).
export function getPesoParticipante(proprietario: { unidades?: unknown[] }): number {
  return proprietario.unidades?.length ?? 0
}
