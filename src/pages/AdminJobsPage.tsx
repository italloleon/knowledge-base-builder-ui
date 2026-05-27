import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Activity,
  RefreshCw,
  XCircle,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Loader2,
  Filter,
} from 'lucide-react'
import { listJobs, cancelJob } from '../api/client'
import type { Job, JobStatus } from '../api/client'
import JobStatusBadge from '../components/JobStatusBadge'

const ACTIVE: JobStatus[] = ['pending', 'processing']

function RelativeTime({ iso }: { iso: string }) {
  const ms = Date.now() - new Date(iso).getTime()
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  const h = Math.floor(m / 60)
  const label =
    h > 0 ? `${h}h ago` : m > 0 ? `${m}m ago` : s <= 5 ? 'just now' : `${s}s ago`
  return <span className="text-xs text-slate-400">{label}</span>
}

function JobRow({ job, onCancel }: { job: Job; onCancel: (id: string) => void }) {
  const isActive = ACTIVE.includes(job.status)

  return (
    <tr className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
      <td className="px-4 py-3">
        <code className="text-xs text-slate-500 font-mono">{job.id.slice(0, 12)}…</code>
      </td>
      <td className="px-4 py-3">
        <span className="text-xs font-medium text-slate-700 capitalize">{job.category}</span>
      </td>
      <td className="px-4 py-3">
        <JobStatusBadge status={job.status} />
      </td>
      <td className="px-4 py-3 text-xs text-slate-600">
        {job.status === 'processing' || job.status === 'completed' || job.status === 'partial' ? (
          <span>{job.parsed_ok ?? 0}/{job.total_found ?? '?'} questions</span>
        ) : job.error_message ? (
          <span className="text-red-500 truncate max-w-[200px] block">{job.error_message}</span>
        ) : (
          <span className="text-slate-400">—</span>
        )}
      </td>
      <td className="px-4 py-3">
        <RelativeTime iso={job.created_at} />
      </td>
      <td className="px-4 py-3 text-right">
        {isActive && (
          <button
            onClick={() => onCancel(job.id)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
          >
            <XCircle className="w-3.5 h-3.5" />
            Cancel
          </button>
        )}
      </td>
    </tr>
  )
}

export default function AdminJobsPage() {
  const queryClient = useQueryClient()
  const [activeOnly, setActiveOnly] = useState(false)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const { data: jobs = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin-jobs', activeOnly],
    queryFn: () => listJobs(activeOnly, 100),
    refetchInterval: 3000,
  })

  const cancelMutation = useMutation({
    mutationFn: (id: string) => cancelJob(id),
    onSuccess: () => {
      setConfirmId(null)
      void queryClient.invalidateQueries({ queryKey: ['admin-jobs'] })
    },
  })

  const activeJobs = jobs.filter((j) => ACTIVE.includes(j.status))

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-slate-900 rounded-lg flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Jobs</h1>
            <p className="text-xs text-slate-400">Monitor and cancel background tasks</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Active jobs pill */}
          {activeJobs.length > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold rounded-full">
              <Loader2 className="w-3 h-3 animate-spin" />
              {activeJobs.length} running
            </span>
          )}

          {/* Filter toggle */}
          <button
            onClick={() => setActiveOnly((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded-lg transition-colors ${
              activeOnly
                ? 'bg-slate-900 text-white border-slate-900'
                : 'text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            {activeOnly ? 'Active only' : 'All jobs'}
          </button>

          {/* Refresh */}
          <button
            onClick={() => void refetch()}
            className="p-2 text-slate-400 hover:text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(
          [
            { label: 'Running', statuses: ACTIVE, icon: Loader2, color: 'text-blue-600', spin: true },
            { label: 'Completed', statuses: ['completed', 'partial'] as JobStatus[], icon: CheckCircle2, color: 'text-emerald-600', spin: false },
            { label: 'Failed', statuses: ['failed'] as JobStatus[], icon: XCircle, color: 'text-red-500', spin: false },
            { label: 'Total', statuses: null, icon: Activity, color: 'text-slate-600', spin: false },
          ] as const
        ).map(({ label, statuses, icon: Icon, color, spin }) => {
          const count = statuses
            ? jobs.filter((j) => (statuses as readonly string[]).includes(j.status)).length
            : jobs.length
          return (
            <div key={label} className="bg-white border border-slate-200 rounded-xl px-4 py-3">
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`w-4 h-4 ${color} ${spin && count > 0 ? 'animate-spin' : ''}`} />
                <span className="text-xs text-slate-500">{label}</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{count}</p>
            </div>
          )
        })}
      </div>

      {/* Confirm cancel dialog */}
      {confirmId && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-800">Cancel this job?</p>
              <p className="text-xs text-red-600">
                Running operations (PDF extraction, LLM calls) will finish their current step but no further work will be queued.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setConfirmId(null)}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              Keep running
            </button>
            <button
              onClick={() => cancelMutation.mutate(confirmId)}
              disabled={cancelMutation.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {cancelMutation.isPending && <Loader2 className="w-3 h-3 animate-spin" />}
              Yes, cancel
            </button>
          </div>
        </div>
      )}

      {/* Jobs table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12 gap-2 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Loading jobs…</span>
          </div>
        ) : jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
            <Clock className="w-8 h-8 text-slate-200" />
            <p className="text-sm text-slate-400">
              {activeOnly ? 'No active jobs right now' : 'No jobs found'}
            </p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-xs font-medium text-slate-500 uppercase tracking-wide">
                <th className="px-4 py-3">Job ID</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Progress</th>
                <th className="px-4 py-3">Started</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <JobRow
                  key={job.id}
                  job={job}
                  onCancel={(id) => setConfirmId(id)}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-xs text-slate-400 text-center">Auto-refreshes every 3 seconds</p>
    </div>
  )
}
