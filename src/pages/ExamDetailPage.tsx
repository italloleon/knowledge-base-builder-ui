import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ChevronRight,
  AlertTriangle,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  SlidersHorizontal,
  Sparkles,
  ClipboardCheck,
  BookOpen,
  Pencil,
  Check,
  X,
} from 'lucide-react'
import { listExams, getExamQuestions, getExamErrors, enrichExam, explainExam, updateExam, getAdminSettings } from '../api/client'
import type { QuestionSection, QuestionType, QuestionsFilters, EnrichProvider, Exam, ExamUpdatePayload } from '../api/client'
import QuestionCard from '../components/QuestionCard'
import GabaritoModal from '../components/GabaritoModal'

// ─── Exam metadata panel ──────────────────────────────────────────────────────

const PERIODO_LABELS: Record<string, string> = { manha: 'Manhã', tarde: 'Tarde' }
const COR_OPTIONS = ['Azul', 'Amarelo', 'Verde', 'Rosa', 'Branco']

function ExamMetadataPanel({ exam }: { exam: Exam }) {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<ExamUpdatePayload>({
    nome: exam.nome,
    periodo: exam.periodo,
    tipo: exam.tipo,
    cor: exam.cor,
    tipo_prova: exam.tipo_prova,
  })

  const mutation = useMutation({
    mutationFn: (payload: ExamUpdatePayload) => updateExam(exam.id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['exams'] })
      setEditing(false)
    },
  })

  const handleCancel = () => {
    setForm({ nome: exam.nome, periodo: exam.periodo, tipo: exam.tipo, cor: exam.cor, tipo_prova: exam.tipo_prova })
    setEditing(false)
  }

  const hasAnyMeta = exam.nome || exam.periodo || exam.tipo || exam.cor || exam.tipo_prova

  if (!editing) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl px-4 py-3.5 mb-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Prova</span>
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Pencil className="w-3 h-3" />
            Editar
          </button>
        </div>
        {hasAnyMeta ? (
          <div className="flex flex-wrap gap-2">
            {exam.nome && (
              <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-lg">
                {exam.nome}
              </span>
            )}
            {exam.periodo && (
              <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold rounded-lg">
                {PERIODO_LABELS[exam.periodo] ?? exam.periodo}
              </span>
            )}
            {exam.tipo && (
              <span className="px-2.5 py-1 bg-violet-50 text-violet-700 border border-violet-200 text-xs font-semibold rounded-lg">
                Tipo {exam.tipo}
              </span>
            )}
            {exam.cor && (
              <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold rounded-lg">
                {exam.cor}
              </span>
            )}
            {exam.tipo_prova && (
              <span className="px-2.5 py-1 bg-green-50 text-green-700 border border-green-200 text-xs font-semibold rounded-lg">
                {exam.tipo_prova}
              </span>
            )}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic">
            Nenhum metadado. Clique em Editar para adicionar, ou reprocesse a prova para extração automática.
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="bg-white border border-blue-200 rounded-xl px-4 py-3.5 mb-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Prova — editar</span>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCancel}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <X className="w-3 h-3" />
            Cancelar
          </button>
          <button
            onClick={() => mutation.mutate(form)}
            disabled={mutation.isPending}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors"
          >
            {mutation.isPending ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
            Salvar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Nome */}
        <div className="sm:col-span-2 lg:col-span-3 flex flex-col gap-1">
          <label className="text-xs text-slate-500 font-medium">Nome</label>
          <input
            type="text"
            value={form.nome ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value || null }))}
            placeholder="Ex: ENARE 2024 Prova Objetiva"
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm text-slate-800 bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none"
          />
        </div>

        {/* Período */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500 font-medium">Período</label>
          <select
            value={form.periodo ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, periodo: (e.target.value as 'manha' | 'tarde') || null }))}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm text-slate-800 bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none"
          >
            <option value="">—</option>
            <option value="manha">Manhã</option>
            <option value="tarde">Tarde</option>
          </select>
        </div>

        {/* Tipo */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500 font-medium">Tipo</label>
          <select
            value={form.tipo ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value ? parseInt(e.target.value) : null }))}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm text-slate-800 bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none"
          >
            <option value="">—</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
          </select>
        </div>

        {/* Cor */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500 font-medium">Cor</label>
          <select
            value={form.cor ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, cor: e.target.value || null }))}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm text-slate-800 bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none"
          >
            <option value="">—</option>
            {COR_OPTIONS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Tipo prova */}
        <div className="sm:col-span-2 flex flex-col gap-1">
          <label className="text-xs text-slate-500 font-medium">Tipo de Prova</label>
          <input
            type="text"
            value={form.tipo_prova ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, tipo_prova: e.target.value || null }))}
            placeholder="Ex: Multiprofissional Enfermagem"
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm text-slate-800 bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none"
          />
        </div>
      </div>

      {mutation.isError && (
        <p className="mt-2 text-xs text-red-600">
          {mutation.error instanceof Error ? mutation.error.message : 'Erro ao salvar'}
        </p>
      )}
    </div>
  )
}

