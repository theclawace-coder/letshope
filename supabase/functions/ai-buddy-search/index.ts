// Supabase Edge Function: ai-buddy-search
// Generates embeddings via OpenAI, searches policy docs with pgvector,
// then uses GPT to produce a grounded answer with source citations.
//
// Deploy: supabase functions deploy ai-buddy-search
// Set secret: supabase secrets set OPENAI_API_KEY=sk-...

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const EMBEDDING_MODEL = 'text-embedding-3-small'
const CHAT_MODEL = 'gpt-4o-mini'
const MATCH_THRESHOLD = 0.40
const MATCH_COUNT = 8

interface PolicyMatch {
  id: string
  document_id: string
  title: string
  source: string
  category: string
  content: string
  metadata: Record<string, unknown>
  similarity: number
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiKey) {
      return new Response(
        JSON.stringify({ error: 'OPENAI_API_KEY not configured', sources: [], answer: '' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { query, currentPage, routeMap } = await req.json()
    if (!query || typeof query !== 'string') {
      return new Response(
        JSON.stringify({ error: 'query is required', sources: [], answer: '' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ─── Step 1a: Rewrite conversational query into policy search terms ───
    // Users ask things like "a participant was rude" — we need to map that
    // to policy language like "complaints management worker conduct".

    const rewriteResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: CHAT_MODEL,
        messages: [
          {
            role: 'system',
            content: `You are a search query rewriter for an NDIS disability support provider's policy database.
Rewrite the user's conversational question into 2-3 concise search phrases using formal NDIS policy terminology.
Focus on the policy areas that would contain the answer: complaints management, incident management, code of conduct, worker screening, restrictive practices, risk management, participant rights, service agreements, etc.
Return ONLY the search phrases separated by newlines. No explanations.`,
          },
          { role: 'user', content: query },
        ],
        temperature: 0,
        max_tokens: 100,
      }),
    })

    let searchQuery = query
    if (rewriteResponse.ok) {
      const rewriteResult = await rewriteResponse.json()
      const rewritten = rewriteResult.choices?.[0]?.message?.content?.trim()
      if (rewritten) {
        // Combine original query with rewritten terms for better recall
        searchQuery = `${query}\n${rewritten}`
      }
    }

    // ─── Step 1b: Generate embedding for the enhanced search query ───

    const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input: searchQuery,
      }),
    })

    if (!embeddingResponse.ok) {
      const errText = await embeddingResponse.text()
      return new Response(
        JSON.stringify({ error: `Embedding API error: ${errText}`, sources: [], answer: '' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const embeddingResult = await embeddingResponse.json()
    const queryEmbedding = embeddingResult.data[0].embedding as number[]

    // ─── Step 2: Semantic search via match_policy_documents ───

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data: matches, error: matchError } = await supabase.rpc(
      'match_policy_documents',
      {
        query_embedding: queryEmbedding,
        match_threshold: MATCH_THRESHOLD,
        match_count: MATCH_COUNT,
      }
    )

    if (matchError) {
      return new Response(
        JSON.stringify({ error: `Search error: ${matchError.message}`, sources: [], answer: '' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const sources = (matches as PolicyMatch[]) ?? []

    // ─── Step 3: Generate answer grounded in retrieved sources ───

    const contextBlock = sources.length > 0
      ? sources
          .map(
            (s, i) =>
              `[Source ${i + 1}] "${s.title}" from ${s.source} (${s.category}, ${Math.round(s.similarity * 100)}% match)\n${s.content}`
          )
          .join('\n\n---\n\n')
      : 'No relevant policy documents were found in the knowledge base.'

    // Build route-aware context
    const currentPageContext = currentPage
      ? `\nThe user is currently on the "${currentPage}" page of Hope OS.`
      : ''
    const routeMapContext = routeMap
      ? `\n\nHope OS Internal Pages (use these to guide users with links):\n${routeMap}`
      : ''

    const systemPrompt = `You are AI Buddy, the official NDIS policy and compliance assistant for Hope Disability Support Pty Ltd.

═══ STRICT GROUNDING RULES (NON-NEGOTIABLE) ═══

1. ONLY USE INFORMATION FROM THE PROVIDED SOURCE DOCUMENTS. Every claim you make MUST be directly supported by the sources below.
2. CITE EVERY FACT with [Source N] notation. If you cannot cite it, do not say it.
3. NEVER fabricate, infer, or assume policy content. If the sources do not contain the answer, you MUST say: "I couldn't find specific information about this in the uploaded policies. Please check with your manager or refer to the NDIS Quality & Safeguards Commission website."
4. NEVER guess at procedures, timeframes, or requirements that are not explicitly stated in the sources.
5. If the sources only partially answer the question, answer ONLY the part you can support and clearly state what is missing.
6. Do NOT supplement with general NDIS knowledge unless it is directly stated in the provided sources. Your knowledge base is Hope Disability Support's own policies and procedures — not generic NDIS guidance.

═══ YOUR KNOWLEDGE BASE ═══

Your answers are grounded in Hope Disability Support's actual documents:
- Core Module Policy & Procedure Manual
- Module 1: High Intensity Policy & Procedure Manual
- Module 2 & 2A: Behaviour Support Policy & Procedure Manual
- Plan Management Policy & Procedure Manual
- NDIS Practice Standards & Quality Indicators
- Incident Management procedures
- Complaints & Feedback procedures
- Risk Management & Emergency Management plans
- Participant documentation (consent, intake, service agreements, support plans)
- Governance & operational review documents
- Worker screening & compliance requirements

═══ INTERNAL APP NAVIGATION ═══

When the user asks "how do I..." or "where do I..." do something in the system, guide them to the correct page using markdown links.
Format internal links as: **[Page Name](/route-path)**
${currentPageContext}${routeMapContext}

Examples:
- "To lodge a complaint, go to **[Complaints](/complaints)** and click 'New Complaint', or go directly to **[New Complaint](/complaints/new)**."
- "You can find all incident reports at **[Incidents](/incidents)**."

═══ RESPONSE FORMAT ═══

- Be concise, professional, and practical. Staff need actionable guidance, not essays.
- Use numbered steps for procedures (e.g., "How do I report an incident?").
- Use bullet points for lists of requirements or obligations.
- When relevant, mention specific NDIS timeframes or obligations FROM THE SOURCES.
- Always end with the source documents referenced so the user can verify.
- If guiding through an in-app process, give step-by-step instructions with the relevant page link.`

    const chatResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: CHAT_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `Here are the relevant policy documents:\n\n${contextBlock}\n\n---\n\nUser question: ${query}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 1500,
      }),
    })

    if (!chatResponse.ok) {
      const errText = await chatResponse.text()
      return new Response(
        JSON.stringify({
          error: `Chat API error: ${errText}`,
          sources: sources.map((s) => ({
            document_id: s.document_id,
            title: s.title,
            source: s.source,
            category: s.category,
            content: s.content,
            similarity: s.similarity,
          })),
          answer: '',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const chatResult = await chatResponse.json()
    const answer = chatResult.choices[0]?.message?.content ?? 'Sorry, I could not generate an answer.'

    return new Response(
      JSON.stringify({
        answer,
        sources: sources.map((s) => ({
          document_id: s.document_id,
          title: s.title,
          source: s.source,
          category: s.category,
          content: s.content,
          similarity: s.similarity,
        })),
        error: null,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: `Internal error: ${(err as Error).message}`, sources: [], answer: '' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
