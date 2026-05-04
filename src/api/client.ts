// ─── Auth token storage (in-memory; refresh token in localStorage) ───────────

let _accessToken: string | null = null
let _onAuthFailure: (() => void) | null = null

export function setAccessToken(token: string | null) {
  _accessToken = token
}

export function setOnAuthFailure(cb: () => void) {
  _onAuthFailure = cb
}

export function clearAuth() {
  _accessToken = null
  localStorage.removeItem('refresh_token')
}

// ─── Types ──────────────────────────────────────────────────────────────────

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'partial'
export type DocumentCategory = 'prova' | 'edital'

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

export interface User {
  id: string
  email: string
  full_name: string
  is_active: boolean
  created_at: string
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface AccessTokenResponse {
  access_token: string
  token_type: string
}

export interface IngestResponse {
  job_id: string
  exam_id: string | null
  edital_id: string | null
}

export interface Job {
  id: string
  exam_id: string | null
  edital_id: string | null
  category: DocumentCategory
  status: JobStatus
  total_found: number | null
  parsed_ok: number | null
  parse_errors: number | null
  error_message: string | null
  created_at: string
  updated_at: string
}

export interface Edital {
  id: string
  filename: string
  file_hash: string
  uploaded_by: User | null
  numero_edital: string | null
  ano: number | null
  edition_name: string | null
  organizadora: string | null
  instituicao_gestora: string | null
  modalidade: string | null
  total_questoes_gerais: number | null
  total_questoes_especificas: number | null
  percentual_minimo_aprovacao: number | null
  bolsa_mensal: number | null
  data_inicio_programas: string | null
  contato_email: string | null
  contato_telefone: string | null
  url_enare: string | null
  /** Etapas do processo seletivo — evento, data_inicio, data_fim (YYYY-MM-DD) */
  cronograma: CronogramaEvento[] | null
  vagas: VagaEntry[] | null
  instituicoes: InstituicaoEntry[] | null
  knowledge_areas: KnowledgeAreaProfession[] | null
  created_at: string
}

export interface CronogramaEvento {
  evento: string
  data_inicio: string
  data_fim: string | null
}

export interface KnowledgeAreaEntry {
  area: string
  topicos: string[]
}

export interface KnowledgeAreaProfession {
  profissao: string
  gerais: KnowledgeAreaEntry[]
  especificos: KnowledgeAreaEntry[]
}

export interface VagaEntry {
  profissao: string
  instituicao: string
  cidade: string
  estado: string
  programa: string
  vagas_ampla: number
  vagas_reservadas: Record<string, number>
}

export interface InstituicaoEntry {
  nome: string
  sigla: string
  cidade: string
  estado: string
  programas: string[]
}

export interface Exam {
  id: string
  filename: string
  file_hash: string
  edital_id: string | null
  uploaded_by: User | null
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

export interface TaxonomyMatchDetail {
  area_match: string
  topic_match: string
}

export interface QuestionExplanation {
  correta: string
  justificativa_correta: string
  justificativas_erradas: Record<string, string>
  conceito_central: string
  confidence: number
  flagged: boolean
}

export interface QuestionEnrichment {
  area?: string | null
  topic?: string | null
  competencia_geral_area?: string | null
  competencia_geral_topico?: string | null
  competencia_especifica_area?: string | null
  competencia_especifica_topico?: string | null
  keywords: string[]
  difficulty: 'facil' | 'medio' | 'dificil'
  bloom_level: string
  taxonomy_grounded?: boolean
  taxonomy_needs_review?: boolean
  taxonomy_match?: {
    question: TaxonomyMatchDetail
    competencia_geral: TaxonomyMatchDetail
    competencia_especifica: TaxonomyMatchDetail
  }
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
  explanation: QuestionExplanation | null
  explanation_flagged: boolean
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

const API_PREFIX = '/api'

function apiPath(path: string): string {
  return `${API_PREFIX}${path}`
}

let _isRefreshing = false
let _refreshPromise: Promise<string | null> | null = null

async function tryRefresh(): Promise<string | null> {
  const stored = localStorage.getItem('refresh_token')
  if (!stored) return null
  try {
    const res = await fetch(apiPath('/auth/refresh'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: stored }),
    })
    if (!res.ok) {
      clearAuth()
      return null
    }
    const data = await res.json() as TokenResponse
    setAccessToken(data.access_token)
    // Persist rotated refresh token returned by the server
    localStorage.setItem('refresh_token', data.refresh_token)
    return data.access_token
  } catch {
    clearAuth()
    return null
  }
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    ...((init?.headers ?? {}) as Record<string, string>),
  }
  if (_accessToken) {
    headers['Authorization'] = `Bearer ${_accessToken}`
  }

  const res = await fetch(apiPath(path), { ...init, headers })

  if (res.status === 401) {
    // Try to refresh once
    if (!_isRefreshing) {
      _isRefreshing = true
      _refreshPromise = tryRefresh().finally(() => { _isRefreshing = false })
    }
    const newToken = await _refreshPromise
    if (!newToken) {
      _onAuthFailure?.()
      throw new Error('Session expired')
    }

    // Retry with fresh token
    const retryHeaders = { ...headers, 'Authorization': `Bearer ${newToken}` }
    const retryRes = await fetch(apiPath(path), { ...init, headers: retryHeaders })
    if (!retryRes.ok) {
      if (retryRes.status === 401) {
        clearAuth()
        _onAuthFailure?.()
        throw new Error('Session expired')
      }
      let message = `HTTP ${retryRes.status}`
      try {
        const body = await retryRes.json() as { detail?: string; message?: string }
        message = body.detail ?? body.message ?? message
      } catch { /* ignore */ }
      throw new Error(message)
    }
    if (retryRes.status === 204) return undefined as T
    return retryRes.json() as Promise<T>
  }

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

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

// ─── Auth endpoints ──────────────────────────────────────────────────────────

export async function login(email: string, password: string): Promise<TokenResponse> {
  const res = await fetch(apiPath('/auth/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) {
    let message = `HTTP ${res.status}`
    try {
      const body = await res.json() as { detail?: string }
      message = body.detail ?? message
    } catch { /* ignore */ }
    throw new Error(message)
  }
  return res.json() as Promise<TokenResponse>
}

export async function refreshToken(raw: string): Promise<TokenResponse> {
  const res = await fetch(apiPath('/auth/refresh'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: raw }),
  })
  if (!res.ok) throw new Error('Refresh failed')
  return res.json() as Promise<TokenResponse>
}

