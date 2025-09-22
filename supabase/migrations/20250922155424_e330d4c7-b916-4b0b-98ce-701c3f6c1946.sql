-- Create teams table
CREATE TABLE IF NOT EXISTS public.teams (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  team_code text NOT NULL UNIQUE,
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on teams
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- Add team_id to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL;

-- Add team_id to events table  
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE;

-- Add team_id to songs table
ALTER TABLE public.songs ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE;

-- Function to generate team code
CREATE OR REPLACE FUNCTION public.generate_team_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
    code_chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    result text := '';
    i integer;
    code_exists boolean;
BEGIN
    LOOP
        result := '';
        FOR i IN 1..6 LOOP
            result := result || substr(code_chars, floor(random() * length(code_chars) + 1)::integer, 1);
        END LOOP;
        
        SELECT EXISTS(SELECT 1 FROM public.teams WHERE team_code = result) INTO code_exists;
        
        IF NOT code_exists THEN
            EXIT;
        END IF;
    END LOOP;
    
    RETURN result;
END;
$$;

-- RLS Policies for teams
CREATE POLICY "Users can view their team" 
ON public.teams 
FOR SELECT 
USING (
  id IN (
    SELECT team_id FROM public.profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create teams" 
ON public.teams 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Team admins can update teams" 
ON public.teams 
FOR UPDATE 
USING (
  auth.uid() IN (
    SELECT p.user_id 
    FROM public.profiles p 
    WHERE p.team_id = teams.id AND p.role = 'admin'
  )
);

-- Update profiles policies to be team-scoped
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Users can view team profiles" 
ON public.profiles 
FOR SELECT 
USING (
  team_id IN (
    SELECT team_id FROM public.profiles WHERE user_id = auth.uid()
  ) OR auth.uid() = user_id
);

-- Update events policies to be team-scoped
DROP POLICY IF EXISTS "All authenticated users can view events" ON public.events;
DROP POLICY IF EXISTS "Leaders and admins can manage events" ON public.events;

CREATE POLICY "Users can view team events" 
ON public.events 
FOR SELECT 
USING (
  team_id IN (
    SELECT team_id FROM public.profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Team leaders and admins can manage events" 
ON public.events 
FOR ALL 
USING (
  team_id IN (
    SELECT p.team_id 
    FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role IN ('admin', 'leader')
  )
);

-- Update songs policies to be team-scoped
DROP POLICY IF EXISTS "All authenticated users can view songs" ON public.songs;
DROP POLICY IF EXISTS "Leaders and admins can manage songs" ON public.songs;

CREATE POLICY "Users can view team songs" 
ON public.songs 
FOR SELECT 
USING (
  team_id IN (
    SELECT team_id FROM public.profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Team leaders and admins can manage songs" 
ON public.songs 
FOR ALL 
USING (
  team_id IN (
    SELECT p.team_id 
    FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role IN ('admin', 'leader')
  )
);

-- Add trigger for teams updated_at
CREATE TRIGGER update_teams_updated_at
BEFORE UPDATE ON public.teams
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();