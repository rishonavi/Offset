import { useState } from 'react'
import { PROPERTY_TYPES } from '../lib/constants'
import { Field, Input, Select, Textarea, Button } from './ui'

export default function PropertyForm({ initial, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    type: initial?.type || PROPERTY_TYPES[0],
    address: initial?.address || '',
    notes: initial?.notes || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) {
      setError('Property name is required.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await onSubmit({ ...form, name: form.name.trim() })
    } catch (err) {
      setError(err?.message || String(err))
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Property name" required>
        <Input value={form.name} onChange={set('name')} placeholder="e.g. Sea View Apartment, Bandra" autoFocus />
      </Field>

      <Field label="Type">
        <Select value={form.type} onChange={set('type')}>
          {PROPERTY_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Address">
        <Input value={form.address} onChange={set('address')} placeholder="Street, area, city" />
      </Field>

      <Field label="Notes">
        <Textarea rows={3} value={form.notes} onChange={set('notes')} placeholder="Anything worth remembering" />
      </Field>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={saving}>
          {initial ? 'Save changes' : 'Add property'}
        </Button>
      </div>
    </form>
  )
}
