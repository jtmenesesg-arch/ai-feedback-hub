import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Trash2, 
  Save, 
  Target, 
  MessageSquare, 
  Scale, 
  Sparkles,
  GripVertical,
  Loader2
} from 'lucide-react';

interface Criterio {
  nombre: string;
  peso: number;
  descripcion: string;
}

interface EscalaItem {
  min: number;
  max: number;
  etiqueta: string;
  color: string;
}

interface FeedbackConfig {
  id: string;
  criterios: Criterio[];
  tono: string;
  tono_descripcion: string | null;
  escala_min: number;
  escala_max: number;
  escala_descripcion: EscalaItem[];
  prompt_sistema: string | null;
  prompt_fortalezas: string | null;
  prompt_mejoras: string | null;
  prompt_recomendaciones: string | null;
  updated_at: string;
}

const TONOS = [
  { value: 'constructivo', label: 'Constructivo', desc: 'Feedback positivo orientado al crecimiento' },
  { value: 'directo', label: 'Directo', desc: 'Feedback claro y sin rodeos' },
  { value: 'motivacional', label: 'Motivacional', desc: 'Enfocado en motivar y empoderar' },
  { value: 'formal', label: 'Formal', desc: 'Tono profesional y corporativo' },
  { value: 'coaching', label: 'Coaching', desc: 'Estilo de mentoría y guía' },
];

const COLORES_ESCALA = [
  '#ef4444', // red
  '#f59e0b', // amber
  '#22c55e', // green
  '#10b981', // emerald
  '#3b82f6', // blue
];

