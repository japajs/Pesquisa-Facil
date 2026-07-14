// Chave normalizada de uma unidade — só para comparação/duplicidade,
// NUNCA para exibição (ver formatUnidade abaixo, que continua mostrando o
// padrão da administradora). Remove hífens, espaços e qualquer caractere
// que não seja letra ou número, e converte para maiúsculas, para que
// "C-0502", "C0502", "c 0502" e "c-0502" sejam sempre a mesma unidade.
// Espelha exatamente a coluna gerada `unidades.numero_normalizado` no banco
// (mesma expressão, só que em JS) — usada no client antes de chamar o
// servidor, para validação/feedback imediato.
export function normalizarChaveUnidade(unidade: { numero: string; bloco?: string | null }): string {
  const bruto = `${unidade.bloco ?? ""}${unidade.numero}`
  return bruto.replace(/[^a-zA-Z0-9]/g, "").toUpperCase()
}

// Padroniza a exibição de uma unidade como "BLOCO-NÚMERO" (ex.: C-0502).
// É só formatação visual — nunca altera o que está gravado no banco
// (o campo `numero` continua sendo texto livre, como sempre foi).
export function formatUnidade(unidade: { numero: string; bloco?: string | null }): string {
  const numero = unidade.numero.trim()
  const bloco = unidade.bloco?.trim()
  if (bloco) return `${bloco.toUpperCase()}-${numero}`

  // Cobre o caso comum de o bloco já vir digitado junto do número (o campo
  // `bloco` raramente é usado hoje), em qualquer ordem: "0502 C" ou "C 0502".
  const numeroLetra = numero.match(/^(\d+)[\s-]+([A-Za-z]+)$/)
  if (numeroLetra) return `${numeroLetra[2]!.toUpperCase()}-${numeroLetra[1]}`

  const letraNumero = numero.match(/^([A-Za-z]+)[\s-]+(\d+)$/)
  if (letraNumero) return `${letraNumero[1]!.toUpperCase()}-${letraNumero[2]}`

  return numero
}

// Menor unidade de um proprietário, para ordenação por unidade — usa
// comparação numérica (não alfabética pura) para "0101" vir antes de "0205".
export function menorNumeroUnidade(unidades: { numero: string }[]): string | null {
  if (unidades.length === 0) return null
  return [...unidades].sort((a, b) => a.numero.localeCompare(b.numero, undefined, { numeric: true }))[0]!
    .numero
}