const PAGE_SIZE = 20

function QuestionSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden animate-pulse">
      <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-3">
        <div className="h-4 w-8 bg-slate-200 rounded" />
        <div className="h-5 w-16 bg-slate-200 rounded-full" />
        <div className="h-5 w-20 bg-slate-200 rounded-full" />
        <div className="flex-1 h-2 bg-slate-100 rounded-full" />
      </div>
      <div className="px-5 py-4 space-y-3">
        <div className="space-y-1.5">
          <div className="h-3.5 bg-slate-100 rounded w-full" />
          <div className="h-3.5 bg-slate-100 rounded w-5/6" />
          <div className="h-3.5 bg-slate-100 rounded w-4/6" />
        </div>
        <div className="space-y-1.5">
          {['A', 'B', 'C', 'D', 'E'].map((k) => (
            <div key={k} className="flex gap-2.5">
              <div className="h-3 w-4 bg-slate-100 rounded" />
              <div className="h-3 bg-slate-100 rounded" style={{ width: `${55 + Math.random() * 35}%` }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const SECTION_OPTIONS: { value: QuestionSection | ''; label: string }[] = [
  { value: '', label: 'All sections' },
  { value: 'conhecimentos_gerais', label: 'Gerais' },
  { value: 'conhecimentos_especificos', label: 'Específicos' },
  { value: 'unknown', label: 'Unknown' },
]

const TYPE_OPTIONS: { value: QuestionType | ''; label: string }[] = [
  { value: '', label: 'All types' },
  { value: 'simple', label: 'Simple' },
  { value: 'roman_numeral', label: 'Roman Numeral' },
  { value: 'true_false', label: 'True/False' },
  { value: 'association', label: 'Association' },
  { value: 'unknown', label: 'Unknown' },
]

export default function ExamDetailPage() {
  const { id } = useParams<{ id: string }>()
  const examId = id!
  const queryClient = useQueryClient()

  const [section, setSection] = useState<QuestionSection | ''>('')
  const [type, setType] = useState<QuestionType | ''>('')
  const [minConfidence, setMinConfidence] = useState(0)
  const [page, setPage] = useState(1)
  const [enrichMsg, setEnrichMsg] = useState<string | null>(null)
  const [enrichProvider, setEnrichProvider] = useState<EnrichProvider>('gemini')

  const { data: adminSettings } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: getAdminSettings,
    staleTime: 60_000,
  })

  // Initialise provider from the configured default once settings load
  useEffect(() => {
    if (!adminSettings) return
    const providerSetting = adminSettings.settings.find(s => s.key === 'enrichment_provider')
    if (providerSetting && !providerSetting.is_secret) {
      setEnrichProvider(providerSetting.value as EnrichProvider)
    }
  }, [adminSettings])
  const [showGabaritoModal, setShowGabaritoModal] = useState(false)

  const enrichMutation = useMutation({
    mutationFn: ({ mode }: { mode: 'missing' | 'all' }) =>
      enrichExam(examId, mode, enrichProvider),
    onSuccess: (data) => {
      setEnrichMsg(
        data.queued === 0
          ? 'All questions are already enriched.'
          : `Queued ${data.queued} question${data.queued !== 1 ? 's' : ''} for enrichment. This runs in the background.`,
      )
      void queryClient.invalidateQueries({ queryKey: ['exams'] })
    },
    onError: (err) => {
      setEnrichMsg(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`)
    },
  })

  const explainMutation = useMutation({
    mutationFn: () => explainExam(examId, 'missing', enrichProvider),
    onSuccess: (data) => {
      setEnrichMsg(
        data.queued === 0
          ? 'All questions already have explanations.'
          : `Queued ${data.queued} question${data.queued !== 1 ? 's' : ''} for explanation.`,
      )
    },
    onError: (err) => {
      setEnrichMsg(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`)
    },
  })

  const filters: QuestionsFilters = {
    ...(section ? { section } : {}),
    ...(type ? { type } : {}),
    ...(minConfidence > 0 ? { min_confidence: minConfidence } : {}),
    page,
    page_size: PAGE_SIZE,
  }

  const { data: exams } = useQuery({
    queryKey: ['exams'],
    queryFn: listExams,
  })
  const exam = exams?.find((e) => e.id === examId)

  const {
    data: questionsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['exam-questions', examId, filters],
    queryFn: () => getExamQuestions(examId, filters),
    placeholderData: (prev) => prev,
  })

  const { data: errors } = useQuery({
    queryKey: ['exam-errors', examId],
    queryFn: () => getExamErrors(examId),
  })

  const totalPages = questionsData
    ? Math.ceil(questionsData.total / PAGE_SIZE)
    : 0

  const avgConfidence =
    questionsData && questionsData.items.length > 0
      ? questionsData.items.reduce((s, q) => s + q.confidence, 0) / questionsData.items.length
      : null

  const handleFilterChange = () => setPage(1)

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:px-6 sm:py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6" aria-label="Breadcrumb">
        <Link to="/exams" className="hover:text-blue-600 transition-colors">
          Exams
        </Link>
        <ChevronRight className="w-4 h-4 text-slate-300" />
        <span className="text-slate-900 font-medium truncate max-w-xs">
          {exam?.filename ?? examId}
        </span>
      </nav>

      {/* Page title */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900 truncate">
          {exam?.filename ?? 'Exam Detail'}
        </h1>
      </div>

      {/* Exam metadata */}
      {exam && <ExamMetadataPanel exam={exam} />}

      {/* Stats row */}
      {questionsData && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-white border border-slate-200 rounded-xl px-4 py-3">
            <p className="text-xs text-slate-500 font-medium">Total Questions</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">
              {questionsData.total}
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl px-4 py-3">
            <p className="text-xs text-slate-500 font-medium">AI Enriched</p>
            <p className={`text-2xl font-bold mt-0.5 ${
              exam && exam.enriched_count === exam.question_count
                ? 'text-violet-700'
                : 'text-slate-900'
            }`}>
              {exam ? `${exam.enriched_count}/${exam.question_count}` : '—'}
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl px-4 py-3">
            <p className="text-xs text-slate-500 font-medium">Avg Confidence</p>
            <p className={`text-2xl font-bold mt-0.5 ${
              avgConfidence === null ? 'text-slate-400' :
              avgConfidence >= 0.8 ? 'text-green-700' :
              avgConfidence >= 0.5 ? 'text-yellow-700' : 'text-red-700'
            }`}>
              {avgConfidence !== null ? `${(avgConfidence * 100).toFixed(0)}%` : '—'}
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl px-4 py-3">
            <p className="text-xs text-slate-500 font-medium">Parse Errors</p>
            <p className={`text-2xl font-bold mt-0.5 ${errors && errors.length > 0 ? 'text-red-600' : 'text-slate-900'}`}>
              {errors?.length ?? '—'}
            </p>
          </div>
        </div>
      )}

      {/* Enrichment actions */}
      {exam && (
        <div className="mb-5 bg-white border border-slate-200 rounded-xl px-4 py-3.5">
          <div className="flex flex-wrap items-center gap-3">
            {/* Provider select */}
            <select
              value={enrichProvider}
              onChange={(e) => setEnrichProvider(e.target.value as EnrichProvider)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-colors"
            >
              {(adminSettings?.providers ?? [{ name: 'gemini', label: 'Google Gemini' }]).map((p) => (
                <option key={p.name} value={p.name}>{p.label}</option>
              ))}
            </select>

            <div className="w-px h-6 bg-slate-200 self-center" />

            {/* Enrich missing */}
            <button
              onClick={() => {
                setEnrichMsg(null)
                enrichMutation.mutate({ mode: 'missing' })
              }}
              disabled={
                enrichMutation.isPending ||
                (exam.question_count > 0 && exam.enriched_count >= exam.question_count)
              }
              className="inline-flex items-center gap-2 px-4 py-2 bg-violet-50 border border-violet-200 text-violet-800 text-sm font-medium rounded-lg hover:bg-violet-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Sparkles className="w-4 h-4 text-violet-500" />
              {exam.question_count - exam.enriched_count > 0
                ? `Enrich Missing (${exam.question_count - exam.enriched_count})`
                : 'All Enriched'}
            </button>

            {/* Re-enrich all */}
            <button
              onClick={() => {
                setEnrichMsg(null)
                enrichMutation.mutate({ mode: 'all' })
              }}
              disabled={enrichMutation.isPending || exam.question_count === 0}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 text-slate-400 ${enrichMutation.isPending ? 'animate-spin' : ''}`} />
              Re-enrich All
            </button>

            <div className="w-px h-6 bg-slate-200 self-center" />

            {/* Gabarito */}
            <button
              onClick={() => setShowGabaritoModal(true)}
              disabled={exam.question_count === 0}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 text-green-800 text-sm font-medium rounded-lg hover:bg-green-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ClipboardCheck className="w-4 h-4 text-green-600" />
              Gabarito
            </button>

            {/* Explain */}
            <button
              onClick={() => {
                setEnrichMsg(null)
                explainMutation.mutate()
              }}
              disabled={exam.question_count === 0 || enrichMutation.isPending || explainMutation.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-200 text-indigo-800 text-sm font-medium rounded-lg hover:bg-indigo-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <BookOpen className="w-4 h-4 text-indigo-500" />
              Explain
            </button>

            {enrichMsg && (
              <p className="text-sm text-slate-600">{enrichMsg}</p>
            )}
          </div>

          {(() => {
            const keySettingKey = `${enrichProvider}_api_key`
            const keySetting = adminSettings?.settings.find(s => s.key === keySettingKey)
            const notConfigured = keySetting && keySetting.is_secret && !keySetting.is_configured
            return notConfigured ? (
              <p className="mt-2 text-xs text-amber-600">
                No API key configured for this provider. Go to{' '}
                <a href="/settings" className="underline hover:text-amber-800">Settings</a>
                {' '}to add one.
              </p>
            ) : null
          })()}
        </div>
      )}

      {/* Parse errors link */}
      {errors && errors.length > 0 && (
        <div className="mb-5">
          <Link
            to={`/exams/${examId}/errors`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm font-medium rounded-lg hover:bg-yellow-100 transition-colors"
          >
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
            View {errors.length} parse error{errors.length !== 1 ? 's' : ''}
            <ChevronRight className="w-4 h-4 text-yellow-400" />
          </Link>
        </div>
      )}

      {/* Filter bar */}
      <div className="bg-white border border-slate-200 rounded-xl px-4 py-3.5 mb-5">
        <div className="flex items-center gap-2 mb-3">
          <SlidersHorizontal className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-700">Filters</span>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          {/* Section */}
          <div className="flex flex-col gap-1">
            <label htmlFor="filter-section" className="text-xs text-slate-500">
              Section
            </label>
            <select
              id="filter-section"
              value={section}
              onChange={(e) => {
                setSection(e.target.value as QuestionSection | '')
                handleFilterChange()
              }}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm text-slate-700 bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none"
            >
              {SECTION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {/* Type */}
          <div className="flex flex-col gap-1">
            <label htmlFor="filter-type" className="text-xs text-slate-500">
              Type
            </label>
            <select
              id="filter-type"
              value={type}
              onChange={(e) => {
                setType(e.target.value as QuestionType | '')
                handleFilterChange()
              }}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm text-slate-700 bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none"
            >
              {TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {/* Min confidence */}
          <div className="flex flex-col gap-1 min-w-[160px]">
            <label htmlFor="filter-confidence" className="text-xs text-slate-500">
              Min Confidence: {(minConfidence * 100).toFixed(0)}%
            </label>
            <input
              id="filter-confidence"
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={minConfidence}
              onChange={(e) => {
                setMinConfidence(parseFloat(e.target.value))
                handleFilterChange()
              }}
              className="accent-blue-600"
              aria-valuetext={`${(minConfidence * 100).toFixed(0)}%`}
            />
          </div>

          {/* Reset */}
          {(section || type || minConfidence > 0) && (
            <button
              onClick={() => {
                setSection('')
                setType('')
                setMinConfidence(0)
                setPage(1)
              }}
              className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Loading skeletons */}
      {isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <QuestionSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 bg-red-50 rounded-xl flex items-center justify-center mb-4">
            <AlertCircle className="w-7 h-7 text-red-400" />
          </div>
          <h3 className="text-base font-semibold text-slate-700 mb-1">Failed to load questions</h3>
          <p className="text-sm text-slate-400 mb-5 max-w-xs">
            {error instanceof Error ? error.message : 'An unexpected error occurred'}
          </p>
          <button
            onClick={() => void refetch()}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      )}

      {/* Gabarito modal */}
      {showGabaritoModal && (
        <GabaritoModal examId={examId} onClose={() => setShowGabaritoModal(false)} />
      )}

      {/* Questions list */}
      {!isLoading && !isError && questionsData && (
        <>
          {questionsData.items.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-slate-500">No questions match the current filters.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {questionsData.items.map((question) => (
                <QuestionCard key={question.id} question={question} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200">
              <p className="text-sm text-slate-500">
                Page {page} of {totalPages} &middot;{' '}
                {questionsData.total} questions
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  aria-label="Next page"
                >
                  Next
                  <ChevronRightIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
