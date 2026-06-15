import { useMemo, useRef, useState } from 'react'
import { FileSpreadsheet, FileText, FileType, Upload, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { useData } from '../context/DataContext'
import { applyFilters, emptyFilters, sumAmount } from '../lib/filters'
import { formatCurrency, formatDate } from '../lib/format'
import { colorForCategory } from '../lib/constants'
import {
  toExportRows,
  exportExcel,
  exportCSV,
  exportPDF,
  parseSpreadsheet,
  rowToExpenseInput,
} from '../lib/exports'
import { Card, Button, Spinner, EmptyState, Badge } from '../components/ui'
import FilterBar from '../components/FilterBar'

const PREVIEW_LIMIT = 100

export default function Reports() {
  const { expenses, properties, loading, propertyNameById, addProperty, addExpense } = useData()
  const [filters, setFilters] = useState(emptyFilters)
  const [importing, setImporting] = useState(false)
  const [importMsg, setImportMsg] = useState(null)
  const fileRef = useRef(null)

  const filtered = useMemo(() => applyFilters(expenses, filters), [expenses, filters])
  const total = useMemo(() => sumAmount(filtered), [filtered])

  const baseName = `property-expenses-${new Date().toISOString().slice(0, 10)}`
  const subtitle = `${filtered.length} expense${filtered.length === 1 ? '' : 's'} · Total ${formatCurrency(total)}`

  const doExport = (kind) => {
    const rows = toExportRows(filtered, propertyNameById)
    if (kind === 'xlsx') exportExcel(rows, baseName)
    if (kind === 'csv') exportCSV(rows, baseName)
    if (kind === 'pdf') exportPDF(rows, { title: 'Property Expense Report', subtitle })
  }

  const handleImport = async (file) => {
    if (!file) return
    setImporting(true)
    setImportMsg(null)
    try {
      const raw = await parseSpreadsheet(file)
      const parsed = raw.map(rowToExpenseInput).filter((r) => r.amount > 0 && r.date)
      if (parsed.length === 0) {
        setImportMsg({ ok: false, text: 'No valid rows found. Expected columns: Date, Property, Category, Amount.' })
        return
      }
      const nameToId = new Map(properties.map((p) => [p.name.trim().toLowerCase(), p.id]))
      let createdProps = 0
      for (const r of parsed) {
        const propName = r.property || 'Unassigned'
        const key = propName.toLowerCase()
        let pid = nameToId.get(key)
        if (!pid) {
          const created = await addProperty({ name: propName, type: 'Other', address: '', notes: '' })
          pid = created.id
          nameToId.set(key, pid)
          createdProps += 1
        }
        await addExpense({
          property_id: pid,
          date: r.date,
          amount: r.amount,
          category: r.category || 'Other',
          vendor: r.vendor,
          payment_method: r.payment_method,
          description: r.description,
          receipt_url: null,
        })
      }
      setImportMsg({
        ok: true,
        text: `Imported ${parsed.length} expense${parsed.length === 1 ? '' : 's'}${
          createdProps ? `, created ${createdProps} new propert${createdProps === 1 ? 'y' : 'ies'}` : ''
        }.`,
      })
    } catch (err) {
      setImportMsg({ ok: false, text: `Import failed: ${err?.message || err}` })
    } finally {
      setImporting(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  if (loading) return <Spinner />

  const preview = filtered.slice(0, PREVIEW_LIMIT)

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Reports &amp; Export</h1>
        <p className="text-sm text-slate-500">Filter your expenses, then export or import as Excel, CSV or PDF.</p>
      </div>

      <FilterBar properties={properties} value={filters} onChange={setFilters} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Export */}
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-slate-700">Export</h3>
          <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="ghost" onClick={() => doExport('xlsx')} disabled={filtered.length === 0}>
              <FileSpreadsheet size={16} className="text-emerald-600" /> Excel (.xlsx)
            </Button>
            <Button variant="ghost" onClick={() => doExport('csv')} disabled={filtered.length === 0}>
              <FileType size={16} className="text-sky-600" /> CSV
            </Button>
            <Button variant="ghost" onClick={() => doExport('pdf')} disabled={filtered.length === 0}>
              <FileText size={16} className="text-red-600" /> PDF
            </Button>
          </div>
        </Card>

        {/* Import */}
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-slate-700">Import from spreadsheet</h3>
          <p className="mt-1 text-xs text-slate-500">
            Upload an <strong>.xlsx</strong> or <strong>.csv</strong> with columns:
            <span className="font-medium text-slate-600"> Date, Property, Category, Vendor, Payment Method, Description, Amount</span>.
            New property names are created automatically.
          </p>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => handleImport(e.target.files?.[0])}
          />
          <div className="mt-4">
            <Button variant="ghost" onClick={() => fileRef.current?.click()} loading={importing}>
              {!importing && <Upload size={16} />} Choose file…
            </Button>
          </div>
          {importMsg && (
            <div
              className={`mt-3 flex items-start gap-2 rounded-lg px-3 py-2 text-sm ${
                importMsg.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
              }`}
            >
              {importMsg.ok ? <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> : <AlertCircle size={16} className="mt-0.5 shrink-0" />}
              {importMsg.text}
            </div>
          )}
        </Card>
      </div>

      {/* Preview */}
      {filtered.length === 0 ? (
        <EmptyState icon={FileText} title="Nothing to show" subtitle="No expenses match the current filters." />
      ) : (
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
            <h3 className="text-sm font-semibold text-slate-700">Preview</h3>
            <span className="text-xs text-slate-400">
              {preview.length < filtered.length ? `Showing ${preview.length} of ${filtered.length}` : `${filtered.length} rows`}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-2.5 font-semibold">Date</th>
                  <th className="px-5 py-2.5 font-semibold">Property</th>
                  <th className="px-5 py-2.5 font-semibold">Category</th>
                  <th className="px-5 py-2.5 font-semibold">Vendor</th>
                  <th className="px-5 py-2.5 text-right font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {preview.map((e) => (
                  <tr key={e.id}>
                    <td className="whitespace-nowrap px-5 py-2.5 text-slate-600">{formatDate(e.date)}</td>
                    <td className="px-5 py-2.5 font-medium text-slate-800">{propertyNameById(e.property_id) || '—'}</td>
                    <td className="px-5 py-2.5">
                      <Badge color={colorForCategory(e.category)}>{e.category}</Badge>
                    </td>
                    <td className="px-5 py-2.5 text-slate-600">{e.vendor || '—'}</td>
                    <td className="whitespace-nowrap px-5 py-2.5 text-right font-semibold text-slate-900">{formatCurrency(e.amount)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-slate-200 bg-slate-50 font-semibold text-slate-900">
                  <td className="px-5 py-2.5" colSpan={4}>Total</td>
                  <td className="px-5 py-2.5 text-right">{formatCurrency(total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
