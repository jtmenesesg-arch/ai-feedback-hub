import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import { Evaluation } from '@/types';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { jsPDF } from 'jspdf';
import {
  ArrowLeft,
  Download,
  Calendar,
  Target,
  ThumbsUp,
  AlertTriangle,
  Lightbulb,
  Award,
  Users,
} from 'lucide-react';

export const FeedbackPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

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
    if (!evaluation) return;
    
    setIsGeneratingPdf(true);
    toast({
      title: 'Generando PDF...',
      description: 'Por favor espera un momento',
    });

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      const contentWidth = pageWidth - margin * 2;
      let yPosition = 20;

      // Helper function to add text with word wrap
      const addWrappedText = (text: string, y: number, fontSize: number = 11, isBold: boolean = false) => {
        doc.setFontSize(fontSize);
        doc.setFont('helvetica', isBold ? 'bold' : 'normal');
        const lines = doc.splitTextToSize(text, contentWidth);
        doc.text(lines, margin, y);
        return y + (lines.length * fontSize * 0.4) + 4;
      };

      // Check if we need a new page
      const checkNewPage = (requiredSpace: number) => {
        if (yPosition + requiredSpace > doc.internal.pageSize.getHeight() - 20) {
          doc.addPage();
          yPosition = 20;
        }
      };

      // Header
      doc.setFillColor(26, 115, 232); // Primary blue
      doc.rect(0, 0, pageWidth, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('Evaluador AI', margin, 25);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Reporte de Evaluación', margin, 33);

      yPosition = 55;
      doc.setTextColor(0, 0, 0);

      // Title
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(evaluation.titulo || 'Evaluación', margin, yPosition);
      yPosition += 10;

      // Date
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      const dateStr = new Date(evaluation.fecha || evaluation.created_at).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      doc.text(`Fecha: ${dateStr}`, margin, yPosition);
      yPosition += 15;
      doc.setTextColor(0, 0, 0);

      // Score
      checkNewPage(30);
      doc.setFillColor(245, 247, 250);
      doc.roundedRect(margin, yPosition - 5, contentWidth, 25, 3, 3, 'F');
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Nota General:', margin + 5, yPosition + 8);
      doc.setFontSize(20);
      const scoreColor = evaluation.score >= 80 ? [0, 200, 83] : evaluation.score >= 60 ? [245, 158, 11] : [239, 68, 68];
      doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
      doc.text(`${evaluation.score}/100`, margin + 60, yPosition + 9);
      doc.setTextColor(0, 0, 0);
      yPosition += 30;

      // Participants
      if (evaluation.participantes && evaluation.participantes.length > 0) {
        checkNewPage(30);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Participantes', margin, yPosition);
        yPosition += 8;
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text(evaluation.participantes.join(', '), margin, yPosition);
        yPosition += 15;
      }

      // Summary
      if (evaluation.resumen) {
        checkNewPage(40);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Resumen', margin, yPosition);
        yPosition += 8;
        yPosition = addWrappedText(evaluation.resumen, yPosition);
        yPosition += 5;
      }

      // Strengths
      if (evaluation.fortalezas && evaluation.fortalezas.length > 0) {
        checkNewPage(40);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 200, 83);
        doc.text('Fortalezas', margin, yPosition);
        doc.setTextColor(0, 0, 0);
        yPosition += 8;
        evaluation.fortalezas.forEach((item, index) => {
          checkNewPage(15);
          yPosition = addWrappedText(`${index + 1}. ${item}`, yPosition);
        });
        yPosition += 5;
      }

      // Improvements
      if (evaluation.mejoras && evaluation.mejoras.length > 0) {
        checkNewPage(40);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(245, 158, 11);
        doc.text('Áreas de Mejora', margin, yPosition);
        doc.setTextColor(0, 0, 0);
        yPosition += 8;
        evaluation.mejoras.forEach((item, index) => {
          checkNewPage(15);
          yPosition = addWrappedText(`${index + 1}. ${item}`, yPosition);
        });
        yPosition += 5;
      }

      // Recommendations
      if (evaluation.recomendaciones && evaluation.recomendaciones.length > 0) {
        checkNewPage(40);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(26, 115, 232);
        doc.text('Recomendaciones', margin, yPosition);
        doc.setTextColor(0, 0, 0);
        yPosition += 8;
        evaluation.recomendaciones.forEach((item, index) => {
          checkNewPage(15);
          yPosition = addWrappedText(`${index + 1}. ${item}`, yPosition);
        });
      }

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `Generado por Evaluador AI - Página ${i} de ${pageCount}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }

      // Save
      const fileName = `evaluacion-${evaluation.titulo?.replace(/\s+/g, '-').toLowerCase() || id}.pdf`;
      doc.save(fileName);

      toast({
        title: 'PDF generado',
        description: 'El archivo se ha descargado correctamente',
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo generar el PDF',
      });
    } finally {
      setIsGeneratingPdf(false);
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
        <Button variant="outline" onClick={handleDownloadPdf} disabled={isGeneratingPdf}>
          {isGeneratingPdf ? (
            <LoadingSpinner size="sm" className="mr-2" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          {isGeneratingPdf ? 'Generando...' : 'Descargar PDF'}
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

      {/* Participants */}
      {evaluation.participantes && evaluation.participantes.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Participantes
          </h2>
          <div className="flex flex-wrap gap-2">
            {evaluation.participantes.map((nombre, index) => (
              <span
                key={index}
                className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium"
              >
                {nombre}
              </span>
            ))}
          </div>
        </div>
      )}

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
