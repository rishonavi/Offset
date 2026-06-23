// Creates a Stripe Checkout Session for the Pro subscription. The Supabase user
// id is passed as client_reference_id so the webhook can mark that account Pro.
//
// Env: STRIPE_SECRET_KEY, STRIPE_PRICE_ID (the recurring price for Pro).

import Stripe from 'stripe'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' })
    return
  }
  const key = process.env.STRIPE_SECRET_KEY
  const price = process.env.STRIPE_PRICE_ID
  if (!key || !price) {
    res.status(501).json({ error: 'Billing is not configured.' })
    return
  }
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}
    const { userId, email } = body
    const origin = req.headers.origin || `https://${req.headers.host}`
    const stripe = new Stripe(key)
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price, quantity: 1 }],
      client_reference_id: userId || undefined,
      customer_email: email || undefined,
      allow_promotion_codes: true,
      success_url: `${origin}/settings?upgraded=1`,
      cancel_url: `${origin}/pricing`,
    })
    res.status(200).json({ url: session.url })
  } catch (err) {
    res.status(500).json({ error: err?.message || 'checkout_failed' })
  }
}
