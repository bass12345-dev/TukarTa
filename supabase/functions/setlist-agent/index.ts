import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"

const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
      global: { headers: { Authorization: req.headers.get('Authorization')! } },
    })

    const { gigId, message, setlistId } = await req.json()

    // 1. Fetch Context
    // Gig & Band info
    const { data: gig } = await supabase
      .from('gigs')
      .select('*, band:bands(*)')
      .eq('id', gigId)
      .single()

    // User's known songs
    const { data: { user } } = await supabase.auth.getUser()
    const { data: repertoire } = await supabase
      .from('musician_song_knowledge')
      .select('song:songs(*)')
      .eq('musician_id', user!.id)

    // Current setlist
    const { data: currentSongs } = await supabase
      .from('setlist_songs')
      .select('song:songs(*)')
      .eq('setlist_id', setlistId)

    const knownSongs = repertoire?.map((r: any) => `${r.song.title} by ${r.song.artist} [id: ${r.song.id}]`).join('\n')
    const currentList = currentSongs?.map((s: any) => s.song.title).join(', ')

    // 2. Construct Prompt
    const systemPrompt = `
      You are a professional Music Director and Setlist Consultant for a musician named ${user?.user_metadata?.full_name || 'the user'}.
      Your job is to help them build the perfect setlist for their upcoming gig.

      CONTEXT:
      - Gig: ${gig.name}
      - Venue: ${gig.venue}
      - Band: ${gig.band.name} (Genres: ${gig.band.genres.join(', ')})
      - Current Setlist: ${currentList || 'Empty'}

      REPERTOIRE (The only songs this musician knows and can play):
      ${knownSongs}

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
        model: 'llama3-70b-8192',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
      })
    })

    const result = await groqRes.json()
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
