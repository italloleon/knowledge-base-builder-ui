import { NavLink } from 'react-router-dom'
import { BookOpen, Database, LogOut, ScrollText, Users } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 pr-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
    isActive
      ? 'bg-blue-50 text-blue-700 border-l-2 border-blue-600 pl-[10px]'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border-l-2 border-transparent pl-[10px]'
  }`

export default function Sidebar() {
  const { user, logout } = useAuth()

  return (
    <aside className="w-56 shrink-0 bg-white border-r border-slate-200 flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
            <Database className="w-4.5 h-4.5 text-white" style={{ width: 18, height: 18 }} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 leading-tight">Knowledge Base</p>
            <p className="text-xs text-slate-400 leading-tight">Builder</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5" aria-label="Main navigation">
        <NavLink to="/editais" className={navLinkClass}>
          <ScrollText className="w-4 h-4 shrink-0" />
          Editais
        </NavLink>

        <NavLink to="/exams" className={navLinkClass}>
          <BookOpen className="w-4 h-4 shrink-0" />
          Provas
        </NavLink>

        <NavLink to="/users" className={navLinkClass}>
          <Users className="w-4 h-4 shrink-0" />
          Usuários
        </NavLink>
      </nav>

      {/* Footer — current user + logout */}
      <div className="px-4 py-4 border-t border-slate-200 space-y-3">
        {user && (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-semibold shrink-0">
              {user.full_name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-900 truncate leading-tight">{user.full_name}</p>
              <p className="text-xs text-slate-400 truncate leading-tight">{user.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          className="flex items-center gap-2 w-full px-2 py-1.5 text-xs text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sair
        </button>
      </div>
    </aside>
  )
}
