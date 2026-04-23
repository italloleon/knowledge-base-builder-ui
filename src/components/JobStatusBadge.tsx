import { CheckCircle, XCircle, AlertTriangle, Clock, Loader2 } from 'lucide-react'
import type { JobStatus } from '../api/client'

interface Props {
  status: JobStatus
  size?: 'sm' | 'md'
}

const config: Record<
  JobStatus,
  { label: string; icon: React.ReactNode; classes: string }
> = {
  pending: {
    label: 'Pending',
    icon: <Clock className="w-3.5 h-3.5" />,
    classes: 'bg-slate-100 text-slate-600 border-slate-200',
  },
  processing: {
    label: 'Processing',
    icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
    classes: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  completed: {
    label: 'Completed',
    icon: <CheckCircle className="w-3.5 h-3.5" />,
    classes: 'bg-green-50 text-green-700 border-green-200',
  },
  partial: {
    label: 'Partial',
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
    classes: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  },
  failed: {
    label: 'Failed',
    icon: <XCircle className="w-3.5 h-3.5" />,
    classes: 'bg-red-50 text-red-700 border-red-200',
  },
}

export default function JobStatusBadge({ status, size = 'md' }: Props) {
  const { label, icon, classes } = config[status]
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm'

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border font-medium ${textSize} ${classes}`}
    >
      {icon}
      {label}
    </span>
  )
}
