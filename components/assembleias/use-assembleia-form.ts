import { useState } from "react"
import type { PautaTipo } from "@/types"

export const MAX_PAUTAS = 9
export const MIN_OPCOES = 2

export interface PautaFormState {
  titulo: string
  descricao: string
  tipo: PautaTipo
  permiteAbstencao: boolean
  opcoes: string[]
}

export interface AssembleiaFormValues {
  titulo: string
  descricao: string
  dataAbertura: string
  dataEncerramento: string
  pautas: PautaFormState[]
}

export function novaPauta(): PautaFormState {
  return { titulo: "", descricao: "", tipo: "sim_nao", permiteAbstencao: true, opcoes: [] }
}

function valoresIniciais(initial?: Partial<AssembleiaFormValues>): AssembleiaFormValues {
  return {
    titulo: initial?.titulo ?? "",
    descricao: initial?.descricao ?? "",
    dataAbertura: initial?.dataAbertura ?? "",
    dataEncerramento: initial?.dataEncerramento ?? "",
    pautas: initial?.pautas?.length ? initial.pautas : [novaPauta()],
  }
}

// Estado e mutações do formulário de assembleia (título, descrição, datas e
// pautas) — usado tanto na criação quanto na edição, para as duas telas
// nunca divergirem em validação ou comportamento.
export function useAssembleiaForm(initial?: Partial<AssembleiaFormValues>) {
  const [titulo, setTitulo] = useState(() => valoresIniciais(initial).titulo)
  const [descricao, setDescricao] = useState(() => valoresIniciais(initial).descricao)
  const [dataAbertura, setDataAbertura] = useState(() => valoresIniciais(initial).dataAbertura)
  const [dataEncerramento, setDataEncerramento] = useState(() => valoresIniciais(initial).dataEncerramento)
  const [pautas, setPautas] = useState<PautaFormState[]>(() => valoresIniciais(initial).pautas)

  function reset(values?: Partial<AssembleiaFormValues>) {
    const v = valoresIniciais(values)
    setTitulo(v.titulo)
    setDescricao(v.descricao)
    setDataAbertura(v.dataAbertura)
    setDataEncerramento(v.dataEncerramento)
    setPautas(v.pautas)
  }

  function addPauta() {
    if (pautas.length >= MAX_PAUTAS) return
    setPautas((prev) => [...prev, novaPauta()])
  }

  function removePauta(index: number) {
    setPautas((prev) => prev.filter((_, i) => i !== index))
  }

  function updatePauta(index: number, field: "titulo" | "descricao", value: string) {
    setPautas((prev) => prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)))
  }

  function updatePautaTipo(index: number, tipo: PautaTipo) {
    setPautas((prev) =>
      prev.map((p, i) =>
        i === index
          ? { ...p, tipo, opcoes: tipo === "multipla_escolha" && p.opcoes.length === 0 ? ["", ""] : p.opcoes }
          : p
      )
    )
  }

  function togglePermiteAbstencao(index: number) {
    setPautas((prev) =>
      prev.map((p, i) => (i === index ? { ...p, permiteAbstencao: !p.permiteAbstencao } : p))
    )
  }

  function addOpcao(pautaIndex: number) {
    setPautas((prev) =>
      prev.map((p, i) => (i === pautaIndex ? { ...p, opcoes: [...p.opcoes, ""] } : p))
    )
  }

  function removeOpcao(pautaIndex: number, opcaoIndex: number) {
    setPautas((prev) =>
      prev.map((p, i) =>
        i === pautaIndex ? { ...p, opcoes: p.opcoes.filter((_, oi) => oi !== opcaoIndex) } : p
      )
    )
  }

  function updateOpcao(pautaIndex: number, opcaoIndex: number, value: string) {
    setPautas((prev) =>
      prev.map((p, i) =>
        i === pautaIndex
          ? { ...p, opcoes: p.opcoes.map((o, oi) => (oi === opcaoIndex ? value : o)) }
          : p
      )
    )
  }

  function moveOpcao(pautaIndex: number, opcaoIndex: number, direction: -1 | 1) {
    setPautas((prev) =>
      prev.map((p, i) => {
        if (i !== pautaIndex) return p
        const target = opcaoIndex + direction
        if (target < 0 || target >= p.opcoes.length) return p
        const opcoes = [...p.opcoes]
        ;[opcoes[opcaoIndex], opcoes[target]] = [opcoes[target]!, opcoes[opcaoIndex]!]
        return { ...p, opcoes }
      })
    )
  }

  const canSubmit =
    titulo.trim().length > 0 &&
    pautas.length > 0 &&
    pautas.every((p) => {
      if (!p.titulo.trim()) return false
      if (p.tipo !== "multipla_escolha") return true
      return p.opcoes.map((o) => o.trim()).filter(Boolean).length >= MIN_OPCOES
    })

  return {
    titulo,
    setTitulo,
    descricao,
    setDescricao,
    dataAbertura,
    setDataAbertura,
    dataEncerramento,
    setDataEncerramento,
    pautas,
    addPauta,
    removePauta,
    updatePauta,
    updatePautaTipo,
    togglePermiteAbstencao,
    addOpcao,
    removeOpcao,
    updateOpcao,
    moveOpcao,
    canSubmit,
    reset,
  }
}

export type AssembleiaFormApi = ReturnType<typeof useAssembleiaForm>
