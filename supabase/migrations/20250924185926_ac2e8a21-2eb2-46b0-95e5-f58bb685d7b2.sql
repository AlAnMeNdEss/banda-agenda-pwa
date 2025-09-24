-- Adicionar colunas para funcionalidades avançadas de eventos
ALTER TABLE public.events
ADD COLUMN end_time time without time zone,
ADD COLUMN notes text,
ADD COLUMN participants jsonb DEFAULT '[]'::jsonb,
ADD COLUMN songs jsonb DEFAULT '[]'::jsonb,
ADD COLUMN attachments jsonb DEFAULT '[]'::jsonb;

-- Criar tabela para participantes de eventos (relacionamento many-to-many)
CREATE TABLE public.event_participants (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  confirmed boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Enable RLS
ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;

-- Políticas para event_participants
CREATE POLICY "Team members can view event participants" 
ON public.event_participants 
FOR SELECT 
USING (event_id IN (
  SELECT e.id FROM public.events e 
  INNER JOIN public.profiles p ON e.team_id = p.team_id 
  WHERE p.user_id = auth.uid()
));

CREATE POLICY "Team leaders and admins can manage event participants" 
ON public.event_participants 
FOR ALL 
USING (event_id IN (
  SELECT e.id FROM public.events e 
  INNER JOIN public.profiles p ON e.team_id = p.team_id 
  WHERE p.user_id = auth.uid() AND p.role IN ('admin', 'leader')
));

-- Criar tabela para músicas do evento (relacionamento many-to-many)
CREATE TABLE public.event_songs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  song_id uuid NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
  song_order integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(event_id, song_id)
);

-- Enable RLS
ALTER TABLE public.event_songs ENABLE ROW LEVEL SECURITY;

-- Políticas para event_songs
CREATE POLICY "Team members can view event songs" 
ON public.event_songs 
FOR SELECT 
USING (event_id IN (
  SELECT e.id FROM public.events e 
  INNER JOIN public.profiles p ON e.team_id = p.team_id 
  WHERE p.user_id = auth.uid()
));

CREATE POLICY "Team leaders and admins can manage event songs" 
ON public.event_songs 
FOR ALL 
USING (event_id IN (
  SELECT e.id FROM public.events e 
  INNER JOIN public.profiles p ON e.team_id = p.team_id 
  WHERE p.user_id = auth.uid() AND p.role IN ('admin', 'leader')
));

-- Trigger para updated_at
CREATE TRIGGER update_event_participants_updated_at
BEFORE UPDATE ON public.event_participants
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();