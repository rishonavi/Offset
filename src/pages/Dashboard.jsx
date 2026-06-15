import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts'
import { startOfMonth, startOfYear, format } from 'date-fns'
import { Wallet, Receipt, Building2, CalendarDays, Plus } from 'lucide-react'
import { useData } from '../context/DataContext'
import { formatCurrency, formatCompact } from '../lib/format'
import { colorForCategory, CHART_PALETTE } from '../lib/constants'
import { totalsByCategory, totalsByProperty, monthlySeries } from '../lib/stats'
import { sumAmount } from '../lib/filters'
import { Card, Spinner, EmptyState } from '../components/ui'

const RANGES = [
  { id: 'month', label: 'This month' },
  { id: 'year', label: 'This year' },
  { id: 'all', label: 'All time' },
]

function StatCard({ icon: Icon, label, value, accent = '#4f46e5' }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl" style={{ background: `${accent}1a`, color: accent }}>
          <Icon size={20} />
        </div>
        <div className="min-w-0">
          <div className="text-xs font-medium text-slate-500">{label}</div>
          <div className="truncate text-xl font-bold text-slate-900">{value}</div>
        </div>
      </div>
    </Card>
  )
}

function ChartCard({ title, children, empty }) {
  return (
    <Card className="p-5">
      <h3 className="mb-4 text-sm font-semibold text-slate-700">{title}</h3>
      {empty ? (
        <div className="grid h-64 place-items-center text-sm text-slate-400">No data for this view</div>
      ) : (
        <div style={{ width: '100%', height: 260 }}>{children}</div>
      )}
    </Card>
  )
}

const tooltipStyle = {
  borderRadius: 12,
  border: '1px solid #e2e8f0',
  boxShadow: '0 8px 24px rgba(15,23,42,0.08)',
  fontSize: 13,
}

export default function Dashboard() {
  const { expenses, properties, loading, propertyNameById } = useData()
  const [propertyId, setPropertyId] = useState('')
  const [range, setRange] = useState('all')

  const propertyScoped = useMemo(
    () => (propertyId ? expenses.filter((e) => e.property_id === propertyId) : expenses),
    [expenses, propertyId],
  )

  const scoped = useMemo(() => {
    if (range === 'month') {
      const s = format(startOfMonth(new Date()), 'yyyy-MM-dd')
      return propertyScoped.filter((e) => (e.date || '') >= s)
    }
    if (range === 'year') {
      const s = format(startOfYear(new Date()), 'yyyy-MM-dd')
      return propertyScoped.filter((e) => (e.date || '') >= s)
    }
    return propertyScoped
  }, [propertyScoped, range])

  const total = useMemo(() => sumAmount(scoped), [scoped])
  const monthTotal = useMemo(() => {
    const s = format(startOfMonth(new Date()), 'yyyy-MM-dd')
    return sumAmount(propertyScoped.filter((e) => (e.date || '') >= s))
  }, [propertyScoped])

  const byCategory = useMemo(() => totalsByCategory(scoped), [scoped])
  const byProperty = useMemo(() => totalsByProperty(scoped, propertyNameById), [scoped, propertyNameById])
  const monthly = useMemo(() => monthlySeries(propertyScoped, 12), [propertyScoped])

  if (loading) return <Spinner />

  if (properties.length === 0 && expenses.length === 0) {
    return (
      <div className="animate-fade-in">
        <h1 className="mb-6 text-2xl font-bold text-slate-900">Dashboard</h1>
        <EmptyState
          icon={Building2}
          title="Welcome to Property Ledger"
          subtitle="Start by adding a property, then log expenses against it. Your charts and totals will appear here."
          action={
            <Link to="/properties" className="btn-primary">
              <Plus size={16} /> Add your first property
            </Link>
          }
        />
      </div>
    )
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="field-input h-9 w-auto py-1"
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value)}
          >
            <option value="">All properties</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
            {RANGES.map((r) => (
              <button
                key={r.id}
                onClick={() => setRange(r.id)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                  range === r.id ? 'bg-brand text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={Wallet} label={`Total spent (${RANGES.find((r) => r.id === range).label.toLowerCase()})`} value={formatCurrency(total)} accent="#4f46e5" />
        <StatCard icon={CalendarDays} label="This month" value={formatCurrency(monthTotal)} accent="#0ea5e9" />
        <StatCard icon={Receipt} label="Expenses logged" value={String(scoped.length)} accent="#10b981" />
        <StatCard icon={Building2} label="Properties" value={String(properties.length)} accent="#f59e0b" />
      </div>

      <ChartCard title="Spending over the last 12 months" empty={monthly.every((m) => m.total === 0)}>
        <ResponsiveContainer>
          <AreaChart data={monthly} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#4f46e5" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f7" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={formatCompact} tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={48} />
            <Tooltip formatter={(v) => [formatCurrency(v), 'Spent']} contentStyle={tooltipStyle} />
            <Area type="monotone" dataKey="total" stroke="#4f46e5" strokeWidth={2.5} fill="url(#g)" />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Spending by category" empty={byCategory.length === 0}>
          <ResponsiveContainer>
            <PieChart>
              <Pie data={byCategory} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95} paddingAngle={2}>
                {byCategory.map((d) => (
                  <Cell key={d.name} fill={colorForCategory(d.name)} />
                ))}
              </Pie>
              <Tooltip formatter={(v, n) => [formatCurrency(v), n]} contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Spending by property" empty={byProperty.length === 0}>
          <ResponsiveContainer>
            <BarChart data={byProperty} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eef2f7" />
              <XAxis type="number" tickFormatter={formatCompact} tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 12, fill: '#475569' }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => [formatCurrency(v), 'Spent']} contentStyle={tooltipStyle} cursor={{ fill: '#f1f5f9' }} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={22}>
                {byProperty.map((d, i) => (
                  <Cell key={d.id} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {byCategory.length > 0 && (
        <Card className="p-5">
          <h3 className="mb-4 text-sm font-semibold text-slate-700">Category breakdown</h3>
          <div className="space-y-3">
            {byCategory.map((c) => {
              const pct = total ? Math.round((c.value / total) * 100) : 0
              return (
                <div key={c.name}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-slate-600">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: colorForCategory(c.name) }} />
                      {c.name}
                    </span>
                    <span className="font-semibold text-slate-800">
                      {formatCurrency(c.value)} <span className="ml-1 text-xs font-normal text-slate-400">{pct}%</span>
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: colorForCategory(c.name) }} />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )
}