export async function logoutApi(refreshTokenRaw: string): Promise<void> {
  await apiFetch('/auth/logout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshTokenRaw }),
  })
}

// ─── Users endpoints ─────────────────────────────────────────────────────────

export async function getMe(): Promise<User> {
  return apiFetch<User>('/users/me')
}

export async function listUsers(): Promise<User[]> {
  return apiFetch<User[]>('/users')
}

export interface CreateUserPayload {
  email: string
  full_name: string
  password: string
}

export async function createUser(payload: CreateUserPayload): Promise<User> {
  return apiFetch<User>('/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export interface UpdateUserPayload {
  full_name?: string
  email?: string
  password?: string
}

export async function updateUser(id: string, payload: UpdateUserPayload): Promise<User> {
  return apiFetch<User>(`/users/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export async function deactivateUser(id: string): Promise<void> {
  return apiFetch<void>(`/users/${id}`, { method: 'DELETE' })
}

// ─── Ingest endpoints ────────────────────────────────────────────────────────

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

// ─── Editais ─────────────────────────────────────────────────────────────────

export async function listEditais(): Promise<Edital[]> {
  return apiFetch<Edital[]>('/editais')
}

export async function getEdital(id: string): Promise<Edital> {
  return apiFetch<Edital>(`/editais/${id}`)
}

export interface EditalEnrichResponse {
  message: string
  job_id: string
}

export async function enrichEdital(editalId: string): Promise<EditalEnrichResponse> {
  return apiFetch<EditalEnrichResponse>(`/editais/${editalId}/enrich`, {
    method: 'POST',
  })
}

export async function enrichEditalFromUpload(
  editalId: string,
  file: File,
): Promise<EditalEnrichResponse> {
  const form = new FormData()
  form.append('file', file)
  return apiFetch<EditalEnrichResponse>(`/editais/${editalId}/enrich-upload`, {
    method: 'POST',
    body: form,
  })
}

export async function deleteEdital(id: string): Promise<void> {
  return apiFetch<void>(`/editais/${id}`, { method: 'DELETE' })
}

export async function listEditalExams(editalId: string): Promise<Exam[]> {
  return apiFetch<Exam[]>(`/editais/${editalId}/exams`)
}

export async function linkExamToEdital(examId: string, editalId: string): Promise<Exam> {
  return apiFetch<Exam>(`/exams/${examId}/edital`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ edital_id: editalId }),
  })
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

export async function explainExam(
  examId: string,
  mode: 'missing' | 'all',
  provider?: EnrichProvider,
): Promise<{ message: string; queued: number }> {
  return apiFetch(`/exams/${examId}/explain`, {
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

export interface FullImportResult {
  editais_created: number
  editais_existing: number
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
  const headers: Record<string, string> = { 'Accept': 'application/json' }
  if (_accessToken) headers['Authorization'] = `Bearer ${_accessToken}`
  const res = await fetch(apiPath(`/exams/export?format=${format}`), { headers })
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

export async function importFullDataset(file: File): Promise<FullImportResult> {
  const form = new FormData()
  form.append('file', file)
  return apiFetch<FullImportResult>('/import/full', {
    method: 'POST',
    body: form,
  })
}

export async function exportFullDataset(): Promise<void> {
  const headers: Record<string, string> = { 'Accept': 'application/json' }
  if (_accessToken) headers['Authorization'] = `Bearer ${_accessToken}`
  const res = await fetch(apiPath('/import/export/full'), { headers })
  if (!res.ok) {
    throw new Error(`Export failed: HTTP ${res.status}`)
  }
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'knowledge_base_full_export.json'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function deleteExam(examId: string): Promise<void> {
  return apiFetch<void>(`/exams/${examId}`, { method: 'DELETE' })
}

// ─── Gabarito ────────────────────────────────────────────────────────────────

export interface GabaritoCaderno {
  name: string
  answers: Record<string, string | null>
  answer_count: number
  annulled: number[]
}

export interface GabaritoParseResponse {
  cadernos: GabaritoCaderno[]
}

export interface ApplyGabaritoResponse {
  updated: number
  annulled: number
}

export async function parseGabaritoFile(file: File): Promise<GabaritoParseResponse> {
  const form = new FormData()
  form.append('file', file)
  return apiFetch<GabaritoParseResponse>('/gabarito/parse', {
    method: 'POST',
    body: form,
  })
}

export async function applyGabarito(
  examId: string,
  answers: Record<string, string | null>,
): Promise<ApplyGabaritoResponse> {
  return apiFetch<ApplyGabaritoResponse>(`/exams/${examId}/gabarito`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answers }),
  })
}

// ─── Health ──────────────────────────────────────────────────────────────────

export async function getHealthLive(): Promise<HealthStatus> {
  return apiFetch<HealthStatus>('/health/live')
}

export async function getHealthReady(): Promise<HealthStatus> {
  return apiFetch<HealthStatus>('/health/ready')
}