const FeedbackConfigPage = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<FeedbackConfig | null>(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('feedback_config')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setConfig({
          ...data,
          criterios: Array.isArray(data.criterios) ? data.criterios as unknown as Criterio[] : [],
          escala_descripcion: Array.isArray(data.escala_descripcion) ? data.escala_descripcion as unknown as EscalaItem[] : [],
        });
      }
    } catch (error) {
      console.error('Error fetching config:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo cargar la configuración',
      });
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    if (!config) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('feedback_config')
        .update({
          criterios: JSON.parse(JSON.stringify(config.criterios)) as Json,
          tono: config.tono,
          tono_descripcion: config.tono_descripcion,
          escala_min: config.escala_min,
          escala_max: config.escala_max,
          escala_descripcion: JSON.parse(JSON.stringify(config.escala_descripcion)) as Json,
          prompt_sistema: config.prompt_sistema,
          prompt_fortalezas: config.prompt_fortalezas,
          prompt_mejoras: config.prompt_mejoras,
          prompt_recomendaciones: config.prompt_recomendaciones,
        })
        .eq('id', config.id);

      if (error) throw error;

      toast({
        title: 'Configuración guardada',
        description: 'Los cambios se aplicarán a las próximas evaluaciones',
      });
    } catch (error) {
      console.error('Error saving config:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo guardar la configuración',
      });
    } finally {
      setSaving(false);
    }
  };

  // Criterios handlers
  const addCriterio = () => {
    if (!config) return;
    setConfig({
      ...config,
      criterios: [...config.criterios, { nombre: '', peso: 0, descripcion: '' }],
    });
  };

  const updateCriterio = (index: number, field: keyof Criterio, value: string | number) => {
    if (!config) return;
    const newCriterios = [...config.criterios];
    newCriterios[index] = { ...newCriterios[index], [field]: value };
    setConfig({ ...config, criterios: newCriterios });
  };

  const removeCriterio = (index: number) => {
    if (!config) return;
    setConfig({
      ...config,
      criterios: config.criterios.filter((_, i) => i !== index),
    });
  };

  // Escala handlers
  const addEscalaItem = () => {
    if (!config) return;
    const lastItem = config.escala_descripcion[config.escala_descripcion.length - 1];
    const newMin = lastItem ? lastItem.max + 1 : config.escala_min;
    setConfig({
      ...config,
      escala_descripcion: [
        ...config.escala_descripcion,
        { min: newMin, max: newMin + 20, etiqueta: '', color: COLORES_ESCALA[config.escala_descripcion.length % COLORES_ESCALA.length] },
      ],
    });
  };

  const updateEscalaItem = (index: number, field: keyof EscalaItem, value: string | number) => {
    if (!config) return;
    const newEscala = [...config.escala_descripcion];
    newEscala[index] = { ...newEscala[index], [field]: value };
    setConfig({ ...config, escala_descripcion: newEscala });
  };

  const removeEscalaItem = (index: number) => {
    if (!config) return;
    setConfig({
      ...config,
      escala_descripcion: config.escala_descripcion.filter((_, i) => i !== index),
    });
  };

  const totalPeso = config?.criterios.reduce((sum, c) => sum + (c.peso || 0), 0) || 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!config) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No se encontró configuración</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Configuración de Feedback</h1>
          <p className="text-muted-foreground mt-1">
            Define cómo la IA evaluará y generará feedback para las reuniones
          </p>
        </div>
        <Button onClick={saveConfig} disabled={saving} size="lg">
          {saving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Guardar cambios
        </Button>
      </div>

      <Tabs defaultValue="criterios" className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="criterios" className="gap-2">
            <Target className="h-4 w-4" />
            Criterios
          </TabsTrigger>
          <TabsTrigger value="tono" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Tono
          </TabsTrigger>
          <TabsTrigger value="escala" className="gap-2">
            <Scale className="h-4 w-4" />
            Escala
          </TabsTrigger>
          <TabsTrigger value="prompts" className="gap-2">
            <Sparkles className="h-4 w-4" />
            Prompts
          </TabsTrigger>
        </TabsList>

        {/* Criterios Tab */}
        <TabsContent value="criterios" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Criterios de Evaluación
              </CardTitle>
              <CardDescription>
                Define los aspectos que la IA evaluará en cada reunión. El peso determina la importancia relativa.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {config.criterios.map((criterio, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg border"
                >
                  <GripVertical className="h-5 w-5 text-muted-foreground mt-2 cursor-move" />
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-1">
                      <Label className="text-xs text-muted-foreground">Nombre</Label>
                      <Input
                        value={criterio.nombre}
                        onChange={(e) => updateCriterio(index, 'nombre', e.target.value)}
                        placeholder="Ej: Comunicación"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Peso (%)</Label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={criterio.peso}
                        onChange={(e) => updateCriterio(index, 'peso', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-xs text-muted-foreground">Descripción</Label>
                      <Input
                        value={criterio.descripcion}
                        onChange={(e) => updateCriterio(index, 'descripcion', e.target.value)}
                        placeholder="Describe qué se evalúa..."
                      />
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeCriterio(index)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              <div className="flex items-center justify-between pt-4">
                <Button variant="outline" onClick={addCriterio}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar criterio
                </Button>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Peso total:</span>
                  <Badge variant={totalPeso === 100 ? 'default' : 'destructive'}>
                    {totalPeso}%
                  </Badge>
                  {totalPeso !== 100 && (
                    <span className="text-xs text-destructive">Debe sumar 100%</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tono Tab */}
        <TabsContent value="tono" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Tono del Feedback
              </CardTitle>
              <CardDescription>
                Configura el estilo de comunicación que usará la IA al generar el feedback.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>Selecciona el tono</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {TONOS.map((tono) => (
                    <div
                      key={tono.value}
                      onClick={() => setConfig({ ...config, tono: tono.value })}
                      className={`cursor-pointer p-4 rounded-lg border-2 transition-all ${
                        config.tono === tono.value
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <p className="font-medium">{tono.label}</p>
                      <p className="text-sm text-muted-foreground">{tono.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tono-desc">Descripción adicional del tono (opcional)</Label>
                <Textarea
                  id="tono-desc"
                  value={config.tono_descripcion || ''}
                  onChange={(e) => setConfig({ ...config, tono_descripcion: e.target.value })}
                  placeholder="Añade instrucciones específicas sobre el tono que quieres..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Escala Tab */}
        <TabsContent value="escala" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5" />
                Escala de Puntuación
              </CardTitle>
              <CardDescription>
                Define los rangos de puntuación y sus etiquetas descriptivas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Puntuación mínima</Label>
                  <Input
                    type="number"
                    value={config.escala_min}
                    onChange={(e) => setConfig({ ...config, escala_min: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Puntuación máxima</Label>
                  <Input
                    type="number"
                    value={config.escala_max}
                    onChange={(e) => setConfig({ ...config, escala_max: parseInt(e.target.value) || 100 })}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label>Rangos y etiquetas</Label>
                {config.escala_descripcion.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border"
                  >
                    <div
                      className="w-4 h-4 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <div className="grid grid-cols-4 gap-3 flex-1">
                      <Input
                        type="number"
                        value={item.min}
                        onChange={(e) => updateEscalaItem(index, 'min', parseInt(e.target.value) || 0)}
                        placeholder="Min"
                      />
                      <Input
                        type="number"
                        value={item.max}
                        onChange={(e) => updateEscalaItem(index, 'max', parseInt(e.target.value) || 0)}
                        placeholder="Max"
                      />
                      <Input
                        value={item.etiqueta}
                        onChange={(e) => updateEscalaItem(index, 'etiqueta', e.target.value)}
                        placeholder="Etiqueta"
                        className="col-span-2"
                      />
                    </div>
                    <Select
                      value={item.color}
                      onValueChange={(value) => updateEscalaItem(index, 'color', value)}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COLORES_ESCALA.map((color) => (
                          <SelectItem key={color} value={color}>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: color }}
                              />
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeEscalaItem(index)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" onClick={addEscalaItem}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar rango
                </Button>
              </div>

              {/* Preview */}
              <div className="p-4 bg-muted rounded-lg">
                <Label className="text-sm text-muted-foreground mb-3 block">Vista previa</Label>
                <div className="flex gap-2 flex-wrap">
                  {config.escala_descripcion.map((item, index) => (
                    <Badge
                      key={index}
                      style={{ backgroundColor: item.color, color: 'white' }}
                    >
                      {item.min}-{item.max}: {item.etiqueta || 'Sin etiqueta'}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Prompts Tab */}
        <TabsContent value="prompts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Prompts Personalizados
              </CardTitle>
              <CardDescription>
                Personaliza las instrucciones que recibe la IA para generar cada sección del feedback.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="prompt-sistema">Prompt del sistema (general)</Label>
                <Textarea
                  id="prompt-sistema"
                  value={config.prompt_sistema || ''}
                  onChange={(e) => setConfig({ ...config, prompt_sistema: e.target.value })}
                  placeholder="Instrucciones generales para la IA sobre cómo evaluar..."
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  Este prompt define el comportamiento general de la IA al evaluar reuniones.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="prompt-fortalezas">Prompt para fortalezas</Label>
                <Textarea
                  id="prompt-fortalezas"
                  value={config.prompt_fortalezas || ''}
                  onChange={(e) => setConfig({ ...config, prompt_fortalezas: e.target.value })}
                  placeholder="Instrucciones para identificar fortalezas..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="prompt-mejoras">Prompt para áreas de mejora</Label>
                <Textarea
                  id="prompt-mejoras"
                  value={config.prompt_mejoras || ''}
                  onChange={(e) => setConfig({ ...config, prompt_mejoras: e.target.value })}
                  placeholder="Instrucciones para identificar áreas de mejora..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="prompt-recomendaciones">Prompt para recomendaciones</Label>
                <Textarea
                  id="prompt-recomendaciones"
                  value={config.prompt_recomendaciones || ''}
                  onChange={(e) => setConfig({ ...config, prompt_recomendaciones: e.target.value })}
                  placeholder="Instrucciones para generar recomendaciones..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FeedbackConfigPage;
