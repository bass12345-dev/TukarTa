import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"

const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    // 3. Convert blob to base64 for Groq
    const arrayBuffer = await fileData.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)
    let binary = ''
    const chunk_size = 8192
    for (let i = 0; i < uint8Array.length; i += chunk_size) {
      binary += String.fromCharCode(...uint8Array.slice(i, i + chunk_size))
    }
    const base64Image = btoa(binary)

    // 4. Call Groq Llama 3.2 Vision
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
      - FOCUS ONLY on Song Titles and Artist Names.
      - For handwritten notes, do your best to decipher messy handwriting.
      - If the artist is not explicitly mentioned but you can infer it from a well-known song title, please include the most likely artist.
      - If the artist is truly unknown, use "Unknown Artist".
      - For "genre", identify if it fits one of these: OPM, Rock, Pop, Acoustic, Worship, Ballad, Hip-Hop, R&B, Electronic, Country, Jazz, Classical, Blues, Folk, Metal, Punk, Reggae, Soul, or Latin. If it doesn't fit, provide a short 1-word genre.

      Return the results STRICTLY as a JSON object with a "songs" key containing an array of objects with "title", "artist", and "genre" keys.
      Example format: {"songs": [{"title": "With or Without You", "artist": "U2", "genre": "Rock"}, {"title": "Ang Huling El Bimbo", "artist": "Eraserheads", "genre": "OPM"}]}
      Only return the JSON, no other text.
    `

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.2-11b-vision-preview',
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
        temperature: 0.1,
      })
    })


    const result = await response.json()
    console.log('Groq Result:', JSON.stringify(result))

    if (!response.ok) {
      throw new Error(`Groq API error: ${result.error?.message || response.statusText}`)
    }

    const content = result.choices?.[0]?.message?.content
    const parsedData = JSON.parse(content || '{"songs": []}')
    const songs = parsedData.songs || []

    return new Response(JSON.stringify({ songs }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })


  } catch (error) {
    console.error('Error:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
