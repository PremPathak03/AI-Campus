import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CAMPUS_KNOWLEDGE = `You are AI Campus Assistant, a helpful AI assistant for college students.

CAMPUS INFORMATION:
- Campus Library: Open Monday-Friday 8AM-10PM, Saturday-Sunday 10AM-8PM. Located in Building A, floors 1-4.
- Student Services: Building B, 1st floor. Hours: Monday-Friday 9AM-5PM. Handles registration, financial aid, transcripts.
- Computer Labs: Available in Buildings A, C, and D. Open 24/7 with student ID card access.
- Cafeteria: Building E, serves breakfast 7AM-10AM, lunch 11AM-2PM, dinner 5PM-8PM.
- Gym & Recreation: Building F, open 6AM-10PM daily. Free for all students.
- Health Center: Building G, open Monday-Friday 8AM-5PM. Emergency services available 24/7.
- Parking: Student parking in Lots A, B, C. Visitor parking in Lot D. Parking permits required.
- Wi-Fi: Campus-wide Wi-Fi available. Network name: "CampusNet". Login with student credentials.
- Office Hours: Most professors hold office hours Tuesday/Thursday afternoons. Check your syllabus for specific times.
- Academic Advising: Schedule appointments through the Student Portal or visit Building B, 2nd floor.

BUILDING DIRECTORY:
- Building A: Library, Computer Labs (2nd floor), Study Rooms
- Building B: Administration, Student Services, Academic Advising
- Building C: Engineering & Sciences, Computer Labs (1st floor)
- Building D: Arts & Humanities, Computer Labs (basement)
- Building E: Cafeteria, Student Lounge
- Building F: Gym, Recreation Center, Pool
- Building G: Health Center, Counseling Services

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

    const { conversationId, message } = await req.json();

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

    console.log('Sending request to Lovable AI...');

    // Call Lovable AI
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: chatMessages,
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Lovable AI error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI service quota exceeded. Please contact support.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const assistantMessage = aiData.choices[0].message.content;

    console.log('AI response received, saving to database...');

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
