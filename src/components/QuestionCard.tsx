import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { Question } from '../api/client'
import ConfidenceBar from './ConfidenceBar'
import QuestionTypeBadge from './QuestionTypeBadge'
import SectionBadge from './SectionBadge'

interface Props {
  question: Question
  showNavigate?: boolean
}

const ALTERNATIVE_KEYS = ['A', 'B', 'C', 'D', 'E'] as const

export default function QuestionCard({ question, showNavigate = true }: Props) {
  const [expanded, setExpanded] = useState(false)
  const navigate = useNavigate()

  const handleNavigate = () => {
    if (showNavigate) {
      navigate(`/questions/${question.id}`)
    }
  }

  return (
    <article className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-slate-300 transition-colors">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-3 flex-wrap">
        <button
          onClick={handleNavigate}
          className={`text-sm font-semibold text-slate-900 ${showNavigate ? 'hover:text-blue-600 cursor-pointer' : 'cursor-default'}`}
          aria-label={`Question ${question.number}`}
        >
          #{question.number}
        </button>
        <SectionBadge section={question.section} />
        <QuestionTypeBadge type={question.question_type} />
        <div className="flex-1 min-w-[120px]">
          <ConfidenceBar value={question.confidence} compact />
        </div>
        {question.gabarito && (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
            Gabarito: {question.gabarito}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="px-5 py-4 space-y-4">
        {/* Enunciado */}
        <div>
          <p
            className={`text-sm text-slate-800 leading-relaxed whitespace-pre-wrap ${!expanded ? 'line-clamp-3' : ''}`}
          >
            {question.enunciado}
          </p>
          {question.enunciado.length > 200 && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="mt-1.5 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
              aria-expanded={expanded}
            >
              {expanded ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5" /> Show less
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5" /> Show more
                </>
              )}
            </button>
          )}
        </div>

        {/* Items (Roman numeral / True-false) */}
        {question.items && question.items.length > 0 && (
          <ol className="space-y-1.5 pl-1" aria-label="Question items">
            {question.items.map((item) => (
              <li key={item.label} className="flex gap-2.5 text-sm text-slate-700">
                <span className="font-semibold shrink-0 text-slate-500 w-6 text-right">
                  {item.label}.
                </span>
                <span className="leading-relaxed">{item.text}</span>
              </li>
            ))}
          </ol>
        )}

        {/* Alternatives */}
        <div className="space-y-1.5" role="list" aria-label="Answer alternatives">
          {ALTERNATIVE_KEYS.map((key) => {
            const text = question.alternatives[key]
            if (!text) return null
            const isAnswer = question.gabarito === key
            return (
              <div
                key={key}
                role="listitem"
                className={`flex gap-2.5 rounded-lg px-3 py-2 text-sm ${
                  isAnswer
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-slate-50 border border-transparent'
                }`}
              >
                <span
                  className={`shrink-0 font-semibold w-4 ${isAnswer ? 'text-green-700' : 'text-slate-400'}`}
                >
                  {key})
                </span>
                <span className={`leading-relaxed ${isAnswer ? 'text-green-800' : 'text-slate-700'}`}>
                  {text}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </article>
  )
}
