import { useState } from 'react'
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
} from 'lucide-react'
import { listExams, getExamQuestions, getExamErrors, enrichExam } from '../api/client'
import type { QuestionSection, QuestionType, QuestionsFilters, EnrichProvider } from '../api/client'
import QuestionCard from '../components/QuestionCard'

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
  const [enrichProvider, setEnrichProvider] = useState<EnrichProvider>('ollama')

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
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6" aria-label="Breadcrumb">
        <Link to="/" className="hover:text-blue-600 transition-colors">
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
            {/* Provider toggle */}
            <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1 text-xs font-medium">
              <button
                onClick={() => setEnrichProvider('ollama')}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  enrichProvider === 'ollama'
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Ollama
              </button>
              <button
                onClick={() => setEnrichProvider('gemini')}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  enrichProvider === 'gemini'
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Gemini
              </button>
            </div>

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

            {enrichMsg && (
              <p className="text-sm text-slate-600">{enrichMsg}</p>
            )}
          </div>

          {enrichProvider === 'gemini' && (
            <p className="mt-2 text-xs text-amber-600">
              Gemini requires <code className="bg-amber-50 px-1 rounded">GEMINI_API_KEY</code> set in <code className="bg-amber-50 px-1 rounded">.env</code>.
              Get a free key at{' '}
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-amber-800"
              >
                aistudio.google.com
              </a>
              . Much faster than Ollama (~1–2s/question).
            </p>
          )}
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
