import { useState, useRef, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Upload, Link, FileText, CheckCircle, AlertTriangle, XCircle, Loader2 } from 'lucide-react'
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

export default function UploadModal({ onClose, defaultCategory = 'prova' }: Props) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [tab, setTab] = useState<Tab>('file')
  const [dragOver, setDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [urlValue, setUrlValue] = useState('')
  const [category, setCategory] = useState<DocumentCategory>(defaultCategory)
  const [jobInfo, setJobInfo] = useState<IngestResponse | null>(null)
  const [urlError, setUrlError] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Poll job status while active
  const { data: jobStatus } = useQuery({
    queryKey: ['job', jobInfo?.job_id],
    queryFn: () => getJob(jobInfo!.job_id),
    enabled: jobInfo !== null,
    refetchInterval: (query) => {
      const status = query.state.data?.status
      return status && ACTIVE_STATUSES.has(status) ? 2000 : false
    },
  })

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadFile(file, category),
    onSuccess: (data) => {
      setJobInfo(data)
      if (category === 'edital') {
        void queryClient.invalidateQueries({ queryKey: ['editais'] })
      } else {
        void queryClient.invalidateQueries({ queryKey: ['exams'] })
      }
    },
  })

  const urlMutation = useMutation({
    mutationFn: (url: string) => ingestUrl(url, category),
    onSuccess: (data) => {
      setJobInfo(data)
      if (category === 'edital') {
        void queryClient.invalidateQueries({ queryKey: ['editais'] })
      } else {
        void queryClient.invalidateQueries({ queryKey: ['exams'] })
      }
    },
  })

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file)
    }
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setSelectedFile(file)
  }

  const handleSubmit = () => {
    if (tab === 'file') {
      if (!selectedFile) return
      uploadMutation.mutate(selectedFile)
    } else {
      if (!urlValue.trim()) return
      if (!urlValue.startsWith('https://') && !urlValue.startsWith('http://')) {
        setUrlError('URL must start with https:// or http://')
        return
      }
      setUrlError('')
      urlMutation.mutate(urlValue.trim())
    }
  }

  const isLoading = uploadMutation.isPending || urlMutation.isPending
  const mutationError = uploadMutation.error ?? urlMutation.error
  const hasJobResult = jobInfo !== null
  const isJobActive = jobStatus ? ACTIVE_STATUSES.has(jobStatus.status) : false
  const isJobDone = jobStatus?.status === 'completed' || jobStatus?.status === 'partial'

  const handleViewDocument = () => {
    const editalId = jobStatus?.edital_id ?? jobInfo?.edital_id
    const examId = jobStatus?.exam_id ?? jobInfo?.exam_id
    if (editalId) {
      navigate(`/editais/${editalId}`)
    } else if (examId) {
      navigate(`/exams/${examId}`)
    }
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Upload PDF"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
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

        <div className="p-6 space-y-5">
          {/* Category selector */}
          {!hasJobResult && (
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
          {!hasJobResult && (
            <div className="flex bg-slate-100 rounded-lg p-1 gap-1">
              <button
                onClick={() => setTab('file')}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  tab === 'file'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <FileText className="w-4 h-4" />
                Upload File
              </button>
              <button
                onClick={() => setTab('url')}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  tab === 'url'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Link className="w-4 h-4" />
                URL
              </button>
            </div>
          )}

          {/* File Tab */}
          {!hasJobResult && tab === 'file' && (
            <div>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click() }}
                aria-label="Drop PDF file here or click to browse"
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                  dragOver
                    ? 'border-blue-400 bg-blue-50'
                    : selectedFile
                    ? 'border-green-400 bg-green-50'
                    : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={handleFileChange}
                  aria-hidden="true"
                />
                {selectedFile ? (
                  <div className="flex flex-col items-center gap-2">
                    <FileText className="w-10 h-10 text-green-500" />
                    <p className="text-sm font-medium text-green-700">{selectedFile.name}</p>
                    <p className="text-xs text-slate-500">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedFile(null) }}
                      className="text-xs text-slate-400 hover:text-red-500 underline"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="w-10 h-10 text-slate-300" />
                    <p className="text-sm font-medium text-slate-700">
                      Drop a PDF here or{' '}
                      <span className="text-blue-600">browse</span>
                    </p>
                    <p className="text-xs text-slate-400">PDF files only</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* URL Tab */}
          {!hasJobResult && tab === 'url' && (
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
                aria-describedby={urlError ? 'url-error' : undefined}
              />
              {urlError && (
                <p id="url-error" className="text-xs text-red-600" role="alert">
                  {urlError}
                </p>
              )}
            </div>
          )}

          {/* Mutation error */}
          {mutationError && !hasJobResult && (
            <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-lg">
              <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              <p className="text-sm text-red-700">{mutationError.message}</p>
            </div>
          )}

          {/* Job Status Panel */}
          {hasJobResult && (
            <JobStatusPanel
              job={jobStatus ?? null}
              jobId={jobInfo.job_id}
              isLoading={isJobActive || jobStatus === undefined}
              category={category}
              onViewDocument={isJobDone ? handleViewDocument : undefined}
            />
          )}

          {/* Footer actions */}
          {!hasJobResult && (
            <div className="flex items-center justify-end gap-3 pt-1">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isLoading || (tab === 'file' ? !selectedFile : !urlValue.trim())}
                className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {isLoading ? 'Submitting...' : 'Start Ingestion'}
              </button>
            </div>
          )}

          {hasJobResult && isJobDone && (
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

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

      {/* Status */}
      <div className="flex items-center gap-3">
        {status ? <JobStatusBadge status={status} /> : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border bg-slate-100 text-slate-600 border-slate-200 text-sm font-medium">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Waiting...
          </span>
        )}
      </div>

      {/* Progress */}
      {job && (job.total_found !== null || job.parsed_ok !== null) && (
        <div className="space-y-1.5">
          {(status === 'processing' || status === 'completed' || status === 'partial') && job.total_found !== null && (
            <>
              <div className="flex justify-between text-xs text-slate-500">
                <span>
                  {isLoading
                    ? `Parsing... ${job.parsed_ok ?? 0}/${job.total_found} questions`
                    : `Parsed ${job.parsed_ok ?? 0} of ${job.total_found} questions`}
                </span>
                {job.parse_errors !== null && job.parse_errors > 0 && (
                  <span className="text-yellow-600">
                    {job.parse_errors} error{job.parse_errors !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{
                    width: job.total_found > 0
                      ? `${Math.min(((job.parsed_ok ?? 0) / job.total_found) * 100, 100)}%`
                      : '0%',
                  }}
                />
              </div>
            </>
          )}
        </div>
      )}

      {/* Completion summary */}
      {(status === 'completed' || status === 'partial') && job && (
        <div
          className={`flex items-start gap-2.5 p-3.5 rounded-lg border ${
            status === 'completed'
              ? 'bg-green-50 border-green-200'
              : 'bg-yellow-50 border-yellow-200'
          }`}
        >
          {status === 'completed' ? (
            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
          )}
          <div className="space-y-0.5">
            <p className={`text-sm font-medium ${status === 'completed' ? 'text-green-800' : 'text-yellow-800'}`}>
              {status === 'completed' ? 'Ingestion complete' : 'Ingestion completed with errors'}
            </p>
            <p className={`text-xs ${status === 'completed' ? 'text-green-700' : 'text-yellow-700'}`}>
              {job.parsed_ok ?? 0} questions parsed
              {job.parse_errors !== null && job.parse_errors > 0
                ? `, ${job.parse_errors} errors`
                : ''}
            </p>
          </div>
        </div>
      )}

      {/* Failed */}
      {status === 'failed' && job?.error_message && (
        <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-lg">
          <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-800">Ingestion failed</p>
            <p className="text-xs text-red-700 mt-0.5">{job.error_message}</p>
          </div>
        </div>
      )}

      {/* View document button */}
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
