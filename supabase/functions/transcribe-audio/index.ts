// Supabase Edge Function: transcribe-audio
// Transcribes audio files using OpenAI Whisper API
//
// Deploy: supabase functions deploy transcribe-audio
// Set secret: supabase secrets set OPENAI_API_KEY=sk-...

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
        JSON.stringify({ error: 'OPENAI_API_KEY not configured', text: null }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { audioPath } = await req.json()
    if (!audioPath) {
      return new Response(
        JSON.stringify({ error: 'audioPath is required', text: null }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Download audio from Supabase Storage
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data: fileData, error: downloadError } = await supabase.storage
      .from('audio-recordings')
      .download(audioPath)

    if (downloadError || !fileData) {
      return new Response(
        JSON.stringify({ error: `Failed to download audio: ${downloadError?.message}`, text: null }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Send to OpenAI Whisper API
    const formData = new FormData()
    const ext = audioPath.split('.').pop() || 'webm'
    formData.append('file', fileData, `recording.${ext}`)
    formData.append('model', 'whisper-1')
    formData.append('language', 'en')

    const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: formData,
    })

    if (!whisperResponse.ok) {
      const errorText = await whisperResponse.text()
      return new Response(
        JSON.stringify({ error: `Whisper API error: ${errorText}`, text: null }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const result = await whisperResponse.json()

    return new Response(
      JSON.stringify({ text: result.text, error: null }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: `Internal error: ${(err as Error).message}`, text: null }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
