import { paymentMeta } from '../lib/payments'
import { Badge } from './ui'

// Renders a status chip only when an entry is NOT settled, so paid/received
// rows stay clean and only outstanding/overdue items stand out.
export default function PaymentChip({ entry, kind }) {
  const meta = paymentMeta(entry, kind)
  if (meta.settled) return null
  return <Badge color={meta.color}>{meta.label}</Badge>
}
