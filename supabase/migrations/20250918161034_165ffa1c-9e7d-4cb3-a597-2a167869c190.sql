-- Create events table for ministry events and rehearsals
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_time TIME NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('evento', 'ensaio')),
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create songs table for the music repertoire
CREATE TABLE public.songs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  musical_key TEXT,
  bpm INTEGER,
  category TEXT NOT NULL CHECK (category IN ('louvor', 'adoracao')),
  is_favorite BOOLEAN DEFAULT false,
  lyrics TEXT,
  chords TEXT,
  last_played DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since this is a ministry app, we'll allow public access for now)
-- In a real scenario, you might want to add authentication and user-specific policies

-- Events policies
CREATE POLICY "Allow all operations on events" 
ON public.events 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Songs policies  
CREATE POLICY "Allow all operations on songs"
ON public.songs
FOR ALL
USING (true)
WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_songs_updated_at
  BEFORE UPDATE ON public.songs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample data
INSERT INTO public.events (title, description, event_date, event_time, event_type, location) VALUES
('Culto Dominical', 'Culto dominical noturno', '2024-01-21', '18:30', 'evento', 'Santuário Principal'),
('Ensaio Geral', 'Ensaio para o culto dominical', '2024-01-20', '19:00', 'ensaio', 'Sala de Ensaio'),
('Culto de Oração', 'Culto de oração e jejum', '2024-01-23', '19:30', 'evento', 'Santuário Principal'),
('Ensaio - Novas Músicas', 'Ensaio das novas músicas do mês', '2024-01-24', '20:00', 'ensaio', 'Sala de Ensaio');

INSERT INTO public.songs (title, artist, musical_key, bpm, category, is_favorite, last_played) VALUES
('Como Zaqueu', 'Bruna Karla', 'G', 72, 'adoracao', true, '2024-01-14'),
('Reckless Love', 'Cory Asbury', 'C', 68, 'adoracao', false, '2024-01-07'),
('Teu É o Reino', 'Davi Sacer', 'D', 85, 'louvor', true, '2024-01-21'),
('Oceans', 'Hillsong United', 'Bm', 60, 'adoracao', false, '2024-01-10'),
('Aleluia', 'Gabriela Rocha', 'F', 90, 'louvor', true, '2024-01-18');