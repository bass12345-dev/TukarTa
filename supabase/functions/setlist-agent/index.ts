import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"

const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 })
  }

  try {
    const supabase = createClient(SUPABASE_URL!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    const { gigId, message, setlistId } = await req.json()

    // 1. Get User ID from JWT (Gateway already verified it, but we need the sub claim)
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const payload = JSON.parse(atob(token.split('.')[1]))
    const userId = payload.sub

    // 2. Fetch Context
    // Gig & Band info
    const { data: gig, error: gigError } = await supabase
      .from('gigs')
      .select('*, band:bands(*)')
      .eq('id', gigId)
      .single()

    if (gigError || !gig) {
      throw new Error(`Gig not found: ${gigError?.message || 'Unknown error'}`)
    }

    // User's known songs
    const { data: repertoire } = await supabase
      .from('musician_song_knowledge')
      .select('song:songs(*)')
      .eq('musician_id', userId)

    // Current setlist
    const { data: currentSongs } = await supabase
      .from('setlist_songs')
      .select('song:songs(*)')
      .eq('setlist_id', setlistId)

    const knownSongs = repertoire?.map((r: any) => `${r.song.title} by ${r.song.artist} [id: ${r.song.id}]`).join('\n')
    const currentList = currentSongs?.map((s: any) => s.song.title).join(', ')
    const displayName = payload.user_metadata?.full_name || 'the user'

    // 2. Construct Prompt
    const systemPrompt = `
      You are a professional Music Director and Setlist Consultant for a musician named ${displayName}.
      Your job is to help them build the perfect setlist for their upcoming gig.

      CONTEXT:
      - Gig: ${gig.name}
      - Venue: ${gig.venue}
      - Band: ${gig.band?.name || 'Independent'} (Genres: ${gig.band?.genres?.join(', ') || 'N/A'})
      - Current Setlist: ${currentList || 'Empty'}

      REPERTOIRE (The only songs this musician knows and can play):
      ${knownSongs || 'No songs in repertoire yet.'}

      INSTRUCTIONS:
      1. Respond to the user's message in a helpful, encouraging "gig-ready" tone.
      2. If they ask for suggestions, pick the best songs from their REPERTOIRE that fit the gig venue and band style.
      3. ONLY suggest songs from the REPERTOIRE list provided above.
      4. If you suggest adding songs, return a structured JSON block at the end of your message.

      OUTPUT FORMAT:
      Your response should be natural text. If you suggest songs to add, include a JSON block like this:
      ACTIONS: [{"type": "add", "songId": "uuid", "title": "Song Title"}]
    `

    // 3. Call Groq
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
      })
    })

    if (!groqRes.ok) {
      const errorData = await groqRes.json()
      throw new Error(`Groq API Error: ${errorData.error?.message || groqRes.statusText}`)
    }

    const result = await groqRes.json()
    
    if (!result.choices || result.choices.length === 0) {
      throw new Error('Groq returned no choices. Please try again.')
    }

    const aiMessage = result.choices[0].message.content

    return new Response(JSON.stringify({ reply: aiMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
