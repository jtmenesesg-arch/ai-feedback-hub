import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.86.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Transcribe audio file using OpenAI Whisper
async function transcribeAudio(filePath: string, supabase: any): Promise<string> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  
  if (!openaiApiKey) {
    throw new Error("OPENAI_API_KEY not configured");
  }

  console.log("Downloading audio file from storage:", filePath);
  
  // Parse the file path - format: "recordings/user_id/timestamp.ext"
  const parts = filePath.split('/');
  if (parts.length < 2) {
    throw new Error("Invalid file path format");
  }
  
  const bucket = parts[0]; // "recordings"
  const objectPath = parts.slice(1).join('/'); // "user_id/timestamp.ext"
  
  console.log(`Downloading from bucket: ${bucket}, path: ${objectPath}`);
  
  // Download the file from storage using service role
  const { data: fileData, error: downloadError } = await supabase
    .storage
    .from(bucket)
    .download(objectPath);
  
  if (downloadError || !fileData) {
    console.error("Error downloading file:", downloadError);
    throw new Error(`Failed to download audio file: ${downloadError?.message}`);
  }

  const fileSizeBytes = fileData.size;
  const fileSizeMB = fileSizeBytes / (1024 * 1024);
  console.log("Audio file downloaded, size:", fileSizeBytes, "bytes (", fileSizeMB.toFixed(2), "MB)");

  // Whisper API has a 25MB limit
  if (fileSizeMB > 25) {
    throw new Error(`Audio file too large for transcription (${fileSizeMB.toFixed(1)}MB). Maximum is 25MB.`);
  }

  // Create FormData for Whisper API
  const formData = new FormData();
  
  // Determine file extension from path
  const extension = objectPath.split('.').pop()?.toLowerCase() || 'mp3';
  const mimeTypes: Record<string, string> = {
    'mp3': 'audio/mpeg',
    'mp4': 'video/mp4',
    'wav': 'audio/wav',
    'm4a': 'audio/mp4',
    'webm': 'audio/webm',
    'ogg': 'audio/ogg',
  };
  
  const mimeType = mimeTypes[extension] || 'audio/mpeg';
  const blob = new Blob([fileData], { type: mimeType });
  formData.append('file', blob, `audio.${extension}`);
  formData.append('model', 'whisper-1');
  formData.append('language', 'es'); // Spanish

  console.log("Sending to Whisper API for transcription, mime:", mimeType);

  const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
    },
    body: formData,
  });

  if (!whisperResponse.ok) {
    const errorText = await whisperResponse.text();
    console.error("Whisper API error:", whisperResponse.status, "response:", errorText);
    
    // Parse error if possible
    let errorMsg = `Whisper transcription failed: ${whisperResponse.status}`;
    try {
      const errorJson = JSON.parse(errorText);
      if (errorJson.error?.message) {
        errorMsg = `Whisper error: ${errorJson.error.message}`;
      }
    } catch {}
    
    throw new Error(errorMsg);
  }

  const result = await whisperResponse.json();
  console.log("Transcription complete, length:", result.text?.length, "chars");
  
  return result.text;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // IMPORTANT: keep submissionId outside try so we can update status on failures
  let submissionId: string | undefined;

  try {
    const body = await req.json().catch(() => ({}));
    submissionId = body?.submissionId;

    if (!submissionId) {
      return new Response(
        JSON.stringify({ error: "submissionId is required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
      // Transcribe audio/video file using Whisper
      console.log("File submission detected, starting transcription...");
      try {
        const transcription = await transcribeAudio(submission.archivo_url, supabase);
        contentToAnalyze = transcription;

        // Save transcription to submission for reference
        await supabase
          .from('submissions')
          .update({ transcript_text: transcription })
          .eq('id', submissionId);

        console.log("Transcription saved to submission");
      } catch (transcribeError) {
        console.error("Transcription error:", transcribeError);
        throw new Error(
          `Error transcribing audio: ${transcribeError instanceof Error ? transcribeError.message : 'Unknown error'}`
        );
      }
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
  "participantes": ["Nombre Participante 1", "Nombre Participante 2"],
  "fortalezas": ["Fortaleza 1", "Fortaleza 2", "Fortaleza 3"],
  "mejoras": ["Área de mejora 1", "Área de mejora 2"],
  "recomendaciones": ["Recomendación específica 1", "Recomendación específica 2", "Recomendación específica 3"],
  "score": 75
}

IMPORTANTE: Extrae los nombres de los participantes mencionados en la transcripción o contenido.
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
        participantes: feedback.participantes || [],
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

    // Always try to update submission status to error (avoid re-reading req.json())
    try {
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
    } catch (statusErr) {
      console.error("Failed to mark submission as error:", statusErr);
    }

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
