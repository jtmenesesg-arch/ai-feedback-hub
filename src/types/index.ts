export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  user_id: string;
  nombre: string;
  email: string;
  rol: UserRole;
  fecha_creacion: string;
  activo?: boolean;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

export interface Submission {
  id: string;
  user_id: string;
  tipo: 'file' | 'transcript' | 'link';
  estado: 'procesando' | 'completado' | 'error';
  archivo_url?: string;
  transcript_text?: string;
  link?: string;
  created_at: string;
}

export interface Evaluation {
  id: string;
  submission_id: string;
  user_id: string;
  titulo?: string | null;
  resumen: string | null;
  fortalezas: string[];
  mejoras: string[];
  recomendaciones: string[];
  score: number;
  created_at: string;
  fecha?: string;
  estado?: 'procesando' | 'completado' | 'error';
  tipo?: 'file' | 'transcript' | 'link';
  submission?: {
    tipo: 'file' | 'transcript' | 'link';
    estado: 'procesando' | 'completado' | 'error';
  };
}

export interface UserStats {
  total_evaluaciones: number;
  evaluaciones_mes: number;
  promedio_score: number;
  ultima_evaluacion?: string;
}

export interface AdminStats {
  total_evaluaciones: number;
  evaluaciones_mes: number;
  evaluaciones_proceso: number;
  tiempo_promedio_analisis: number;
  usuarios_activos: number;
  descargas: number;
}

export interface SubmissionPayload {
  user_id: string;
  type: 'file' | 'transcript' | 'link';
  file?: File;
  transcript?: string;
  link?: string;
}

export interface Profile {
  id: string;
  user_id: string;
  nombre: string;
  email: string;
  activo: boolean;
  created_at: string;
  role?: UserRole;
}
