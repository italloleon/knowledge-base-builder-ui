import { useState, useRef, useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  X,
  Upload,
  FileText,
  CheckCircle,
  XCircle,
  Loader2,
  ClipboardCheck,
  ChevronRight,
} from 'lucide-react'
import { parseGabaritoFile, applyGabarito } from '../api/client'
import type { GabaritoCaderno } from '../api/client'

interface Props {
  examId: string
  onClose: () => void
}

export default function GabaritoModal({ examId, onClose }: Props) {
  const queryClient = useQueryClient()

  const [dragOver, setDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [cadernos, setCadernos] = useState<GabaritoCaderno[] | null>(null)
  const [applied, setApplied] = useState<{ caderno: string; updated: number; annulled: number } | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const parseMutation = useMutation({
    mutationFn: (file: File) => parseGabaritoFile(file),
    onSuccess: (data) => {
      setCadernos(data.cadernos)
    },
  })

  const applyMutation = useMutation({
    mutationFn: ({ answers }: { caderno: string; answers: Record<string, string | null> }) =>
      applyGabarito(examId, answers),
    onSuccess: (data, variables) => {
      setApplied({ caderno: variables.caderno, updated: data.updated, annulled: data.annulled })
      void queryClient.invalidateQueries({ queryKey: ['exam-questions', examId] })
      void queryClient.invalidateQueries({ queryKey: ['exams'] })
    },
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

  const handleParse = () => {
    if (!selectedFile) return
    setCadernos(null)
    setApplied(null)
    applyMutation.reset()
    parseMutation.mutate(selectedFile)
  }

  const handleApply = (caderno: GabaritoCaderno) => {
    applyMutation.mutate({ caderno: caderno.name, answers: caderno.answers })
  }

  const handleReset = () => {
    setSelectedFile(null)
    setCadernos(null)
    setApplied(null)
    parseMutation.reset()
    applyMutation.reset()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Aplicar Gabarito"
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
          <div className="flex items-center gap-2.5">
            <ClipboardCheck className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold text-slate-900">Aplicar Gabarito</h2>
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
          {/* Success state */}
          {applied && (
            <div className="space-y-4">
              <div className="flex items-start gap-2.5 p-4 bg-green-50 border border-green-200 rounded-xl">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-green-800">Gabarito aplicado com sucesso</p>
                  <p className="text-xs text-green-700 mt-1">
                    {applied.updated} questão{applied.updated !== 1 ? 'ões' : ''} atualizada{applied.updated !== 1 ? 's' : ''}
                    {applied.annulled > 0 ? ` · ${applied.annulled} anulada${applied.annulled !== 1 ? 's' : ''}` : ''}
                  </p>
                  <p className="text-xs text-green-600 mt-0.5 truncate max-w-sm" title={applied.caderno}>
                    {applied.caderno}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <button
                  onClick={handleReset}
                  className="text-sm text-slate-500 hover:text-slate-700 underline"
                >
                  Aplicar outro caderno
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          )}

          {/* Apply error */}
          {!applied && applyMutation.isError && (
            <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-lg">
              <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              <p className="text-sm text-red-700">
                {applyMutation.error instanceof Error ? applyMutation.error.message : 'Erro ao aplicar gabarito'}
              </p>
            </div>
          )}

          {/* Upload + parse step */}
          {!applied && (
            <>
              {/* Drop zone */}
              <div>
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click() }}
                  aria-label="Arraste o PDF do gabarito ou clique para selecionar"
                  className={`border-2 border-dashed rounded-xl p-7 text-center cursor-pointer transition-colors ${
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
                      <p className="text-xs text-slate-500">
                        {(selectedFile.size / 1024).toFixed(0)} KB
                      </p>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleReset() }}
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
              </div>

              {/* Parse error */}
              {parseMutation.isError && (
                <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-lg">
                  <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-red-700">
                    {parseMutation.error instanceof Error
                      ? parseMutation.error.message
                      : 'Não foi possível ler o gabarito'}
                  </p>
                </div>
              )}

              {/* Parse action */}
              {!cadernos && (
                <div className="flex justify-end">
                  <button
                    onClick={handleParse}
                    disabled={!selectedFile || parseMutation.isPending}
                    className="flex items-center gap-2 px-5 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {parseMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                    {parseMutation.isPending ? 'Lendo gabarito...' : 'Ler Gabarito'}
                  </button>
                </div>
              )}

              {/* Caderno list */}
              {cadernos && cadernos.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-700">
                      {cadernos.length} caderno{cadernos.length !== 1 ? 's' : ''} encontrado{cadernos.length !== 1 ? 's' : ''}
                    </p>
                    <button
                      onClick={handleReset}
                      className="text-xs text-slate-400 hover:text-slate-600 underline"
                    >
                      Trocar arquivo
                    </button>
                  </div>

                  {cadernos.map((caderno) => (
                    <CadernoCard
                      key={caderno.name}
                      caderno={caderno}
                      isApplying={applyMutation.isPending && applyMutation.variables?.caderno === caderno.name}
                      isDisabled={applyMutation.isPending}
                      onApply={() => handleApply(caderno)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

interface CadernoCardProps {
  caderno: GabaritoCaderno
  isApplying: boolean
  isDisabled: boolean
  onApply: () => void
}

function CadernoCard({ caderno, isApplying, isDisabled, onApply }: CadernoCardProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      {/* Card header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-800 truncate" title={caderno.name}>
            {caderno.name}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-slate-500">
              {caderno.answer_count} respostas
            </span>
            {caderno.annulled.length > 0 && (
              <span className="text-xs text-amber-600">
                · {caderno.annulled.length} anulada{caderno.annulled.length !== 1 ? 's' : ''} (Q{caderno.annulled.join(', Q')})
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 ml-3 shrink-0">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
            aria-label={expanded ? 'Ocultar respostas' : 'Ver respostas'}
          >
            <ChevronRight className={`w-4 h-4 transition-transform ${expanded ? 'rotate-90' : ''}`} />
          </button>
          <button
            onClick={onApply}
            disabled={isDisabled}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isApplying
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <ClipboardCheck className="w-3.5 h-3.5" />}
            {isApplying ? 'Aplicando...' : 'Aplicar'}
          </button>
        </div>
      </div>

      {/* Answer preview grid */}
      {expanded && (
        <div className="px-4 py-3 border-t border-slate-100">
          <div className="grid grid-cols-10 gap-1 text-center text-xs font-mono">
            {Object.entries(caderno.answers).map(([num, ans]) => (
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
