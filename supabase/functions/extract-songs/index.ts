import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"

const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY')
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
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

    // 1. Get User ID from JWT
    const authHeader = req.headers.get('Authorization')
    const customAuthHeader = req.headers.get('X-Auth-Token')
    
    const token = (customAuthHeader || authHeader || '').replace('Bearer ', '')
    const payload = token ? decodeSafe(token) : null;
    const userId = payload?.sub;

    // 2. Initialize Supabase client with Service Role to access storage
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

    // 3. Fetch the image from Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('song-screenshots')
      .download(filePath)

    if (downloadError) {
      console.error('Download error:', downloadError)
      throw new Error(`Failed to download file: ${downloadError.message}`)
    }

    const arrayBuffer = await fileData.arrayBuffer()
    const base64Image = btoa(
      Array.from(new Uint8Array(arrayBuffer))
        .map((b) => String.fromCharCode(b))
        .join('')
    )

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

    console.log(`Processing image of size ${arrayBuffer.byteLength} bytes...`)

    let content: string | null = null;
    const errors: string[] = [];

    // Attempt Groq Vision models
    if (GROQ_API_KEY) {
      const groqVisionModels = [
        'qwen/qwen3.8-27b',
        'qwen-3.8-27b',
        'meta-llama/llama-4-scout-17b-16e-instruct',
      ];

      for (const model of groqVisionModels) {
        try {
          console.log(`Attempting Groq vision with model: ${model}`);
          const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${GROQ_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: model,
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
          });

          if (response.ok) {
            const result = await response.json();
            content = result.choices?.[0]?.message?.content;
            if (content) {
              console.log(`Groq vision success using model: ${model}`);
              break;
            }
          } else {
            const errJson = await response.json().catch(() => ({}));
            errors.push(`Groq (${model}): ${errJson.error?.message || response.statusText}`);
          }
        } catch (e: any) {
          errors.push(`Groq (${model}): ${e.message}`);
        }
      }
    }

    // Fallback to Gemini Vision if Groq failed or not set
    if (!content && GEMINI_API_KEY) {
      const geminiVisionModels = ['gemini-2.5-flash', 'gemini-1.5-flash'];
      for (const geminiModel of geminiVisionModels) {
        try {
          console.log(`Attempting Gemini vision with model: ${geminiModel}`);
          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [
                  { text: prompt },
                  {
                    inlineData: {
                      mimeType: "image/jpeg",
                      data: base64Image
                    }
                  }
                ]
              }],
              generationConfig: {
                response_mime_type: "application/json",
              }
            })
          });

          if (response.ok) {
            const result = await response.json();
            const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              content = text;
              console.log(`Gemini vision success using model: ${geminiModel}`);
              break;
            }
          } else {
            const errJson = await response.json().catch(() => ({}));
            errors.push(`Gemini (${geminiModel}): ${errJson.error?.message || response.statusText}`);
          }
        } catch (e: any) {
          errors.push(`Gemini (${geminiModel}): ${e.message}`);
        }
      }
    }

    if (!content) {
      throw new Error(`Vision extraction failed across all providers: ${errors.join(' | ')}`);
    }

    console.log('Raw content from vision AI:', content)
    
    let songs = []
    try {
      const parsedData = JSON.parse(content || '{"songs": []}')
      songs = parsedData.songs || []
    } catch (parseErr) {
      console.error('Failed to parse AI response as JSON:', content)
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
