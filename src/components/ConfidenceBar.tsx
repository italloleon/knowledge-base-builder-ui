interface Props {
  value: number
  showLabel?: boolean
  compact?: boolean
}

function getColorClasses(value: number): { bar: string; text: string } {
  if (value >= 0.8) {
    return { bar: 'bg-green-500', text: 'text-green-700' }
  }
  if (value >= 0.5) {
    return { bar: 'bg-yellow-500', text: 'text-yellow-700' }
  }
  return { bar: 'bg-red-500', text: 'text-red-700' }
}

function getTrackClasses(value: number): string {
  if (value >= 0.8) return 'bg-green-100'
  if (value >= 0.5) return 'bg-yellow-100'
  return 'bg-red-100'
}

export default function ConfidenceBar({ value, showLabel = true, compact = false }: Props) {
  const pct = Math.min(Math.max(value, 0), 1) * 100
  const { bar, text } = getColorClasses(value)
  const track = getTrackClasses(value)
  const displayValue = (value * 100).toFixed(0) + '%'

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${text}`}>
        <span
          className={`inline-block w-12 h-1.5 rounded-full ${track} overflow-hidden`}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Confidence: ${displayValue}`}
        >
          <span
            className={`h-full rounded-full ${bar} block`}
            style={{ width: `${pct}%` }}
          />
        </span>
        {displayValue}
      </span>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <div
        className={`flex-1 h-2 rounded-full ${track} overflow-hidden`}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Confidence: ${displayValue}`}
      >
        <div
          className={`h-full rounded-full ${bar} transition-all duration-300`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span className={`text-xs font-semibold tabular-nums w-9 text-right ${text}`}>
          {displayValue}
        </span>
      )}
    </div>
  )
}
