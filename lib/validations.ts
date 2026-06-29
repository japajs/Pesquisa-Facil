import { z } from "zod"

// ─── Question ─────────────────────────────────────────────────────────────────

export const questionOptionSchema = z.object({
  id: z.string(),
  label: z.string().min(1, "O texto da opção não pode estar vazio"),
})

export const questionSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "O título da pergunta é obrigatório"),
  type: z.enum(["text", "rating_5", "rating_10", "yes_no", "multiple_choice"]),
  required: z.boolean(),
  options: z.array(questionOptionSchema).optional(),
})

// ─── Survey ───────────────────────────────────────────────────────────────────

export const surveyFormSchema = z.object({
  title: z.string().min(1, "O título é obrigatório").max(200, "Título muito longo"),
  description: z.string().max(500, "Descrição muito longa").optional(),
  questions: z
    .array(questionSchema)
    .min(1, "Adicione pelo menos uma pergunta"),
})

export type SurveyFormValues = z.infer<typeof surveyFormSchema>

// ─── Client ───────────────────────────────────────────────────────────────────

export const clientSchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  company: z.string().optional(),
  email: z.string().email("E-mail inválido"),
})

export type ClientFormValues = z.infer<typeof clientSchema>
