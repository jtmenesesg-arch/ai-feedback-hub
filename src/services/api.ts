import { supabase } from '@/integrations/supabase/client';
import { Evaluation, UserStats, AdminStats, User, Profile } from '@/types';

export const api = {
  // User endpoints
  getUserStats: async (userId: string): Promise<UserStats> => {
    const { data: submissions } = await supabase
      .from('submissions')
      .select('id, created_at')
      .eq('user_id', userId);

    const { data: evaluations } = await supabase
      .from('evaluations')
      .select('score, created_at')
      .eq('user_id', userId);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const totalEvaluaciones = submissions?.length || 0;
    const evaluacionesMes = submissions?.filter(
      s => new Date(s.created_at) >= startOfMonth
    ).length || 0;
    
    const scores = evaluations?.map(e => e.score).filter(s => s !== null && s > 0) || [];
    const promedioScore = scores.length > 0 
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;

    const ultimaEvaluacion = submissions?.length 
      ? submissions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]?.created_at
      : undefined;

    return {
      total_evaluaciones: totalEvaluaciones,
      evaluaciones_mes: evaluacionesMes,
      promedio_score: promedioScore,
      ultima_evaluacion: ultimaEvaluacion,
    };
  },

  getUserEvaluations: async (userId: string): Promise<Evaluation[]> => {
    const { data: submissions } = await supabase
      .from('submissions')
      .select(`
        id,
        user_id,
        tipo,
        estado,
        created_at,
        evaluations (
          id,
          titulo,
          resumen,
          participantes,
          fortalezas,
          mejoras,
          recomendaciones,
          score
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!submissions) return [];

    return submissions.map(sub => {
      const eval_ = sub.evaluations?.[0];
      return {
        id: eval_?.id || sub.id,
        submission_id: sub.id,
        user_id: sub.user_id,
        titulo: eval_?.titulo || null,
        resumen: eval_?.resumen || null,
        participantes: eval_?.participantes || [],
        fortalezas: eval_?.fortalezas || [],
        mejoras: eval_?.mejoras || [],
        recomendaciones: eval_?.recomendaciones || [],
        score: eval_?.score || 0,
        created_at: sub.created_at,
        fecha: sub.created_at,
        estado: sub.estado,
        tipo: sub.tipo,
        submission: {
          tipo: sub.tipo,
          estado: sub.estado,
        },
      };
    });
  },

  getEvaluation: async (evaluationId: string): Promise<Evaluation | null> => {
    // First try to get by evaluation id
    const { data } = await supabase
      .from('evaluations')
      .select(`
        *,
        submissions (
          tipo,
          estado,
          created_at
        )
      `)
      .eq('id', evaluationId)
      .maybeSingle();

    // If not found, try by submission id
    if (!data) {
      const { data: submission } = await supabase
        .from('submissions')
        .select(`
          *,
          evaluations (*)
        `)
        .eq('id', evaluationId)
        .maybeSingle();

      if (submission) {
        const eval_ = submission.evaluations?.[0];
        return {
          id: eval_?.id || submission.id,
          submission_id: submission.id,
          user_id: submission.user_id,
          titulo: eval_?.titulo || null,
          resumen: eval_?.resumen || null,
          participantes: eval_?.participantes || [],
          fortalezas: eval_?.fortalezas || [],
          mejoras: eval_?.mejoras || [],
          recomendaciones: eval_?.recomendaciones || [],
          score: eval_?.score || 0,
          created_at: submission.created_at,
          fecha: submission.created_at,
          estado: submission.estado,
          tipo: submission.tipo,
          submission: {
            tipo: submission.tipo,
            estado: submission.estado,
          },
        };
      }
      return null;
    }

    return {
      id: data.id,
      submission_id: data.submission_id,
      user_id: data.user_id,
      titulo: data.titulo,
      resumen: data.resumen,
      participantes: data.participantes || [],
      fortalezas: data.fortalezas || [],
      mejoras: data.mejoras || [],
      recomendaciones: data.recomendaciones || [],
      score: data.score || 0,
      created_at: data.created_at,
      fecha: data.submissions?.created_at || data.created_at,
      estado: data.submissions?.estado,
      tipo: data.submissions?.tipo,
      submission: data.submissions ? {
        tipo: data.submissions.tipo,
        estado: data.submissions.estado,
      } : undefined,
    };
  },

  submitMeeting: async (payload: {
    user_id: string;
    type: 'file' | 'transcript' | 'link';
    file?: File;
    transcript?: string;
    link?: string;
  }): Promise<{ success: boolean; id?: string; error?: string }> => {
    try {
      let archivo_url: string | null = null;

      // Upload file if present
      if (payload.file) {
        const fileExt = payload.file.name.split('.').pop();
        const fileName = `${payload.user_id}/${Date.now()}.${fileExt}`;
        
        console.log('Uploading file:', fileName);
        
        const { error: uploadError } = await supabase.storage
          .from('recordings')
          .upload(fileName, payload.file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          return { success: false, error: uploadError.message };
        }

        // Store the file path (not URL) - edge function will download with service role
        archivo_url = `recordings/${fileName}`;
        console.log('File uploaded successfully:', archivo_url);
      }

      // Create submission
      console.log('Creating submission...');
      const { data, error } = await supabase
        .from('submissions')
        .insert({
          user_id: payload.user_id,
          tipo: payload.type,
          archivo_url,
          transcript_text: payload.transcript || null,
          link: payload.link || null,
        })
        .select()
        .single();

      if (error) {
        console.error('Submission error:', error);
        return { success: false, error: error.message };
      }

      console.log('Submission created:', data.id);

      // Trigger AI processing in background
      supabase.functions.invoke('process-meeting', {
        body: { submissionId: data.id }
      }).catch(err => {
        console.error('Error triggering AI processing:', err);
      });

      return { success: true, id: data.id };
    } catch (error) {
      console.error('Submit error:', error);
      return { success: false, error: 'Error al enviar' };
    }
  },

  // Admin endpoints
  getAdminStats: async (): Promise<AdminStats> => {
    const { data: allSubmissions } = await supabase
      .from('submissions')
      .select('id, estado, created_at');

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, activo');

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const total = allSubmissions?.length || 0;
    const thisMonth = allSubmissions?.filter(
      s => new Date(s.created_at) >= startOfMonth
    ).length || 0;
    const processing = allSubmissions?.filter(
      s => s.estado === 'procesando'
    ).length || 0;
    const activeUsers = profiles?.filter(p => p.activo).length || 0;

    return {
      total_evaluaciones: total,
      evaluaciones_mes: thisMonth,
      evaluaciones_proceso: processing,
      tiempo_promedio_analisis: 4.5,
      usuarios_activos: activeUsers,
      descargas: 0,
    };
  },

  getAdminUsers: async (): Promise<User[]> => {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (!profiles) return [];

    // Get roles for each user
    const userIds = profiles.map(p => p.user_id);
    const { data: roles } = await supabase
      .from('user_roles')
      .select('user_id, role')
      .in('user_id', userIds);

    const roleMap = new Map(roles?.map(r => [r.user_id, r.role]) || []);

    return profiles.map(p => ({
      id: p.id,
      user_id: p.user_id,
      nombre: p.nombre,
      email: p.email,
      rol: (roleMap.get(p.user_id) || 'user') as 'admin' | 'user',
      fecha_creacion: p.created_at,
      activo: p.activo,
    }));
  },

  getAllEvaluations: async (): Promise<Evaluation[]> => {
    const { data: submissions } = await supabase
      .from('submissions')
      .select(`
        id,
        user_id,
        tipo,
        estado,
        created_at,
        evaluations (
          id,
          titulo,
          resumen,
          participantes,
          fortalezas,
          mejoras,
          recomendaciones,
          score
        )
      `)
      .order('created_at', { ascending: false });

    if (!submissions) return [];

    return submissions.map(sub => {
      const eval_ = sub.evaluations?.[0];
      return {
        id: eval_?.id || sub.id,
        submission_id: sub.id,
        user_id: sub.user_id,
        titulo: eval_?.titulo || null,
        resumen: eval_?.resumen || null,
        participantes: eval_?.participantes || [],
        fortalezas: eval_?.fortalezas || [],
        mejoras: eval_?.mejoras || [],
        recomendaciones: eval_?.recomendaciones || [],
        score: eval_?.score || 0,
        created_at: sub.created_at,
        fecha: sub.created_at,
        estado: sub.estado,
        tipo: sub.tipo,
        submission: {
          tipo: sub.tipo,
          estado: sub.estado,
        },
      };
    });
  },

  createUser: async (userData: {
    email: string;
    password: string;
    nombre: string;
    rol: 'admin' | 'user';
  }): Promise<{ success: boolean; user?: User; error?: string }> => {
    try {
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: userData
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.error) {
        return { success: false, error: data.error };
      }

      return { 
        success: true, 
        user: {
          id: data.user.id,
          user_id: data.user.id,
          nombre: data.user.nombre,
          email: data.user.email,
          rol: userData.rol,
          fecha_creacion: new Date().toISOString(),
          activo: true,
        }
      };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error al crear usuario' 
      };
    }
  },

  updateUser: async (userId: string, updates: Partial<User>): Promise<{ success: boolean; error?: string }> => {
    // Update profile
    if (updates.nombre || updates.activo !== undefined) {
      const { error } = await supabase
        .from('profiles')
        .update({
          nombre: updates.nombre,
          activo: updates.activo,
        })
        .eq('user_id', userId);

      if (error) {
        return { success: false, error: error.message };
      }
    }

    // Update role if provided
    if (updates.rol) {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: updates.rol })
        .eq('user_id', userId);

      if (error) {
        return { success: false, error: error.message };
      }
    }

    return { success: true };
  },

  deleteUser: async (userId: string): Promise<{ success: boolean; error?: string }> => {
    // Note: Deleting users requires admin API
    return { 
      success: false, 
      error: 'La eliminación de usuarios requiere una función backend.' 
    };
  },

  downloadPdf: async (evaluationId: string): Promise<Blob | null> => {
    // PDF generation would be done by backend
    return null;
  },
};
