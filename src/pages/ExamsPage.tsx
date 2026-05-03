import { useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Upload, BookOpen, FileText, HelpCircle, RefreshCw, AlertCircle, Trash2, Download, FolderUp, CheckCircle2, ScrollText } from 'lucide-react'
import { listExams, deleteExam, exportExams, importExams, exportFullDataset, importFullDataset } from '../api/client'
import type { Exam, FullImportResult, ImportResult } from '../api/client'
import UploadModal from '../components/UploadModal'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function ExamCardSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 bg-slate-200 rounded-lg shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-slate-200 rounded w-3/4" />
          <div className="h-3 bg-slate-100 rounded w-1/2" />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="h-3 bg-slate-100 rounded w-24" />
        <div className="h-3 bg-slate-100 rounded w-20" />
      </div>
    </div>
  )
}

function ExamCard({ exam }: { exam: Exam }) {
  const [confirming, setConfirming] = useState(false)
  const queryClient = useQueryClient()

  const { mutate: remove, isPending } = useMutation({
    mutationFn: () => deleteExam(exam.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['exams'] }),
  })

  return (
    <div className="group bg-white border border-slate-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-sm transition-all">
      <div className="flex items-start justify-between gap-3">
        <Link
          to={`/exams/${exam.id}`}
          className="flex items-start gap-3 flex-1 min-w-0"
          aria-label={`View exam: ${exam.filename}`}
        >
          <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-blue-50 transition-colors">
            <FileText style={{ width: 18, height: 18 }} className="text-slate-500 group-hover:text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate group-hover:text-blue-700 transition-colors">
              {exam.filename}
            </p>
          </div>
        </Link>

        {confirming ? (
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => remove()}
              disabled={isPending}
              className="px-2.5 py-1 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {isPending ? 'Deleting…' : 'Confirm'}
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="px-2.5 py-1 text-xs font-medium text-slate-600 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            aria-label="Delete exam"
            className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all"
          >
            <Trash2 style={{ width: 15, height: 15 }} />
          </button>
        )}
      </div>

      <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <HelpCircle className="w-3.5 h-3.5" />
          {exam.question_count} questions
        </span>
        {exam.enriched_count > 0 && (
          <span className="text-violet-600 font-medium">
            · {exam.enriched_count}/{exam.question_count} enriched
          </span>
        )}
        {exam.edital_id && (
          <Link
            to={`/editais/${exam.edital_id}`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-medium"
          >
            <ScrollText className="w-3.5 h-3.5" />
            Edital
          </Link>
        )}
        <span className="ml-auto flex items-center gap-3">
          <span className="text-[10px] text-slate-300 font-mono">{exam.file_hash.slice(0, 12)}</span>
          {formatDate(exam.created_at)}
        </span>
      </div>
    </div>
  )
}

function EmptyState({ onUpload }: { onUpload: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mb-5">
        <BookOpen className="w-9 h-9 text-slate-300" />
      </div>
      <h3 className="text-lg font-semibold text-slate-700 mb-1">No exams yet</h3>
      <p className="text-sm text-slate-400 max-w-xs mb-6">
        Upload your first ENARE exam PDF to start parsing and reviewing questions.
      </p>
      <button
        onClick={onUpload}
        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
      >
        <Upload className="w-4 h-4" />
        Upload Exam PDF
      </button>
    </div>
  )
}

