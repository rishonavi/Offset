// Client helpers for Stripe checkout + billing portal. They call the serverless
// functions in /api/stripe/*. We pass the Supabase user id + email so the
// webhook can map the subscription back to the right account.

async function postJson(path, body) {
  const r = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body || {}),
  })
  const data = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(data?.error || `Request failed (${r.status})`)
  return data
}

export async function startCheckout(user) {
  const { url } = await postJson('/api/stripe/checkout', { userId: user?.id, email: user?.email })
  if (url) window.location.href = url
  else throw new Error('Could not start checkout.')
}

export async function openBillingPortal(user) {
  const { url } = await postJson('/api/stripe/portal', { userId: user?.id, email: user?.email })
  if (url) window.location.href = url
  else throw new Error('Could not open the billing portal.')
}
