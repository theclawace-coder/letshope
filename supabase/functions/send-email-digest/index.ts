// Supabase Edge Function: send-email-digest
// Generates and sends email digest summaries to users who have opted in.
//
// Deploy: supabase functions deploy send-email-digest
// Schedule via Supabase cron or external scheduler (e.g. every hour).
// The function checks each user's preferred_time and frequency to decide
// whether to send now.
//
// Requires:
//   - RESEND_API_KEY secret (or swap for your email provider)
//   - FROM_EMAIL env var (e.g. "noreply@hopedisability.com.au")

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const resendKey = Deno.env.get('RESEND_API_KEY')
    const fromEmail = Deno.env.get('FROM_EMAIL') || 'Hope OS <noreply@hopedisability.com.au>'
    if (!resendKey) {
      return new Response(
        JSON.stringify({ error: 'RESEND_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const now = new Date()
    const currentHour = now.getUTCHours()
    const currentDay = now.getUTCDay()

    // Get all users who should receive a digest now
    const { data: prefs, error: prefsError } = await supabase
      .from('email_digest_preferences')
      .select('*, profiles:user_id(email, full_name)')
      .eq('digest_enabled', true)

    if (prefsError) throw prefsError
    if (!prefs?.length) {
      return new Response(
        JSON.stringify({ message: 'No users opted in', sent: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get digest summary data
    const { data: summary } = await supabase
      .from('daily_digest_summary')
      .select('*')
      .single()

    const digestData = summary ?? {}

    let sentCount = 0
    const errors: string[] = []

    for (const pref of prefs) {
      // Check if it's the right time to send
      const prefHour = parseInt((pref.preferred_time as string).split(':')[0])
      if (currentHour !== prefHour) continue // only send within the matching hour
      if (pref.frequency === 'weekly' && currentDay !== pref.preferred_day) continue

      // Skip if already sent recently
      if (pref.last_sent_at) {
        const lastSent = new Date(pref.last_sent_at as string)
        const hoursSince = (now.getTime() - lastSent.getTime()) / 3600000
        if (pref.frequency === 'daily' && hoursSince < 20) continue
        if (pref.frequency === 'weekly' && hoursSince < 144) continue
      }

      const profiles = pref.profiles as { email: string; full_name: string } | null
      if (!profiles?.email) continue

      // Build email body
      const sections: string[] = []
      const d = digestData as Record<string, number>

      if (pref.include_incidents && (d.open_incidents > 0 || d.unreported_incidents > 0)) {
        sections.push(`<h3>Incidents</h3><p>${d.open_incidents} open incident(s), ${d.unreported_incidents} pending NDIS report(s)</p>`)
      }
      if (pref.include_complaints && (d.open_complaints > 0 || d.overdue_acknowledgments > 0)) {
        sections.push(`<h3>Complaints</h3><p>${d.open_complaints} open complaint(s), ${d.overdue_acknowledgments} overdue acknowledgment(s), ${d.overdue_resolutions ?? 0} overdue resolution(s)</p>`)
      }
      if (pref.include_compliance && (d.expiring_wwcc > 0 || d.expiring_police_checks > 0)) {
        sections.push(`<h3>Compliance Alerts</h3><p>${d.expiring_wwcc} WWCC expiring within 30 days, ${d.expiring_police_checks} police check(s) expiring</p>`)
      }
      if (pref.include_invoices && (d.draft_invoices > 0 || d.rejected_invoices > 0)) {
        sections.push(`<h3>Invoices</h3><p>${d.draft_invoices} draft(s) pending approval, ${d.rejected_invoices} rejected</p>`)
      }
      if (pref.include_overdue && d.critical_concerns > 0) {
        sections.push(`<h3>Critical Concerns</h3><p>${d.critical_concerns} high/critical concern(s) remain open</p>`)
      }

      if (sections.length === 0) continue // nothing to report

      const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #e11d48;">Hope OS ${pref.frequency === 'weekly' ? 'Weekly' : 'Daily'} Digest</h2>
          <p>Hi ${profiles.full_name?.split(' ')[0] ?? 'there'},</p>
          <p>Here's your ${pref.frequency} summary:</p>
          ${sections.join('')}
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;" />
          <p style="font-size: 12px; color: #9ca3af;">
            You're receiving this because you opted in to email digests.
            <a href="${supabaseUrl.replace('.supabase.co', '')}/settings">Manage preferences</a>
          </p>
        </div>
      `

      // Send via Resend
      try {
        const emailRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: fromEmail,
            to: [profiles.email],
            subject: `Hope OS ${pref.frequency === 'weekly' ? 'Weekly' : 'Daily'} Digest`,
            html,
          }),
        })

        if (emailRes.ok) {
          sentCount++
          await supabase
            .from('email_digest_preferences')
            .update({ last_sent_at: now.toISOString() } as never)
            .eq('id', pref.id)
        } else {
          const errText = await emailRes.text()
          errors.push(`${profiles.email}: ${errText}`)
        }
      } catch (sendErr) {
        errors.push(`${profiles.email}: ${(sendErr as Error).message}`)
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Digest processing complete',
        sent: sentCount,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: `Internal error: ${(err as Error).message}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
