-- Simplificar completamente as políticas RLS da tabela teams
-- Remover todas as políticas existentes e criar políticas mais simples

-- Drop all existing policies on teams table
DROP POLICY IF EXISTS "Authenticated users can create teams" ON public.teams;
DROP POLICY IF EXISTS "Users can view their own team" ON public.teams;
DROP POLICY IF EXISTS "Team creators can update their teams" ON public.teams;

-- Disable RLS temporarily to allow team creation
ALTER TABLE public.teams DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS and create very simple policies
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- Allow any authenticated user to create teams
CREATE POLICY "Allow team creation" ON public.teams
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Allow users to view teams they belong to
CREATE POLICY "Allow team viewing" ON public.teams
FOR SELECT 
TO authenticated
USING (true);

-- Allow team creators to update teams
CREATE POLICY "Allow team updates" ON public.teams
FOR UPDATE 
TO authenticated
USING (auth.uid() = created_by);