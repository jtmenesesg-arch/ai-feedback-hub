-- Create table for global feedback configuration (admin-only)
CREATE TABLE public.feedback_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Evaluation criteria
  criterios JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Example: [{"nombre": "Comunicación", "peso": 25, "descripcion": "Claridad y efectividad..."}, ...]
  
  -- Tone configuration
  tono TEXT NOT NULL DEFAULT 'constructivo',
  tono_descripcion TEXT,
  
  -- Scoring scale
  escala_min INTEGER NOT NULL DEFAULT 0,
  escala_max INTEGER NOT NULL DEFAULT 100,
  escala_descripcion JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Example: [{"min": 0, "max": 40, "etiqueta": "Necesita mejora"}, {"min": 41, "max": 70, "etiqueta": "Bueno"}, ...]
  
  -- Custom prompts
  prompt_sistema TEXT,
  prompt_fortalezas TEXT,
  prompt_mejoras TEXT,
  prompt_recomendaciones TEXT,
  
  -- Metadata
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.feedback_config ENABLE ROW LEVEL SECURITY;

-- Only admins can view config
CREATE POLICY "Admins can view feedback config"
ON public.feedback_config
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can update config
CREATE POLICY "Admins can update feedback config"
ON public.feedback_config
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can insert config
CREATE POLICY "Admins can insert feedback config"
ON public.feedback_config
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_feedback_config_updated_at
BEFORE UPDATE ON public.feedback_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default configuration
INSERT INTO public.feedback_config (
  criterios,
  tono,
  tono_descripcion,
  escala_min,
  escala_max,
  escala_descripcion,
  prompt_sistema
) VALUES (
  '[
    {"nombre": "Comunicación", "peso": 25, "descripcion": "Claridad, escucha activa y expresión de ideas"},
    {"nombre": "Liderazgo", "peso": 25, "descripcion": "Capacidad de guiar y motivar al equipo"},
    {"nombre": "Colaboración", "peso": 25, "descripcion": "Trabajo en equipo y apoyo a compañeros"},
    {"nombre": "Resolución de problemas", "peso": 25, "descripcion": "Análisis y solución efectiva de desafíos"}
  ]'::jsonb,
  'constructivo',
  'Feedback positivo y orientado al crecimiento profesional',
  0,
  100,
  '[
    {"min": 0, "max": 40, "etiqueta": "Necesita mejora", "color": "#ef4444"},
    {"min": 41, "max": 70, "etiqueta": "Bueno", "color": "#f59e0b"},
    {"min": 71, "max": 85, "etiqueta": "Muy bueno", "color": "#22c55e"},
    {"min": 86, "max": 100, "etiqueta": "Excelente", "color": "#10b981"}
  ]'::jsonb,
  'Eres un evaluador de desempeño profesional. Analiza las reuniones de forma objetiva, identifica fortalezas y áreas de mejora, y proporciona recomendaciones accionables para el crecimiento del empleado.'
);