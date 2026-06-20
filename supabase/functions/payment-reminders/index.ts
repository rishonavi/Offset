// Offset — daily payment reminder email.
//
// Finds each user's overdue and soon-due items (unpaid expenses + pending
// income with a due date) and emails them a digest. Runs on a schedule (see
// README.md in this folder). Uses the service-role key so it can read every
// user's rows; emails go out via Resend (https://resend.com).
//
// Required env (set with: supabase secrets set ...):
//   RESEND_API_KEY        your Resend API key
//   REMINDER_FROM         e.g. "Offset <reminders@yourdomain.com>" (defaults to Resend's sandbox)
//   REMINDER_WINDOW_DAYS  how many days ahead counts as "upcoming" (default 3)
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected automatically.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const FROM = Deno.env.get('REMINDER_FROM') || 'Offset <onboarding@resend.dev>'
const WINDOW_DAYS = Number(Deno.env.get('REMINDER_WINDOW_DAYS') || '3')

const admin = createClient(SUPABASE_URL, SERVICE_ROLE)

const isoDay = (d: Date) => d.toISOString().slice(0, 10)
const money = (n: number) => '₹' + (Number(n) || 0).toLocaleString('en-IN')

async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY not set')
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to, subject, html }),
  })
  if (!r.ok) throw new Error(`Resend ${r.status}: ${await r.text()}`)
}

function rowsHtml(items: any[], nameById: Map<string, string>) {
  return items
    .map(
      (i) =>
        `<tr><td style="padding:4px 10px">${i.due_date}</td>` +
        `<td style="padding:4px 10px">${nameById.get(i.property_id) || '—'}</td>` +
        `<td style="padding:4px 10px">${i.label || i.kind}</td>` +
        `<td style="padding:4px 10px;text-align:right">${money(i.amount)}</td></tr>`,
    )
    .join('')
}

Deno.serve(async () => {
  const today = isoDay(new Date())
  const horizon = isoDay(new Date(Date.now() + WINDOW_DAYS * 86400000))

  const [{ data: exp }, { data: inc }, { data: props }] = await Promise.all([
    admin
      .from('expenses')
      .select('user_id, amount, due_date, category, status, property_id')
      .eq('status', 'unpaid')
      .not('due_date', 'is', null)
      .lte('due_date', horizon),
    admin
      .from('income')
      .select('user_id, amount, due_date, source, status, property_id')
      .eq('status', 'pending')
      .not('due_date', 'is', null)
      .lte('due_date', horizon),
    admin.from('properties').select('id, name'),
  ])

  const nameById = new Map((props || []).map((p: any) => [p.id, p.name]))
  const byUser = new Map<string, any[]>()
  const push = (uid: string, item: any) => {
    if (!byUser.has(uid)) byUser.set(uid, [])
    byUser.get(uid)!.push(item)
  }
  for (const e of exp || []) push(e.user_id, { ...e, kind: 'expense', label: e.category })
  for (const e of inc || []) push(e.user_id, { ...e, kind: 'income', label: e.source })

  let sent = 0
  for (const [userId, items] of byUser) {
    const { data: u } = await admin.auth.admin.getUserById(userId)
    const email = u?.user?.email
    if (!email) continue

    items.sort((a, b) => (a.due_date < b.due_date ? -1 : 1))
    const overdue = items.filter((i) => i.due_date < today)
    const soon = items.filter((i) => i.due_date >= today)
    const section = (title: string, rows: any[], color: string) =>
      rows.length
        ? `<h3 style="color:${color};margin:18px 0 6px">${title} (${rows.length})</h3>
           <table style="width:100%;border-collapse:collapse;font-size:14px">
             <tr style="text-align:left;color:#64748b"><th style="padding:4px 10px">Due</th><th style="padding:4px 10px">Asset</th><th style="padding:4px 10px">Item</th><th style="padding:4px 10px;text-align:right">Amount</th></tr>
             ${rowsHtml(rows, nameById)}
           </table>`
        : ''

    const html = `<div style="font-family:system-ui,Arial,sans-serif;max-width:560px;margin:auto">
      <h2 style="color:#0A1828">Offset — payment reminders</h2>
      <p style="color:#475569">You have ${overdue.length} overdue and ${soon.length} upcoming payment(s).</p>
      ${section('Overdue', overdue, '#C0492F')}
      ${section('Due soon', soon, '#C5A059')}
      <p style="color:#94a3b8;font-size:12px;margin-top:20px">Sent by your Offset account.</p>
    </div>`

    try {
      await sendEmail(email, `Offset — ${overdue.length} overdue, ${soon.length} upcoming`, html)
      sent++
    } catch (err) {
      console.error('email failed for', userId, String(err))
    }
  }

  return new Response(JSON.stringify({ ok: true, users: byUser.size, sent }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
