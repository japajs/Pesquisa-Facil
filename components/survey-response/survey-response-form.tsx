"use client"

import { useState, useTransition } from "react"
import { Loader2, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { QuestionInput } from "./question-input"
import { ThankYou } from "./thank-you"
import { submitResponseAction } from "@/app/actions/responses"
import type { Survey, QuestionAnswer } from "@/types"

interface SurveyResponseFormProps {
  survey: Survey
  sendId: string
}

export function SurveyResponseForm({ survey, sendId }: SurveyResponseFormProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [isPending, startTransition] = useTransition()

  const setAnswer = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
    if (error) setError(null)
  }

  const handleSubmit = () => {
    const missingRequired = survey.questions.filter(
      (q) => q.required && !answers[q.id]?.trim()
    )
    if (missingRequired.length > 0) {
      const label = missingRequired[0].title
      const extra = missingRequired.length - 1
      setError(
        extra > 0
          ? `Por favor, responda: "${label}" e mais ${extra} pergunta${extra > 1 ? "s" : ""} obrigatória${extra > 1 ? "s" : ""}.`
          : `Por favor, responda: "${label}".`
      )
      return
    }

    const payload: QuestionAnswer[] = survey.questions
      .filter((q) => answers[q.id]?.trim())
      .map((q) => ({
        question_id: q.id,
        question_title: q.title,
        question_type: q.type,
        value: answers[q.id],
      }))

    startTransition(async () => {
      const result = await submitResponseAction(sendId, payload)
      if (result.success) {
        setDone(true)
      } else {
        setError(result.error ?? "Erro ao enviar respostas. Tente novamente.")
      }
    })
  }

  if (done) return <ThankYou surveyTitle={survey.title} />

  const requiredCount = survey.questions.filter((q) => q.required).length

  return (
    <div className="space-y-4">
      {/* Questions */}
      {survey.questions.map((question, index) => (
        <div
          key={question.id}
          className="rounded-xl border border-border/60 bg-card p-5"
        >
          <div className="mb-4">
            <p className="text-xs font-medium text-muted-foreground">
              {index + 1} / {survey.questions.length}
            </p>
            <p className="mt-1 text-sm font-medium leading-snug">
              {question.title}
              {question.required && (
                <span className="ml-1 text-destructive" aria-label="obrigatório">
                  *
                </span>
              )}
            </p>
          </div>

          <QuestionInput
            question={question}
            value={answers[question.id] ?? ""}
            onChange={(v) => setAnswer(question.id, v)}
          />
        </div>
      ))}

      {/* Error */}
      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-1">
        {requiredCount > 0 ? (
          <p className="text-xs text-muted-foreground">
            <span className="text-destructive">*</span> Campos obrigatórios
          </p>
        ) : (
          <span />
        )}
        <Button onClick={handleSubmit} disabled={isPending} className="gap-2">
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          {isPending ? "Enviando…" : "Enviar respostas"}
        </Button>
      </div>
    </div>
  )
}
