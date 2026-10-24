import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"

const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY')
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-auth-token',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

// Helper to decode JWT without external dependencies
function decodeSafe(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error("JWT Decode Error:", e);
    return null;
  }
}

// Static fallback list of known active Groq models (prioritized by capability and availability)
const STATIC_GROQ_MODELS = [
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
  'qwen/qwen3.8-27b',
  'gpt-oss-120b',
  'gpt-oss-20b',
  'qwen-3.8-27b',
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant'
];

// Dynamically fetch currently active models from Groq to avoid decommissioned models
async function getActiveGroqModels(apiKey: string): Promise<string[]> {
  try {
    const res = await fetch('https://api.groq.com/openai/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (res.ok) {
      const data = await res.json();
      const models: string[] = (data.data || [])
        .map((m: any) => m.id)
        .filter((id: string) => {
          const lower = id.toLowerCase();
          return (
            !lower.includes('whisper') &&
            !lower.includes('tts') &&
            !lower.includes('orpheus') &&
            !lower.includes('embed') &&
            !lower.includes('guard') &&
            !lower.includes('mixtral') &&
            !lower.includes('llama3-') // old llama3-70b/8b decommissioned
          );
        });

      if (models.length > 0) {
        // Prioritize active models: GPT OSS 120B, GPT OSS 20B, Qwen 3.8 27B
        const prioritized = [
          ...models.filter(m => m.includes('gpt-oss-120b')),
          ...models.filter(m => m.includes('gpt-oss-20b')),
          ...models.filter(m => m.includes('qwen3.8') || m.includes('qwen-3.8')),
          ...models.filter(m => !m.includes('gpt-oss') && !m.includes('qwen'))
        ];
        return prioritized;
      }
    }
  } catch (err) {
    console.warn('Failed to query dynamic Groq models list:', err);
  }
  return STATIC_GROQ_MODELS;
}

