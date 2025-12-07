import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { AdminStats } from '@/types';
import { StatCard } from '@/components/common/StatCard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { DashboardCard } from '@/components/common/DashboardCard';
import {
  BarChart3,
  Users,
  Clock,
  Download,
  TrendingUp,
  FileText,
  MessageSquare,
  Activity,
} from 'lucide-react';

export const AdminDashboardPage = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const data = await api.getAdminStats();
      setStats(data);
      setIsLoading(false);
    };
    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Cargando estadísticas..." />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Panel de Administración</h1>
        <p className="text-muted-foreground mt-1">
          Resumen general del sistema
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          title="Total Evaluaciones"
          value={stats?.total_evaluaciones || 0}
          icon={FileText}
        />
        <StatCard
          title="Este Mes"
          value={stats?.evaluaciones_mes || 0}
          icon={BarChart3}
          trend={{ value: 8, positive: true }}
        />
        <StatCard
          title="En Proceso"
          value={stats?.evaluaciones_proceso || 0}
          icon={Activity}
          iconClassName="bg-warning/10"
        />
        <StatCard
          title="Tiempo Promedio"
          value={`${stats?.tiempo_promedio_analisis || 0}min`}
          icon={Clock}
        />
        <StatCard
          title="Usuarios Activos"
          value={stats?.usuarios_activos || 0}
          icon={Users}
          iconClassName="bg-accent/10"
        />
        <StatCard
          title="Descargas PDF"
          value={stats?.descargas || 0}
          icon={Download}
        />
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">Acciones rápidas</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <DashboardCard
            title="Gestión de usuarios"
            description="Administra cuentas, roles y permisos"
            icon={Users}
            to="/admin/users"
          />
          <DashboardCard
            title="Feedback global"
            description="Visualiza todas las evaluaciones"
            icon={MessageSquare}
            to="/admin/feedback"
          />
          <DashboardCard
            title="Reportes"
            description="Genera reportes y estadísticas"
            icon={TrendingUp}
            to="/admin"
          />
        </div>
      </div>

      {/* Activity feed placeholder */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">
          Actividad reciente
        </h2>
        <div className="space-y-4">
          {[
            { user: 'Juan García', action: 'subió una reunión', time: 'Hace 5 min' },
            { user: 'María López', action: 'completó una evaluación', time: 'Hace 15 min' },
            { user: 'Carlos Admin', action: 'creó un nuevo usuario', time: 'Hace 1 hora' },
            { user: 'Ana Martínez', action: 'descargó un PDF', time: 'Hace 2 horas' },
          ].map((activity, i) => (
            <div key={i} className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-medium text-primary">
                  {activity.user.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-sm text-foreground">
                  <span className="font-medium">{activity.user}</span>{' '}
                  {activity.action}
                </p>
                <p className="text-xs text-muted-foreground">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
