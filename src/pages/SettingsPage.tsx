import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Settings,
  Key,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Save,
  AlertCircle,
  RefreshCw,
  Cpu,
} from 'lucide-react'
import { getAdminSettings, updateAdminSettings } from '../api/client'
import type { SettingItem, ProviderMeta } from '../api/client'

// ─── Provider icons (emoji fallback since no SDK logos) ──────────────────────

const PROVIDER_ICONS: Record<string, string> = {
  gemini: '✦',
  openai: '⬡',
  deepseek: '◈',
  anthropic: '△',
}

const PROVIDER_COLORS: Record<string, string> = {
  gemini: 'bg-blue-50 border-blue-200 text-blue-700',
  openai: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  deepseek: 'bg-violet-50 border-violet-200 text-violet-700',
  anthropic: 'bg-orange-50 border-orange-200 text-orange-700',
}

// ─── API Key input row ────────────────────────────────────────────────────────

function ApiKeyRow({
  setting,
  draft,
  onChange,
}: {
  setting: SettingItem
  draft: string
  onChange: (val: string) => void
}) {
  const [visible, setVisible] = useState(false)

  const isSecret = setting.is_secret
  const isConfigured = isSecret ? setting.is_configured : setting.value !== ''
  const isDirty = draft !== ''

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 relative">
        <input
          type={isSecret && !visible ? 'password' : 'text'}
          value={draft}
          onChange={(e) => onChange(e.target.value)}
          placeholder={
            isSecret
              ? isConfigured
                ? '••••••••  (leave blank to keep current)'
                : 'Paste API key…'
              : ''
          }
          className="w-full px-3 py-2 pr-10 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-colors placeholder-slate-300 font-mono"
        />
        {isSecret && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            tabIndex={-1}
          >
            {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Status badge */}
      {!isDirty && (
        isConfigured ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-full shrink-0">
            <CheckCircle2 className="w-3 h-3" />
            {setting.source === 'env' ? 'Env var' : 'Configured'}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 bg-slate-100 border border-slate-200 px-2 py-1 rounded-full shrink-0">
            <XCircle className="w-3 h-3" />
            Not set
          </span>
        )
      )}
      {isDirty && (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-full shrink-0">
          Unsaved
        </span>
      )}
    </div>
  )
}

// ─── Provider card ────────────────────────────────────────────────────────────

