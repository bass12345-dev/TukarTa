import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
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

    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not set')
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

    // 3. Convert blob to base64 for Gemini
    const arrayBuffer = await fileData.arrayBuffer()
    const base64Image = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))

    // 4. Call Gemini 1.5 Flash
    const prompt = `
      Extract a list of songs from this image. 
      The image might be a handwritten setlist, a screenshot of notes, or a printed list.
      Identify both OPM (Filipino) and International songs.
      Return the results strictly as a JSON array of objects with "title" and "artist" keys.
      If the artist is not clear, put "Unknown Artist".
      Example format: [{"title": "With or Without You", "artist": "U2"}, {"title": "Ang Huling El Bimbo", "artist": "Eraserheads"}]
      Only return the JSON array, no other text.
    `

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: "image/jpeg", // We'll assume jpeg/png, Gemini is flexible
                data: base64Image
              }
            }
          ]
        }],
        generationConfig: {
          response_mime_type: "application/json",
        }
      })
    })

    const result = await response.json()
    console.log('Gemini Result:', JSON.stringify(result))

    if (!response.ok) {
      throw new Error(`Gemini API error: ${result.error?.message || response.statusText}`)
    }

    const textResponse = result.candidates?.[0]?.content?.parts?.[0]?.text
    const songs = JSON.parse(textResponse || '[]')

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
