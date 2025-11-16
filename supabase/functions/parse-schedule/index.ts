import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ParsedClass {
  course_name: string;
  course_code?: string;
  professor?: string;
  room_number?: string;
  building?: string;
  floor?: string;
  start_time: string;
  end_time: string;
  days_of_week: string[];
  notes?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileContent, fileName } = await req.json();

    console.log('Parsing schedule file:', fileName);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { 
            role: 'system', 
            content: `You are a schedule parser that extracts class information from various document formats.
Extract ALL classes with the following information:
- course_name (required)
- course_code (optional)
- professor (optional)
- room_number (optional)
- building (optional)
- floor (optional, extract from room number if possible, e.g., "301" -> "3")
- start_time (required, format as HH:MM in 24-hour format)
- end_time (required, format as HH:MM in 24-hour format)
- days_of_week (required, array of days: ["Monday", "Tuesday", etc.])
- notes (optional)

Return ONLY valid JSON array of classes. No markdown, no explanations.`
          },
          { 
            role: 'user', 
            content: `Parse this schedule and return a JSON array of classes:\n\n${fileContent}` 
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.choices[0].message.content;

    console.log('Raw AI response:', generatedText);

    // Parse the JSON response
    let parsedClasses: ParsedClass[];
    try {
      // Remove markdown code blocks if present
      const cleanedText = generatedText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      parsedClasses = JSON.parse(cleanedText);
      
      if (!Array.isArray(parsedClasses)) {
        throw new Error('Response is not an array');
      }

      console.log('Successfully parsed classes:', parsedClasses.length);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError, generatedText);
      throw new Error('Failed to parse schedule data from AI response');
    }

    return new Response(
      JSON.stringify({ classes: parsedClasses }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in parse-schedule function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});