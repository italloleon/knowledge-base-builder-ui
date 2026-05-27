import { useState } from 'react'
import { ChevronDown, ChevronUp, ArrowUpRight, AlertTriangle, MessageSquare, CheckCircle2, Image } from 'lucide-react'
import { Link } from 'react-router-dom'
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

  const cardContent = (
    <article className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-blue-200 hover:shadow-md transition-all duration-150 cursor-pointer group">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-3 flex-wrap">
        {showNavigate ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 group-hover:bg-blue-50 border border-transparent group-hover:border-blue-200 transition-colors text-sm font-bold text-slate-700 group-hover:text-blue-700">
            #{question.number}
            <ArrowUpRight className="w-3 h-3 text-slate-300 group-hover:text-blue-500 transition-colors" />
          </span>
        ) : (
          <span className="text-sm font-bold text-slate-700">
            #{question.number}
          </span>
        )}
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
        {question.images && question.images.length > 0 && (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-200">
            <Image className="w-3 h-3" />{question.images.length}
          </span>
        )}
        {question.explanation && (
          question.explanation.flagged ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-200">
              <AlertTriangle className="w-3 h-3" /> Revisar
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
              <MessageSquare className="w-3 h-3" /> Comentado
            </span>
          )
        )}
      </div>

      {/* Body */}
      <div className="px-5 py-4 space-y-4">
        {/* Enunciado */}
        <div>
          <p
            className={`text-sm text-slate-800 leading-relaxed whitespace-pre-wrap ${!expanded ? 'line-clamp-3' : ''}`}
          >
            {question.enunciado.replace(/<!--\s*image:\d+\s*-->/g, '').trim()}
          </p>
          {question.enunciado.length > 200 && (
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setExpanded((v) => !v) }}
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
                className={`flex items-start gap-2.5 rounded-lg px-3 py-2 text-sm ${
                  isAnswer
                    ? 'bg-green-50 border border-green-300'
                    : 'bg-slate-50 border border-transparent'
                }`}
              >
                {isAnswer ? (
                  <span className="shrink-0 flex items-center gap-1 text-green-700 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                    {key})
                  </span>
                ) : (
                  <span className="shrink-0 w-4 text-slate-400 font-semibold text-sm">
                    {key})
                  </span>
                )}
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

  if (showNavigate) {
    return (
      <Link to={`/questions/${question.id}`} className="block">
        {cardContent}
      </Link>
    )
  }

  return <div>{cardContent}</div>
}
