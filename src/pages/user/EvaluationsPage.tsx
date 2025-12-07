import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import { Evaluation } from '@/types';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Eye, FileAudio, FileText, Link as LinkIcon, RefreshCw } from 'lucide-react';

export const EvaluationsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEvaluations = async () => {
    if (user?.id) {
      setIsLoading(true);
      const data = await api.getUserEvaluations(user.id);
      setEvaluations(data);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvaluations();
  }, [user?.id]);

  const getTypeIcon = (tipo: string) => {
    switch (tipo) {
      case 'file':
        return <FileAudio className="h-4 w-4 text-primary" />;
      case 'transcript':
        return <FileText className="h-4 w-4 text-accent" />;
      case 'link':
        return <LinkIcon className="h-4 w-4 text-muted-foreground" />;
      default:
        return null;
    }
  };

  const getTypeLabel = (tipo: string) => {
    switch (tipo) {
      case 'file':
        return 'Archivo';
      case 'transcript':
        return 'Transcripción';
      case 'link':
        return 'Enlace';
      default:
        return tipo;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Cargando evaluaciones..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Mis evaluaciones</h1>
          <p className="text-muted-foreground mt-1">
            Historial de reuniones analizadas
          </p>
        </div>
        <Button variant="outline" onClick={fetchEvaluations}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {/* Evaluations table */}
      {evaluations.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center mb-4">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No tienes evaluaciones aún
          </h3>
          <p className="text-muted-foreground mb-6">
            Sube tu primera reunión para comenzar a recibir feedback
          </p>
          <Button variant="gradient" onClick={() => navigate('/upload')}>
            Subir reunión
          </Button>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Fecha</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {evaluations.map((evaluation) => (
                <TableRow key={evaluation.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium">
                    {new Date(evaluation.created_at).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </TableCell>
                  <TableCell>
                    <span className="line-clamp-1">
                      {evaluation.titulo || 'Sin título'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getTypeIcon(evaluation.submission?.tipo || 'file')}
                      <span className="text-sm">{getTypeLabel(evaluation.submission?.tipo || 'file')}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={evaluation.submission?.estado || 'procesando'} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/evaluation/${evaluation.submission_id}`)}
                      disabled={evaluation.submission?.estado !== 'completado'}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Feedback
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default EvaluationsPage;
