import { useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, AlertCircle, RefreshCw, FileText, HelpCircle, Upload,
  ChevronDown, ChevronRight, BookOpen, Link2, Calendar, Building2, Users,
  ClipboardCheck,
} from 'lucide-react'
import {
  getEdital,
  listEditalExams,
  listExams,
  linkExamToEdital,
  enrichEdital,
  enrichEditalFromUpload,
} from '../api/client'
import EditalGabaritoModal from '../components/EditalGabaritoModal'
import type {
  CronogramaEvento, InstituicaoEntry, KnowledgeAreaProfession, VagaEntry,
} from '../api/client'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

/** Date-only YYYY-MM-DD from API — avoid UTC shifting the calendar day */
function formatISODate(s: string | null | undefined): string {
  if (s == null || s === '') return '—'
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s)
  if (m) {
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
    return d.toLocaleDateString('pt-BR', { year: 'numeric', month: 'short', day: 'numeric' })
  }
  return s
}

function CronogramaSection({ items }: { items: CronogramaEvento[] }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-200 flex items-center gap-2">
        <Calendar className="w-4 h-4 text-slate-500" />
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Cronograma</h2>
          <p className="text-xs text-slate-400 mt-0.5">{items.length} etapa{items.length !== 1 ? 's' : ''}</p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
              <th className="px-5 py-2.5">Evento</th>
              <th className="px-3 py-2.5 w-32">Início</th>
              <th className="px-5 py-2.5 w-32">Fim</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row, i) => (
              <tr key={`${row.evento}-${row.data_inicio}-${i}`} className="border-b border-slate-50 last:border-0">
                <td className="px-5 py-3 text-slate-800">{row.evento}</td>
                <td className="px-3 py-3 text-slate-600 whitespace-nowrap">{formatISODate(row.data_inicio)}</td>
                <td className="px-5 py-3 text-slate-600 whitespace-nowrap">
                  {row.data_fim != null && row.data_fim !== '' ? formatISODate(row.data_fim) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function VagasSection({ vagas }: { vagas: VagaEntry[] }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-200 flex items-center gap-2">
        <Users className="w-4 h-4 text-slate-500" />
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Vagas por programa</h2>
          <p className="text-xs text-slate-400 mt-0.5">{vagas.length} oferta{vagas.length !== 1 ? 's' : ''}</p>
        </div>
      </div>
      <div className="divide-y divide-slate-100">
        {vagas.map((v, i) => {
          const reservas = v.vagas_reservadas && Object.keys(v.vagas_reservadas).length > 0
            ? Object.entries(v.vagas_reservadas)
            : []
          return (
            <div key={`${v.instituicao}-${v.programa}-${i}`} className="px-5 py-4 space-y-1.5">
              <p className="text-sm font-medium text-slate-800">{v.profissao}</p>
              <p className="text-xs text-slate-600">{v.instituicao}</p>
              <p className="text-xs text-slate-500">
                {v.cidade} — {v.estado} · {v.programa}
              </p>
              <p className="text-xs text-slate-700 pt-1">
                Ampla concorrência: <span className="font-medium">{v.vagas_ampla}</span>
                {reservas.length > 0 && (
                  <span className="ml-2">
                    Reservas: {reservas.map(([k, n]) => `${k}: ${n}`).join(' · ')}
                  </span>
                )}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function InstituicoesSection({ instituicoes }: { instituicoes: InstituicaoEntry[] }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-200 flex items-center gap-2">
        <Building2 className="w-4 h-4 text-slate-500" />
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Instituições participantes</h2>
          <p className="text-xs text-slate-400 mt-0.5">{instituicoes.length} instituiç{instituicoes.length !== 1 ? 'ões' : 'ão'}</p>
        </div>
      </div>
      <div className="divide-y divide-slate-100">
        {instituicoes.map((ins, i) => (
          <div key={`${ins.nome}-${i}`} className="px-5 py-4">
            <p className="text-sm font-medium text-slate-800">
              {ins.nome}
              {ins.sigla ? <span className="text-slate-500 font-normal"> ({ins.sigla})</span> : null}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">{ins.cidade} — {ins.estado}</p>
            {ins.programas && ins.programas.length > 0 && (
              <ul className="mt-2 space-y-0.5 text-xs text-slate-600 list-disc list-inside">
                {ins.programas.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function MetaRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (value == null) return null
  return (
    <div className="flex items-start gap-4 py-2.5 border-b border-slate-100 last:border-0">
      <span className="text-xs font-medium text-slate-500 w-44 shrink-0">{label}</span>
      <span className="text-sm text-slate-800">{String(value)}</span>
    </div>
  )
}

function KnowledgeAreasSection({ areas }: { areas: KnowledgeAreaProfession[] }) {
  const [openProf, setOpenProf] = useState<string | null>(areas[0]?.profissao ?? null)
  const [openArea, setOpenArea] = useState<string | null>(null)

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-200">
        <h2 className="text-sm font-semibold text-slate-900">Áreas de Conhecimento (Anexo III)</h2>
        <p className="text-xs text-slate-400 mt-0.5">{areas.length} profissão{areas.length !== 1 ? 'ões' : ''}</p>
      </div>

      {areas.map((prof) => {
        const isOpen = openProf === prof.profissao
        return (
          <div key={prof.profissao} className="border-b border-slate-100 last:border-0">
            <button
              onClick={() => setOpenProf(isOpen ? null : prof.profissao)}
              className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-slate-50 transition-colors"
            >
              <span className="text-sm font-semibold text-slate-700">{prof.profissao}</span>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                {prof.gerais.length > 0 && (
                  <span>{prof.gerais.length} área{prof.gerais.length !== 1 ? 's' : ''} gerais</span>
                )}
                {prof.especificos.length > 0 && (
                  <span>{prof.especificos.length} área{prof.especificos.length !== 1 ? 's' : ''} específicas</span>
                )}
                {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </div>
            </button>

            {isOpen && (
              <div className="px-5 pb-4 space-y-3">
                {prof.gerais.length > 0 && (
                  <AreaGroup title="Competências Gerais" areas={prof.gerais} openArea={openArea} setOpenArea={setOpenArea} prefix="g" />
                )}
                {prof.especificos.length > 0 && (
                  <AreaGroup title="Competências Específicas" areas={prof.especificos} openArea={openArea} setOpenArea={setOpenArea} prefix="e" />
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function AreaGroup({
  title,
  areas,
  openArea,
  setOpenArea,
  prefix,
}: {
  title: string
  areas: { area: string; topicos: string[] }[]
  openArea: string | null
  setOpenArea: (k: string | null) => void
  prefix: string
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{title}</p>
      <div className="space-y-1">
        {areas.map((a, i) => {
          const key = `${prefix}-${i}`
          const isOpen = openArea === key
          return (
            <div key={key} className="rounded-lg border border-slate-200 overflow-hidden">
              <button
                onClick={() => setOpenArea(isOpen ? null : key)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 text-left hover:bg-slate-50 transition-colors"
              >
                <span className="text-xs font-medium text-slate-700">{a.area}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-slate-400">{a.topicos.length} tópicos</span>
                  {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                </div>
              </button>
              {isOpen && a.topicos.length > 0 && (
                <ul className="px-3.5 pb-3 space-y-1 bg-slate-50">
                  {a.topicos.map((t, j) => (
                    <li key={j} className="text-xs text-slate-600 flex items-start gap-2">
                      <span className="text-slate-300 mt-0.5">•</span>
                      {t}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function LinkExamPanel({ editalId }: { editalId: string }) {
  const [selectedExamId, setSelectedExamId] = useState('')
  const queryClient = useQueryClient()

  const { data: allExams } = useQuery({ queryKey: ['exams'], queryFn: listExams })
  const { data: linkedExams } = useQuery({
    queryKey: ['edital-exams', editalId],
    queryFn: () => listEditalExams(editalId),
  })

  const linkedIds = new Set((linkedExams ?? []).map(e => e.id))
  const unlinked = (allExams ?? []).filter(e => !linkedIds.has(e.id))

  const { mutate: linkExam, isPending } = useMutation({
    mutationFn: (examId: string) => linkExamToEdital(examId, editalId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['edital-exams', editalId] })
      void queryClient.invalidateQueries({ queryKey: ['exams'] })
      setSelectedExamId('')
    },
  })

  if (unlinked.length === 0) return null

  return (
    <div className="flex items-center gap-2">
      <select
        value={selectedExamId}
        onChange={(e) => setSelectedExamId(e.target.value)}
        className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 bg-white"
      >
        <option value="">Vincular uma prova…</option>
        {unlinked.map(e => (
          <option key={e.id} value={e.id}>{e.filename}</option>
        ))}
      </select>
      <button
        disabled={!selectedExamId || isPending}
        onClick={() => selectedExamId && linkExam(selectedExamId)}
        className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        <Link2 className="w-3.5 h-3.5" />
        {isPending ? 'Vinculando…' : 'Vincular'}
      </button>
    </div>
  )
}

function LinkedExamsSection({ editalId }: { editalId: string }) {
  const { data: exams, isLoading } = useQuery({
    queryKey: ['edital-exams', editalId],
    queryFn: () => listEditalExams(editalId),
  })

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Provas Vinculadas</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {isLoading ? '…' : `${exams?.length ?? 0} prova${exams?.length !== 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      <div className="px-5 py-4 space-y-3">
        <LinkExamPanel editalId={editalId} />

        {isLoading && (
          <div className="space-y-2">
            {[1, 2].map(i => (
              <div key={i} className="h-12 bg-slate-100 rounded-lg animate-pulse" />
            ))}
          </div>
        )}

        {!isLoading && exams?.length === 0 && (
          <p className="text-sm text-slate-400 py-4 text-center">Nenhuma prova vinculada ainda.</p>
        )}

        {!isLoading && exams && exams.map(exam => (
          <Link
            key={exam.id}
            to={`/exams/${exam.id}`}
            className="flex items-center gap-3 px-3.5 py-3 bg-slate-50 hover:bg-blue-50 rounded-lg transition-colors group"
          >
            <div className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center shrink-0 group-hover:border-blue-200">
              <FileText style={{ width: 14, height: 14 }} className="text-slate-400 group-hover:text-blue-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-700 truncate group-hover:text-blue-700">{exam.filename}</p>
              <p className="text-xs text-slate-400 mt-0.5">{exam.question_count} questões · {formatDate(exam.created_at)}</p>
            </div>
            <HelpCircle className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-300 shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  )
}

export default function EditalDetailPage() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const [enrichMsg, setEnrichMsg] = useState<string | null>(null)
  const [showGabaritoModal, setShowGabaritoModal] = useState(false)
  const annexInputRef = useRef<HTMLInputElement>(null)

  const { data: edital, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['edital', id],
    queryFn: () => getEdital(id!),
    enabled: !!id,
  })

  const enrichMutation = useMutation({
    mutationFn: () => enrichEdital(id!),
    onSuccess: (data) => {
      setEnrichMsg(
        `${data.message} (job: ${data.job_id}). O processamento ocorre em segundo plano — atualize a página em alguns minutos para ver os dados.`,
      )
      void queryClient.invalidateQueries({ queryKey: ['edital', id] })
    },
    onError: (err) => {
      setEnrichMsg(err instanceof Error ? err.message : 'Falha ao enfileirar enriquecimento')
    },
  })

  const enrichFromUploadMutation = useMutation({
    mutationFn: (file: File) => enrichEditalFromUpload(id!, file),
    onSuccess: (data) => {
      setEnrichMsg(
        `${data.message} (job: ${data.job_id}). O processamento ocorre em segundo plano — atualize a página em alguns minutos para ver os dados.`,
      )
      void queryClient.invalidateQueries({ queryKey: ['edital', id] })
    },
    onError: (err) => {
      setEnrichMsg(err instanceof Error ? err.message : 'Falha ao enviar anexo para enriquecimento')
    },
  })

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
        <div className="h-64 bg-slate-100 rounded-xl animate-pulse" />
        <div className="h-48 bg-slate-100 rounded-xl animate-pulse" />
      </div>
    )
  }

  if (isError || !edital) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8 flex flex-col items-center justify-center py-32">
        <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
        <p className="text-base font-semibold text-slate-700 mb-1">Falha ao carregar edital</p>
        <p className="text-sm text-slate-400 mb-5">
          {error instanceof Error ? error.message : 'Erro inesperado'}
        </p>
        <button
          onClick={() => void refetch()}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Tentar novamente
        </button>
      </div>
    )
  }

  const title = edital.edition_name ?? edital.numero_edital ?? edital.filename

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link to="/editais" className="flex items-center gap-1.5 text-slate-500 hover:text-blue-600 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Editais
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-slate-700 font-medium truncate">{title}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-4 min-w-0">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
            <BookOpen className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{title}</h1>
            {edital.instituicao_gestora && (
              <p className="text-sm text-slate-500 mt-0.5">{edital.instituicao_gestora}</p>
            )}
          </div>
        </div>
        <div className="flex flex-col items-stretch sm:items-end gap-2 shrink-0 w-full sm:w-auto">
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={() => {
                setEnrichMsg(null)
                enrichMutation.mutate()
              }}
              disabled={enrichMutation.isPending || enrichFromUploadMutation.isPending}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${enrichMutation.isPending ? 'animate-spin' : ''}`} />
              {enrichMutation.isPending ? 'Enfileirando…' : 'Enriquecer com IA'}
            </button>
            <button
              type="button"
              onClick={() => annexInputRef.current?.click()}
              disabled={enrichMutation.isPending || enrichFromUploadMutation.isPending}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-indigo-700 border border-indigo-200 bg-indigo-50 rounded-lg hover:bg-indigo-100 disabled:opacity-50 transition-colors"
            >
              <Upload className={`w-4 h-4 ${enrichFromUploadMutation.isPending ? 'animate-pulse' : ''}`} />
              {enrichFromUploadMutation.isPending ? 'Enviando anexo…' : 'Enviar Anexo III'}
            </button>
            <button
              type="button"
              onClick={() => setShowGabaritoModal(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-green-700 border border-green-200 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              <ClipboardCheck className="w-4 h-4" />
              Gabarito
            </button>
          </div>
          <input
            ref={annexInputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={(e) => {
              const selected = e.target.files?.[0]
              e.currentTarget.value = ''
              if (selected == null) return
              setEnrichMsg(null)
              enrichFromUploadMutation.mutate(selected)
            }}
          />
          {enrichMsg && (
            <p className="text-xs text-slate-600 max-w-md sm:text-right">{enrichMsg}</p>
          )}
        </div>
      </div>

      {/* Metadata */}
      <div className="bg-white border border-slate-200 rounded-xl">
        <div className="px-5 py-4 border-b border-slate-200">
          <h2 className="text-sm font-semibold text-slate-900">Dados Extraídos</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Parser (regex) e, opcionalmente, enriquecimento com Gemini (metadados e Anexo III)
          </p>
        </div>
        <div className="px-5 py-1">
          <MetaRow label="Nº Edital" value={edital.numero_edital} />
          <MetaRow label="Ano" value={edital.ano} />
          <MetaRow label="Edição" value={edital.edition_name} />
          <MetaRow label="Organizadora" value={edital.organizadora} />
          <MetaRow label="Instituição Gestora" value={edital.instituicao_gestora} />
          <MetaRow label="Modalidade" value={edital.modalidade} />
          <MetaRow label="Questões Gerais" value={edital.total_questoes_gerais} />
          <MetaRow label="Questões Específicas" value={edital.total_questoes_especificas} />
          <MetaRow label="Aprovação Mínima" value={edital.percentual_minimo_aprovacao != null ? `${edital.percentual_minimo_aprovacao}%` : null} />
          <MetaRow label="Bolsa Mensal" value={edital.bolsa_mensal != null ? `R$ ${edital.bolsa_mensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : null} />
          <MetaRow label="Início dos Programas" value={edital.data_inicio_programas} />
          <MetaRow label="E-mail de Contato" value={edital.contato_email} />
          <MetaRow label="Telefone" value={edital.contato_telefone} />
          <MetaRow label="URL" value={edital.url_enare} />
          <MetaRow label="Arquivo" value={edital.filename} />
          <MetaRow label="Ingerido em" value={formatDate(edital.created_at)} />
        </div>
      </div>

      {/* Cronograma, vagas, instituições (p.ex. enriquecimento Gemini) */}
      {edital.cronograma && edital.cronograma.length > 0 && (
        <CronogramaSection items={edital.cronograma} />
      )}
      {edital.vagas && edital.vagas.length > 0 && (
        <VagasSection vagas={edital.vagas} />
      )}
      {edital.instituicoes && edital.instituicoes.length > 0 && (
        <InstituicoesSection instituicoes={edital.instituicoes} />
      )}

      {/* Knowledge Areas */}
      {edital.knowledge_areas && edital.knowledge_areas.length > 0 && (
        <KnowledgeAreasSection areas={edital.knowledge_areas} />
      )}

      {/* Linked Exams */}
      <LinkedExamsSection editalId={edital.id} />

      {/* Gabarito modal */}
      {showGabaritoModal && (
        <EditalGabaritoModal editalId={edital.id} onClose={() => setShowGabaritoModal(false)} />
      )}
    </div>
  )
}
