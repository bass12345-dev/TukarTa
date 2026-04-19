import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"

const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')

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
    const displayName = payload.user_metadata?.full_name || 'the musician'

    // 2. Fetch Global Context (Bands user leads & Top available musicians)
    const { data: myBands } = await supabase
      .from('bands')
      .select('*')
      .eq('leader_id', userId)

    const { data: discoverMusicians } = await supabase
      .from('users')
      .select('id, display_name, musician_profiles(roles, genres)')
      .limit(15)

    // 3. Fetch Gig-Specific Context (if gigId provided)
    let gigContext = ""
    let repertoireContext = ""
    
    if (gigId) {
      const { data: gig } = await supabase
        .from('gigs')
        .select('*, band:bands(*)')
        .eq('id', gigId)
        .single()

      if (gig) {
        gigContext = `
          CURRENT GIG:
          - Name: ${gig.name}
          - Venue: ${gig.venue}
          - Band: ${gig.band?.name || 'Independent'}
          - Focus: ${gig.genre_focus || 'N/A'}
        `
      }

      const { data: repertoire } = await supabase
        .from('musician_song_knowledge')
        .select('song:songs(*)')
        .eq('musician_id', userId)

      repertoireContext = repertoire?.map((r: any) => `- ${r.song.title} (${r.song.artist}) [ID: ${r.song.id}]`).join('\n') || "No songs in repertoire."
    }

    const bandList = myBands?.map(b => `- ${b.name} [ID: ${b.id}]`).join('\n') || "No bands found."
    const musicianList = discoverMusicians?.map(m => `- ${m.display_name} (${m.musician_profiles?.[0]?.roles?.join(', ') || 'Musician'}) [ID: ${m.id}]`).join('\n') || "No musicians found."

    // 4. Construct Multi-Purpose Prompt
    const systemPrompt = `
      You are the "TukarTa Gig Assistant", a professional Music Director and Band Coordinator for ${displayName}.
      Your goal is to help them manage their entire music career: planning gigs, building setlists, and finding band members.

      CONTEXT:
      ${gigContext}
      
      USER'S BANDS (User is the leader):
      ${bandList}

      AVAILABLE MUSICIANS (Discovery DB):
      ${musicianList}

      REPERTOIRE (If in a gig context):
      ${repertoireContext}

      YOUR CAPABILITIES (Action Proposals):
      1. CREATE_GIG: If user wants to plan an event. Requires: name, venue, date (YYYY-MM-DD), bandId.
      2. INVITE_MUSICIAN: If user needs a specific role. Requires: musicianId, bandId, message.
      3. ADD_SONG: If user is editing a setlist. Requires: songId, title.

      INSTRUCTIONS:
      - Be encouraging, organized, and proactive.
      - If pieces of information are missing (e.g., date for a gig), ASK for them first.
      - When you are ready to perform an action, append it in the ACTIONS section at the end.
      - ONLY use IDs provided in the context for actions.

      OUTPUT FORMAT:
      Your response should be natural text. If you want to propose an action, end with:
      ACTIONS: [{"type": "proposal_create_gig", "data": {...}}, {"type": "proposal_invite", "data": {...}}, {"type": "add", "songId": "uuid", "title": "Song Title"}]
    `

    // 5. Call Groq
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
