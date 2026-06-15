import { Building2, Car, Ship, Plane, Factory, Landmark, Box } from 'lucide-react'

// Pick a sensible icon for an asset based on its type label.
export function iconForAssetType(type = '') {
  const t = (type || '').toLowerCase()
  if (t.includes('car') || t.includes('vehicle')) return Car
  if (t.includes('yacht') || t.includes('boat') || t.includes('ship')) return Ship
  if (t.includes('air') || t.includes('plane') || t.includes('jet') || t.includes('craft')) return Plane
  if (t.includes('machin') || t.includes('equip')) return Factory
  if (t.includes('land') || t.includes('plot')) return Landmark
  if (
    t.includes('real estate') ||
    t.includes('apartment') ||
    t.includes('villa') ||
    t.includes('house') ||
    t.includes('commercial') ||
    t.includes('property') ||
    t.includes('office') ||
    t.includes('shop')
  )
    return Building2
  return Box
}