// Google Gemini fallback in case Groq is rate-limited, unavailable, or decommissioned
async function callGeminiFallback(
  systemPrompt: string,
  history: any[],
  message: string,
  apiKey: string
): Promise<string> {
  const geminiModels = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-2.0-flash'];
  let lastGeminiError: any = null;

  for (const model of geminiModels) {
    try {
      console.log(`Attempting Gemini completion with model: ${model}`);
      
      // 1. Try Gemini OpenAI-compatible endpoint
      const openAiRes = await fetch('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: systemPrompt },
            ...history,
            { role: 'user', content: message }
          ],
          temperature: 0.7,
        })
      });

      if (openAiRes.ok) {
        const data = await openAiRes.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          console.log(`Gemini OpenAI-endpoint success using model: ${model}`);
          return content;
        }
      }

      // 2. Try native generateContent endpoint
      const nativeRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: systemPrompt }]
          },
          contents: [
            ...history.map((m: any) => ({
              role: m.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: m.content || '' }]
            })),
            {
              role: 'user',
              parts: [{ text: message }]
            }
          ],
          generationConfig: {
            temperature: 0.7,
          }
        })
      });

      if (nativeRes.ok) {
        const nativeData = await nativeRes.json();
        const content = nativeData.candidates?.[0]?.content?.parts?.[0]?.text;
        if (content) {
          console.log(`Gemini native-endpoint success using model: ${model}`);
          return content;
        }
      } else {
        const errJson = await nativeRes.json().catch(() => ({}));
        lastGeminiError = new Error(`Gemini (${model}): ${errJson.error?.message || nativeRes.statusText}`);
      }
    } catch (e: any) {
      lastGeminiError = e;
    }
  }

  throw lastGeminiError || new Error('All Gemini candidate models failed');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 })
  }

  try {
    const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!SERVICE_ROLE_KEY) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not defined')
    
    // Use Service Role to bypass RLS and ensure we can ALWAYS save messages
    const supabase = createClient(SUPABASE_URL!, SERVICE_ROLE_KEY)

    const { gigId, message, setlistId, sessionId } = await req.json()

    // 1. Get User ID from JWT
    const authHeader = req.headers.get('Authorization')
    const customAuthHeader = req.headers.get('X-Auth-Token')
    
    const token = (customAuthHeader || authHeader || '').replace('Bearer ', '')
    if (!token) throw new Error('Missing authentication token')
    
    const payload = decodeSafe(token)
    if (!payload?.sub) throw new Error('Invalid or expired token')
    
    const userId = payload.sub
    const displayName = payload.user_metadata?.full_name || 'the musician'

    // 2. Fetch Global Context
    const { data: myBands } = await supabase
      .from('bands')
      .select('id, name, city')
      .eq('leader_id', userId)

    const { data: userProfile } = await supabase
      .from('users')
      .select('city')
      .eq('id', userId)
      .single()
    const userCity = userProfile?.city || 'your area'

    const { data: discoverMusicians } = await supabase
      .from('users')
      .select('id, display_name, city, musician_profiles(roles, genres)')
      .limit(15)

    // 3. Fetch Gig-Specific Context
    let gigContext = ""
    let repertoireContext = ""
    let setlistContext = ""
    
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

      repertoireContext = repertoire?.map((r: any) => `- ${r.song.title} (${r.song.artist}) [RefKey: ${r.song.id}]`).join('\n') || "No songs in repertoire."

      // Fetch Current Setlist
      const { data: setlist } = await supabase
        .from('setlists')
        .select('id')
        .eq('gig_id', gigId)
        .single();

      if (setlist) {
        const { data: setlistSongs } = await supabase
          .from('setlist_songs')
          .select('song:songs(*)')
          .eq('setlist_id', setlist.id)
          .order('position', { ascending: true });

        if (setlistSongs && setlistSongs.length > 0) {
          setlistContext = `
            CURRENT SETLIST:
            ${setlistSongs.map((s: any, idx: number) => `${idx + 1}. ${s.song.title} (${s.song.artist}) [ID: ${s.song.id}]`).join('\n')}
          `
        } else {
          setlistContext = "CURRENT SETLIST: Empty."
        }
      }
    }

    const bandNames = myBands?.map((b: any) => `- ${b.name} (${b.city || 'Unknown City'})`).join('\n') || "No bands found."
    const musicianNames = discoverMusicians?.map((m: any) => `- ${m.display_name} (${m.city || 'Unknown City'}) (${m.musician_profiles?.[0]?.roles?.join(', ') || 'Musician'})`).join('\n') || "No musicians found."
    
    const bandIdMap = myBands?.map((b: any) => `${b.name}: ${b.id}`).join('\n')
    const musicianIdMap = discoverMusicians?.map((m: any) => `${m.display_name}: ${m.id}`).join('\n')

    // 4. Construct Multi-Purpose Prompt
    const systemPrompt = `
      You are the "TukarTa Gig Assistant", a professional Music Director and Band Coordinator for ${displayName}.
      Your goal is to help them manage their entire music career: planning gigs, building setlists, and finding band members.

      CONTEXT:
      ${gigContext}
      ${setlistContext}
      
      USER'S BANDS:
      ${bandNames}

      LOCAL MUSICIANS (TukarTa Community near ${userCity}):
      ${musicianNames}

      REPERTOIRE (If in a gig context):
      ${repertoireContext}

      ID MAPPING (INTERNAL USE ONLY - NEVER DISCLOSE TO USER):
      ${bandIdMap}
      ${musicianIdMap}

      YOUR CAPABILITIES (Action Proposals):
      1. CREATE_GIG: If user wants to plan an event. Requires: name, venue, date (YYYY-MM-DD), bandId.
      2. INVITE_MUSICIAN: If user needs a specific role. Requires: musicianId, musicianName, bandId, message.
      3. ADD_SONG: If user is editing a setlist. Requires: songId, data: { title, artist }, [Optional: position (number)].
      4. REORDER_SONG: If user wants to move a song. Requires: songId, position (number).
      5. ADD_TO_DICTIONARY: If user wants to add a new song to their personal repertoire (music dictionary). Requires: title, artist, genre.

      INSTRUCTIONS:
      - ALWAYS respond in the same language the user uses.
      - !!! GUARDRAILS !!!: NEVER provide programming code, scripts, or technical terminal commands. You are a musician's assistant, not a developer tool.
      - STAY strictly within the persona of a professional Music Director / Band Coordinator.
      - If the user asks for anything unrelated to music, gigs, setlists, or band management, politely steer the conversation back to their music career.
      - !!! STOP !!!: NEVER display raw UUIDs / IDs in your natural text. They are for the JSON ACTIONS block ONLY.
      - Use ONLY "Name (City)" in your conversation.
      - Be encouraging, organized, and proactive.
      - If pieces of information are missing (e.g., date for a gig), ASK for them first.
      - When you are ready to perform an action, append it ONLY in the ACTIONS section at the end.
      - Use the IDs from the ID MAPPING section for the JSON actions.

      OUTPUT FORMAT:
      Your response should be natural text. If you want to propose an action, end with:
      ACTIONS: [{"type": "proposal_create_gig", "data": {"name": "...", "venue": "...", "date": "...", "bandId": "..."}}, {"type": "proposal_invite", "data": {"musicianId": "...", "musicianName": "...", "bandId": "...", "message": "..."}}, {"type": "add", "songId": "uuid", "data": {"title": "Song Title", "artist": "Artist Name"}}, {"type": "reorder", "songId": "uuid", "position": 1}, {"type": "proposal_add_to_dictionary", "data": {"title": "Song Title", "artist": "Artist Name", "genre": "..."}}]
    `

    // 5. Fetch History
    let history: any[] = []
    if (sessionId) {
      const { data: pastMessages } = await supabase
        .from('ai_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })
        .limit(15)

      if (pastMessages) {
        history = pastMessages.reverse().map((m: any) => ({
          role: m.role,
          content: m.content
        }))
      }
    }

    // 6. Persist User Message
    if (sessionId) {
      console.log(`Persisting user message for session: ${sessionId}`)
      const { error: insertError } = await supabase.from('ai_messages').insert({
        session_id: sessionId,
        role: 'user',
        content: message
      })
      if (insertError) throw new Error(`Failed to save user message: ${insertError.message}`);
    }

    // 7. Call AI with Dynamic Groq Discovery & Gemini Fallback
    let aiMessage: string | null = null;
    const attemptErrors: string[] = [];

    // Attempt Groq models first
    if (GROQ_API_KEY) {
      const candidateModels = await getActiveGroqModels(GROQ_API_KEY);
      console.log(`Active candidate Groq models: ${candidateModels.join(', ')}`);

      for (const modelName of candidateModels) {
        try {
          console.log(`Attempting Groq completion with model: ${modelName}`);
          const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${GROQ_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: modelName,
              messages: [
                { role: 'system', content: systemPrompt },
                ...history,
                { role: 'user', content: message }
              ],
              temperature: 0.7,
            })
          });

          if (groqRes.ok) {
            const data = await groqRes.json();
            const text = data.choices?.[0]?.message?.content;
            if (text) {
              aiMessage = text;
              console.log(`Groq success using model: ${modelName}`);
              break;
            }
          } else {
            const errorData = await groqRes.json().catch(() => ({}));
            const errDetail = errorData.error?.message || groqRes.statusText;
            attemptErrors.push(`Groq (${modelName}): ${errDetail}`);
            console.warn(`Model ${modelName} returned error: ${errDetail}`);
          }
        } catch (callErr: any) {
          attemptErrors.push(`Groq (${modelName}) network: ${callErr.message}`);
          console.warn(`Model ${modelName} call exception:`, callErr.message);
        }
      }
    } else {
      attemptErrors.push('Groq: GROQ_API_KEY is not defined');
    }

    // If Groq models failed or Groq was unavailable, fallback to Google Gemini
    if (!aiMessage && GEMINI_API_KEY) {
      console.log(`Groq attempts did not succeed (${attemptErrors.join('; ')}). Attempting Google Gemini fallback...`);
      try {
        aiMessage = await callGeminiFallback(systemPrompt, history, message, GEMINI_API_KEY);
      } catch (geminiErr: any) {
        attemptErrors.push(`Gemini: ${geminiErr.message}`);
        console.error('Gemini fallback failed:', geminiErr);
      }
    }

    if (!aiMessage) {
      throw new Error(`AI generation failed: ${attemptErrors.join(' | ')}`);
    }

    // Programmatic Safety Filter: Scrub UUIDs from natural language text (before ACTIONS block)
    const uuidRegex = /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi;
    
    // Split to protect the ACTIONS block
    const parts = aiMessage.split('ACTIONS:');
    let cleanReply = aiMessage;
    
    if (parts.length > 1) {
      const cleanNaturalText = parts[0].replace(uuidRegex, '[HIDDEN]');
      cleanReply = cleanNaturalText + 'ACTIONS:' + parts[1];
    } else {
      cleanReply = aiMessage.replace(uuidRegex, '[HIDDEN]');
    }

    // 8. Persist AI Response
    if (sessionId) {
      const actionMatch = aiMessage.match(/ACTIONS:\s*(\[.*\])/s);
      let parsedActions = null;
      if (actionMatch) {
        try {
          parsedActions = JSON.parse(actionMatch[1]);
        } catch (e) {
          console.error("Failed to parse actions for DB storage:", e);
        }
      }

      console.log(`Persisting assistant response for session: ${sessionId}`)
      const { error: insertAIError } = await supabase.from('ai_messages').insert({
        session_id: sessionId,
        role: 'assistant',
        content: aiMessage, 
        actions: parsedActions
      })
      if (insertAIError) throw new Error(`Failed to save AI response: ${insertAIError.message}`);
    }

    return new Response(JSON.stringify({ reply: cleanReply }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error("Edge Function Error:", error);
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMsg }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
