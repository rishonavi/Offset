import { useMemo, useState } from 'react'
import { Building2, Plus, Pencil, Trash2, MapPin, Receipt } from 'lucide-react'
import { useData } from '../context/DataContext'
import { formatCurrency } from '../lib/format'
import { Card, Button, EmptyState, Spinner } from '../components/ui'
import PageHeader from '../components/PageHeader'
import Modal from '../components/Modal'
import PropertyForm from '../components/PropertyForm'

export default function Properties() {
  const { properties, expenses, loading, addProperty, updateProperty, deleteProperty } = useData()
  const [modal, setModal] = useState(null) // null | { editing }

  const totals = useMemo(() => {
    const sum = new Map()
    const count = new Map()
    for (const e of expenses) {
      sum.set(e.property_id, (sum.get(e.property_id) || 0) + (Number(e.amount) || 0))
      count.set(e.property_id, (count.get(e.property_id) || 0) + 1)
    }
    return { sum, count }
  }, [expenses])

  const onSubmit = async (data) => {
    if (modal?.editing) await updateProperty(modal.editing.id, data)
    else await addProperty(data)
    setModal(null)
  }

  const onDelete = (p) => {
    const n = totals.count.get(p.id) || 0
    const msg = n
      ? `Delete "${p.name}" and its ${n} expense(s)? This cannot be undone.`
      : `Delete "${p.name}"?`
    if (window.confirm(msg)) deleteProperty(p.id)
  }

  if (loading) return <Spinner />

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Properties"
        subtitle="Each expense is logged against one of these."
        actions={
          <Button onClick={() => setModal({})}>
            <Plus size={16} /> Add property
          </Button>
        }
      />

      {properties.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No properties yet"
          subtitle="Add your first property to start tracking its expenses."
          action={
            <Button onClick={() => setModal({})}>
              <Plus size={16} /> Add property
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 stagger sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((p) => (
            <Card key={p.id} className="card-hover flex flex-col p-5">
              <div className="flex items-start justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-light text-brand">
                    <Building2 size={18} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-slate-900">{p.name}</h3>
                    {p.type && <span className="text-xs text-slate-400">{p.type}</span>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setModal({ editing: p })}
                    className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-brand"
                    title="Edit"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => onDelete(p)}
                    className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                    title="Delete"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {p.address && (
                <p className="mt-3 flex items-start gap-1.5 text-sm text-slate-500">
                  <MapPin size={14} className="mt-0.5 shrink-0 text-slate-400" />
                  <span className="line-clamp-2">{p.address}</span>
                </p>
              )}

              <div className="mt-auto flex items-end justify-between border-t border-slate-100 pt-4">
                <div>
                  <div className="text-xs text-slate-400">Total spent</div>
                  <div className="text-lg font-bold text-slate-900">{formatCurrency(totals.sum.get(p.id) || 0)}</div>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <Receipt size={13} />
                  {totals.count.get(p.id) || 0} expenses
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.editing ? 'Edit property' : 'Add property'}
      >
        {modal && (
          <PropertyForm initial={modal.editing} onSubmit={onSubmit} onCancel={() => setModal(null)} />
        )}
      </Modal>
    </div>
  )
}
