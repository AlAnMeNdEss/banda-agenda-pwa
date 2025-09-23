-- Fix the teams RLS policy to allow team creation
-- The current policy requires created_by = auth.uid() which is correct
-- But we need to ensure the user can actually insert the row

-- Drop existing policies on teams table
DROP POLICY IF EXISTS "Users can create teams" ON public.teams;
DROP POLICY IF EXISTS "Users can view their team" ON public.teams;
DROP POLICY IF EXISTS "Team admins can update teams" ON public.teams;

-- Create new policies with proper permissions
CREATE POLICY "Authenticated users can create teams" ON public.teams
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can view their own team" ON public.teams
FOR SELECT 
TO authenticated
USING (id IN (
  SELECT team_id FROM public.profiles 
  WHERE user_id = auth.uid() AND team_id IS NOT NULL
));

CREATE POLICY "Team creators can update their teams" ON public.teams
FOR UPDATE 
TO authenticated
USING (auth.uid() = created_by);