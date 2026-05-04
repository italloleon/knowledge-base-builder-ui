import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Plus, UserX, Pencil, X, Check } from 'lucide-react'
import {
  createUser,
  deactivateUser,
  listUsers,
  updateUser,
  type User,
} from '../api/client'
import { useAuth } from '../auth/AuthContext'

// ─── Create user modal ────────────────────────────────────────────────────────

interface CreateModalProps {
  onClose: () => void
}

function CreateUserModal({ onClose }: CreateModalProps) {
  const queryClient = useQueryClient()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const { mutate, isPending, error } = useMutation({
    mutationFn: () => createUser({ full_name: fullName, email, password }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      onClose()
    },
  })

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    mutate()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-slate-900">Novo usuário</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Nome completo</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Dr. Fulano de Tal"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">E-mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="fulano@exemplo.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Senha <span className="text-slate-400 font-normal">(mín. 8 caracteres)</span>
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error instanceof Error ? error.message : 'Erro ao criar usuário'}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 rounded-lg transition-colors"
            >
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Criar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Edit user modal ──────────────────────────────────────────────────────────

interface EditModalProps {
  user: User
  onClose: () => void
}

function EditUserModal({ user, onClose }: EditModalProps) {
  const queryClient = useQueryClient()
  const [fullName, setFullName] = useState(user.full_name)
  const [email, setEmail] = useState(user.email)
  const [password, setPassword] = useState('')

  const { mutate, isPending, error } = useMutation({
    mutationFn: () =>
      updateUser(user.id, {
        full_name: fullName !== user.full_name ? fullName : undefined,
        email: email !== user.email ? email : undefined,
        password: password.length >= 8 ? password : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      onClose()
    },
  })

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    mutate()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-slate-900">Editar usuário</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Nome completo</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">E-mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Nova senha{' '}
              <span className="text-slate-400 font-normal">(deixe em branco para manter)</span>
            </label>
            <input
              type="password"
              minLength={8}
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error instanceof Error ? error.message : 'Erro ao atualizar usuário'}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 rounded-lg transition-colors"
            >
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── User row ─────────────────────────────────────────────────────────────────

interface UserRowProps {
  user: User
  isSelf: boolean
}

function UserRow({ user, isSelf }: UserRowProps) {
  const queryClient = useQueryClient()
  const [showEdit, setShowEdit] = useState(false)
  const [confirmDeactivate, setConfirmDeactivate] = useState(false)

  const { mutate: deactivate, isPending: isDeactivating } = useMutation({
    mutationFn: () => deactivateUser(user.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setConfirmDeactivate(false)
    },
  })

  const initials = user.full_name
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase()

  return (
    <>
      <div className="flex items-center gap-4 px-5 py-4">
        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-semibold shrink-0">
          {initials}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-slate-900 truncate">{user.full_name}</p>
            {isSelf && (
              <span className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-medium">
                você
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 truncate">{user.email}</p>
        </div>

        {/* Status badge */}
        <div className="shrink-0">
          {user.is_active ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              <Check className="w-3 h-3" />
              Ativo
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
              Inativo
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setShowEdit(true)}
            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            aria-label={`Editar ${user.full_name}`}
          >
            <Pencil className="w-4 h-4" />
          </button>

          {user.is_active && !isSelf && (
            confirmDeactivate ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => deactivate()}
                  disabled={isDeactivating}
                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  aria-label="Confirmar desativação"
                >
                  {isDeactivating
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Check className="w-4 h-4" />
                  }
                </button>
                <button
                  onClick={() => setConfirmDeactivate(false)}
                  className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"
                  aria-label="Cancelar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDeactivate(true)}
                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                aria-label={`Desativar ${user.full_name}`}
              >
                <UserX className="w-4 h-4" />
              </button>
            )
          )}
        </div>
      </div>

      {showEdit && <EditUserModal user={user} onClose={() => setShowEdit(false)} />}
    </>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const { user: currentUser } = useAuth()
  const [showCreate, setShowCreate] = useState(false)

  const { data: users, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['users'],
    queryFn: listUsers,
  })

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Usuários</h1>
          <p className="text-sm text-slate-500 mt-0.5">Gerencie os profissionais com acesso ao sistema.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo usuário
        </button>
      </div>

      {/* Content */}
      {isLoading && (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-slate-200 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {isError && (
        <div className="text-center py-12">
          <p className="text-sm text-red-600 mb-3">
            {error instanceof Error ? error.message : 'Erro ao carregar usuários'}
          </p>
          <button
            onClick={() => refetch()}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {users && users.length === 0 && (
        <div className="text-center py-12 text-slate-500 text-sm">
          Nenhum usuário encontrado.
        </div>
      )}

      {users && users.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden">
          {users.map(u => (
            <UserRow key={u.id} user={u} isSelf={u.id === currentUser?.id} />
          ))}
        </div>
      )}

      {showCreate && <CreateUserModal onClose={() => setShowCreate(false)} />}
    </div>
  )
}
