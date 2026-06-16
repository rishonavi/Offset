import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Building2 } from 'lucide-react'
import { useData } from '../context/DataContext'
import { Card, EmptyState, Spinner } from '../components/ui'
import PageHeader from '../components/PageHeader'
import PropertyForm from '../components/PropertyForm'

export default function AssetFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { properties, loading, addProperty, updateProperty } = useData()

  if (loading) return <Spinner />

  const editing = id ? properties.find((p) => p.id === id) : null
  const goBack = () => navigate(-1)

  if (id && !editing) {
    return (
      <div className="animate-fade-in">
        <EmptyState
          icon={Building2}
          title="Asset not found"
          subtitle="It may have been deleted."
          action={
            <Link to="/properties" className="btn-primary">
              Back to assets
            </Link>
          }
        />
      </div>
    )
  }

  const onSubmit = async (data) => {
    if (editing) await updateProperty(editing.id, data)
    else await addProperty(data)
    goBack()
  }

  return (
    <div className="animate-fade-in space-y-6">
      <Link to="/properties" className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-800">
        <ArrowLeft size={15} /> Back to assets
      </Link>
      <PageHeader title={editing ? 'Edit asset' : 'Add asset'} />
      <Card className="max-w-2xl p-5 sm:p-7">
        <PropertyForm initial={editing} onSubmit={onSubmit} onCancel={goBack} />
      </Card>
    </div>
  )
}
