"use client"

import { GripVertical, Plus, Trash2, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { QUESTION_TYPE_LABELS } from "@/lib/constants"
import type { Question, QuestionOption, QuestionType } from "@/types"

const QUESTION_TYPES = Object.entries(QUESTION_TYPE_LABELS) as [QuestionType, string][]

interface QuestionEditorProps {
  question: Question
  index: number
  onChange: (question: Question) => void
  onRemove: () => void
}

function createOption(): QuestionOption {
  return { id: crypto.randomUUID(), label: "" }
}

export function QuestionEditor({ question, index, onChange, onRemove }: QuestionEditorProps) {
  function handleTypeChange(type: QuestionType) {
    const next: Question = { ...question, type }
    if (type === "multiple_choice" && (!next.options || next.options.length === 0)) {
      next.options = [createOption(), createOption()]
    } else if (type !== "multiple_choice") {
      next.options = undefined
    }
    onChange(next)
  }

  function handleOptionChange(optionId: string, label: string) {
    onChange({
      ...question,
      options: question.options?.map((o) => (o.id === optionId ? { ...o, label } : o)),
    })
  }

  function addOption() {
    onChange({ ...question, options: [...(question.options ?? []), createOption()] })
  }

  function removeOption(optionId: string) {
    onChange({ ...question, options: question.options?.filter((o) => o.id !== optionId) })
  }

  return (
    <div className="group relative rounded-lg border border-border/60 bg-card p-4 transition-colors hover:border-border">
      {/* Drag handle (visual only) + question number */}
      <div className="mb-3 flex items-center gap-2">
        <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/40" />
        <span className="text-xs font-medium text-muted-foreground">Pergunta {index + 1}</span>

        <div className="ml-auto flex items-center gap-2">
          {/* Required toggle */}
          <label className="flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={question.required}
              onChange={(e) => onChange({ ...question, required: e.target.checked })}
              className="accent-primary"
            />
            Obrigatória
          </label>

          {/* Remove question */}
          <button
            type="button"
            onClick={onRemove}
            className="rounded p-0.5 text-muted-foreground/50 transition-colors hover:bg-destructive/10 hover:text-destructive"
            aria-label="Remover pergunta"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        {/* Title */}
        <div className="space-y-1.5">
          <Label htmlFor={`q-title-${question.id}`} className="text-xs text-muted-foreground">
            Título
          </Label>
          <Input
            id={`q-title-${question.id}`}
            value={question.title}
            onChange={(e) => onChange({ ...question, title: e.target.value })}
            placeholder="Ex.: Como você avalia nosso atendimento?"
            className="h-8 text-sm"
          />
        </div>

        {/* Type */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Tipo</Label>
          <Select
            value={question.type}
            onValueChange={(v: string | null) => { if (v) handleTypeChange(v as QuestionType) }}
          >
            <SelectTrigger className="h-8 w-48 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {QUESTION_TYPES.map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Multiple choice options */}
      {question.type === "multiple_choice" && (
        <div className="mt-3 space-y-2">
          <Label className="text-xs text-muted-foreground">Opções de resposta</Label>
          {(question.options ?? []).map((option, i) => (
            <div key={option.id} className="flex items-center gap-2">
              <span className="w-4 shrink-0 text-center text-xs text-muted-foreground">
                {i + 1}.
              </span>
              <Input
                value={option.label}
                onChange={(e) => handleOptionChange(option.id, e.target.value)}
                placeholder={`Opção ${i + 1}`}
                className="h-7 text-sm"
              />
              <button
                type="button"
                onClick={() => removeOption(option.id)}
                disabled={(question.options?.length ?? 0) <= 1}
                className="shrink-0 rounded p-0.5 text-muted-foreground/50 transition-colors hover:text-destructive disabled:pointer-events-none disabled:opacity-30"
                aria-label="Remover opção"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={addOption}
            className="h-7 gap-1.5 text-xs text-muted-foreground"
          >
            <Plus className="h-3.5 w-3.5" />
            Adicionar opção
          </Button>
        </div>
      )}
    </div>
  )
}
