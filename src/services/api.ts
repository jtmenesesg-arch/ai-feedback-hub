import { Evaluation, UserStats, AdminStats, User, SubmissionPayload } from '@/types';

const API_BASE = 'https://api.mi-backend.com';

const getAuthHeaders = () => {
  const token = localStorage.getItem('evaluador_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
};

// Mock data for demo
const mockEvaluations: Evaluation[] = [
  {
    id: '1',
    submission_id: 's1',
    user_id: '1',
    titulo: 'Reunión de ventas - Cliente ABC',
    resumen: 'La reunión tuvo un buen desarrollo con una presentación clara de los productos. Se identificaron oportunidades de mejora en el cierre de ventas.',
    fortalezas: [
      'Excelente manejo del producto',
      'Comunicación clara y profesional',
      'Buena escucha activa',
      'Respuestas precisas a objeciones',
    ],
    mejoras: [
      'Mejorar técnicas de cierre',
      'Reducir tiempos muertos en la conversación',
      'Incluir más ejemplos de casos de éxito',
    ],
    recomendaciones: [
      'Practicar técnicas de cierre con role-playing',
      'Preparar casos de éxito antes de cada reunión',
      'Implementar pausas estratégicas para generar expectativa',
    ],
    score: 85,
    fecha: '2024-01-15T10:30:00Z',
    estado: 'completado',
    tipo: 'file',
  },
  {
    id: '2',
    submission_id: 's2',
    user_id: '1',
    titulo: 'Llamada de seguimiento - Prospecto XYZ',
    resumen: 'Seguimiento efectivo con buena gestión de expectativas del cliente.',
    fortalezas: [
      'Seguimiento oportuno',
      'Manejo adecuado de objeciones',
    ],
    mejoras: [
      'Preparar mejor la propuesta de valor',
    ],
    recomendaciones: [
      'Revisar el pitch de valor antes de cada llamada',
    ],
    score: 78,
    fecha: '2024-01-10T14:00:00Z',
    estado: 'completado',
    tipo: 'transcript',
  },
  {
    id: '3',
    submission_id: 's3',
    user_id: '1',
    titulo: 'Demo de producto',
    resumen: '',
    fortalezas: [],
    mejoras: [],
    recomendaciones: [],
    score: 0,
    fecha: '2024-01-18T09:00:00Z',
    estado: 'procesando',
    tipo: 'link',
  },
];

const mockUserStats: UserStats = {
  total_evaluaciones: 12,
  evaluaciones_mes: 3,
  promedio_score: 82,
  ultima_evaluacion: '2024-01-15T10:30:00Z',
};

const mockAdminStats: AdminStats = {
  total_evaluaciones: 156,
  evaluaciones_mes: 34,
  evaluaciones_proceso: 5,
  tiempo_promedio_analisis: 4.5,
  usuarios_activos: 28,
  descargas: 89,
};

const mockUsers: User[] = [
  { id: '1', nombre: 'Juan García', email: 'juan@empresa.com', rol: 'user', fecha_creacion: '2023-06-15', activo: true },
  { id: '2', nombre: 'María López', email: 'maria@empresa.com', rol: 'user', fecha_creacion: '2023-07-20', activo: true },
  { id: '3', nombre: 'Carlos Admin', email: 'admin@empresa.com', rol: 'admin', fecha_creacion: '2023-01-01', activo: true },
  { id: '4', nombre: 'Ana Martínez', email: 'ana@empresa.com', rol: 'user', fecha_creacion: '2023-09-10', activo: false },
];

export const api = {
  // User endpoints
  getUserStats: async (userId: string): Promise<UserStats> => {
    try {
      const response = await fetch(`${API_BASE}/user/${userId}/stats`, {
        headers: getAuthHeaders(),
      });
      if (response.ok) return response.json();
    } catch {}
    return mockUserStats;
  },

  getUserEvaluations: async (userId: string): Promise<Evaluation[]> => {
    try {
      const response = await fetch(`${API_BASE}/user/${userId}/evaluations`, {
        headers: getAuthHeaders(),
      });
      if (response.ok) return response.json();
    } catch {}
    return mockEvaluations;
  },

  getEvaluation: async (evaluationId: string): Promise<Evaluation | null> => {
    try {
      const response = await fetch(`${API_BASE}/evaluation/${evaluationId}`, {
        headers: getAuthHeaders(),
      });
      if (response.ok) return response.json();
    } catch {}
    return mockEvaluations.find(e => e.id === evaluationId) || null;
  },

  submitMeeting: async (payload: SubmissionPayload): Promise<{ success: boolean; id?: string; error?: string }> => {
    try {
      const formData = new FormData();
      formData.append('user_id', payload.user_id);
      formData.append('type', payload.type);
      
      if (payload.file) {
        formData.append('file', payload.file);
      }
      if (payload.transcript) {
        formData.append('transcript', payload.transcript);
      }
      if (payload.link) {
        formData.append('link', payload.link);
      }

      const response = await fetch(`${API_BASE}/submission`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('evaluador_token')}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        return { success: true, id: data.id };
      }
    } catch {}
    
    // Demo mode
    return { success: true, id: 'demo-' + Date.now() };
  },

  // Admin endpoints
  getAdminStats: async (): Promise<AdminStats> => {
    try {
      const response = await fetch(`${API_BASE}/admin/stats`, {
        headers: getAuthHeaders(),
      });
      if (response.ok) return response.json();
    } catch {}
    return mockAdminStats;
  },

  getAdminUsers: async (): Promise<User[]> => {
    try {
      const response = await fetch(`${API_BASE}/admin/users`, {
        headers: getAuthHeaders(),
      });
      if (response.ok) return response.json();
    } catch {}
    return mockUsers;
  },

  getAllEvaluations: async (): Promise<Evaluation[]> => {
    try {
      const response = await fetch(`${API_BASE}/admin/evaluations`, {
        headers: getAuthHeaders(),
      });
      if (response.ok) return response.json();
    } catch {}
    return mockEvaluations;
  },

  createUser: async (user: Omit<User, 'id' | 'fecha_creacion'>): Promise<{ success: boolean; user?: User; error?: string }> => {
    try {
      const response = await fetch(`${API_BASE}/admin/users`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(user),
      });
      if (response.ok) {
        const data = await response.json();
        return { success: true, user: data };
      }
    } catch {}
    return { 
      success: true, 
      user: { 
        ...user, 
        id: 'new-' + Date.now(), 
        fecha_creacion: new Date().toISOString() 
      } 
    };
  },

  updateUser: async (userId: string, updates: Partial<User>): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`${API_BASE}/admin/users/${userId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updates),
      });
      if (response.ok) return { success: true };
    } catch {}
    return { success: true };
  },

  deleteUser: async (userId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`${API_BASE}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (response.ok) return { success: true };
    } catch {}
    return { success: true };
  },

  downloadPdf: async (evaluationId: string): Promise<Blob | null> => {
    try {
      const response = await fetch(`${API_BASE}/evaluation/${evaluationId}/pdf`, {
        headers: getAuthHeaders(),
      });
      if (response.ok) return response.blob();
    } catch {}
    // Demo: return null to trigger a toast
    return null;
  },
};
