import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Receipt, Building2 } from 'lucide-react'
import { useData } from '../context/DataContext'
import { applyFilters, emptyFilters, sumAmount, hasActiveFilters } from '../lib/filters'
import { formatCurrency } from '../lib/format'
import { Button, Card, EmptyState, Spinner } from '../components/ui'
import FilterBar from '../components/FilterBar'
import ExpenseTable from '../components/ExpenseTable'
import Modal from '../components/Modal'
import ExpenseForm from '../components/ExpenseForm'

export default function Expenses() {
  const { expenses, properties, loading, addExpense, updateExpense, deleteExpense, propertyNameById } = useData()
  const [filters, setFilters] = useState(emptyFilters)
  const [modal, setModal] = useState(null) // null | { editing }

  const filtered = useMemo(() => applyFilters(expenses, filters), [expenses, filters])
  const total = useMemo(() => sumAmount(filtered), [filtered])

  const onSubmit = async (data) => {
    if (modal?.editing) await updateExpense(modal.editing.id, data)
    else await addExpense(data)
    setModal(null)
  }

  if (loading) return <Spinner />

  const noProperties = properties.length === 0

  return (
    <div className="animate-fade-in space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Expenses</h1>
          <p className="text-sm text-slate-500">
            {filtered.length} {filtered.length === 1 ? 'entry' : 'entries'}
            {hasActiveFilters(filters) ? ' (filtered)' : ''} · {formatCurrency(total)}
          </p>
        </div>
        <Button onClick={() => setModal({})} disabled={noProperties}>
          <Plus size={16} /> Add expense
        </Button>
      </div>

      {noProperties ? (
        <EmptyState
          icon={Building2}
          title="Add a property first"
          subtitle="Expenses are tracked per property, so create one before logging expenses."
          action={
            <Link to="/properties" className="btn-primary">
              <Plus size={16} /> Add property
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
                <Button onClick={() => setModal({})}>
                  <Plus size={16} /> Add expense
                </Button>
              }
            />
          ) : filtered.length === 0 ? (
            <Card className="p-10 text-center text-sm text-slate-500">
              No expenses match these filters.
            </Card>
          ) : (
            <ExpenseTable
              expenses={filtered}
              propertyNameById={propertyNameById}
              onEdit={(e) => setModal({ editing: e })}
              onDelete={deleteExpense}
            />
          )}
        </>
      )}

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.editing ? 'Edit expense' : 'Add expense'}
        maxWidth="max-w-2xl"
      >
        {modal && (
          <ExpenseForm
            initial={modal.editing}
            properties={properties}
            defaultPropertyId={filters.propertyId}
            onSubmit={onSubmit}
            onCancel={() => setModal(null)}
          />
        )}
      </Modal>
    </div>
  )
}
