import { useState, useRef, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { X, Upload, Link, FileText, CheckCircle, AlertTriangle, XCircle, Loader2, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { uploadFile, ingestUrl, getJob } from '../api/client'
import type { DocumentCategory, IngestResponse, Job } from '../api/client'
import JobStatusBadge from './JobStatusBadge'

interface Props {
  onClose: () => void
  defaultCategory?: DocumentCategory
}

type Tab = 'file' | 'url'

const ACTIVE_STATUSES = new Set(['pending', 'processing'])

// ─── Single file upload entry (tracks its own job) ────────────────────────────

interface FileEntry {
  id: string
  file: File
  jobInfo: IngestResponse | null
  error: string | null
}

function FileRow({
  entry,
  onRemove,
}: {
  entry: FileEntry
  onRemove: () => void
}) {
  const { data: jobStatus } = useQuery({
    queryKey: ['job', entry.jobInfo?.job_id],
    queryFn: () => getJob(entry.jobInfo!.job_id),
    enabled: entry.jobInfo !== null,
    refetchInterval: (query) => {
      const status = query.state.data?.status
      return status && ACTIVE_STATUSES.has(status) ? 2000 : false
    },
  })

  const isActive = jobStatus ? ACTIVE_STATUSES.has(jobStatus.status) : false
  const isDone = jobStatus?.status === 'completed' || jobStatus?.status === 'partial'
  const isFailed = jobStatus?.status === 'failed'

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
      <FileText className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0 space-y-1.5">
        <p className="text-sm font-medium text-slate-700 truncate">{entry.file.name}</p>
        <p className="text-xs text-slate-400">{(entry.file.size / 1024 / 1024).toFixed(2)} MB</p>

        {/* Job status */}
        {entry.jobInfo && (
          <div className="flex items-center gap-2 flex-wrap">
            {jobStatus ? (
              <JobStatusBadge status={jobStatus.status} />
            ) : (
              <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                <Loader2 className="w-3 h-3 animate-spin" /> Aguardando...
              </span>
            )}
            {jobStatus && (jobStatus.parsed_ok !== null || jobStatus.total_found !== null) && (
              <span className="text-xs text-slate-500">
                {jobStatus.parsed_ok ?? 0}/{jobStatus.total_found ?? '?'} questões
                {jobStatus.parse_errors ? ` · ${jobStatus.parse_errors} erros` : ''}
              </span>
            )}
          </div>
        )}

        {/* Progress bar while processing */}
        {isActive && jobStatus && jobStatus.total_found != null && jobStatus.total_found > 0 && (
          <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(((jobStatus.parsed_ok ?? 0) / jobStatus.total_found) * 100, 100)}%` }}
            />
          </div>
        )}

        {/* Error messages */}
        {entry.error && (
          <p className="text-xs text-red-600">{entry.error}</p>
        )}
        {isFailed && jobStatus?.error_message && (
          <p className="text-xs text-red-600">{jobStatus.error_message}</p>
        )}
      </div>

      {/* Status icon / remove button */}
      <div className="shrink-0">
        {isDone ? (
          <CheckCircle className="w-4 h-4 text-green-500" />
        ) : isFailed || entry.error ? (
          <XCircle className="w-4 h-4 text-red-400" />
        ) : !entry.jobInfo ? (
          <button
            onClick={onRemove}
            className="p-1 rounded text-slate-300 hover:text-red-400 transition-colors"
            aria-label="Remove file"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        ) : isActive ? (
          <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
        ) : null}
      </div>
    </div>
  )
}

// ─── Main modal ───────────────────────────────────────────────────────────────

export default function UploadModal({ onClose, defaultCategory = 'prova' }: Props) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [tab, setTab] = useState<Tab>('file')
  const [dragOver, setDragOver] = useState(false)
  const [fileEntries, setFileEntries] = useState<FileEntry[]>([])
  const [urlValue, setUrlValue] = useState('')
  const [category, setCategory] = useState<DocumentCategory>(defaultCategory)
  const [urlJobInfo, setUrlJobInfo] = useState<IngestResponse | null>(null)
  const [urlError, setUrlError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const hasSubmitted = fileEntries.some((e) => e.jobInfo !== null) || urlJobInfo !== null
  const allDone = fileEntries.length > 0 &&
    fileEntries.every((e) => e.jobInfo !== null || e.error !== null)

  const addFiles = useCallback((files: FileList | File[]) => {
    const pdfs = Array.from(files).filter((f) => f.type === 'application/pdf')
    setFileEntries((prev) => [
      ...prev,
      ...pdfs.map((f) => ({ id: crypto.randomUUID(), file: f, jobInfo: null, error: null })),
    ])
  }, [])

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(false)
    addFiles(e.dataTransfer.files)
  }, [addFiles])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(e.target.files)
    e.target.value = ''
  }

  const removeEntry = (id: string) => {
    setFileEntries((prev) => prev.filter((e) => e.id !== id))
  }

  const handleSubmit = async () => {
    if (tab === 'url') {
      if (!urlValue.trim()) return
      if (!urlValue.startsWith('https://') && !urlValue.startsWith('http://')) {
        setUrlError('URL must start with https:// or http://')
        return
      }
      setUrlError('')
      try {
        const data = await ingestUrl(urlValue.trim(), category)
        setUrlJobInfo(data)
        void queryClient.invalidateQueries({ queryKey: [category === 'edital' ? 'editais' : 'exams'] })
      } catch (err) {
        setUrlError(err instanceof Error ? err.message : 'Upload failed')
      }
      return
    }

    const pending = fileEntries.filter((e) => e.jobInfo === null && e.error === null)
    if (pending.length === 0) return

    setSubmitting(true)
    await Promise.all(
      pending.map(async (entry) => {
        try {
          const data = await uploadFile(entry.file, category)
          setFileEntries((prev) =>
            prev.map((e) => (e.id === entry.id ? { ...e, jobInfo: data } : e))
          )
          void queryClient.invalidateQueries({ queryKey: [category === 'edital' ? 'editais' : 'exams'] })
        } catch (err) {
          setFileEntries((prev) =>
            prev.map((e) =>
              e.id === entry.id
                ? { ...e, error: err instanceof Error ? err.message : 'Upload failed' }
                : e
            )
          )
        }
      })
    )
    setSubmitting(false)
  }

  // URL job polling (single job for URL tab)
  const { data: urlJobStatus } = useQuery({
    queryKey: ['job', urlJobInfo?.job_id],
    queryFn: () => getJob(urlJobInfo!.job_id),
    enabled: urlJobInfo !== null,
    refetchInterval: (query) => {
      const status = query.state.data?.status
      return status && ACTIVE_STATUSES.has(status) ? 2000 : false
    },
  })

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Upload PDF"
    >
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">
            {category === 'edital' ? 'Ingerir Edital' : 'Ingerir Prova'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Category selector */}
          {!hasSubmitted && (
            <div>
              <p className="text-xs font-medium text-slate-500 mb-2">Tipo de documento</p>
              <div className="flex bg-slate-100 rounded-lg p-1 gap-1">
                {(['prova', 'edital'] as DocumentCategory[]).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`flex-1 px-3 py-2 rounded-md text-sm font-medium capitalize transition-colors ${
                      category === cat
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tabs */}
          {!hasSubmitted && (
            <div className="flex bg-slate-100 rounded-lg p-1 gap-1">
              {(['file', 'url'] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    tab === t
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {t === 'file' ? <><FileText className="w-4 h-4" />Upload File</> : <><Link className="w-4 h-4" />URL</>}
                </button>
              ))}
            </div>
          )}

          {/* File Tab */}
          {tab === 'file' && (
            <div className="space-y-3">
              {/* Drop zone — hide after submitting */}
              {!hasSubmitted && (
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click() }}
                  aria-label="Drop PDF files here or click to browse"
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                    dragOver
                      ? 'border-blue-400 bg-blue-50'
                      : fileEntries.length > 0
                      ? 'border-green-400 bg-green-50'
                      : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                    aria-hidden="true"
                  />
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="w-10 h-10 text-slate-300" />
                    <p className="text-sm font-medium text-slate-700">
                      Drop PDFs here or{' '}
                      <span className="text-blue-600">browse</span>
                    </p>
                    <p className="text-xs text-slate-400">Multiple files supported</p>
                  </div>
                </div>
              )}

              {/* File list */}
              {fileEntries.length > 0 && (
                <div className="space-y-2">
                  {fileEntries.map((entry) => (
                    <FileRow
                      key={entry.id}
                      entry={entry}
                      onRemove={() => removeEntry(entry.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* URL Tab */}
          {tab === 'url' && !urlJobInfo && (
            <div className="space-y-2">
              <label htmlFor="ingest-url" className="block text-sm font-medium text-slate-700">
                PDF URL
              </label>
              <input
                id="ingest-url"
                type="url"
                value={urlValue}
                onChange={(e) => { setUrlValue(e.target.value); setUrlError('') }}
                placeholder="https://example.com/exam.pdf"
                className={`w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-colors ${
                  urlError
                    ? 'border-red-300 focus:ring-2 focus:ring-red-200'
                    : 'border-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100'
                }`}
              />
              {urlError && (
                <p className="text-xs text-red-600" role="alert">{urlError}</p>
              )}
            </div>
          )}

          {/* URL job status */}
          {urlJobInfo && (
            <JobStatusPanel
              job={urlJobStatus ?? null}
              jobId={urlJobInfo.job_id}
              isLoading={!urlJobStatus || ACTIVE_STATUSES.has(urlJobStatus.status)}
              category={category}
              onViewDocument={
                urlJobStatus?.status === 'completed' || urlJobStatus?.status === 'partial'
                  ? () => {
                      const id = urlJobStatus?.exam_id ?? urlJobStatus?.edital_id
                      if (id) navigate(`/${category === 'edital' ? 'editais' : 'exams'}/${id}`)
                      onClose()
                    }
                  : undefined
              }
            />
          )}

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
            >
              {allDone ? 'Close' : 'Cancel'}
            </button>
            {!hasSubmitted && (
              <button
                onClick={() => void handleSubmit()}
                disabled={
                  submitting ||
                  (tab === 'file' ? fileEntries.length === 0 : !urlValue.trim())
                }
                className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {submitting
                  ? 'Submitting...'
                  : tab === 'file' && fileEntries.length > 1
                  ? `Start ${fileEntries.length} Ingestions`
                  : 'Start Ingestion'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Single-job status panel (used for URL tab) ───────────────────────────────

interface JobStatusPanelProps {
  job: Job | null
  jobId: string
  isLoading: boolean
  category: DocumentCategory
  onViewDocument?: () => void
}

function JobStatusPanel({ job, jobId, isLoading, category, onViewDocument }: JobStatusPanelProps) {
  const status = job?.status
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">Ingestion Job</h3>
        <code className="text-xs text-slate-400 font-mono">{jobId.slice(0, 12)}...</code>
      </div>
      <div className="flex items-center gap-3">
        {status ? <JobStatusBadge status={status} /> : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border bg-slate-100 text-slate-600 border-slate-200 text-sm font-medium">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Waiting...
          </span>
        )}
      </div>
      {job && (status === 'processing' || status === 'completed' || status === 'partial') && job.total_found !== null && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-slate-500">
            <span>{isLoading ? `Parsing... ` : `Parsed `}{job.parsed_ok ?? 0}/{job.total_found} questions</span>
            {job.parse_errors != null && job.parse_errors > 0 && (
              <span className="text-yellow-600">{job.parse_errors} errors</span>
            )}
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: job.total_found > 0 ? `${Math.min(((job.parsed_ok ?? 0) / job.total_found) * 100, 100)}%` : '0%' }}
            />
          </div>
        </div>
      )}
      {(status === 'completed' || status === 'partial') && job && (
        <div className={`flex items-start gap-2.5 p-3.5 rounded-lg border ${status === 'completed' ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
          {status === 'completed'
            ? <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
            : <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />}
          <div>
            <p className={`text-sm font-medium ${status === 'completed' ? 'text-green-800' : 'text-yellow-800'}`}>
              {status === 'completed' ? 'Ingestion complete' : 'Completed with errors'}
            </p>
            <p className={`text-xs ${status === 'completed' ? 'text-green-700' : 'text-yellow-700'}`}>
              {job.parsed_ok ?? 0} questions parsed{job.parse_errors ? `, ${job.parse_errors} errors` : ''}
            </p>
          </div>
        </div>
      )}
      {status === 'failed' && job?.error_message && (
        <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-lg">
          <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-800">Ingestion failed</p>
            <p className="text-xs text-red-700 mt-0.5">{job.error_message}</p>
          </div>
        </div>
      )}
      {onViewDocument && (
        <button
          onClick={onViewDocument}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          {category === 'edital' ? 'Ver Edital' : 'View Exam Questions'}
        </button>
      )}
    </div>
  )
}
