import { useState, useRef, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  X,
  Upload,
  FileText,
  CheckCircle,
  XCircle,
  Loader2,
  ClipboardCheck,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react'
import { listEditalExams, parseGabaritoFile, applyGabarito } from '../api/client'
import type { GabaritoCaderno, Exam } from '../api/client'

interface Props {
  editalId: string
  onClose: () => void
}

type Step = 'upload' | 'mapping' | 'done'

interface ApplyResult {
  exam: Exam
  caderno: string
  updated: number
  annulled: number
  error: string | null
}

export default function EditalGabaritoModal({ editalId, onClose }: Props) {
  const queryClient = useQueryClient()

  const [step, setStep] = useState<Step>('upload')
  const [dragOver, setDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [cadernos, setCadernos] = useState<GabaritoCaderno[]>([])
  const [parseError, setParseError] = useState<string | null>(null)
  const [isParsing, setIsParsing] = useState(false)
  // mapping: examId → caderno name ('' = skip)
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [isApplying, setIsApplying] = useState(false)
  const [results, setResults] = useState<ApplyResult[]>([])

  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: linkedExams = [], isLoading: examsLoading } = useQuery({
    queryKey: ['edital-exams', editalId],
    queryFn: () => listEditalExams(editalId),
  })

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file?.type === 'application/pdf') setSelectedFile(file)
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setSelectedFile(file)
  }

  const handleParse = async () => {
    if (!selectedFile) return
    setIsParsing(true)
    setParseError(null)
    try {
      const data = await parseGabaritoFile(selectedFile)
      setCadernos(data.cadernos)
      // Pre-fill mapping: initialise all exams to '' (skip)
      const initial: Record<string, string> = {}
      for (const exam of linkedExams) initial[exam.id] = ''
      setMapping(initial)
      setStep('mapping')
    } catch (e) {
      setParseError(e instanceof Error ? e.message : 'Não foi possível ler o gabarito')
    } finally {
      setIsParsing(false)
    }
  }

  const handleApplyAll = async () => {
    const selected = Object.entries(mapping).filter(([, name]) => name !== '')
    if (selected.length === 0) return
    setIsApplying(true)
    const out: ApplyResult[] = []
    for (const [examId, cadernoName] of selected) {
      const exam = linkedExams.find((e) => e.id === examId)
      const caderno = cadernos.find((c) => c.name === cadernoName)
      if (!exam || !caderno) continue
      try {
        const res = await applyGabarito(examId, caderno.answers)
        out.push({ exam, caderno: cadernoName, updated: res.updated, annulled: res.annulled, error: null })
      } catch (e) {
        out.push({ exam, caderno: cadernoName, updated: 0, annulled: 0, error: e instanceof Error ? e.message : 'Erro' })
      }
    }
    setResults(out)
    setIsApplying(false)
    setStep('done')
    void queryClient.invalidateQueries({ queryKey: ['exam-questions'] })
    void queryClient.invalidateQueries({ queryKey: ['exams'] })
  }

  const selectedCount = Object.values(mapping).filter(Boolean).length

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Aplicar Gabarito às Provas"
    >
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <ClipboardCheck className="w-5 h-5 text-green-600" />
            <div>
              <h2 className="text-base font-semibold text-slate-900">Aplicar Gabarito às Provas</h2>
              {step === 'mapping' && (
                <p className="text-xs text-slate-400 mt-0.5">
                  {cadernos.length} caderno{cadernos.length !== 1 ? 's' : ''} encontrado{cadernos.length !== 1 ? 's' : ''} · {linkedExams.length} prova{linkedExams.length !== 1 ? 's' : ''} vinculada{linkedExams.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* ── STEP 1: Upload ── */}
          {step === 'upload' && (
            <>
              <p className="text-sm text-slate-500">
                Envie o PDF do Gabarito Definitivo. O sistema irá detectar os cadernos disponíveis para que você os associe a cada prova vinculada a este edital.
              </p>

              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click() }}
                aria-label="Arraste o PDF do gabarito ou clique para selecionar"
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                  dragOver
                    ? 'border-green-400 bg-green-50'
                    : selectedFile
                    ? 'border-green-400 bg-green-50'
                    : 'border-slate-300 hover:border-green-400 hover:bg-slate-50'
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
                    <FileText className="w-9 h-9 text-green-500" />
                    <p className="text-sm font-medium text-green-700">{selectedFile.name}</p>
                    <p className="text-xs text-slate-500">{(selectedFile.size / 1024).toFixed(0)} KB</p>
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedFile(null); setParseError(null) }}
                      className="text-xs text-slate-400 hover:text-red-500 underline"
                    >
                      Remover
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="w-9 h-9 text-slate-300" />
                    <p className="text-sm font-medium text-slate-700">
                      Arraste o PDF do gabarito ou{' '}
                      <span className="text-green-600">clique para selecionar</span>
                    </p>
                    <p className="text-xs text-slate-400">Somente PDF</p>
                  </div>
                )}
              </div>

              {parseError && (
                <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-lg">
                  <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-red-700">{parseError}</p>
                </div>
              )}

              {linkedExams.length === 0 && !examsLoading && (
                <div className="flex items-start gap-2.5 p-3.5 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-amber-700">
                    Nenhuma prova vinculada a este edital ainda. Vincule as provas antes de aplicar o gabarito.
                  </p>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={() => void handleParse()}
                  disabled={!selectedFile || isParsing || linkedExams.length === 0}
                  className="flex items-center gap-2 px-5 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isParsing && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isParsing ? 'Lendo gabarito...' : 'Próximo'}
                </button>
              </div>
            </>
          )}

          {/* ── STEP 2: Mapping ── */}
          {step === 'mapping' && (
            <>
              <p className="text-sm text-slate-500">
                Para cada prova, selecione o caderno correspondente no gabarito. Provas sem seleção serão ignoradas.
              </p>

              <div className="space-y-2">
                {linkedExams.map((exam) => (
                  <MappingRow
                    key={exam.id}
                    exam={exam}
                    cadernos={cadernos}
                    value={mapping[exam.id] ?? ''}
                    onChange={(val) => setMapping((m) => ({ ...m, [exam.id]: val }))}
                  />
                ))}
              </div>

              {selectedCount === 0 && (
                <p className="text-xs text-slate-400 text-center">
                  Selecione ao menos um caderno para continuar.
                </p>
              )}

              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={() => setStep('upload')}
                  className="text-sm text-slate-500 hover:text-slate-700 underline"
                >
                  Voltar
                </button>
                <button
                  onClick={() => void handleApplyAll()}
                  disabled={selectedCount === 0 || isApplying}
                  className="flex items-center gap-2 px-5 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isApplying && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isApplying
                    ? 'Aplicando...'
                    : `Aplicar a ${selectedCount} prova${selectedCount !== 1 ? 's' : ''}`}
                </button>
              </div>
            </>
          )}

          {/* ── STEP 3: Done ── */}
          {step === 'done' && (
            <>
              <div className="space-y-2">
                {results.map((r) => (
                  <div
                    key={r.exam.id}
                    className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${
                      r.error
                        ? 'bg-red-50 border-red-200'
                        : 'bg-green-50 border-green-200'
                    }`}
                  >
                    {r.error ? (
                      <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                    ) : (
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-medium truncate ${r.error ? 'text-red-800' : 'text-green-800'}`}>
                        {r.exam.filename}
                      </p>
                      {r.error ? (
                        <p className="text-xs text-red-600 mt-0.5">{r.error}</p>
                      ) : (
                        <p className="text-xs text-green-700 mt-0.5">
                          {r.updated} questão{r.updated !== 1 ? 'ões' : ''} atualizada{r.updated !== 1 ? 's' : ''}
                          {r.annulled > 0 ? ` · ${r.annulled} anulada${r.annulled !== 1 ? 's' : ''}` : ''}
                        </p>
                      )}
                      <p className="text-xs text-slate-400 mt-0.5 truncate" title={r.caderno}>
                        {r.caderno}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={onClose}
                  className="px-5 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                >
                  Fechar
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Mapping row ───────────────────────────────────────────────────────────────

interface MappingRowProps {
  exam: Exam
  cadernos: GabaritoCaderno[]
  value: string
  onChange: (val: string) => void
}

function MappingRow({ exam, cadernos, value, onChange }: MappingRowProps) {
  const [expanded, setExpanded] = useState(false)
  const selected = cadernos.find((c) => c.name === value)

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3">
        <FileText className="w-4 h-4 text-slate-400 shrink-0" />
        <p className="text-sm text-slate-700 font-medium truncate flex-1 min-w-0" title={exam.filename}>
          {exam.filename}
        </p>
        <p className="text-xs text-slate-400 shrink-0">{exam.question_count} questões</p>
      </div>

      <div className="px-4 pb-3 flex items-center gap-2">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-400 bg-white text-slate-700"
          aria-label={`Caderno para ${exam.filename}`}
        >
          <option value="">— Não aplicar —</option>
          {cadernos.map((c) => (
            <option key={c.name} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>

        {selected && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors"
            aria-label={expanded ? 'Ocultar gabarito' : 'Ver gabarito'}
          >
            <ChevronRight className={`w-4 h-4 transition-transform ${expanded ? 'rotate-90' : ''}`} />
          </button>
        )}
      </div>

      {selected && expanded && (
        <div className="px-4 pb-3 border-t border-slate-100 pt-2">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xs text-slate-500">{selected.answer_count} respostas</span>
            {selected.annulled.length > 0 && (
              <span className="text-xs text-amber-600">
                {selected.annulled.length} anulada{selected.annulled.length !== 1 ? 's' : ''}: Q{selected.annulled.join(', Q')}
              </span>
            )}
          </div>
          <div className="grid grid-cols-10 gap-1 text-center text-xs font-mono">
            {Object.entries(selected.answers).map(([num, ans]) => (
              <div key={num} className="flex flex-col items-center gap-0.5">
                <span className="text-slate-400">{num}</span>
                <span
                  className={`w-6 h-6 flex items-center justify-center rounded font-semibold ${
                    ans === null
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {ans ?? '*'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
