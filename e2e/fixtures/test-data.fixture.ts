import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

// Load env from .env.local
function loadEnv() {
  try {
    // Try multiple path resolution strategies
    const candidates = [
      path.resolve(process.cwd(), '.env.local'),
      path.resolve(process.cwd(), 'hope-os', '.env.local'),
    ]

    // Also try __dirname if available
    try {
      const dir = typeof __dirname !== 'undefined'
        ? __dirname
        : path.dirname(fileURLToPath(import.meta.url))
      candidates.unshift(path.resolve(dir, '../../.env.local'))
    } catch {
      // ignore
    }

    for (const envPath of candidates) {
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf-8')
        for (const line of content.split('\n')) {
          const match = line.match(/^([^#=]+)=(.*)$/)
          if (match) {
            const key = match[1].trim()
            const val = match[2].trim()
            if (!process.env[key]) {
              process.env[key] = val
            }
          }
        }
        break
      }
    }
  } catch {
    // ignore
  }
}

loadEnv()

const url = process.env.VITE_SUPABASE_URL || ''
const key = process.env.VITE_SUPABASE_ANON_KEY || ''

if (!url) {
  console.warn('WARNING: VITE_SUPABASE_URL not found. Seed/cleanup functions will fail.')
}

export const supabase = url ? createClient(url, key) : null as any

let _authenticated = false
let _userId: string | null = null
async function ensureAuth() {
  if (_authenticated || !supabase) return
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'erfan.test@gmail.com',
    password: 'Employee123!!',
  })
  if (error) console.warn(`Supabase auth warning: ${error.message}`)
  _userId = data?.user?.id ?? null
  _authenticated = true
}

export async function seedParticipant(overrides: Record<string, unknown> = {}) {
  await ensureAuth()
  const data = {
    first_name: 'E2E_Seed',
    last_name: 'Participant',
    ndis_number: `439${Date.now().toString().slice(-7)}`,
    status: 'active',
    funding_type: 'ndia_managed',
    ...overrides,
  }
  const { data: result, error } = await supabase
    .from('participants')
    .insert(data)
    .select()
    .single()
  if (error) throw new Error(`Failed to seed participant: ${error.message}`)
  return result
}

export async function seedWorker(overrides: Record<string, unknown> = {}) {
  await ensureAuth()
  const data = {
    first_name: 'E2E_Seed',
    last_name: 'Worker',
    email: `e2e.worker.${Date.now()}@test.com`,
    role_title: 'Support Worker',
    employment_type: 'employee',
    status: 'active',
    ...overrides,
  }
  const { data: result, error } = await supabase
    .from('workers')
    .insert(data)
    .select()
    .single()
  if (error) throw new Error(`Failed to seed worker: ${error.message}`)
  return result
}

export async function seedInvoice(
  participantId: string,
  overrides: Record<string, unknown> = {}
) {
  await ensureAuth()
  const data = {
    participant_id: participantId,
    invoice_number: `E2E-${Date.now()}`,
    invoice_date: new Date().toISOString().split('T')[0],
    period_start: new Date().toISOString().split('T')[0],
    period_end: new Date().toISOString().split('T')[0],
    funding_type: 'ndia_managed',
    status: 'draft',
    subtotal: 130.94,
    gst: 0,
    total: 130.94,
    ...overrides,
  }
  const { data: result, error } = await supabase
    .from('invoices')
    .insert(data)
    .select()
    .single()
  if (error) throw new Error(`Failed to seed invoice: ${error.message}`)
  return result
}

export async function seedIncident(
  participantId: string,
  overrides: Record<string, unknown> = {}
) {
  await ensureAuth()
  const data = {
    participant_id: participantId,
    incident_date: new Date().toISOString().split('T')[0],
    incident_type: 'injury',
    severity: 'minor',
    description: 'Seeded E2E test incident for automation.',
    status: 'open',
    is_reportable: false,
    ...overrides,
  }
  const { data: result, error } = await supabase
    .from('incidents')
    .insert(data)
    .select()
    .single()
  if (error) throw new Error(`Failed to seed incident: ${error.message}`)
  return result
}

export async function seedComplaint(
  participantId: string,
  overrides: Record<string, unknown> = {}
) {
  await ensureAuth()
  const data = {
    participant_id: participantId,
    complainant_name: 'E2E Seed Complainant',
    complaint_date: new Date().toISOString().split('T')[0],
    category: 'service_delivery',
    description: 'Seeded E2E test complaint for automation.',
    status: 'received',
    ...overrides,
  }
  const { data: result, error } = await supabase
    .from('complaints')
    .insert(data)
    .select()
    .single()
  if (error) throw new Error(`Failed to seed complaint: ${error.message}`)
  return result
}

export async function seedConcern(
  participantId: string,
  overrides: Record<string, unknown> = {}
) {
  await ensureAuth()
  const data = {
    participant_id: participantId,
    concern_type: 'safety',
    severity: 'low',
    title: 'E2E Seed Concern',
    description: 'Seeded E2E test concern for automation.',
    status: 'open',
    raised_by: _userId,
    ...overrides,
  }
  const { data: result, error } = await supabase
    .from('concerns')
    .insert(data)
    .select()
    .single()
  if (error) throw new Error(`Failed to seed concern: ${error.message}`)
  return result
}

export async function seedGoal(
  participantId: string,
  overrides: Record<string, unknown> = {}
) {
  await ensureAuth()
  const data = {
    participant_id: participantId,
    title: 'E2E Seed Goal',
    domain: 'daily_living',
    timeframe: 'short_term',
    priority: 'medium',
    status: 'not_started',
    ...overrides,
  }
  const { data: result, error } = await supabase
    .from('goals')
    .insert(data)
    .select()
    .single()
  if (error) throw new Error(`Failed to seed goal: ${error.message}`)
  return result
}

export async function seedConsent(
  participantId: string,
  overrides: Record<string, unknown> = {}
) {
  await ensureAuth()
  const data = {
    participant_id: participantId,
    consent_type: 'service_agreement',
    consent_method: 'written',
    title: 'E2E Seed Consent',
    scope: 'E2E test consent scope for automation.',
    given_date: new Date().toISOString().split('T')[0],
    given_by_name: 'E2E Test',
    consent_status: 'active',
    ...overrides,
  }
  const { data: result, error } = await supabase
    .from('consent_records')
    .insert(data)
    .select()
    .single()
  if (error) throw new Error(`Failed to seed consent: ${error.message}`)
  return result
}

export async function seedRisk(
  participantId: string,
  overrides: Record<string, unknown> = {}
) {
  await ensureAuth()
  const data = {
    participant_id: participantId,
    title: 'E2E Seed Risk',
    description: 'Seeded E2E test risk for automation.',
    category: 'environmental',
    likelihood: 'possible',
    consequence: 'moderate',
    risk_level: 'medium',
    status: 'active',
    identified_date: new Date().toISOString().split('T')[0],
    ...overrides,
  }
  const { data: result, error } = await supabase
    .from('risks')
    .insert(data)
    .select()
    .single()
  if (error) throw new Error(`Failed to seed risk: ${error.message}`)
  return result
}

export async function cleanup(table: string, ids: string[]) {
  if (ids.length === 0) return
  await ensureAuth()
  const { error } = await supabase.from(table).delete().in('id', ids)
  if (error) console.warn(`Cleanup warning for ${table}: ${error.message}`)
}
