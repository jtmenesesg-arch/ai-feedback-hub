import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import { Evaluation, UserStats } from '@/types';
import { StatCard } from '@/components/common/StatCard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { TrendingUp, Target, Award, Calendar, BarChart3 } from 'lucide-react';

export const ProgressPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (user?.id) {
        const [statsData, evalsData] = await Promise.all([
          api.getUserStats(user.id),
          api.getUserEvaluations(user.id),
        ]);
        setStats(statsData);
        setEvaluations(evalsData.filter(e => e.estado === 'completado'));
        setIsLoading(false);
      }
    };
    fetchData();
  }, [user?.id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Cargando progreso..." />
      </div>
    );
  }

  const completedEvaluations = evaluations.filter(e => e.estado === 'completado');
  const averageScore = completedEvaluations.length > 0
    ? Math.round(completedEvaluations.reduce((sum, e) => sum + e.score, 0) / completedEvaluations.length)
    : 0;

  const recentScores = completedEvaluations.slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Mi progreso</h1>
        <p className="text-muted-foreground mt-1">
          Visualiza tu evolución y mejora continua
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Evaluaciones"
          value={stats?.total_evaluaciones || 0}
          icon={BarChart3}
        />
        <StatCard
          title="Score Promedio"
          value={`${averageScore}%`}
          icon={Target}
          iconClassName="bg-accent/10"
        />
        <StatCard
          title="Este Mes"
          value={stats?.evaluaciones_mes || 0}
          icon={Calendar}
          trend={{ value: 15, positive: true }}
        />
        <StatCard
          title="Mejor Score"
          value={`${Math.max(...completedEvaluations.map(e => e.score), 0)}%`}
          icon={Award}
          iconClassName="bg-warning/10"
        />
      </div>

      {/* Progress chart placeholder */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Evolución de scores
        </h2>
        
        {recentScores.length > 0 ? (
          <div className="space-y-4">
            {recentScores.map((evaluation, index) => (
              <div key={evaluation.id} className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground w-24 shrink-0">
                  {new Date(evaluation.fecha).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </span>
                <div className="flex-1 h-8 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500"
                    style={{ 
                      width: `${evaluation.score}%`,
                      animationDelay: `${index * 100}ms`,
                    }}
                  />
                </div>
                <span className="font-semibold text-foreground w-12 text-right">
                  {evaluation.score}%
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>No hay datos suficientes para mostrar el progreso</p>
            <p className="text-sm">Completa más evaluaciones para ver tu evolución</p>
          </div>
        )}
      </div>

      {/* Performance summary */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="font-semibold text-foreground mb-4">Fortalezas más comunes</h3>
          <div className="space-y-2">
            {['Comunicación clara', 'Manejo del producto', 'Escucha activa'].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className="w-2 h-2 rounded-full bg-accent" />
                <span className="text-foreground">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="font-semibold text-foreground mb-4">Áreas a mejorar</h3>
          <div className="space-y-2">
            {['Técnicas de cierre', 'Manejo del tiempo', 'Seguimiento'].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className="w-2 h-2 rounded-full bg-warning" />
                <span className="text-foreground">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressPage;