function ProviderCard({
  provider,
  apiKeySetting,
  modelSetting,
  keyDraft,
  modelDraft,
  onKeyDraftChange,
  onModelDraftChange,
}: {
  provider: ProviderMeta
  apiKeySetting: SettingItem | undefined
  modelSetting: SettingItem | undefined
  keyDraft: string
  modelDraft: string
  onKeyDraftChange: (val: string) => void
  onModelDraftChange: (val: string) => void
}) {
  const colorClass = PROVIDER_COLORS[provider.name] ?? 'bg-slate-50 border-slate-200 text-slate-700'
  const icon = PROVIDER_ICONS[provider.name] ?? '◎'
  const currentModel = modelSetting && !modelSetting.is_secret ? modelSetting.value : provider.default_model

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="px-5 py-4 flex items-center gap-3 border-b border-slate-100">
        <span className={`w-9 h-9 rounded-lg border flex items-center justify-center text-lg font-bold ${colorClass}`}>
          {icon}
        </span>
        <div>
          <p className="text-sm font-semibold text-slate-900">{provider.label}</p>
          <p className="text-xs text-slate-400 font-mono">{currentModel}</p>
        </div>
      </div>

      <div className="px-5 py-4 space-y-4">
        <div className="space-y-2">
          <label className="block text-xs font-medium text-slate-500">API Key</label>
          {apiKeySetting ? (
            <ApiKeyRow
              setting={apiKeySetting}
              draft={keyDraft}
              onChange={onKeyDraftChange}
            />
          ) : (
            <p className="text-xs text-slate-400 italic">No API key required</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-medium text-slate-500">
            Model
            <span className="ml-1.5 text-slate-400 font-normal">
              (default: {provider.default_model})
            </span>
          </label>
          <input
            type="text"
            value={modelDraft !== '' ? modelDraft : (currentModel !== provider.default_model ? currentModel : '')}
            onChange={(e) => onModelDraftChange(e.target.value)}
            placeholder={provider.default_model}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-colors font-mono placeholder-slate-300"
          />
        </div>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const queryClient = useQueryClient()
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [saveSuccess, setSaveSuccess] = useState(false)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: getAdminSettings,
  })

  const mutation = useMutation({
    mutationFn: (patches: { key: string; value: string }[]) =>
      updateAdminSettings(patches),
    onSuccess: () => {
      setDrafts({})
      setSaveSuccess(true)
      void queryClient.invalidateQueries({ queryKey: ['admin-settings'] })
      setTimeout(() => setSaveSuccess(false), 3000)
    },
  })

  const settingsByKey = Object.fromEntries(
    (data?.settings ?? []).map((s) => [s.key, s]),
  )

  const currentProvider =
    (settingsByKey['enrichment_provider'] as { value?: string } | undefined)?.value ?? 'gemini'

  const draftProvider = drafts['enrichment_provider'] ?? currentProvider

  const hasDirtyFields = Object.values(drafts).some((v) => v !== '')

  const handleSave = () => {
    const patches = Object.entries(drafts)
      .filter(([, v]) => v !== '')
      .map(([key, value]) => ({ key, value }))
    if (patches.length === 0) return
    mutation.mutate(patches)
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-100 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-10 flex flex-col items-center gap-4 text-center">
        <AlertCircle className="w-10 h-10 text-red-400" />
        <p className="text-sm text-slate-600">Failed to load settings</p>
        <button
          onClick={() => void refetch()}
          className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50"
        >
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-slate-900 rounded-lg flex items-center justify-center">
          <Settings className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-900">Settings</h1>
          <p className="text-xs text-slate-400">Manage API keys and enrichment configuration</p>
        </div>
      </div>

      {/* Enrichment provider selector */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <Cpu className="w-4 h-4 text-slate-500" />
          <h2 className="text-sm font-semibold text-slate-800">Enrichment Provider</h2>
        </div>
        <div className="px-5 py-4 space-y-2">
          <label className="block text-xs font-medium text-slate-500">
            Active provider for question enrichment
          </label>
          <select
            value={draftProvider}
            onChange={(e) =>
              setDrafts((prev) => ({ ...prev, enrichment_provider: e.target.value }))
            }
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-colors bg-white"
          >
            {(data?.providers ?? []).map((p) => (
              <option key={p.name} value={p.name}>
                {p.label}
              </option>
            ))}
          </select>
          {(settingsByKey['enrichment_provider'] as { source?: string } | undefined)?.source === 'env' && (
            <p className="text-xs text-amber-600">
              Currently set via environment variable. Saving here will override it.
            </p>
          )}
        </div>
      </section>

      {/* API key cards */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <Key className="w-4 h-4 text-slate-500" />
          <h2 className="text-sm font-semibold text-slate-800">API Keys</h2>
        </div>

        {(data?.providers ?? []).map((provider) => {
          const keyKey = `${provider.name}_api_key`
          const modelKey = `${provider.name}_model`
          return (
            <ProviderCard
              key={provider.name}
              provider={provider}
              apiKeySetting={settingsByKey[keyKey]}
              modelSetting={settingsByKey[modelKey]}
              keyDraft={drafts[keyKey] ?? ''}
              modelDraft={drafts[modelKey] ?? ''}
              onKeyDraftChange={(val) =>
                setDrafts((prev) => ({ ...prev, [keyKey]: val }))
              }
              onModelDraftChange={(val) =>
                setDrafts((prev) => ({ ...prev, [modelKey]: val }))
              }
            />
          )
        })}
      </section>

      {/* Save bar */}
      <div className="sticky bottom-6 flex items-center justify-between bg-white border border-slate-200 rounded-xl px-5 py-3.5 shadow-lg">
        {saveSuccess ? (
          <span className="flex items-center gap-2 text-sm text-emerald-700">
            <CheckCircle2 className="w-4 h-4" />
            Settings saved
          </span>
        ) : (
          <span className="text-xs text-slate-400">
            {hasDirtyFields ? 'You have unsaved changes' : 'No pending changes'}
          </span>
        )}

        {mutation.isError && (
          <span className="text-xs text-red-600">
            {mutation.error instanceof Error ? mutation.error.message : 'Save failed'}
          </span>
        )}

        <button
          onClick={handleSave}
          disabled={!hasDirtyFields || mutation.isPending}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {mutation.isPending ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Save className="w-3.5 h-3.5" />
          )}
          Save changes
        </button>
      </div>
    </div>
  )
}
