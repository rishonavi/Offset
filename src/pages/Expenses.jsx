import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Receipt, Building2 } from 'lucide-react'
import { useData } from '../context/DataContext'
import { applyFilters, emptyFilters, sumAmount, hasActiveFilters } from '../lib/filters'
import { formatCurrency } from '../lib/format'
import { Card, EmptyState, Spinner } from '../components/ui'
import PageHeader from '../components/PageHeader'
import FilterBar from '../components/FilterBar'
import ExpenseTable from '../components/ExpenseTable'

export default function Expenses() {
  const { expenses, properties, loading, deleteExpense, propertyNameById } = useData()
  const [filters, setFilters] = useState(emptyFilters)
  const navigate = useNavigate()

  const filtered = useMemo(() => applyFilters(expenses, filters), [expenses, filters])
  const total = useMemo(() => sumAmount(filtered), [filtered])

  if (loading) return <Spinner />

  const noProperties = properties.length === 0

  return (
    <div className="animate-fade-in space-y-5">
      <PageHeader
        title="Expenses"
        subtitle={`${filtered.length} ${filtered.length === 1 ? 'entry' : 'entries'}${
          hasActiveFilters(filters) ? ' (filtered)' : ''
        } · ${formatCurrency(total)}`}
        actions={
          <Link to="/expenses/new" className="btn-primary">
            <Plus size={16} /> Add expense
          </Link>
        }
      />

      {noProperties ? (
        <EmptyState
          icon={Building2}
          title="Add an asset first"
          subtitle="Expenses are tracked per asset, so create one before logging expenses."
          action={
            <Link to="/properties/new" className="btn-primary">
              <Plus size={16} /> Add asset
            </Link>
          }
        />
      ) : (
        <>
          <FilterBar properties={properties} value={filters} onChange={setFilters} />

          {expenses.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="No expenses yet"
              subtitle="Log your first expense to see it here."
              action={
                <Link to="/expenses/new" className="btn-primary">
                  <Plus size={16} /> Add expense
                </Link>
              }
            />
          ) : filtered.length === 0 ? (
            <Card className="p-10 text-center text-sm text-slate-500">No expenses match these filters.</Card>
          ) : (
            <ExpenseTable
              expenses={filtered}
              propertyNameById={propertyNameById}
              onEdit={(e) => navigate(`/expenses/${e.id}/edit`)}
              onDelete={deleteExpense}
            />
          )}
        </>
      )}
    </div>
  )
}
