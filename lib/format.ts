// Máscara de exibição do celular — só formatação visual, nunca altera o que
// está gravado no banco. Cobre os dois tamanhos comuns no Brasil (11 dígitos
// com o 9º dígito, ou 10 dígitos no formato antigo); qualquer outra coisa
// (número incompleto, formato internacional etc.) é exibida como veio,
// sem forçar uma máscara que distorceria o dado.
export function formatCelular(telefone: string): string {
  const digitos = telefone.replace(/\D/g, "")
  if (digitos.length === 11) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`
  }
  if (digitos.length === 10) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`
  }
  return telefone
}
