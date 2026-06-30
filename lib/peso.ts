// Peso de voto de um proprietário = quantidade de unidades vinculadas a ele.
// Nunca armazenado em banco — sempre recalculado a partir do cadastro atual
// de unidades, para que vendas/compras de apartamento reflitam automaticamente
// em qualquer pesquisa futura sem exigir nenhuma atualização manual.
export function getPesoParticipante(proprietario: { unidades?: { id: string }[] }): number {
  return proprietario.unidades?.length ?? 0
}
