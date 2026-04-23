import type { QuestionType } from '../api/client'

interface Props {
  type: QuestionType
}

const labels: Record<QuestionType, string> = {
  simple: 'Simple',
  roman_numeral: 'Roman Numeral',
  true_false: 'True/False',
  association: 'Association',
  unknown: 'Unknown',
}

const classes: Record<QuestionType, string> = {
  simple: 'bg-blue-50 text-blue-700 border-blue-200',
  roman_numeral: 'bg-purple-50 text-purple-700 border-purple-200',
  true_false: 'bg-orange-50 text-orange-700 border-orange-200',
  association: 'bg-teal-50 text-teal-700 border-teal-200',
  unknown: 'bg-slate-100 text-slate-500 border-slate-200',
}

export default function QuestionTypeBadge({ type }: Props) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${classes[type]}`}
    >
      {labels[type]}
    </span>
  )
}
