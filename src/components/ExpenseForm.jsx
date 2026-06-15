import { useEffect, useState } from 'react'
import { Paperclip, X } from 'lucide-react'
import { CATEGORIES, PAYMENT_METHODS } from '../lib/constants'
import { currencySymbol, todayISO } from '../lib/format'
import { db } from '../lib/storage'
import { Field, Input, Select, Textarea, Button } from './ui'

export default function ExpenseForm({ initial, properties, defaultPropertyId, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    property_id: initial?.property_id || defaultPropertyId || (properties[0]?.id ?? ''),
    date: initial?.date || todayISO(),
    amount: initial?.amount ?? '',
    category: initial?.category || '',
    vendor: initial?.vendor || '',
    payment_method: initial?.payment_method || '',
    description: initial?.description || '',
  })
  const [file, setFile] = useState(null)
  const [existingReceipt, setExistingReceipt] = useState(initial?.receipt_url || null)
  const [receiptPreview, setReceiptPreview] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  // Resolve a viewable URL for an already-saved receipt (signed URL in cloud mode).
  useEffect(() => {
    let active = true
    if (existingReceipt && !file) {
      db.getReceiptUrl(existingReceipt).then((url) => active && setReceiptPreview(url))
    }
    return () => {
      active = false
    }
  }, [existingReceipt, file])

  const onPickFile = (e) => {
    const f = e.target.files?.[0] || null
    setFile(f)
    if (f) setReceiptPreview(URL.createObjectURL(f))
  }

  const clearReceipt = () => {
    setFile(null)
    setExistingReceipt(null)
    setReceiptPreview(null)
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!form.property_id) return setError('Please choose a property.')
    if (!form.date) return setError('Please choose a date.')
    if (!form.category) return setError('Please choose a category.')
    const amount = Number(form.amount)
    if (!amount || amount <= 0) return setError('Enter an amount greater than zero.')

    setSaving(true)
    setError(null)
    try {
      let receipt_url = existingReceipt
      if (file) receipt_url = await db.uploadReceipt(file)

      await onSubmit({
        property_id: form.property_id,
        date: form.date,
        amount,
        category: form.category,
        vendor: form.vendor.trim(),
        payment_method: form.payment_method,
        description: form.description.trim(),
        receipt_url: receipt_url || null,
      })
    } catch (err) {
      setError(err?.message || String(err))
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Property" required>
          <Select value={form.property_id} onChange={set('property_id')}>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Date" required>
          <Input type="date" value={form.date} onChange={set('date')} max={todayISO()} />
        </Field>

        <Field label="Amount" required>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
              {currencySymbol}
            </span>
            <Input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              className="pl-8"
              value={form.amount}
              onChange={set('amount')}
              placeholder="0"
            />
          </div>
        </Field>

        <Field label="Category" required>
          <Select value={form.category} onChange={set('category')}>
            <option value="" disabled>
              Select category…
            </option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Vendor / Payee">
          <Input value={form.vendor} onChange={set('vendor')} placeholder="e.g. Asian Paints" />
        </Field>

        <Field label="Payment method">
          <Select value={form.payment_method} onChange={set('payment_method')}>
            <option value="">—</option>
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="Description / Notes">
        <Textarea rows={2} value={form.description} onChange={set('description')} placeholder="Optional details" />
      </Field>

      <Field label="Receipt / bill photo" hint="JPG, PNG or PDF">
        {receiptPreview || existingReceipt ? (
          <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <Paperclip size={16} className="text-slate-400" />
            <a
              href={receiptPreview || '#'}
              target="_blank"
              rel="noreferrer"
              className="flex-1 truncate text-sm font-medium text-brand hover:underline"
            >
              {file ? file.name : 'View attached receipt'}
            </a>
            <button
              type="button"
              onClick={clearReceipt}
              className="grid h-7 w-7 place-items-center rounded-md text-slate-400 hover:bg-slate-200 hover:text-slate-700"
              title="Remove receipt"
            >
              <X size={15} />
            </button>
          </div>
        ) : (
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={onPickFile}
            className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-light file:px-3 file:py-2 file:text-sm file:font-semibold file:text-brand hover:file:bg-indigo-100"
          />
        )}
      </Field>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={saving}>
          {initial ? 'Save changes' : 'Add expense'}
        </Button>
      </div>
    </form>
  )
}
