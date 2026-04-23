// ─── Types ──────────────────────────────────────────────────────────────────

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'partial'

export type QuestionSection =
  | 'conhecimentos_gerais'
  | 'conhecimentos_especificos'
  | 'unknown'

export type QuestionType =
  | 'simple'
  | 'roman_numeral'
  | 'true_false'
  | 'association'
  | 'unknown'

export interface IngestResponse {
  job_id: string
  exam_id: string | null
}

export interface Job {
  id: string
  exam_id: string | null
  status: JobStatus
  total_found: number | null
  parsed_ok: number | null
  parse_errors: number | null
  error_message: string | null
  created_at: string
  updated_at: string
}

export interface Exam {
  id: string
  filename: string
  file_hash: string
  question_count: number
  enriched_count: number
  created_at: string
}

export interface QuestionItem {
  label: string
  text: string
}

export interface Alternatives {
  A: string
  B: string
  C: string
  D: string
  E: string
}

export interface QuestionEnrichment {
  area: string
  topic: string
  keywords: string[]
  difficulty: 'facil' | 'medio' | 'dificil'
  bloom_level: string
}

export interface Question {
  id: string
  exam_id: string
  job_id: string
  number: number
  section: QuestionSection
  question_type: QuestionType
  enunciado: string
  items: QuestionItem[] | null
  alternatives: Alternatives
  gabarito: string | null
  confidence: number
  enrichment: QuestionEnrichment | null
  raw_block?: string
  created_at: string
}

export interface QuestionsResponse {
  total: number
  page: number
  page_size: number
  items: Question[]
}

export interface ParseError {
  id: string
  exam_id: string
  job_id: string
  raw_block: string
  reason: string
  created_at: string
}

export interface QuestionsFilters {
  section?: QuestionSection
  type?: QuestionType
  min_confidence?: number
  page?: number
  page_size?: number
  include_raw?: boolean
}

export interface HealthStatus {
  status: string
}

// ─── Base fetch helper ───────────────────────────────────────────────────────

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: {
      'Accept': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  })

  if (!res.ok) {
    let message = `HTTP ${res.status}`
    try {
      const body = await res.json() as { detail?: string; message?: string }
      message = body.detail ?? body.message ?? message
    } catch {
      // ignore parse error, use status message
    }
    throw new Error(message)
  }

  return res.json() as Promise<T>
}

// ─── Ingest endpoints ────────────────────────────────────────────────────────

export type DocumentCategory = 'prova' | 'edital'

export async function uploadFile(file: File, category: DocumentCategory): Promise<IngestResponse> {
  const form = new FormData()
  form.append('file', file)
  form.append('category', category)
  return apiFetch<IngestResponse>('/ingest/upload', {
    method: 'POST',
    body: form,
  })
}

export async function ingestUrl(url: string, category: DocumentCategory): Promise<IngestResponse> {
  return apiFetch<IngestResponse>('/ingest/url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, category }),
  })
}

// ─── Jobs ────────────────────────────────────────────────────────────────────

export async function getJob(id: string): Promise<Job> {
  return apiFetch<Job>(`/jobs/${id}`)
}

// ─── Exams ───────────────────────────────────────────────────────────────────

export async function listExams(): Promise<Exam[]> {
  return apiFetch<Exam[]>('/exams')
}

export async function getExamQuestions(
  examId: string,
  filters: QuestionsFilters = {},
): Promise<QuestionsResponse> {
  const params = new URLSearchParams()
  if (filters.section) params.set('section', filters.section)
  if (filters.type) params.set('type', filters.type)
  if (filters.min_confidence !== undefined)
    params.set('min_confidence', String(filters.min_confidence))
  if (filters.page !== undefined) params.set('page', String(filters.page))
  if (filters.page_size !== undefined)
    params.set('page_size', String(filters.page_size))
  if (filters.include_raw !== undefined)
    params.set('include_raw', String(filters.include_raw))

  const qs = params.toString()
  return apiFetch<QuestionsResponse>(
    `/exams/${examId}/questions${qs ? `?${qs}` : ''}`,
  )
}

export async function getQuestion(id: string): Promise<Question> {
  return apiFetch<Question>(`/questions/${id}?include_raw=true`)
}

export async function getExamErrors(examId: string): Promise<ParseError[]> {
  return apiFetch<ParseError[]>(`/exams/${examId}/errors`)
}

export type EnrichProvider = 'ollama' | 'gemini'

export async function enrichExam(
  examId: string,
  mode: 'missing' | 'all',
  provider?: EnrichProvider,
): Promise<{ message: string; queued: number }> {
  return apiFetch(`/exams/${examId}/enrich`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode, provider: provider ?? null }),
  })
}

export interface ImportResult {
  exams_created: number
  exams_existing: number
  questions_created: number
  questions_skipped: number
  questions_enrichment_updated: number
}

export async function importExams(file: File): Promise<ImportResult> {
  const form = new FormData()
  form.append('file', file)
  return apiFetch<ImportResult>('/import', {
    method: 'POST',
    body: form,
  })
}

export async function exportExams(format: 'json' | 'csv'): Promise<void> {
  const res = await fetch(`/exams/export?format=${format}`)
  if (!res.ok) {
    throw new Error(`Export failed: HTTP ${res.status}`)
  }
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `exams_export.${format}`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function deleteExam(examId: string): Promise<void> {
  const res = await fetch(`/exams/${examId}`, { method: 'DELETE' })
  if (!res.ok) {
    let message = `HTTP ${res.status}`
    try {
      const body = await res.json() as { detail?: string }
      message = body.detail ?? message
    } catch { /* ignore */ }
    throw new Error(message)
  }
}

// ─── Health ──────────────────────────────────────────────────────────────────

export async function getHealthLive(): Promise<HealthStatus> {
  return apiFetch<HealthStatus>('/health/live')
}

export async function getHealthReady(): Promise<HealthStatus> {
  return apiFetch<HealthStatus>('/health/ready')
}
