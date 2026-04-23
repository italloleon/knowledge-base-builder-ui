import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight, RefreshCw, AlertCircle, AlertTriangle, CheckCircle } from 'lucide-react'
import { getExamErrors, listExams } from '../api/client'
import type { ParseError } from '../api/client'

function ErrorSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden animate-pulse">
      <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-3">
        <div className="h-5 w-32 bg-slate-200 rounded-full" />
        <div className="h-4 w-48 bg-slate-100 rounded" />
      </div>
      <div className="px-5 py-4 space-y-2">
        <div className="h-3 bg-slate-100 rounded w-full" />
        <div className="h-3 bg-slate-100 rounded w-5/6" />
        <div className="h-3 bg-slate-100 rounded w-3/4" />
        <div className="h-3 bg-slate-100 rounded w-4/5" />
      </div>
    </div>
  )
}

function ErrorCard({ parseError }: { parseError: ParseError }) {
  return (
    <article className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-slate-100 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
            <AlertTriangle className="w-3.5 h-3.5" />
            Parse Error
          </span>
          <span className="text-xs text-slate-400 font-mono">{parseError.id.slice(0, 12)}...</span>
        </div>
        <time
          className="text-xs text-slate-400 shrink-0"
          dateTime={parseError.created_at}
        >
          {new Date(parseError.created_at).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </time>
      </div>

      {/* Reason */}
      <div className="px-5 pt-3.5 pb-0">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
          Reason
        </p>
        <p className="text-sm text-red-700 bg-red-50 rounded-lg px-3 py-2 border border-red-100">
          {parseError.reason}
        </p>
      </div>

      {/* Raw block */}
      <div className="px-5 py-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
          Raw Block
        </p>
        <pre className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap font-mono bg-slate-50 rounded-lg p-4 overflow-x-auto border border-slate-100 max-h-64">
          {parseError.raw_block}
        </pre>
      </div>
    </article>
  )
}

export default function ParseErrorsPage() {
  const { id } = useParams<{ id: string }>()
  const examId = id!

  const { data: exams } = useQuery({
    queryKey: ['exams'],
    queryFn: listExams,
  })
  const exam = exams?.find((e) => e.id === examId)

  const {
    data: errors,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['exam-errors', examId],
    queryFn: () => getExamErrors(examId),
  })

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6" aria-label="Breadcrumb">
        <Link to="/" className="hover:text-blue-600 transition-colors">
          Exams
        </Link>
        <ChevronRight className="w-4 h-4 text-slate-300" />
        <Link
          to={`/exams/${examId}`}
          className="hover:text-blue-600 transition-colors truncate max-w-[200px]"
        >
          {exam?.filename ?? examId}
        </Link>
        <ChevronRight className="w-4 h-4 text-slate-300" />
        <span className="text-slate-900 font-medium">Parse Errors</span>
      </nav>

      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Parse Errors</h1>
          {errors !== undefined && (
            <p className="text-sm text-slate-500 mt-0.5">
              {errors.length} error{errors.length !== 1 ? 's' : ''} found during parsing
            </p>
          )}
        </div>
        <Link
          to={`/exams/${examId}`}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
        >
          Back to Questions
        </Link>
      </div>

      {/* Loading skeletons */}
      {isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <ErrorSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 bg-red-50 rounded-xl flex items-center justify-center mb-4">
            <AlertCircle className="w-7 h-7 text-red-400" />
          </div>
          <h3 className="text-base font-semibold text-slate-700 mb-1">Failed to load errors</h3>
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

      {/* Empty state */}
      {!isLoading && !isError && errors?.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 bg-green-50 rounded-xl flex items-center justify-center mb-4">
            <CheckCircle className="w-7 h-7 text-green-400" />
          </div>
          <h3 className="text-base font-semibold text-slate-700 mb-1">No parse errors</h3>
          <p className="text-sm text-slate-400 max-w-xs">
            This exam was parsed without any errors.
          </p>
        </div>
      )}

      {/* Errors list */}
      {!isLoading && !isError && errors && errors.length > 0 && (
        <div className="space-y-4">
          {errors.map((e) => (
            <ErrorCard key={e.id} parseError={e} />
          ))}
        </div>
      )}
    </div>
  )
}
