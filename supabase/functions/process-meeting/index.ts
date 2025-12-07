import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.86.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { submissionId } = await req.json();
    
    if (!submissionId) {
      throw new Error("submissionId is required");
    }

    console.log("Processing submission:", submissionId);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get submission data
    const { data: submission, error: submissionError } = await supabase
      .from('submissions')
      .select('*')
      .eq('id', submissionId)
      .single();

    if (submissionError || !submission) {
      console.error("Error fetching submission:", submissionError);
      throw new Error("Submission not found");
    }

    console.log("Submission found:", submission.tipo);

    // Get content to analyze
    let contentToAnalyze = "";

    if (submission.tipo === 'transcript') {
      contentToAnalyze = submission.transcript_text || "";
    } else if (submission.tipo === 'link') {
      contentToAnalyze = `Analyze meeting from link: ${submission.link}`;
    } else if (submission.tipo === 'file' && submission.archivo_url) {
      // For files, we'll analyze metadata since we can't process audio directly
      contentToAnalyze = `Audio file uploaded: ${submission.archivo_url}. Please provide general feedback structure for a meeting recording.`;
    }

    if (!contentToAnalyze) {
      throw new Error("No content to analyze");
    }

    console.log("Calling Lovable AI for analysis...");

    // Call Lovable AI for analysis
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Eres un experto en análisis de reuniones y comunicación empresarial. Tu tarea es analizar transcripciones o contenido de reuniones y proporcionar feedback estructurado.

Debes responder SIEMPRE en formato JSON válido con la siguiente estructura exacta:
{
  "titulo": "Título descriptivo de la reunión",
  "resumen": "Resumen ejecutivo de 2-3 oraciones",
  "fortalezas": ["Fortaleza 1", "Fortaleza 2", "Fortaleza 3"],
  "mejoras": ["Área de mejora 1", "Área de mejora 2"],
  "recomendaciones": ["Recomendación específica 1", "Recomendación específica 2", "Recomendación específica 3"],
  "score": 75
}

El score debe ser un número entre 0 y 100 que refleje la calidad general de la comunicación.
Proporciona feedback constructivo, específico y accionable.
Responde SOLO con el JSON, sin texto adicional.`
          },
          {
            role: "user",
            content: contentToAnalyze
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        throw new Error("Rate limit exceeded. Please try again later.");
      }
      if (aiResponse.status === 402) {
        throw new Error("AI credits exhausted. Please add more credits.");
      }
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log("AI response received");

    const aiContent = aiData.choices?.[0]?.message?.content;
    
    if (!aiContent) {
      throw new Error("No content in AI response");
    }

    // Parse the JSON response
    let feedback;
    try {
      // Clean the response in case it has markdown code blocks
      const cleanContent = aiContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      feedback = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("Error parsing AI response:", aiContent);
      throw new Error("Invalid AI response format");
    }

    console.log("Feedback parsed successfully");

    // Create evaluation record
    const { data: evaluation, error: evalError } = await supabase
      .from('evaluations')
      .insert({
        submission_id: submissionId,
        user_id: submission.user_id,
        titulo: feedback.titulo || "Evaluación de Reunión",
        resumen: feedback.resumen || "",
        fortalezas: feedback.fortalezas || [],
        mejoras: feedback.mejoras || [],
        recomendaciones: feedback.recomendaciones || [],
        score: Math.min(100, Math.max(0, feedback.score || 70))
      })
      .select()
      .single();

    if (evalError) {
      console.error("Error creating evaluation:", evalError);
      throw new Error("Failed to save evaluation");
    }

    console.log("Evaluation created:", evaluation.id);

    // Update submission status to completed
    const { error: updateError } = await supabase
      .from('submissions')
      .update({ estado: 'completado' })
      .eq('id', submissionId);

    if (updateError) {
      console.error("Error updating submission status:", updateError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        evaluationId: evaluation.id,
        feedback 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error processing meeting:", error);
    
    // Try to update submission status to error
    try {
      const { submissionId } = await req.json().catch(() => ({}));
      if (submissionId) {
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL')!,
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        );
        await supabase
          .from('submissions')
          .update({ estado: 'error' })
          .eq('id', submissionId);
      }
    } catch {}

    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
