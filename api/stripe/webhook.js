// Stripe webhook: keeps each account's plan in sync with their subscription.
// On checkout completion → mark the user Pro and store their Stripe customer id;
// on subscription update/cancel → flip the plan based on status. Writes use the
// service-role key (bypasses RLS).
//
// Env: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, SUPABASE_URL,
//      SUPABASE_SERVICE_ROLE_KEY.

import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

// Stripe needs the raw, unparsed body to verify the signature.
export const config = { api: { bodyParser: false } }

async function rawBody(req) {
  const chunks = []
  for await (const c of req) chunks.push(typeof c === 'string' ? Buffer.from(c) : c)
  return Buffer.concat(chunks)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' })
    return
  }
  const key = process.env.STRIPE_SECRET_KEY
  const whSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!key || !whSecret) {
    res.status(501).json({ error: 'Billing is not configured.' })
    return
  }

  const stripe = new Stripe(key)
  const admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

  let event
  try {
    event = stripe.webhooks.constructEvent(await rawBody(req), req.headers['stripe-signature'], whSecret)
  } catch (err) {
    res.status(400).json({ error: `signature_failed: ${err?.message}` })
    return
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const s = event.data.object
      if (s.client_reference_id) {
        await admin
          .from('profiles')
          .upsert(
            { user_id: s.client_reference_id, plan: 'pro', stripe_customer_id: s.customer, status: 'active', updated_at: new Date().toISOString() },
            { onConflict: 'user_id' },
          )
      }
    } else if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
      const sub = event.data.object
      const active = sub.status === 'active' || sub.status === 'trialing'
      await admin
        .from('profiles')
        .update({ plan: active ? 'pro' : 'free', status: sub.status, updated_at: new Date().toISOString() })
        .eq('stripe_customer_id', sub.customer)
    }
    res.status(200).json({ received: true })
  } catch (err) {
    res.status(500).json({ error: err?.message || 'webhook_failed' })
  }
}
