/**
 * Debug script: test semantic search pipeline step by step
 */
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

// Load .env.local
const envPath = resolve(import.meta.dirname, '..', '.env.local')
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const eq = t.indexOf('=')
    if (eq === -1) continue
    const k = t.slice(0, eq).trim()
    let v = t.slice(eq + 1).trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
    if (!process.env[k]) process.env[k] = v
  }
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// Step 1: Check we can get docs
console.log('Step 1: Counting active docs with embeddings...')
const { data: docs } = await supabase
  .from('policy_documents')
  .select('id')
  .eq('is_active', true)
  .limit(5)
console.log(`  Active docs sample: ${docs?.length} returned`)

const { data: embeds } = await supabase
  .from('policy_embeddings')
  .select('id, document_id')
  .limit(5)
console.log(`  Embeddings sample: ${embeds?.length} returned`)

// Step 2: Check if an embedding document_id matches an active doc
if (embeds?.length > 0) {
  const testDocId = embeds[0].document_id
  const { data: matchDoc } = await supabase
    .from('policy_documents')
    .select('id, title, is_active')
    .eq('id', testDocId)
    .single()
  console.log(`  Embedding doc_id ${testDocId} → doc: ${matchDoc ? matchDoc.title + ' (active=' + matchDoc.is_active + ')' : 'NOT FOUND'}`)
}

// Step 3: Generate a test embedding via OpenAI
console.log('\nStep 2: Generating test embedding...')

// Get the OpenAI key from Supabase secrets — we need to get it from env or hardcode for test
// Let's use the edge function directly and capture the response
const testQuery = 'What do I do if a participant falls and gets injured?'
console.log(`  Query: "${testQuery}"`)

const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-buddy-search`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ query: testQuery }),
})

const result = await response.json()
console.log(`  Response status: ${response.status}`)
console.log(`  Error: ${result.error}`)
console.log(`  Sources count: ${result.sources?.length ?? 0}`)
console.log(`  Answer preview: ${result.answer?.slice(0, 150)}...`)

if (result.sources?.length > 0) {
  console.log('\n  Sources:')
  for (const s of result.sources) {
    console.log(`    - ${s.title} (${s.source}) [${Math.round(s.similarity * 100)}% match]`)
  }
}

// Step 3: Try calling the RPC directly with a very low threshold
console.log('\nStep 3: Testing match_policy_documents RPC with threshold=0.01...')

// We need an actual embedding vector. Let's get one from the existing embeddings
// and use it as the query to see if the RPC works at all
const { data: sampleEmbed, error: sampleErr } = await supabase
  .from('policy_embeddings')
  .select('embedding, document_id')
  .limit(1)
  .single()

if (sampleErr) {
  console.log(`  ERROR getting sample embedding: ${sampleErr.message}`)
} else if (sampleEmbed) {
  console.log(`  Got sample embedding for doc ${sampleEmbed.document_id}`)
  console.log(`  Embedding type: ${typeof sampleEmbed.embedding}`)
  console.log(`  Embedding is array: ${Array.isArray(sampleEmbed.embedding)}`)

  const embVal = sampleEmbed.embedding
  if (typeof embVal === 'string') {
    console.log(`  Embedding string preview: ${embVal.slice(0, 80)}...`)
  } else if (Array.isArray(embVal)) {
    console.log(`  Embedding length: ${embVal.length}`)
    console.log(`  First 3 values: ${embVal.slice(0, 3)}`)
  } else {
    console.log(`  Embedding value: ${JSON.stringify(embVal).slice(0, 80)}`)
  }

  // Try the RPC with this exact embedding — should match itself perfectly
  const { data: rpcResult, error: rpcError } = await supabase.rpc(
    'match_policy_documents',
    {
      query_embedding: embVal,
      match_threshold: 0.01,
      match_count: 3,
    }
  )

  if (rpcError) {
    console.log(`  RPC ERROR: ${rpcError.message}`)
    console.log(`  RPC error details: ${JSON.stringify(rpcError)}`)
  } else {
    console.log(`  RPC returned ${rpcResult?.length ?? 0} results`)
    if (rpcResult?.length > 0) {
      for (const r of rpcResult) {
        console.log(`    - ${r.title} (similarity: ${r.similarity})`)
      }
    }
  }
}

console.log('\nDone.')
