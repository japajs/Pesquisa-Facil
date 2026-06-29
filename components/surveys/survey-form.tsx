"use client"

import { useActionState, useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Loader2 } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { QuestionEditor } from "./question-editor"
import { createSurveyAction, updateSurveyAction, type SurveyActionState } from "@/app/actions/surveys"
import { ROUTES } from "@/lib/constants"
import type { Survey, Question } from "@/types"
import Link from "next/link"
import { cn } from "@/lib/utils"

function createEmptyQuestion(): Question {
  return {
    id: crypto.randomUUID(),
    title: "",
    type: "text",
    required: true,
  }
}

interface SurveyFormProps {
  survey?: Survey
}

export function SurveyForm({ survey }: SurveyFormProps) {
  const router = useRouter()
  const isEditing = Boolean(survey)

  const [questions, setQuestions] = useState<Question[]>(
    survey?.questions.length ? survey.questions : [createEmptyQuestion()]
  )

  // Bind the update action to the survey id when editing
  const action = isEditing
    ? updateSurveyAction.bind(null, survey!.id)
    : createSurveyAction

  const [state, formAction, isPending] = useActionState<SurveyActionState, FormData>(
    action,
    null
  )

  function addQuestion() {
    setQuestions((prev) => [...prev, createEmptyQuestion()])
  }

  function removeQuestion(id: string) {
    setQuestions((prev) => prev.filter((q) => q.id !== id))
  }

  function updateQuestion(updated: Question) {
    setQuestions((prev) => prev.map((q) => (q.id === updated.id ? updated : q)))
  }

  return (
    <form action={formAction} className="space-y-6">
      {/* Hidden field with serialized questions */}
      <input type="hidden" name="questions" value={JSON.stringify(questions)} />

      {/* Title */}
      <div className="space-y-1.5">
        <Label htmlFor="title">
          Título <span className="text-destructive">*</span>
        </Label>
        <Input
          id="title"
          name="title"
          defaultValue={survey?.title}
          placeholder="Ex.: Pesquisa de satisfação — Junho 2025"
          required
          disabled={isPending}
          className="max-w-xl"
        />
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={survey?.description ?? ""}
          placeholder="Adicione uma descrição opcional para esta pesquisa…"
          rows={3}
          disabled={isPending}
          className="max-w-xl resize-none"
        />
      </div>

      {/* Questions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm">
            Perguntas <span className="text-destructive">*</span>
          </Label>
          <span className="text-xs text-muted-foreground">
            {questions.length} {questions.length === 1 ? "pergunta" : "perguntas"}
          </span>
        </div>

        <div className="space-y-2">
          {questions.map((question, index) => (
            <QuestionEditor
              key={question.id}
              question={question}
              index={index}
              onChange={updateQuestion}
              onRemove={() => removeQuestion(question.id)}
            />
          ))}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addQuestion}
          disabled={isPending}
          className="gap-1.5"
        >
          <Plus className="h-4 w-4" />
          Adicionar pergunta
        </Button>
      </div>

      {/* Error */}
      {state?.error && (
        <div
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {state.error}
        </div>
      )}

      {/* Footer actions */}
      <div className="flex items-center gap-3 border-t border-border/60 pt-6">
        <Button type="submit" disabled={isPending || questions.length === 0} className="gap-2">
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {isEditing ? "Salvar alterações" : "Criar pesquisa"}
        </Button>
        <Link
          href={ROUTES.surveys}
          className={cn(buttonVariants({ variant: "ghost" }), "text-muted-foreground")}
          onClick={(e) => { if (isPending) e.preventDefault() }}
        >
          Cancelar
        </Link>
      </div>
    </form>
  )
}
