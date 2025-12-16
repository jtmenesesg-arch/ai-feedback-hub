import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { compressAudioIfNeeded } from '@/utils/audioCompressor';
import {
  Upload,
  FileAudio,
  FileVideo,
  FileText,
  Link as LinkIcon,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

const ACCEPTED_TYPES = {
  audio: ['.mp3', '.wav', '.m4a'],
  video: ['.mp4'],
};
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB - we'll compress large files

export const UploadPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState('file');
  const [file, setFile] = useState<File | null>(null);
  const [transcript, setTranscript] = useState('');
  const [externalLink, setExternalLink] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [compressionStatus, setCompressionStatus] = useState<string | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateFile = (file: File): string | null => {
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    const allAccepted = [...ACCEPTED_TYPES.audio, ...ACCEPTED_TYPES.video];
    
    if (!allAccepted.includes(extension)) {
      return 'Tipo de archivo no permitido. Usa MP3, MP4, WAV o M4A.';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'El archivo excede el límite de 500MB.';
    }
    return null;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      const error = validateFile(droppedFile);
      if (error) {
        toast({ title: 'Error', description: error, variant: 'destructive' });
        return;
      }
      setFile(droppedFile);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const error = validateFile(selectedFile);
      if (error) {
        toast({ title: 'Error', description: error, variant: 'destructive' });
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleSubmit = async () => {
    if (!user?.id) return;

    let payload: { user_id: string; type: 'file' | 'transcript' | 'link'; file?: File; transcript?: string; link?: string };

    if (activeTab === 'file' && file) {
      setIsSubmitting(true);
      setCompressionStatus(null);
      
      try {
        // Compress audio if needed (files > 24MB)
        const compressionResult = await compressAudioIfNeeded(file, (status) => {
          setCompressionStatus(status);
        });
        
        if (compressionResult.wasCompressed) {
          toast({
            title: 'Audio comprimido',
            description: `${(compressionResult.originalSize / 1024 / 1024).toFixed(1)}MB → ${(compressionResult.compressedSize / 1024 / 1024).toFixed(1)}MB`,
          });
        }
        
        setCompressionStatus(null);
        payload = { user_id: user.id, type: 'file', file: compressionResult.file };
      } catch (error) {
        setIsSubmitting(false);
        setCompressionStatus(null);
        toast({
          title: 'Error de compresión',
          description: error instanceof Error ? error.message : 'No se pudo comprimir el archivo',
          variant: 'destructive',
        });
        return;
      }
    } else if (activeTab === 'transcript' && transcript.trim()) {
      payload = { user_id: user.id, type: 'transcript', transcript: transcript.trim() };
      setIsSubmitting(true);
    } else if (activeTab === 'link' && externalLink.trim()) {
      payload = { user_id: user.id, type: 'link', link: externalLink.trim() };
      setIsSubmitting(true);
    } else {
      toast({
        title: 'Error',
        description: 'Por favor proporciona el contenido a analizar',
        variant: 'destructive',
      });
      return;
    }

    const result = await api.submitMeeting(payload);
    setIsSubmitting(false);

    if (result.success) {
      setIsSuccess(true);
      toast({
        title: '¡Enviado correctamente!',
        description: 'Tu reunión está siendo procesada',
      });
    } else {
      toast({
        title: 'Error',
        description: result.error || 'No se pudo enviar la reunión',
        variant: 'destructive',
      });
    }
  };

  const getFileIcon = () => {
    if (!file) return <Upload className="h-10 w-10 text-muted-foreground" />;
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (['mp4'].includes(ext || '')) return <FileVideo className="h-10 w-10 text-primary" />;
    return <FileAudio className="h-10 w-10 text-primary" />;
  };

  if (isSuccess) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16 animate-slide-up">
        <div className="w-20 h-20 mx-auto rounded-full bg-accent/10 flex items-center justify-center mb-6">
          <CheckCircle className="h-10 w-10 text-accent" />
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-4">
          Tu evaluación está en proceso
        </h1>
        <p className="text-muted-foreground text-lg mb-8">
          Nuestro sistema de IA está analizando tu reunión. Recibirás una notificación cuando esté listo.
        </p>
        <div className="flex gap-4 justify-center">
          <Button variant="outline" onClick={() => setIsSuccess(false)}>
            Subir otra reunión
          </Button>
          <Button variant="gradient" onClick={() => navigate('/evaluations')}>
            Ver mis evaluaciones
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Subir reunión</h1>
        <p className="text-muted-foreground mt-1">
          Sube tu videollamada, pega la transcripción o comparte un enlace externo
        </p>
      </div>

      {/* Upload tabs */}
      <div className="bg-card rounded-xl border border-border p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="file" className="gap-2">
              <FileVideo className="h-4 w-4" />
              <span className="hidden sm:inline">Archivo</span>
            </TabsTrigger>
            <TabsTrigger value="transcript" className="gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Transcripción</span>
            </TabsTrigger>
            <TabsTrigger value="link" className="gap-2">
              <LinkIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Enlace</span>
            </TabsTrigger>
          </TabsList>

          {/* File upload */}
          <TabsContent value="file" className="space-y-4">
            <div
              className={cn(
                'upload-zone cursor-pointer',
                dragActive && 'upload-zone-active',
                file && 'border-primary bg-primary/5'
              )}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".mp3,.mp4,.wav,.m4a"
                onChange={handleFileSelect}
              />
              
              {file ? (
                <div className="flex items-center justify-center gap-4">
                  {getFileIcon()}
                  <div className="text-left">
                    <p className="font-medium text-foreground">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  {getFileIcon()}
                  <p className="text-foreground font-medium mt-4">
                    Arrastra tu archivo aquí o haz clic para seleccionar
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Formatos: MP3, MP4, WAV, M4A • Archivos grandes se comprimen automáticamente
                  </p>
                </>
              )}
            </div>
          </TabsContent>

          {/* Transcript */}
          <TabsContent value="transcript" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="transcript">Pega tu transcripción</Label>
              <Textarea
                id="transcript"
                placeholder="Pega aquí el texto de tu reunión..."
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                className="min-h-[300px] resize-none"
              />
              <p className="text-xs text-muted-foreground">
                {transcript.length} caracteres
              </p>
            </div>
          </TabsContent>

          {/* External link */}
          <TabsContent value="link" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="link">Enlace a la grabación</Label>
              <Input
                id="link"
                type="url"
                placeholder="https://drive.google.com/file/..."
                value={externalLink}
                onChange={(e) => setExternalLink(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Soportamos enlaces de Google Drive, Zoom, Meet y Dropbox
              </p>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 flex gap-3">
              <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground">Importante</p>
                <p>Asegúrate de que el enlace tenga permisos de acceso público o compartido con nuestro sistema.</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Submit button */}
        <div className="mt-6 pt-6 border-t border-border">
          <Button
            variant="gradient"
            size="lg"
            className="w-full"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {compressionStatus || 'Enviando...'}
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Enviar para análisis
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UploadPage;
