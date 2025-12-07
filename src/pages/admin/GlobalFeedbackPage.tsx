import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import { Evaluation } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Eye, Search, RefreshCw, FileAudio, FileText, Link as LinkIcon } from 'lucide-react';

export const GlobalFeedbackPage = () => {
  const navigate = useNavigate();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchEvaluations = async () => {
    setIsLoading(true);
    const data = await api.getAllEvaluations();
    setEvaluations(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchEvaluations();
  }, []);

  const filteredEvaluations = evaluations.filter(evaluation => {
    const matchesSearch = 
      (evaluation.titulo?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      evaluation.user_id.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || evaluation.estado === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getTypeIcon = (tipo?: string) => {
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
      <div>
        <h1 className="text-3xl font-bold text-foreground">Feedback Global</h1>
        <p className="text-muted-foreground mt-1">
          Todas las evaluaciones de la empresa
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título o usuario..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="completado">Completado</SelectItem>
            <SelectItem value="procesando">Procesando</SelectItem>
            <SelectItem value="error">Error</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={fetchEvaluations}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card rounded-lg border border-border p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{evaluations.length}</p>
          <p className="text-sm text-muted-foreground">Total</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-4 text-center">
          <p className="text-2xl font-bold text-accent">
            {evaluations.filter(e => e.estado === 'completado').length}
          </p>
          <p className="text-sm text-muted-foreground">Completadas</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-4 text-center">
          <p className="text-2xl font-bold text-warning">
            {evaluations.filter(e => e.estado === 'procesando').length}
          </p>
          <p className="text-sm text-muted-foreground">En proceso</p>
        </div>
      </div>

      {/* Evaluations table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Fecha</TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Usuario</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEvaluations.map((evaluation) => (
              <TableRow key={evaluation.id} className="hover:bg-muted/30">
                <TableCell>
                  {new Date(evaluation.fecha || evaluation.created_at).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </TableCell>
                <TableCell className="font-medium">
                  <span className="line-clamp-1">
                    {evaluation.titulo || 'Sin título'}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {evaluation.user_id.slice(0, 8)}...
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getTypeIcon(evaluation.tipo)}
                  </div>
                </TableCell>
                <TableCell>
                  {evaluation.estado === 'completado' ? (
                    <span className="font-semibold">{evaluation.score}%</span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <StatusBadge status={evaluation.estado || 'procesando'} />
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/evaluation/${evaluation.submission_id}`)}
                    disabled={evaluation.estado !== 'completado'}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Ver
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default GlobalFeedbackPage;
