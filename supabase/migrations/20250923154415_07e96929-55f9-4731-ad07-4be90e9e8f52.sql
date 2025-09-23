-- Create security definer function to get current user's team_id
CREATE OR REPLACE FUNCTION public.get_current_user_team_id()
RETURNS UUID AS $$
  SELECT team_id FROM public.profiles WHERE user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Drop existing problematic policy
DROP POLICY IF EXISTS "Users can view team profiles" ON public.profiles;

-- Create new policy using the security definer function
CREATE POLICY "Users can view team profiles" ON public.profiles
FOR SELECT USING (
  (team_id = public.get_current_user_team_id() AND public.get_current_user_team_id() IS NOT NULL) 
  OR (auth.uid() = user_id)
);