import { Suspense, useState } from 'react'
import { NavLink, Outlet, Link } from 'react-router-dom'
import {
  LayoutDashboard,
  Building2,
  Receipt,
  PieChart,
  LogOut,
  Menu,
  X,
  Wallet,
  Info,
  Plus,
  Sun,
  Moon,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { Spinner } from './ui'

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/properties', label: 'Properties', icon: Building2 },
  { to: '/expenses', label: 'Expenses', icon: Receipt },
  { to: '/reports', label: 'Reports & Export', icon: PieChart },
]

function NavItems({ onNavigate }) {
  return (
    <nav className="flex flex-col gap-1">
      {NAV.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              isActive
                ? 'bg-brand text-white shadow-sm shadow-brand/30'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`
          }
        >
          <Icon size={18} />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5 px-1">
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand to-sky-500 text-white shadow-sm shadow-brand/30">
        <Wallet size={18} />
      </div>
      <div className="leading-tight">
        <div className="text-sm font-bold text-slate-900">Property Ledger</div>
        <div className="text-[11px] text-slate-400">Expense Tracker</div>
      </div>
    </div>
  )
}

function ThemeToggle({ className = '' }) {
  const { theme, toggle } = useTheme()
  const dark = theme === 'dark'
  return (
    <button
      onClick={toggle}
      className={`grid h-9 w-9 place-items-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 ${className}`}
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label="Toggle theme"
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  )
}

function QuickAdd({ onNavigate }) {
  return (
    <Link to="/expenses?new=1" onClick={onNavigate} className="btn-primary mt-6 w-full">
      <Plus size={16} /> Add expense
    </Link>
  )
}

export default function Layout() {
  const { user, signOut, isCloud } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[264px_1fr]">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-slate-200 bg-white/80 px-4 py-5 backdrop-blur lg:flex">
        <Brand />
        <QuickAdd />
        <div className="mt-6 flex-1">
          <NavItems />
        </div>
        <UserFooter user={user} isCloud={isCloud} onSignOut={signOut} />
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
        <Brand />
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <button
            onClick={() => setMobileOpen(true)}
            className="grid h-10 w-10 place-items-center rounded-xl text-slate-600 hover:bg-slate-100"
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 flex h-full w-72 flex-col bg-white px-4 py-5 shadow-xl animate-fade-in">
            <div className="flex items-center justify-between">
              <Brand />
              <button
                onClick={() => setMobileOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-xl text-slate-500 hover:bg-slate-100"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>
            <QuickAdd onNavigate={() => setMobileOpen(false)} />
            <div className="mt-6 flex-1">
              <NavItems onNavigate={() => setMobileOpen(false)} />
            </div>
            <UserFooter user={user} isCloud={isCloud} onSignOut={signOut} />
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="min-w-0">
        {!isCloud && (
          <div className="flex items-center gap-2 bg-amber-50 px-4 py-2 text-xs text-amber-800 lg:px-8">
            <Info size={14} className="shrink-0" />
            <span>
              <strong>Demo mode</strong> — data is saved only in this browser. Add your Supabase keys
              in <code className="rounded bg-amber-100 px-1">.env</code> for cloud sync, login &amp; receipt storage.
            </span>
          </div>
        )}
        <div className="mx-auto max-w-6xl px-4 py-6 lg:px-8 lg:py-8">
          <Suspense fallback={<Spinner />}>
            <Outlet />
          </Suspense>
        </div>
      </main>

      {/* Mobile floating quick-add */}
      <Link
        to="/expenses?new=1"
        className="fixed bottom-5 right-5 z-30 grid h-14 w-14 place-items-center rounded-full bg-brand text-white shadow-lg shadow-brand/40 transition active:scale-95 lg:hidden"
        aria-label="Add expense"
      >
        <Plus size={26} />
      </Link>
    </div>
  )
}

function UserFooter({ user, isCloud, onSignOut }) {
  return (
    <div className="mt-4 border-t border-slate-200 pt-4">
      <div className="flex items-center gap-3 px-1">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-slate-200 to-slate-300 text-sm font-semibold text-slate-600">
          {(user?.email || 'U')[0].toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-slate-700">
            {user?.email || 'Local user'}
          </div>
          <div className="text-[11px] text-slate-400">{isCloud ? 'Signed in' : 'Demo mode'}</div>
        </div>
        <ThemeToggle />
        {isCloud && (
          <button
            onClick={onSignOut}
            className="grid h-9 w-9 place-items-center rounded-xl text-slate-400 transition hover:bg-red-50 hover:text-red-600"
            title="Sign out"
          >
            <LogOut size={17} />
          </button>
        )}
      </div>
    </div>
  )
}
