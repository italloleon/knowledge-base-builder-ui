import type { QuestionSection } from '../api/client'

interface Props {
  section: QuestionSection
}

const labels: Record<QuestionSection, string> = {
  conhecimentos_gerais: 'Gerais',
  conhecimentos_especificos: 'Específicos',
  unknown: 'Unknown',
}

const classes: Record<QuestionSection, string> = {
  conhecimentos_gerais: 'bg-slate-100 text-slate-700 border-slate-300',
  conhecimentos_especificos: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  unknown: 'bg-slate-100 text-slate-400 border-slate-200',
}

export default function SectionBadge({ section }: Props) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${classes[section]}`}
    >
      {labels[section]}
    </span>
  )
}
