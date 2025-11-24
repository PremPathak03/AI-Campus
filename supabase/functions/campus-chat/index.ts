import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Gemini API key (set via: npx supabase secrets set GEMINI_API_KEY=.... )
const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

// Input validation
interface ChatInput {
  conversationId: string;
  message: string;
}

function validateInput(input: any): { valid: boolean; error?: string; data?: ChatInput } {
  if (!input || typeof input !== 'object') {
    return { valid: false, error: 'Invalid request body' };
  }

  const { conversationId, message } = input;

  if (!conversationId || typeof conversationId !== 'string') {
    return { valid: false, error: 'conversationId is required and must be a string' };
  }

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(conversationId)) {
    return { valid: false, error: 'conversationId must be a valid UUID' };
  }

  if (!message || typeof message !== 'string') {
    return { valid: false, error: 'message is required and must be a string' };
  }

  if (message.length < 1) {
    return { valid: false, error: 'message cannot be empty' };
  }

  if (message.length > 4000) {
    return { valid: false, error: 'message too long (max 4000 characters)' };
  }

  return { valid: true, data: { conversationId, message } };
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CAMPUS_KNOWLEDGE = `You are AI Campus Assistant for JIS University, a helpful AI assistant for college students.

CAMPUS INFORMATION:
- Campus Library: Open Monday-Friday 9:40AM-5PM, Located in Building A, 1st Floor.
- Student Services: Building A, Ground floor. Hours: Monday-Saturday 9AM-5PM. Handles registration, financial aid, transcripts.
- Computer Labs: Available in Buildings A, On Floors 8, 9 and 10.
- Cafeteria: Building B, serves breakfast 10AM-1PM, lunch 1PM-2PM.
- Canteen: Building C, serves only lunch 1PM-2PM.
- Health Center: Building A.
- Parking: Student parking in Lots beside the pond. Visitor parking beside the NiT ground. Parking permits required.
- Wi-Fi: Campus-wide Wi-Fi available. Network name: "JISU HOTSPOT". Login with student credentials.
- Office Hours: Same as Student Services.
- Academic Advising: Visit Building A, Ground floor.

BUILDING DIRECTORY:
- Building A: Main University Building, Library (1st floor), Student Services (ground floor), Health Center (2nd floor)
- Building B: NIT Cafeteria on Ground floor.
- Building C: Canteen on 1st floor, behind building A.
Instead of using "Building A/B/C", refer to specific locations like "Main University Building", "NiT Building", or "Canteen Building" for clarity.
IMPORTANT DATES:
- Registration opens: 2 weeks before semester starts
- Add/Drop deadline: First week of semester
- Midterms: Week 8 of semester
- Finals: Last week of semester

Be helpful, concise, and friendly. If asked about specific class schedules or personal information, remind users to check their schedule in the app.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Parse and validate input
    const requestBody = await req.json();
    const validation = validateInput(requestBody);
    
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { conversationId, message } = validation.data!;

    // Get conversation history
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      throw messagesError;
    }

    // Save user message
    const { error: insertError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role: 'user',
        content: message,
      });

    if (insertError) {
      console.error('Error inserting user message:', insertError);
      throw insertError;
    }

    // Prepare messages for AI
    const chatMessages = [
      { role: 'system', content: CAMPUS_KNOWLEDGE },
      ...(messages || []).map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: message },
    ];

    console.log('Sending request directly to Gemini API...');

    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    // Transform chat messages to Gemini generateContent format
    // Gemini expects an ordered array of contents with parts. We'll include:
    // 1. System prompt (as initial content)
    // 2. Prior conversation messages mapped to user/model roles
    // 3. Current user message
    const geminiContents: Array<{ role?: string; parts: { text: string }[] }> = [];
    geminiContents.push({ parts: [{ text: CAMPUS_KNOWLEDGE }] });
    for (const m of messages || []) {
      if (m.role === 'user') {
        geminiContents.push({ role: 'user', parts: [{ text: m.content }] });
      } else if (m.role === 'assistant') {
        geminiContents.push({ role: 'model', parts: [{ text: m.content }] });
      }
      // ignore any stored system messages beyond our static CAMPUS_KNOWLEDGE
    }
    geminiContents.push({ role: 'user', parts: [{ text: message }] });

    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: geminiContents,
        generationConfig: {
          temperature: 0.7,
        }
      }),
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', geminiResponse.status, errorText);
      if (geminiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again shortly.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`Gemini API error: ${geminiResponse.status}`);
    }

    const aiData = await geminiResponse.json();
    const assistantMessage = aiData.candidates?.[0]?.content?.parts?.[0]?.text ?? 'Sorry, I could not generate a response.';

    console.log('Gemini response received, saving to database...');

    // Save assistant message
    const { error: assistantError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role: 'assistant',
        content: assistantMessage,
      });

    if (assistantError) {
      console.error('Error inserting assistant message:', assistantError);
      throw assistantError;
    }

    console.log('Chat message processed successfully');

    return new Response(
      JSON.stringify({ message: assistantMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in campus-chat function:', error);
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
