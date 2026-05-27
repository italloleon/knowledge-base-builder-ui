import { useState, useRef, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ChevronRight,
  RefreshCw,
  AlertCircle,
  Code,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Sparkles,
  Tag,
  BarChart2,
  BookOpen,
  MessageSquarePlus,
  CheckCircle,
  Pencil,
  Mic,
  MicOff,
  Zap,
} from 'lucide-react'
import { getQuestion, refineExplanation, explainQuestion, updateQuestionGabarito } from '../api/client'
import type { QuestionEnrichment, QuestionExplanation } from '../api/client'
import ConfidenceBar from '../components/ConfidenceBar'
import QuestionTypeBadge from '../components/QuestionTypeBadge'
import SectionBadge from '../components/SectionBadge'

const ALTERNATIVE_KEYS = ['A', 'B', 'C', 'D', 'E'] as const

const DIFFICULTY_STYLES: Record<string, string> = {
  facil: 'bg-green-50 text-green-700 border-green-200',
  medio: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  dificil: 'bg-red-50 text-red-700 border-red-200',
}

const DIFFICULTY_LABELS: Record<string, string> = {
  facil: 'Fácil',
  medio: 'Médio',
  dificil: 'Difícil',
}

function EnrichmentPanel({ enrichment }: { enrichment: QuestionEnrichment }) {
  return (
    <div className="bg-gradient-to-br from-violet-50 to-blue-50 border border-violet-200 rounded-xl px-5 py-4 space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-violet-500" />
        <h2 className="text-xs font-semibold text-violet-700 uppercase tracking-wide">
          AI Enrichment
        </h2>
        {enrichment.taxonomy_grounded && (
          <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">
            Taxonomia do edital
          </span>
        )}
        {enrichment.taxonomy_needs_review && !enrichment.taxonomy_grounded && (
          <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide rounded-full bg-amber-100 text-amber-800 border border-amber-200">
            Taxonomia a revisar
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Area */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <BookOpen className="w-3.5 h-3.5" />
            Área
          </div>
          <p className="text-sm font-medium text-slate-800">
            {enrichment.area ?? '—'}
          </p>
        </div>

        {/* Topic */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <Tag className="w-3.5 h-3.5" />
            Tópico
          </div>
          <p className="text-sm font-medium text-slate-800">
            {enrichment.topic ?? '—'}
          </p>
        </div>

        {/* Competência geral */}
        {enrichment.competencia_geral_topico && (
          <div className="space-y-1 sm:col-span-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <BookOpen className="w-3.5 h-3.5" />
              Competência Geral
            </div>
            <p className="text-sm font-medium text-slate-800">
              {enrichment.competencia_geral_area ? `${enrichment.competencia_geral_area} · ` : ''}
              {enrichment.competencia_geral_topico}
            </p>
          </div>
        )}

        {/* Competência específica */}
        {enrichment.competencia_especifica_topico && (
          <div className="space-y-1 sm:col-span-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <Tag className="w-3.5 h-3.5" />
              Competência Específica
            </div>
            <p className="text-sm font-medium text-slate-800">
              {enrichment.competencia_especifica_area ? `${enrichment.competencia_especifica_area} · ` : ''}
              {enrichment.competencia_especifica_topico}
            </p>
          </div>
        )}

        {/* Difficulty */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <BarChart2 className="w-3.5 h-3.5" />
            Dificuldade
          </div>
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
              DIFFICULTY_STYLES[enrichment.difficulty] ?? 'bg-slate-100 text-slate-600 border-slate-200'
            }`}
          >
            {DIFFICULTY_LABELS[enrichment.difficulty] ?? enrichment.difficulty}
          </span>
        </div>

        {/* Bloom level */}
        {enrichment.bloom_level && (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <Sparkles className="w-3.5 h-3.5" />
              Taxonomia de Bloom
            </div>
            <p className="text-sm font-medium text-slate-800 capitalize">{enrichment.bloom_level}</p>
          </div>
        )}
      </div>

      {/* Keywords */}
      {enrichment.keywords && enrichment.keywords.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <p className="text-xs font-medium text-slate-500">Palavras-chave</p>
          <div className="flex flex-wrap gap-1.5">
            {enrichment.keywords.map((kw) => (
              <span
                key={kw}
                className="px-2 py-0.5 bg-white border border-violet-200 text-violet-700 text-xs rounded-full font-medium"
              >
                {kw}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const CONFIDENCE_COLOR = (v: number) =>
  v >= 0.8 ? 'bg-green-500' : v >= 0.6 ? 'bg-yellow-400' : 'bg-red-400'

const CONFIDENCE_TEXT = (v: number) =>
  v >= 0.8 ? 'text-green-700' : v >= 0.6 ? 'text-yellow-700' : 'text-red-700'

function ExplanationPanel({ explanation }: { explanation: QuestionExplanation }) {
  const wrongLetters = Object.keys(explanation.justificativas_erradas).sort()

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl px-5 py-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 flex-wrap">
        <BookOpen className="w-4 h-4 text-amber-600" />
        <h2 className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
          Gabarito Comentado
        </h2>
        {explanation.flagged && (
          <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide rounded-full bg-amber-100 text-amber-700 border border-amber-300">
            ⚠ Revisar
          </span>
        )}
      </div>

      {/* Conceito Central */}
      <div className="flex items-start gap-2">
        <span className="text-xs font-medium text-amber-600 shrink-0 mt-0.5">Conceito central</span>
        <span className="inline-flex items-center px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-sm font-semibold text-amber-800">
          {explanation.conceito_central}
        </span>
      </div>

      {/* Justificativa da resposta correta */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Justificativa da resposta correta
          </span>
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-100 border border-green-300 text-xs font-bold text-green-700">
            {explanation.correta}
          </span>
        </div>
        <p className="text-sm text-slate-800 leading-relaxed">
          {explanation.justificativa_correta}
        </p>
      </div>

      {/* Por que as demais estão erradas */}
      {wrongLetters.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Por que as demais estão erradas
          </p>
          <div className="space-y-2">
            {wrongLetters.map((letter) => (
              <div key={letter} className="flex gap-3">
                <span className="inline-flex items-center justify-center shrink-0 w-5 h-5 rounded-full bg-slate-100 border border-slate-300 text-xs font-bold text-slate-500 mt-0.5">
                  {letter}
                </span>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {explanation.justificativas_erradas[letter]}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confidence score */}
      <div className="flex items-center gap-3 pt-1">
        <span className="text-xs font-medium text-slate-500">Confiança da explicação</span>
        <div className="flex items-center gap-2">
          <div className="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${CONFIDENCE_COLOR(explanation.confidence)}`}
              style={{ width: `${(explanation.confidence * 100).toFixed(0)}%` }}
            />
          </div>
          <span className={`text-xs font-semibold tabular-nums ${CONFIDENCE_TEXT(explanation.confidence)}`}>
            {(explanation.confidence * 100).toFixed(0)}%
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── Web Speech API hook ─────────────────────────────────────────────────────

interface SpeechRecognitionInstance {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((event: SpeechResultEvent) => void) | null
  onend: (() => void) | null
  onerror: (() => void) | null
  start(): void
  stop(): void
}

interface SpeechResultEvent {
  results: { isFinal: boolean; 0: { transcript: string } }[]
  resultIndex: number
}

function useVoiceInput(lang = 'pt-BR') {
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)

  const supported =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)

  const start = useCallback(
    (onTranscript: (text: string) => void) => {
      const win = window as typeof window & {
        SpeechRecognition?: new () => SpeechRecognitionInstance
        webkitSpeechRecognition?: new () => SpeechRecognitionInstance
      }
      const SR = win.SpeechRecognition ?? win.webkitSpeechRecognition
      if (!SR) return

      const recognition = new SR()
      recognition.lang = lang
      recognition.continuous = true
      recognition.interimResults = false

      recognition.onresult = (event: SpeechResultEvent) => {
        const transcript = Array.from(event.results)
          .slice(event.resultIndex)
          .filter((r) => r.isFinal)
          .map((r) => r[0].transcript)
          .join(' ')
          .trim()
        if (transcript) onTranscript(transcript)
      }
      recognition.onend = () => setListening(false)
      recognition.onerror = () => setListening(false)

      recognitionRef.current = recognition
      recognition.start()
      setListening(true)
    },
    [lang],
  )

  const stop = useCallback(() => {
    recognitionRef.current?.stop()
    setListening(false)
  }, [])

  return { listening, supported, start, stop }
}

// ─── Specialist insight panel ─────────────────────────────────────────────────

function ExplanationInsightPanel({
  questionId,
  currentInsight,
}: {
  questionId: string
  currentInsight: string | null
}) {
  const queryClient = useQueryClient()
  const [expanded, setExpanded] = useState(false)
  const [text, setText] = useState(currentInsight ?? '')
  const [queued, setQueued] = useState(false)
  const { listening, supported, start, stop } = useVoiceInput()

  const mutation = useMutation({
    mutationFn: (insight: string) => refineExplanation(questionId, insight),
    onSuccess: () => {
      setQueued(true)
      setExpanded(false)
      void queryClient.invalidateQueries({ queryKey: ['question', questionId] })
      setTimeout(() => setQueued(false), 6000)
    },
  })

  const handleVoiceToggle = () => {
    if (listening) {
      stop()
    } else {
      start((transcript) => {
        setText((prev) => (prev.trim() ? `${prev} ${transcript}` : transcript))
      })
    }
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-slate-50 border border-blue-200 rounded-xl px-5 py-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <MessageSquarePlus className="w-4 h-4 text-blue-500" />
          <h2 className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
            Insight do Especialista
          </h2>
        </div>
        {!expanded && (
          <button
            onClick={() => {
              setText(currentInsight ?? '')
              setExpanded(true)
            }}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Pencil className="w-3 h-3" />
            {currentInsight ? 'Editar' : 'Adicionar insight'}
          </button>
        )}
      </div>

      {/* Existing insight (read-only when collapsed) */}
      {currentInsight && !expanded && (
        <blockquote className="border-l-2 border-blue-300 pl-3 text-sm text-slate-700 leading-relaxed italic">
          {currentInsight}
        </blockquote>
      )}

      {/* Queued confirmation */}
      {queued && (
        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          Refinamento em fila. A nova explicação será gerada em breve.
        </div>
      )}

      {/* Edit form */}
      {expanded && (
        <div className="space-y-3">
          {/* Textarea with listening indicator */}
          <div className="relative">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={5}
              placeholder="Descreva o que deve ser corrigido ou complementado na explicação. Ex: A justificativa da alternativa B confunde a Resolução COFEN 358/2009 com a 564/2017..."
              className={`w-full text-sm text-slate-800 placeholder-slate-400 border rounded-lg px-3 py-2.5 bg-white resize-none focus:outline-none focus:ring-2 leading-relaxed transition-colors ${
                listening
                  ? 'border-red-300 focus:ring-red-200 pr-10'
                  : 'border-blue-200 focus:ring-blue-300'
              }`}
            />
            {/* Pulsing mic indicator inside textarea when listening */}
            {listening && (
              <span className="absolute top-2.5 right-2.5 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500" />
              </span>
            )}
          </div>

          {/* Listening label */}
          {listening && (
            <p className="text-xs text-red-600 font-medium flex items-center gap-1.5">
              <Mic className="w-3 h-3" />
              Ouvindo... fale agora. Clique em parar quando terminar.
            </p>
          )}

          {/* Action row */}
          <div className="flex items-center gap-2">
            {/* Voice button */}
            {supported ? (
              <button
                type="button"
                onClick={handleVoiceToggle}
                title={listening ? 'Parar gravação' : 'Falar insight (pt-BR)'}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                  listening
                    ? 'text-red-600 border-red-200 bg-red-50 hover:bg-red-100'
                    : 'text-slate-500 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {listening ? (
                  <>
                    <MicOff className="w-3.5 h-3.5" />
                    Parar
                  </>
                ) : (
                  <>
                    <Mic className="w-3.5 h-3.5" />
                    Falar
                  </>
                )}
              </button>
            ) : (
              <span
                title="Web Speech API não suportada neste navegador (use Chrome ou Edge)"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 border border-slate-200 rounded-lg cursor-not-allowed"
              >
                <MicOff className="w-3.5 h-3.5" />
                Voz indisponível
              </span>
            )}

            <div className="flex-1" />

            <button
              onClick={() => {
                if (listening) stop()
                setExpanded(false)
              }}
              className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => mutation.mutate(text)}
              disabled={!text.trim() || mutation.isPending || listening}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              {mutation.isPending ? (
                <>
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Sparkles className="w-3 h-3" />
                  Gerar nova explicação
                </>
              )}
            </button>
          </div>

          {mutation.isError && (
            <p className="text-xs text-red-600">
              {mutation.error instanceof Error ? mutation.error.message : 'Erro ao enviar insight'}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function DetailSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-5 w-10 bg-slate-200 rounded" />
          <div className="h-6 w-20 bg-slate-200 rounded-full" />
          <div className="h-6 w-24 bg-slate-200 rounded-full" />
        </div>
        <div className="h-2.5 bg-slate-100 rounded-full w-48" />
      </div>

      {/* Body */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-5">
        <div className="space-y-2">
          <div className="h-3.5 bg-slate-200 rounded w-full" />
          <div className="h-3.5 bg-slate-200 rounded w-11/12" />
          <div className="h-3.5 bg-slate-200 rounded w-4/5" />
          <div className="h-3.5 bg-slate-200 rounded w-3/4" />
        </div>
        <div className="space-y-2">
          {['A', 'B', 'C', 'D', 'E'].map((k) => (
            <div key={k} className="flex gap-2">
              <div className="h-3.5 w-5 bg-slate-100 rounded" />
              <div className="h-3.5 bg-slate-100 rounded w-3/4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Gabarito editor ─────────────────────────────────────────────────────────

function GabaritoEditor({
  questionId,
  current,
}: {
  questionId: string
  current: string | null
}) {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [saved, setSaved] = useState(false)

  const mutation = useMutation({
    mutationFn: (g: string | null) => updateQuestionGabarito(questionId, g),
    onSuccess: () => {
      setSaved(true)
      setEditing(false)
      void queryClient.invalidateQueries({ queryKey: ['question', questionId] })
      setTimeout(() => setSaved(false), 4000)
    },
  })

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        {current ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
            Gabarito: {current}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200">
            Sem gabarito
          </span>
        )}
        {saved && (
          <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
            <CheckCircle className="w-3 h-3" /> Salvo
          </span>
        )}
        <button
          onClick={() => setEditing(true)}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors"
          title="Alterar gabarito"
        >
          <Pencil className="w-3 h-3" />
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs font-medium text-slate-500">Gabarito:</span>
      {(['A', 'B', 'C', 'D', 'E'] as const).map((letter) => (
        <button
          key={letter}
          onClick={() => mutation.mutate(letter)}
          disabled={mutation.isPending}
          className={`w-7 h-7 rounded-full text-xs font-bold border transition-colors ${
            current === letter
              ? 'bg-green-100 border-green-400 text-green-700'
              : 'bg-white border-slate-300 text-slate-600 hover:border-green-400 hover:bg-green-50 hover:text-green-700'
          }`}
        >
          {letter}
        </button>
      ))}
      <button
        onClick={() => mutation.mutate(null)}
        disabled={mutation.isPending}
        className="text-xs text-slate-400 hover:text-red-500 transition-colors px-1"
        title="Limpar gabarito"
      >
        limpar
      </button>
      <button
        onClick={() => setEditing(false)}
        className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
      >
        cancelar
      </button>
      {mutation.isPending && <RefreshCw className="w-3 h-3 animate-spin text-slate-400" />}
      {mutation.isError && (
        <span className="text-xs text-red-500">Erro ao salvar</span>
      )}
    </div>
  )
}

// ─── Single-question explain button ──────────────────────────────────────────

function ExplainButton({ questionId }: { questionId: string }) {
  const queryClient = useQueryClient()
  const [queued, setQueued] = useState(false)

  const mutation = useMutation({
    mutationFn: () => explainQuestion(questionId),
    onSuccess: () => {
      setQueued(true)
      setTimeout(() => {
        setQueued(false)
        void queryClient.invalidateQueries({ queryKey: ['question', questionId] })
      }, 8000)
    },
  })

  if (queued) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-green-700 font-medium bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg">
        <CheckCircle className="w-3.5 h-3.5" />
        Explicação em fila…
      </span>
    )
  }

  return (
    <button
      onClick={() => mutation.mutate()}
      disabled={mutation.isPending}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-700 border border-amber-200 bg-amber-50 hover:bg-amber-100 disabled:opacity-50 rounded-lg transition-colors"
    >
      {mutation.isPending ? (
        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <Zap className="w-3.5 h-3.5" />
      )}
      Explicar
    </button>
  )
}

export default function QuestionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const questionId = id!
  const navigate = useNavigate()
  const [rawExpanded, setRawExpanded] = useState(false)

  const { data: question, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['question', questionId],
    queryFn: () => getQuestion(questionId),
  })

  const handleBack = () => {
    if (question) {
      navigate(`/exams/${question.exam_id}`)
    } else {
      navigate('/')
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:px-6 sm:py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6" aria-label="Breadcrumb">
        <Link to="/exams" className="hover:text-blue-600 transition-colors">
          Exams
        </Link>
        <ChevronRight className="w-4 h-4 text-slate-300" />
        {question ? (
          <>
            <Link
              to={`/exams/${question.exam_id}`}
              className="hover:text-blue-600 transition-colors"
            >
              Exam #{question.exam_id.slice(0, 6)}
            </Link>
            <ChevronRight className="w-4 h-4 text-slate-300" />
          </>
        ) : null}
        <span className="text-slate-900 font-medium">
          Question {question?.number ?? '...'}
        </span>
      </nav>

      {/* Back button */}
      <button
        onClick={handleBack}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-5 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-100 border border-transparent hover:border-slate-200"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to exam
      </button>

      {/* Loading */}
      {isLoading && <DetailSkeleton />}

      {/* Error */}
      {isError && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 bg-red-50 rounded-xl flex items-center justify-center mb-4">
            <AlertCircle className="w-7 h-7 text-red-400" />
          </div>
          <h3 className="text-base font-semibold text-slate-700 mb-1">Failed to load question</h3>
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

      {/* Question content */}
      {!isLoading && !isError && question && (
        <div className="space-y-5">
          {/* Meta header */}
          <div className="bg-white border border-slate-200 rounded-xl px-5 py-4 space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-base font-bold text-slate-900">#{question.number}</span>
              <SectionBadge section={question.section} />
              <QuestionTypeBadge type={question.question_type} />
              <GabaritoEditor questionId={question.id} current={question.gabarito} />
              <div className="ml-auto">
                <ExplainButton questionId={question.id} />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 font-medium">Confidence</span>
              <div className="flex-1 max-w-xs">
                <ConfidenceBar value={question.confidence} />
              </div>
            </div>
            <div className="text-xs text-slate-400">
              ID: <code className="font-mono">{question.id}</code>
              {' · '}
              Parsed: {new Date(question.created_at).toLocaleString('en-US')}
            </div>
          </div>

          {/* Enrichment */}
          {question.enrichment && (
            <EnrichmentPanel enrichment={question.enrichment} />
          )}

          {/* Explanation */}
          {question.explanation && (
            <ExplanationPanel explanation={question.explanation} />
          )}

          {/* Specialist insight */}
          {question.gabarito && (
            <ExplanationInsightPanel
              questionId={question.id}
              currentInsight={question.explanation_insight}
            />
          )}

          {/* Enunciado */}
          <div className="bg-white border border-slate-200 rounded-xl px-5 py-4">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
              Enunciado
            </h2>
            <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
              {question.enunciado.replace(/<!--\s*image:\d+\s*-->/g, '').trim()}
            </p>
          </div>

          {/* Images */}
          {question.images && question.images.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl px-5 py-4 space-y-3">
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
                Imagens
              </h2>
              <div className="flex flex-col gap-4">
                {question.images.map((path, i) => (
                  <img
                    key={i}
                    src={`/api/images/${path}`}
                    alt={`Figura ${i + 1}`}
                    className="max-w-full rounded-lg border border-slate-200"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Items */}
          {question.items && question.items.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl px-5 py-4">
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
                Items
              </h2>
              <ol className="space-y-2" aria-label="Question items">
                {question.items.map((item) => (
                  <li key={item.label} className="flex gap-3 text-sm text-slate-700">
                    <span className="font-semibold text-slate-500 shrink-0 w-8 text-right">
                      {item.label}.
                    </span>
                    <span className="leading-relaxed">{item.text}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Alternatives */}
          <div className="bg-white border border-slate-200 rounded-xl px-5 py-4">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
              Alternatives
            </h2>
            <div className="space-y-2" role="list" aria-label="Answer alternatives">
              {ALTERNATIVE_KEYS.map((key) => {
                const text = question.alternatives[key]
                if (!text) return null
                const isAnswer = question.gabarito === key
                return (
                  <div
                    key={key}
                    role="listitem"
                    className={`flex gap-3 rounded-lg px-4 py-3 text-sm ${
                      isAnswer
                        ? 'bg-green-50 border border-green-300'
                        : 'bg-slate-50 border border-transparent'
                    }`}
                  >
                    <span
                      className={`shrink-0 ${isAnswer ? 'font-bold text-base text-green-700' : 'font-semibold text-sm text-slate-400'}`}
                    >
                      {key}
                    </span>
                    <span className={`leading-relaxed ${isAnswer ? 'text-green-800' : 'text-slate-700'}`}>
                      {text}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Raw block */}
          {question.raw_block && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setRawExpanded((v) => !v)}
                className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors"
                aria-expanded={rawExpanded}
              >
                <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                  <Code className="w-4 h-4 text-slate-400" />
                  Raw Block
                </div>
                {rawExpanded ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </button>
              {rawExpanded && (
                <div className="border-t border-slate-200 px-5 py-4">
                  <pre className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap font-mono bg-slate-50 rounded-lg p-4 overflow-x-auto">
                    {question.raw_block}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
