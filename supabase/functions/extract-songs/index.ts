import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"

const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-auth-token',
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

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { filePath } = await req.json()

    if (!filePath) {
      return new Response(JSON.stringify({ error: 'No filePath provided' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    // 1. Get User ID from JWT (Robust check for ES256 algorithm issues)
    const authHeader = req.headers.get('Authorization')
    const customAuthHeader = req.headers.get('X-Auth-Token')
    
    const token = (customAuthHeader || authHeader || '').replace('Bearer ', '')
    // userId is not strictly needed for extraction logic currently but good for logging/RLS in future
    const payload = token ? decodeSafe(token) : null;
    const userId = payload?.sub;

    if (!GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY is not set')
    }

    // 1. Initialize Supabase client with Service Role to access storage
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

    // 2. Fetch the image from Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('song-screenshots')
      .download(filePath)

    if (downloadError) {
      console.error('Download error:', downloadError)
      throw new Error(`Failed to download file: ${downloadError.message}`)
    }

    // 3. Convert blob to base64 for Groq (More efficient way in Deno)
    const arrayBuffer = await fileData.arrayBuffer()
    const base64Image = btoa(
      Array.from(new Uint8Array(arrayBuffer))
        .map((b) => String.fromCharCode(b))
        .join('')
    )

    // 4. Call Groq Llama 4 Scout Vision
    const prompt = `
      Extract a list of songs from this image. 
      The image might be:
      1. A screenshot of a music app (Spotify, Apple Music, YouTube Music).
      2. A handwritten setlist or notebook page.
      3. A printed list of songs.

      ### CRITICAL INSTRUCTIONS:
      - IGNORE all UI elements: Battery percentage, Time/Clock, Network icons, "Play", "Shuffle", "Download", "Repeat", "Library", "Search" buttons.
      - IGNORE navigation text: "Playlist", "Album", "Followers", "Artist Info", "Lyrics".
      - IGNORE handwritten "noise": "Set 1", "Break", "Don't forget", "Check mic", or page numbers.
      - SPELL CHECK: Use your internal knowledge to CORRECT any obvious misspellings or OCR errors in song titles and artist names.
      - IDENTIFY ARTISTS: If the artist is NOT explicitly mentioned in the image but the song title is well-known, you MUST provide the most likely original artist name instead of "Unknown Artist".
      - GENRE DETECTION: You MUST provide an accurate genre for every song. If the genre is not in the image, use your musical knowledge to assign the most appropriate one.
      - GENRE CATEGORIES: Prioritize these categories: OPM (for any Filipino songs), Rock, Pop, Acoustic, Worship, Ballad, Hip-Hop, R&B, Electronic, Country, Jazz, Classical, Blues, Folk, Metal, Punk, Reggae, Soul, or Latin. If it doesn't fit these, provide a concise 1-word genre.
      - ARTIST ACCURACY: For well-known covers, prefer the most popular or original artist.

      Return the results STRICTLY as a JSON object with a "songs" key containing an array of objects with "title", "artist", and "genre" keys.
      Example format: {"songs": [{"title": "With or Without You", "artist": "U2", "genre": "Rock"}, {"title": "Ang Huling El Bimbo", "artist": "Eraserheads", "genre": "OPM"}]}
      Only return the JSON, no other text.
    `

    console.log(`Sending image of size ${arrayBuffer.byteLength} bytes to Groq...`)

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.2-90b-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ]
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0,
      })
    })

    const result = await response.json()
    
    if (!response.ok) {
      console.error('Groq API Error Response:', JSON.stringify(result))
      throw new Error(`Groq API error: ${result.error?.message || response.statusText}`)
    }

    const content = result.choices?.[0]?.message?.content
    console.log('Raw content from Groq:', content)
    
    let songs = []
    try {
      const parsedData = JSON.parse(content || '{"songs": []}')
      songs = parsedData.songs || []
    } catch (parseErr) {
      console.error('Failed to parse Groq response as JSON:', content)
      throw new Error('Failed to parse song list from AI response')
    }

    return new Response(JSON.stringify({ songs }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })


  } catch (error: any) {
    console.error('Final Catch Error:', error.message || error)
    return new Response(JSON.stringify({ error: error.message || String(error) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
