import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import { UserStats } from '@/types';
import { DashboardCard } from '@/components/common/DashboardCard';
import { StatCard } from '@/components/common/StatCard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Upload, FileText, TrendingUp, Settings, BarChart3, Award, Clock, Target } from 'lucide-react';

export const DashboardPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (user?.id) {
        const data = await api.getUserStats(user.id);
        setStats(data);
        setIsLoading(false);
      }
    };
    fetchStats();
  }, [user?.id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Cargando dashboard..." />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Bienvenido, aquí tienes un resumen de tu actividad
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Evaluaciones"
          value={stats?.total_evaluaciones || 0}
          icon={FileText}
          description="Reuniones analizadas"
        />
        <StatCard
          title="Este Mes"
          value={stats?.evaluaciones_mes || 0}
          icon={BarChart3}
          trend={{ value: 12, positive: true }}
        />
        <StatCard
          title="Score Promedio"
          value={`${stats?.promedio_score || 0}%`}
          icon={Target}
          iconClassName="bg-accent/10"
        />
        <StatCard
          title="Última Evaluación"
          value={stats?.ultima_evaluacion ? new Date(stats.ultima_evaluacion).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : '-'}
          icon={Clock}
        />
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">Acciones rápidas</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <DashboardCard
            title="📤 Subir mi reunión"
            description="Analiza una nueva videollamada o transcripción"
            icon={Upload}
            to="/upload"
          />
          <DashboardCard
            title="📝 Mis evaluaciones"
            description="Revisa el historial de tus análisis"
            icon={FileText}
            to="/evaluations"
          />
          <DashboardCard
            title="📈 Progreso"
            description="Visualiza tu evolución en el tiempo"
            icon={TrendingUp}
            to="/progress"
          />
          <DashboardCard
            title="⚙️ Configuración"
            description="Ajusta tus preferencias de cuenta"
            icon={Settings}
            to="/settings"
          />
        </div>
      </div>

      {/* Recent activity placeholder */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" />
          Logros recientes
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="p-4 rounded-lg bg-muted/50 text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <span className="text-2xl">🎯</span>
            </div>
            <p className="font-medium text-foreground">Primera evaluación</p>
            <p className="text-sm text-muted-foreground">¡Completaste tu primera evaluación!</p>
          </div>
          <div className="p-4 rounded-lg bg-muted/50 text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-accent/10 flex items-center justify-center mb-3">
              <span className="text-2xl">📈</span>
            </div>
            <p className="font-medium text-foreground">Mejora continua</p>
            <p className="text-sm text-muted-foreground">Tu score subió 5 puntos</p>
          </div>
          <div className="p-4 rounded-lg bg-muted/50 text-center opacity-50">
            <div className="w-12 h-12 mx-auto rounded-full bg-muted flex items-center justify-center mb-3">
              <span className="text-2xl">🔒</span>
            </div>
            <p className="font-medium text-foreground">Próximo logro</p>
            <p className="text-sm text-muted-foreground">Completa 10 evaluaciones</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