export default function ExamsPage() {
  const [showUpload, setShowUpload] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [fullImportResult, setFullImportResult] = useState<FullImportResult | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const importInputRef = useRef<HTMLInputElement>(null)
  const importFullInputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()

  const { data: exams, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['exams'],
    queryFn: listExams,
  })

  const totalQuestions = exams?.reduce((sum, e) => sum + e.question_count, 0) ?? 0

  async function handleExport(format: 'json' | 'csv') {
    setExporting(true)
    setExportError(null)
    try {
      await exportExams(format)
    } catch (e) {
      setExportError(e instanceof Error ? e.message : 'Export failed')
    } finally {
      setExporting(false)
    }
  }

  async function handleImportFile(file: File) {
    setImporting(true)
    setImportResult(null)
    setFullImportResult(null)
    setImportError(null)
    try {
      const result = await importExams(file)
      setImportResult(result)
      void queryClient.invalidateQueries({ queryKey: ['exams'] })
    } catch (e) {
      setImportError(e instanceof Error ? e.message : 'Import failed')
    } finally {
      setImporting(false)
    }
  }

  async function handleImportFullFile(file: File) {
    setImporting(true)
    setImportResult(null)
    setFullImportResult(null)
    setImportError(null)
    try {
      const result = await importFullDataset(file)
      setFullImportResult(result)
      void queryClient.invalidateQueries({ queryKey: ['exams'] })
      void queryClient.invalidateQueries({ queryKey: ['editais'] })
    } catch (e) {
      setImportError(e instanceof Error ? e.message : 'Full import failed')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Hidden file input for JSON import */}
      <input
        ref={importInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void handleImportFile(file)
          e.target.value = ''
        }}
      />
      <input
        ref={importFullInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void handleImportFullFile(file)
          e.target.value = ''
        }}
      />

      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Exams</h1>
          <p className="text-sm text-slate-500 mt-0.5">Ingested ENARE exam documents</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Import JSON */}
          <button
            onClick={() => importInputRef.current?.click()}
            disabled={importing}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors shadow-sm"
          >
            <FolderUp className="w-4 h-4" />
            {importing ? 'Importing…' : 'Import JSON'}
          </button>
          <button
            onClick={() => importFullInputRef.current?.click()}
            disabled={importing}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 disabled:opacity-50 transition-colors shadow-sm"
          >
            <FolderUp className="w-4 h-4" />
            {importing ? 'Importing…' : 'Import Full'}
          </button>
          <button
            onClick={() => void exportFullDataset().catch((e) => setExportError(e instanceof Error ? e.message : 'Export failed'))}
            disabled={exporting}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 disabled:opacity-50 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            Export Full
          </button>

          {/* Export */}
          {exams && exams.length > 0 && (
            <div className="flex items-center rounded-lg border border-slate-200 overflow-hidden shadow-sm">
              <span className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-500 bg-white border-r border-slate-200">
                <Download className="w-4 h-4" />
                {exporting ? 'Exporting…' : 'Export'}
              </span>
              <button
                onClick={() => void handleExport('json')}
                disabled={exporting}
                className="px-3 py-2 text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 transition-colors border-r border-slate-200"
              >
                JSON
              </button>
              <button
                onClick={() => void handleExport('csv')}
                disabled={exporting}
                className="px-3 py-2 text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                CSV
              </button>
            </div>
          )}

          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Upload className="w-4 h-4" />
            Upload PDF
          </button>
        </div>
      </div>

      {/* Import result banner */}
      {importResult && (
        <div className="mb-4 flex items-start gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-green-600" />
          <div>
            <p className="font-medium">Import complete</p>
            <p className="text-green-700 mt-0.5">
              {importResult.exams_created > 0 && `${importResult.exams_created} exam${importResult.exams_created !== 1 ? 's' : ''} created`}
              {importResult.exams_existing > 0 && `${importResult.exams_created > 0 ? ', ' : ''}${importResult.exams_existing} existing`}
              {' · '}
              {importResult.questions_created} question{importResult.questions_created !== 1 ? 's' : ''} imported
              {importResult.questions_skipped > 0 && `, ${importResult.questions_skipped} skipped (duplicates)`}
              {importResult.questions_enrichment_updated > 0 && `, ${importResult.questions_enrichment_updated} enrichment updated`}
            </p>
          </div>
          <button
            onClick={() => setImportResult(null)}
            className="ml-auto text-green-500 hover:text-green-700 transition-colors"
          >
            ×
          </button>
        </div>
      )}
      {fullImportResult && (
        <div className="mb-4 flex items-start gap-3 px-4 py-3 bg-indigo-50 border border-indigo-200 rounded-lg text-sm text-indigo-800">
          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-indigo-600" />
          <div>
            <p className="font-medium">Full import complete</p>
            <p className="text-indigo-700 mt-0.5">
              {fullImportResult.editais_created} edital(is) created, {fullImportResult.exams_created} exam(s) created, {fullImportResult.questions_created} question(s) imported
              {fullImportResult.questions_enrichment_updated > 0 && `, ${fullImportResult.questions_enrichment_updated} enrichment updated`}
            </p>
          </div>
          <button
            onClick={() => setFullImportResult(null)}
            className="ml-auto text-indigo-500 hover:text-indigo-700 transition-colors"
          >
            ×
          </button>
        </div>
      )}

      {/* Import/Export error banners */}
      {importError && (
        <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {importError}
          <button onClick={() => setImportError(null)} className="ml-auto text-red-400 hover:text-red-600">×</button>
        </div>
      )}
      {exportError && (
        <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {exportError}
        </div>
      )}

      {/* Stats bar */}
      {!isLoading && !isError && exams && exams.length > 0 && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white border border-slate-200 rounded-xl px-5 py-4">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Total Exams</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">{exams.length}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl px-5 py-4">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Total Questions</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">{totalQuestions.toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* Loading skeletons */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <ExamCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 bg-red-50 rounded-xl flex items-center justify-center mb-4">
            <AlertCircle className="w-7 h-7 text-red-400" />
          </div>
          <h3 className="text-base font-semibold text-slate-700 mb-1">Failed to load exams</h3>
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
      {!isLoading && !isError && exams?.length === 0 && (
        <EmptyState onUpload={() => setShowUpload(true)} />
      )}

      {/* Exam grid */}
      {!isLoading && !isError && exams && exams.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {exams.map((exam) => (
            <ExamCard key={exam.id} exam={exam} />
          ))}
        </div>
      )}

      {/* Upload modal */}
      {showUpload && <UploadModal onClose={() => setShowUpload(false)} />}
    </div>
  )
}
