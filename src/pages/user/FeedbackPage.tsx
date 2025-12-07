import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import { Evaluation } from '@/types';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  Download,
  Calendar,
  Target,
  ThumbsUp,
  AlertTriangle,
  Lightbulb,
  Award,
} from 'lucide-react';

export const FeedbackPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEvaluation = async () => {
      if (id) {
        const data = await api.getEvaluation(id);
        setEvaluation(data);
        setIsLoading(false);
      }
    };
    fetchEvaluation();
  }, [id]);

  const handleDownloadPdf = async () => {
    if (!id) return;
    
    toast({
      title: 'Generando PDF...',
      description: 'Por favor espera un momento',
    });

    const blob = await api.downloadPdf(id);
    
    if (blob) {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `evaluacion-${id}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } else {
      toast({
        title: 'Info',
        description: 'La descarga de PDF requiere configurar el backend',
      });
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-accent';
    if (score >= 60) return 'text-warning';
    return 'text-destructive';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excelente';
    if (score >= 80) return 'Muy bueno';
    if (score >= 70) return 'Bueno';
    if (score >= 60) return 'Regular';
    return 'Necesita mejora';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Cargando feedback..." />
      </div>
    );
  }

  if (!evaluation) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold text-foreground mb-4">
          Evaluación no encontrada
        </h2>
        <Button variant="outline" onClick={() => navigate('/evaluations')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a evaluaciones
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/evaluations')}
            className="mb-2 -ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <h1 className="text-3xl font-bold text-foreground">
            {evaluation.titulo || 'Evaluación'}
          </h1>
          <div className="flex items-center gap-4 mt-2 text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {new Date(evaluation.fecha || evaluation.created_at).toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>
        <Button variant="outline" onClick={handleDownloadPdf}>
          <Download className="h-4 w-4 mr-2" />
          Descargar PDF
        </Button>
      </div>

      {/* Score card */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={cn(
              'w-20 h-20 rounded-full flex items-center justify-center',
              'bg-gradient-to-br from-primary/20 to-accent/20'
            )}>
              <span className={cn('text-3xl font-bold', getScoreColor(evaluation.score))}>
                {evaluation.score}
              </span>
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground">
                Nota General
              </p>
              <p className={cn('text-sm font-medium', getScoreColor(evaluation.score))}>
                {getScoreLabel(evaluation.score)}
              </p>
            </div>
          </div>
          <Award className="h-12 w-12 text-primary/30" />
        </div>
      </div>

      {/* Summary */}
      {evaluation.resumen && (
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Resumen
          </h2>
          <p className="text-foreground leading-relaxed">
            {evaluation.resumen}
          </p>
        </div>
      )}

      {/* Strengths */}
      {evaluation.fortalezas && evaluation.fortalezas.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <ThumbsUp className="h-5 w-5 text-accent" />
            Fortalezas
          </h2>
          <ul className="space-y-3">
            {evaluation.fortalezas.map((item, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-accent/10 text-accent flex items-center justify-center text-sm font-medium shrink-0">
                  {index + 1}
                </span>
                <span className="text-foreground">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Improvements */}
      {evaluation.mejoras && evaluation.mejoras.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Áreas de mejora
          </h2>
          <ul className="space-y-3">
            {evaluation.mejoras.map((item, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-warning/10 text-warning flex items-center justify-center text-sm font-medium shrink-0">
                  {index + 1}
                </span>
                <span className="text-foreground">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendations */}
      {evaluation.recomendaciones && evaluation.recomendaciones.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            Recomendaciones
          </h2>
          <ul className="space-y-3">
            {evaluation.recomendaciones.map((item, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium shrink-0">
                  {index + 1}
                </span>
                <span className="text-foreground">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* No feedback yet */}
      {!evaluation.resumen && evaluation.estado === 'procesando' && (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-warning/10 flex items-center justify-center mb-4">
            <span className="text-3xl">⏳</span>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Evaluación en proceso
          </h3>
          <p className="text-muted-foreground">
            Tu reunión está siendo analizada. Recibirás el feedback pronto.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-4 justify-center pt-4">
        <Button variant="outline" onClick={() => navigate('/evaluations')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a evaluaciones
        </Button>
        <Button variant="gradient" onClick={() => navigate('/upload')}>
          Subir otra reunión
        </Button>
      </div>
    </div>
  );
};

export default FeedbackPage;
