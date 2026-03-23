// Supabase Edge Function: embed-policy-docs
// Generates OpenAI embeddings for all policy documents that don't have one yet.
// Run once after seeding policy documents, or whenever new documents are added.
//
// Deploy: supabase functions deploy embed-policy-docs
// Invoke: supabase functions invoke embed-policy-docs
// Or via curl: curl -X POST https://<project>.supabase.co/functions/v1/embed-policy-docs \
//   -H "Authorization: Bearer <service_role_key>" \
//   -H "Content-Type: application/json"

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const EMBEDDING_MODEL = 'text-embedding-3-small'
const BATCH_SIZE = 20 // OpenAI allows up to 2048 inputs per request

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiKey) {
      return new Response(
        JSON.stringify({ error: 'OPENAI_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Find all policy documents that don't have embeddings yet
    const { data: docs, error: fetchError } = await supabase
      .from('policy_documents')
      .select('id, title, source, content')
      .eq('is_active', true)
      .not('id', 'in', `(SELECT document_id FROM policy_embeddings)`)

    // Fallback: if the subquery doesn't work with PostgREST, use a two-step approach
    let docsToEmbed = docs
    if (fetchError || !docs) {
      // Two-step: get all docs, get all existing embeddings, filter
      const { data: allDocs } = await supabase
        .from('policy_documents')
        .select('id, title, source, content')
        .eq('is_active', true)

      const { data: existingEmbeddings } = await supabase
        .from('policy_embeddings')
        .select('document_id')

      const embeddedIds = new Set((existingEmbeddings ?? []).map((e: { document_id: string }) => e.document_id))
      docsToEmbed = (allDocs ?? []).filter((d: { id: string }) => !embeddedIds.has(d.id))
    }

    if (!docsToEmbed || docsToEmbed.length === 0) {
      return new Response(
        JSON.stringify({ message: 'All policy documents already have embeddings', embedded: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let totalEmbedded = 0
    const errors: string[] = []

    // Process in batches
    for (let i = 0; i < docsToEmbed.length; i += BATCH_SIZE) {
      const batch = docsToEmbed.slice(i, i + BATCH_SIZE) as Array<{ id: string; title: string; source: string; content: string }>

      // Prepare texts for embedding (prefix with title and source for better retrieval)
      const texts = batch.map(
        (doc) => `${doc.title}\nSource: ${doc.source}\n\n${doc.content}`
      )

      // Call OpenAI Embeddings API
      const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: EMBEDDING_MODEL,
          input: texts,
        }),
      })

      if (!embeddingResponse.ok) {
        const errText = await embeddingResponse.text()
        errors.push(`Batch ${i / BATCH_SIZE + 1}: OpenAI API error: ${errText}`)
        continue
      }

      const embeddingResult = await embeddingResponse.json()
      const embeddings = embeddingResult.data as Array<{ embedding: number[]; index: number }>

      // Insert embeddings into the database
      const rows = embeddings.map((emb) => ({
        document_id: batch[emb.index].id,
        embedding: emb.embedding,
      }))

      const { error: insertError } = await supabase
        .from('policy_embeddings')
        .insert(rows)

      if (insertError) {
        errors.push(`Batch ${i / BATCH_SIZE + 1}: Insert error: ${insertError.message}`)
        continue
      }

      totalEmbedded += batch.length
    }

    return new Response(
      JSON.stringify({
        message: `Embedding generation complete`,
        total_documents: docsToEmbed.length,
        embedded: totalEmbedded,
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
