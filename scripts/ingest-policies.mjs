#!/usr/bin/env node
/**
 * ingest-policies.mjs
 *
 * Reads all DOCX policy & procedure files from the NDIS_Folders directory,
 * extracts text, chunks it, and inserts into the Supabase policy_documents table.
 *
 * After running this, deploy and invoke the embed-policy-docs edge function
 * to generate vector embeddings for semantic search.
 *
 * Usage:
 *   node scripts/ingest-policies.mjs
 *
 * Environment:
 *   SUPABASE_URL        - your Supabase project URL
 *   SUPABASE_SERVICE_KEY - service role key (NOT anon key)
 *
 * You can set these in a .env file in the project root.
 */

import { readFileSync, existsSync } from 'fs'
import { resolve, basename } from 'path'
import { createClient } from '@supabase/supabase-js'

// ─── Config ──────────────────────────────────────────────────

// Attempt to load .env manually (no dotenv dependency needed)
try {
  // Try .env.local first (your actual config), then .env as fallback
  const envLocal = resolve(import.meta.dirname, '..', '.env.local')
  const envDefault = resolve(import.meta.dirname, '..', '.env')
  const envPath = existsSync(envLocal) ? envLocal : envDefault
  if (existsSync(envPath)) {
    const envText = readFileSync(envPath, 'utf-8')
    for (const line of envText.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eqIdx = trimmed.indexOf('=')
      if (eqIdx === -1) continue
      const key = trimmed.slice(0, eqIdx).trim()
      let val = trimmed.slice(eqIdx + 1).trim()
      // Strip surrounding quotes
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1)
      }
      if (!process.env[key]) process.env[key] = val
    }
  }
} catch {
  // ignore
}

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables.')
  console.error('Set them in .env or export them before running.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// Target ~400 words per chunk, with 50-word overlap for context continuity
const CHUNK_SIZE = 400
const CHUNK_OVERLAP = 50

// ─── Document manifest ───────────────────────────────────────
// Each entry maps a DOCX file to its metadata for the policy_documents table.

const NDIS_ROOT = resolve(import.meta.dirname, '..', '..') // "For CRM" folder

const DOCUMENTS = [
  // ── Core policies ──
  {
    path: '3. Policies and Procedures/Core Module/Core Module - Policy and Procedure Manual - Hope Disability Support.docx',
    source: 'Core Module - Policy & Procedure Manual',
    category: 'internal_policy',
  },
  {
    path: '3. Policies and Procedures/Module 1 - High Intensity/Module 1 High Intensity -  Policy and Procedure Manual - Hope Disability.docx',
    source: 'Module 1 - High Intensity Policy & Procedure Manual',
    category: 'high_intensity',
  },
  {
    path: '3. Policies and Procedures/Module 2 and 2A - Behaviour Support/Module 2 and 2A - Policy and Procedure Manual - Hope Disability V3.docx',
    source: 'Module 2 & 2A - Behaviour Support Policy & Procedure Manual',
    category: 'behaviour_support',
  },
  {
    path: '3. Policies and Procedures/Plan Management/Plan Management - Policy and Procedure Manual - Hope Disability Support V1.docx',
    source: 'Plan Management - Policy & Procedure Manual',
    category: 'plan_management',
  },

  // ── Governance ──
  {
    path: '2. Governance and Operational Review/Internal Audit Report - Hope Disability Support.docx',
    source: 'Internal Audit Report',
    category: 'governance',
  },
  {
    path: '2. Governance and Operational Review/Management Review Meeting Minutes - Hope Disability Support.docx',
    source: 'Management Review Meeting Minutes',
    category: 'governance',
  },
  {
    path: '2. Governance and Operational Review/Organisational Chart and Business Plan - Hope Disability Support.docx',
    source: 'Organisational Chart & Business Plan',
    category: 'governance',
  },

  // ── Risk Management ──
  {
    path: '5. Risk Management/Emergency Management Plan.docx',
    source: 'Emergency Management Plan',
    category: 'emergency_management',
  },
  {
    path: '5. Risk Management/Risk Management - Risk Assessment Template.docx',
    source: 'Risk Assessment Template',
    category: 'risk_management',
  },
  {
    path: '5. Risk Management/Governance - Business Continuity Plan.docx',
    source: 'Business Continuity Plan',
    category: 'risk_management',
  },

  // ── Incident Management ──
  {
    path: '6. Incident Management/Incident Management - Incident Report.docx',
    source: 'Incident Report Template',
    category: 'incident_management',
  },
  {
    path: '6. Incident Management/Incident Management - Incident Investigation Form.docx',
    source: 'Incident Investigation Form',
    category: 'incident_management',
  },
  {
    path: '6. Incident Management/Incident Management - NDIS - Reportable incident - 5 day notification.docx',
    source: 'NDIS Reportable Incident - 5 Day Notification',
    category: 'incident_management',
  },

  // ── Complaints Management ──
  {
    path: '7. Complaints Management/Complaints and Feedback - Complaint Form.docx',
    source: 'Complaint Form',
    category: 'complaints_management',
  },
  {
    path: '7. Complaints Management/Complaints and Feedback - Complaint Form (Easy English).docx',
    source: 'Complaint Form (Easy English)',
    category: 'complaints_management',
  },
  {
    path: '7. Complaints Management/Complaints and Feedback - Company Feedback Form.docx',
    source: 'Company Feedback Form',
    category: 'complaints_management',
  },
  {
    path: '7. Complaints Management/Complaints and Feedback - Complaints Process Checklist.docx',
    source: 'Complaints Process Checklist',
    category: 'complaints_management',
  },

  // ── Participant Documentation ──
  {
    path: '9. Participant Documentation/Participant - Consent Form.docx',
    source: 'Participant Consent Form',
    category: 'participant_documentation',
  },
  {
    path: '9. Participant Documentation/Participant - Intake Form.docx',
    source: 'Participant Intake Form',
    category: 'participant_documentation',
  },
  {
    path: '9. Participant Documentation/Participant - Referral Form.docx',
    source: 'Participant Referral Form',
    category: 'participant_documentation',
  },
  {
    path: '9. Participant Documentation/Participant - Service Agreement.docx',
    source: 'Participant Service Agreement',
    category: 'participant_documentation',
  },
  {
    path: '9. Participant Documentation/Participant - Support Plan.docx',
    source: 'Participant Support Plan',
    category: 'participant_documentation',
  },
  {
    path: '9. Participant Documentation/Participant - Exit & Transition Plan.docx',
    source: 'Participant Exit & Transition Plan',
    category: 'participant_documentation',
  },
  {
    path: '9. Participant Documentation/Participant - Individual Risk Assessment - Hope Disability Support.docx',
    source: 'Participant Individual Risk Assessment',
    category: 'participant_documentation',
  },
  {
    path: '9. Participant Documentation/Participant - Progress Notes - Hope Disability Support.docx',
    source: 'Participant Progress Notes Template',
    category: 'participant_documentation',
  },
  {
    path: '9. Participant Documentation/Participant - Easy Read Your Rights - Hope Disability Support.docx',
    source: 'Participant Rights (Easy Read)',
    category: 'participant_documentation',
  },
  {
    path: '9. Participant Documentation/Participant Handbook .docx',
    source: 'Participant Handbook',
    category: 'participant_documentation',
  },
  {
    path: '9. Participant Documentation/Plan Management - Welcome Pack - Hope Disability Support.docx',
    source: 'Plan Management Welcome Pack',
    category: 'plan_management',
  },
  {
    path: '9. Participant Documentation/Plan Management - Service Agreement - Hope Disability Support.docx',
    source: 'Plan Management Service Agreement',
    category: 'plan_management',
  },
  {
    path: '9. Participant Documentation/Plan Management - Complaint Form - Hope Disability Support.docx',
    source: 'Plan Management Complaint Form',
    category: 'complaints_management',
  },

  // ── Audit / Corrective Actions ──
  {
    path: '1. Audit Documents/Provider Risk Assessment - COMPLETED - Hope Disability Support.docx',
    source: 'Provider Risk Assessment',
    category: 'audit',
  },
  {
    path: '10. Corrective Actions from Initial Audit/Initial Audit CAR - Hope Disability Support.docx',
    source: 'Initial Audit Corrective Action Report',
    category: 'audit',
  },
  {
    path: '10. Corrective Actions from Initial Audit/Initial Audit CAR - Closure Evidence Summary.docx',
    source: 'Initial Audit CAR - Closure Evidence',
    category: 'audit',
  },
  {
    path: '10. Corrective Actions from Initial Audit/HRM - Staff Induction Checklist.docx',
    source: 'Staff Induction Checklist',
    category: 'human_resources',
  },
]

// ─── DOCX text extraction (using mammoth) ────────────────────

let mammoth
try {
  mammoth = await import('mammoth')
} catch {
  console.error('mammoth is not installed. Run: npm install mammoth --save-dev')
  process.exit(1)
}

async function extractText(filePath) {
  const absolutePath = resolve(NDIS_ROOT, filePath)
  if (!existsSync(absolutePath)) {
    console.warn(`  SKIP (file not found): ${filePath}`)
    return null
  }
  const buffer = readFileSync(absolutePath)
  const result = await mammoth.extractRawText({ buffer })
  return result.value
}

// ─── Chunking ────────────────────────────────────────────────

function chunkText(text, chunkSize = CHUNK_SIZE, overlap = CHUNK_OVERLAP) {
  const words = text.split(/\s+/).filter(Boolean)
  if (words.length === 0) return []

  const chunks = []
  let start = 0

  while (start < words.length) {
    const end = Math.min(start + chunkSize, words.length)
    const chunk = words.slice(start, end).join(' ')
    chunks.push(chunk)

    if (end >= words.length) break
    start = end - overlap
  }

  return chunks
}

/**
 * Derive a section title from the first line or heading of a chunk.
 */
function deriveTitle(chunk, source, index) {
  // Take first ~80 chars of the chunk as a rough title
  const firstLine = chunk.split('\n')[0].trim()
  if (firstLine.length > 10 && firstLine.length < 120) {
    return firstLine
  }
  return `${source} — Part ${index + 1}`
}

// ─── Main ────────────────────────────────────────────────────

async function main() {
  console.log('╔══════════════════════════════════════════════════╗')
  console.log('║  Hope Disability Support — Policy Ingestion Tool ║')
  console.log('╚══════════════════════════════════════════════════╝')
  console.log()
  console.log(`Documents to process: ${DOCUMENTS.length}`)
  console.log(`Supabase URL: ${SUPABASE_URL}`)
  console.log()

  // Deactivate existing policy documents so we do a clean re-import
  console.log('Deactivating existing policy documents...')
  const { error: deactivateError } = await supabase
    .from('policy_documents')
    .update({ is_active: false })
    .eq('is_active', true)

  if (deactivateError) {
    console.error('Failed to deactivate existing docs:', deactivateError.message)
  }

  let totalChunks = 0
  let skipped = 0

  for (const doc of DOCUMENTS) {
    console.log(`\nProcessing: ${doc.source}`)
    console.log(`  File: ${doc.path}`)

    const text = await extractText(doc.path)
    if (!text) {
      skipped++
      continue
    }

    const chunks = chunkText(text)
    console.log(`  Extracted ${text.split(/\s+/).length} words → ${chunks.length} chunks`)

    // Insert chunks in batches of 50
    for (let batchStart = 0; batchStart < chunks.length; batchStart += 50) {
      const batch = chunks.slice(batchStart, batchStart + 50).map((chunk, i) => ({
        title: deriveTitle(chunk, doc.source, batchStart + i),
        source: doc.source,
        category: doc.category,
        chunk_index: batchStart + i,
        content: chunk,
        metadata: {
          file: basename(doc.path),
          folder: doc.path.split('/')[0],
        },
        is_active: true,
      }))

      const { error: insertError } = await supabase
        .from('policy_documents')
        .insert(batch)

      if (insertError) {
        console.error(`  ERROR inserting batch: ${insertError.message}`)
      } else {
        totalChunks += batch.length
      }
    }
  }

  console.log('\n════════════════════════════════════════════════')
  console.log(`Done! Inserted ${totalChunks} chunks from ${DOCUMENTS.length - skipped} documents.`)
  if (skipped > 0) {
    console.log(`Skipped ${skipped} documents (file not found).`)
  }
  console.log()
  console.log('NEXT STEP: Generate embeddings by running:')
  console.log('  supabase functions invoke embed-policy-docs')
  console.log()
  console.log('This will generate OpenAI embeddings for all new chunks')
  console.log('so that AI Buddy can search them with semantic search.')
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
