import { NavLink } from 'react-router-dom'
import { BookOpen, Database, ScrollText } from 'lucide-react'

export default function Sidebar() {
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
        <NavLink
          to="/editais"
          className={({ isActive }) =>
            `flex items-center gap-3 pr-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive
                ? 'bg-blue-50 text-blue-700 border-l-2 border-blue-600 pl-[10px]'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border-l-2 border-transparent pl-[10px]'
            }`
          }
        >
          <ScrollText className="w-4 h-4 shrink-0" />
          Editais
        </NavLink>

        <NavLink
          to="/exams"
          className={({ isActive }) =>
            `flex items-center gap-3 pr-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive
                ? 'bg-blue-50 text-blue-700 border-l-2 border-blue-600 pl-[10px]'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border-l-2 border-transparent pl-[10px]'
            }`
          }
        >
          <BookOpen className="w-4 h-4 shrink-0" />
          Provas
        </NavLink>
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-slate-200">
        <p className="text-xs text-slate-400">ENARE Question Parser</p>
      </div>
    </aside>
  )
}
