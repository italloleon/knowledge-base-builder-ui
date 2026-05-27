import { useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Upload, ScrollText, AlertCircle, RefreshCw, Trash2, Download, FolderUp } from 'lucide-react'
import { exportFullDataset, importFullDataset, listEditais, deleteEdital } from '../api/client'
import type { Edital, FullImportResult } from '../api/client'
import UploadModal from '../components/UploadModal'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function EditalCardSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 bg-slate-200 rounded-lg shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-slate-200 rounded w-2/3" />
          <div className="h-3 bg-slate-100 rounded w-1/2" />
        </div>
      </div>
      <div className="flex gap-3">
        <div className="h-3 bg-slate-100 rounded w-28" />
        <div className="h-3 bg-slate-100 rounded w-20" />
      </div>
    </div>
  )
}

function EditalCard({ edital }: { edital: Edital }) {
  const [confirming, setConfirming] = useState(false)
  const queryClient = useQueryClient()

  const { mutate: remove, isPending } = useMutation({
    mutationFn: () => deleteEdital(edital.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['editais'] }),
  })

  const title = edital.edition_name ?? edital.numero_edital ?? edital.filename
  const subtitle = [
    edital.organizadora,
    edital.modalidade ? edital.modalidade.split(' ').slice(0, 3).join(' ') + '…' : null,
  ].filter(Boolean).join(' · ')

  return (
    <div className="group bg-white border border-slate-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-sm transition-all">
      <div className="flex items-start justify-between gap-3">
        <Link
          to={`/editais/${edital.id}`}
          className="flex items-start gap-3 flex-1 min-w-0"
          aria-label={`View edital: ${title}`}
        >
          <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-blue-50 transition-colors">
            <ScrollText style={{ width: 18, height: 18 }} className="text-slate-500 group-hover:text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate group-hover:text-blue-700 transition-colors">
              {title}
            </p>
            {subtitle && (
              <p className="text-xs text-slate-400 mt-0.5 truncate">{subtitle}</p>
            )}
          </div>
        </Link>

        {confirming ? (
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => remove()}
              disabled={isPending}
              className="px-2.5 py-1 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {isPending ? 'Deleting…' : 'Confirm'}
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="px-2.5 py-1 text-xs font-medium text-slate-600 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            aria-label="Delete edital"
            className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all"
          >
            <Trash2 style={{ width: 15, height: 15 }} />
          </button>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500">
        {edital.numero_edital && (
          <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
            {edital.numero_edital}
          </span>
        )}
        {edital.total_questoes_gerais != null && edital.total_questoes_especificas != null && (
          <span>
            {edital.total_questoes_gerais + edital.total_questoes_especificas} questões
          </span>
        )}
        {edital.knowledge_areas && edital.knowledge_areas.length > 0 && (
          <span className="text-emerald-600">
            {edital.knowledge_areas.length} profissão{edital.knowledge_areas.length !== 1 ? 'ões' : ''}
          </span>
        )}
        <span className="ml-auto">{formatDate(edital.created_at)}</span>
      </div>
    </div>
  )
}

function EmptyState({ onUpload }: { onUpload: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mb-5">
        <ScrollText className="w-9 h-9 text-slate-300" />
      </div>
      <h3 className="text-lg font-semibold text-slate-700 mb-1">Nenhum edital ainda</h3>
      <p className="text-sm text-slate-400 max-w-xs mb-6">
        Faça upload do PDF do Edital ENARE para extrair as informações estruturadas.
      </p>
      <button
        onClick={onUpload}
        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
      >
        <Upload className="w-4 h-4" />
        Upload Edital PDF
      </button>
    </div>
  )
}

export default function EditaisPage() {
  const [showUpload, setShowUpload] = useState(false)
  const [importing, setImporting] = useState(false)
  const [ioError, setIoError] = useState<string | null>(null)
  const [fullImportResult, setFullImportResult] = useState<FullImportResult | null>(null)
  const importFullInputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()

  const { data: editais, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['editais'],
    queryFn: listEditais,
  })

  async function handleImportFullFile(file: File) {
    setImporting(true)
    setIoError(null)
    setFullImportResult(null)
    try {
      const result = await importFullDataset(file)
      setFullImportResult(result)
      void queryClient.invalidateQueries({ queryKey: ['editais'] })
      void queryClient.invalidateQueries({ queryKey: ['exams'] })
    } catch (e) {
      setIoError(e instanceof Error ? e.message : 'Full import failed')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:px-6 sm:py-8">
      <input
        ref={importFullInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void handleImportFullFile(file)
          e.target.value = ''
        }}
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Editais</h1>
          <p className="text-sm text-slate-500 mt-0.5">Documentos de edital ENARE ingeridos</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => importFullInputRef.current?.click()}
            disabled={importing}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 disabled:opacity-50 transition-colors shadow-sm"
          >
            <FolderUp className="w-4 h-4" />
            {importing ? 'Importando…' : 'Import Full'}
          </button>
          <button
            onClick={() => void exportFullDataset().catch((e) => setIoError(e instanceof Error ? e.message : 'Export failed'))}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            Export Full
          </button>
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Upload className="w-4 h-4" />
            Upload Edital
          </button>
        </div>
      </div>

      {fullImportResult && (
        <div className="mb-4 px-4 py-3 bg-indigo-50 border border-indigo-200 rounded-lg text-sm text-indigo-800">
          Full import complete: {fullImportResult.editais_created} edital(is), {fullImportResult.exams_created} prova(s), {fullImportResult.questions_created} questão(ões) importadas.
        </div>
      )}
      {ioError && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {ioError}
        </div>
      )}

      {!isLoading && !isError && editais && editais.length > 0 && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white border border-slate-200 rounded-xl px-5 py-4">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Total Editais</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">{editais.length}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl px-5 py-4">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Com Áreas de Conhecimento</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">
              {editais.filter(e => e.knowledge_areas && e.knowledge_areas.length > 0).length}
            </p>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <EditalCardSkeleton key={i} />)}
        </div>
      )}

      {isError && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 bg-red-50 rounded-xl flex items-center justify-center mb-4">
            <AlertCircle className="w-7 h-7 text-red-400" />
          </div>
          <h3 className="text-base font-semibold text-slate-700 mb-1">Falha ao carregar editais</h3>
          <p className="text-sm text-slate-400 mb-5 max-xs">
            {error instanceof Error ? error.message : 'Erro inesperado'}
          </p>
          <button
            onClick={() => void refetch()}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Tentar novamente
          </button>
        </div>
      )}

      {!isLoading && !isError && editais?.length === 0 && (
        <EmptyState onUpload={() => setShowUpload(true)} />
      )}

      {!isLoading && !isError && editais && editais.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {editais.map((edital) => (
            <EditalCard key={edital.id} edital={edital} />
          ))}
        </div>
      )}

      {showUpload && (
        <UploadModal
          defaultCategory="edital"
          onClose={() => setShowUpload(false)}
        />
      )}
    </div>
  )
}
