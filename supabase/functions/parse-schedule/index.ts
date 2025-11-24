import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
interface ParseScheduleInput {
  fileContent: string;
  fileName: string;
  fileType?: string;
  fileBase64?: string;
}

function validateInput(input: any): { valid: boolean; error?: string; data?: ParseScheduleInput } {
  if (!input || typeof input !== 'object') {
    return { valid: false, error: 'Invalid request body' };
  }

  const { fileContent, fileName } = input;

  if (!fileContent || typeof fileContent !== 'string') {
    return { valid: false, error: 'fileContent is required and must be a string' };
  }

  if (fileContent.length > 1048576) { // 1MB limit
    return { valid: false, error: 'File content too large (max 1MB)' };
  }

  if (!fileName || typeof fileName !== 'string') {
    return { valid: false, error: 'fileName is required and must be a string' };
  }

  if (fileName.length > 255) {
    return { valid: false, error: 'fileName too long (max 255 characters)' };
  }

  // Allow most common filename characters including Unicode
  if (/[\x00-\x1F\x7F<>:"\/\\|?*]/.test(fileName)) {
    return { valid: false, error: 'fileName contains invalid characters' };
  }

  return { valid: true, data: { fileContent, fileName } };
}

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

function heuristicParse(content: string): ParsedClass[] {
  const lines = content.split(/\r?\n/).map(l => l.trim()).filter(l => l.length);
  const classes: ParsedClass[] = [];
  // Very basic heuristic: group lines that contain a time range HH:MM - HH:MM
  const timeRangeRegex = /(0?[0-9]|1[0-9]|2[0-3]):[0-5][0-9]\s*-\s*(0?[0-9]|1[0-9]|2[0-3]):[0-5][0-9]/;
  const dayWords = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]; 
  let buffer: string[] = [];
  for (const line of lines) {
    buffer.push(line);
    if (timeRangeRegex.test(line)) {
      // Attempt to build a class from buffer
      const timeMatch = line.match(timeRangeRegex);
      if (timeMatch) {
        const [start, end] = timeMatch[0].split(/-+/).map(s => s.trim());
        // Find days
        const daysLine = buffer.find(b => dayWords.some(d => b.toLowerCase().includes(d.toLowerCase())));
        const days: string[] = [];
        if (daysLine) {
          for (const d of dayWords) {
            if (daysLine.toLowerCase().includes(d.toLowerCase())) days.push(d);
          }
        }
        // Course name heuristic: first non-empty line in buffer
        const courseLine = buffer[0] || "Untitled Course";
        classes.push({
          course_name: courseLine.replace(timeRangeRegex, '').trim() || 'Untitled Course',
          start_time: start,
          end_time: end,
          days_of_week: days.length ? days : dayWords.filter(d => d !== 'Sunday' && d !== 'Saturday').slice(0,5), // fallback weekdays
          room_number: undefined,
          building: undefined,
          floor: undefined,
          professor: undefined,
        });
      }
      buffer = [];
    }
    if (buffer.length > 10) buffer = []; // avoid runaway buffer
  }
  return classes;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse and validate input
    const requestBody = await req.json();
    const validation = validateInput(requestBody);
    
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { fileContent, fileName } = validation.data!;

    console.log('Parsing schedule file:', fileName);

    // If no Gemini key, fall back to heuristic parser
    if (!geminiApiKey) {
      const fallback = heuristicParse(fileContent);
      return new Response(
        JSON.stringify({ classes: fallback, warnings: ['GEMINI_API_KEY missing - used heuristic parser'] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let parsedClasses: ParsedClass[] = [];
    let warnings: string[] = [];
    
    // Model hierarchy: Try models in order until one succeeds
    const models = [
      'gemini-2.5-pro',
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-2.5-flash-lite'
    ];
    
    let lastError = null;
    
    for (const model of models) {
      try {
        console.log(`Attempting to use model: ${model}`);
        
        const payload: any = {
          generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json"
          }
        };

        // Check if we have base64 PDF data
        if (requestBody.fileBase64 && requestBody.fileType === 'application/pdf') {
          // Send PDF directly to Gemini for better accuracy
          payload.contents = [{
            parts: [
              {
                inlineData: {
                  mimeType: 'application/pdf',
                  data: requestBody.fileBase64
                }
              },
              {
                text: `You are a schedule parser that extracts class information from this PDF document.
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
              }
            ]
          }];
        } else {
          // Use text content
          payload.contents = [{
            parts: [{
              text: `You are a schedule parser that extracts class information from various document formats.
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

Return ONLY valid JSON array of classes. No markdown, no explanations.

Parse this schedule and return a JSON array of classes:

${fileContent}`
            }]
          }];
        }

        console.log(`Sending payload to ${model}...`);

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`${model} API error:`, response.status, errorText);
          
          if (response.status === 429) {
            console.log(`Rate limit hit on ${model}, trying next model...`);
            lastError = `Rate limit on ${model}`;
            continue; // Try next model
          }
          
          if (response.status === 400) {
            console.log(`Bad request on ${model}, trying next model...`);
            lastError = `Invalid request for ${model}`;
            continue;
          }
          
          throw new Error(`${model} error: ${response.status}`);
        }

        const data = await response.json();
        const generatedText = data.candidates[0].content.parts[0].text;
        const cleanedText = generatedText
          .replace(/```json\n?/g, '')
          .replace(/```\n?/g, '')
          .trim();
        parsedClasses = JSON.parse(cleanedText);
        
        if (!Array.isArray(parsedClasses)) {
          throw new Error('AI response not array');
        }
        
        console.log(`Successfully parsed with ${model}`);
        warnings.push(`Parsed using ${model}`);
        break; // Success, exit loop
        
      } catch (e) {
        console.error(`Failed with ${model}:`, e);
        lastError = e;
        // Continue to next model
      }
    }
    
    // If all models failed, use heuristic parser
    if (parsedClasses.length === 0) {
      console.error('All AI models failed, using heuristic parser. Last error:', lastError);
      warnings.push('All AI models failed - used heuristic parser');
      parsedClasses = heuristicParse(fileContent);
    }

    return new Response(
      JSON.stringify({ classes: parsedClasses, warnings }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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