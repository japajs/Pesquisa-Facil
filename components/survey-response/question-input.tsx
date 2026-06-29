"use client"

import { cn } from "@/lib/utils"
import { Textarea } from "@/components/ui/textarea"
import type { Question } from "@/types"

const RATING_5_LABELS: Record<string, string> = {
  "1": "Muito insatisfeito",
  "2": "Insatisfeito",
  "3": "Neutro",
  "4": "Satisfeito",
  "5": "Muito satisfeito",
}

interface QuestionInputProps {
  question: Question
  value: string
  onChange: (value: string) => void
}

export function QuestionInput({ question, value, onChange }: QuestionInputProps) {
  switch (question.type) {
    case "text":
      return (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Digite sua resposta…"
          rows={3}
          className="resize-none"
        />
      )

    case "rating_5":
      return (
        <div className="flex flex-wrap items-center gap-2">
          {[1, 2, 3, 4, 5].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => onChange(String(num))}
              aria-pressed={value === String(num)}
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-xl border-2 text-sm font-semibold transition-all",
                value === String(num)
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:border-primary/60"
              )}
            >
              {num}
            </button>
          ))}
          {value && (
            <span className="ml-1 text-sm text-muted-foreground">
              {RATING_5_LABELS[value]}
            </span>
          )}
        </div>
      )

    case "rating_10":
      return (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => onChange(String(num))}
                aria-pressed={value === String(num)}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg border-2 text-sm font-semibold transition-all",
                  value === String(num)
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-foreground hover:border-primary/60"
                )}
              >
                {num}
              </button>
            ))}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Muito improvável</span>
            <span>Muito provável</span>
          </div>
        </div>
      )

    case "yes_no":
      return (
        <div className="flex gap-3">
          {(["Sim", "Não"] as const).map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              aria-pressed={value === opt}
              className={cn(
                "flex flex-1 items-center justify-center rounded-xl border-2 py-4 text-sm font-medium transition-all",
                value === opt
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:border-primary/60"
              )}
            >
              {opt}
            </button>
          ))}
        </div>
      )

    case "multiple_choice":
      return (
        <div className="space-y-2">
          {(question.options ?? []).map((option) => (
            <label
              key={option.id}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-lg border-2 p-3.5 transition-all",
                value === option.label
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:border-primary/40"
              )}
            >
              <input
                type="radio"
                name={question.id}
                value={option.label}
                checked={value === option.label}
                onChange={() => onChange(option.label)}
                className="sr-only"
              />
              <div
                className={cn(
                  "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                  value === option.label ? "border-primary bg-primary" : "border-border"
                )}
              >
                {value === option.label && (
                  <div className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />
                )}
              </div>
              <span className="text-sm">{option.label}</span>
            </label>
          ))}
        </div>
      )

    default:
      return null
  }
}
