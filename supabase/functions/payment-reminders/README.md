# Payment reminder emails (optional)

A daily email digest of each user's **overdue** and **soon-due** payments
(unpaid expenses + pending income that have a due date). It runs as a Supabase
Edge Function on a schedule. Emails are sent via [Resend](https://resend.com)
(free tier available).

This is optional — the app works fully without it. Set it up only if you want
email nudges.

## 1. Get a Resend API key

1. Sign up at <https://resend.com> (free).
2. (Recommended) verify your domain, or use the sandbox sender for testing.
3. Copy your **API key**.

## 2. Deploy the function

You need the [Supabase CLI](https://supabase.com/docs/guides/cli):

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF

# secrets used by the function
supabase secrets set RESEND_API_KEY=re_xxxxxxxx
supabase secrets set REMINDER_FROM="Offset <reminders@yourdomain.com>"   # optional
supabase secrets set REMINDER_WINDOW_DAYS=3                              # optional

supabase functions deploy payment-reminders
```

(`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are provided to the function
automatically — don't set them yourself.)

## 3. Run it daily

In the Supabase dashboard → **SQL Editor**, enable the scheduler extensions and
add a cron job (replace the URL ref and the service-role key):

```sql
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'offset-daily-reminders',
  '0 8 * * *',                 -- every day at 08:00 UTC
  $$
  select net.http_post(
    url     := 'https://YOUR_PROJECT_REF.functions.supabase.co/payment-reminders',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
    )
  );
  $$
);
```

To test immediately, just open the function URL with a POST (or run the
`net.http_post` line on its own). Check **Edge Function logs** for the
`{ ok, users, sent }` result.

To remove the schedule later: `select cron.unschedule('offset-daily-reminders');`
