-- Function to check if there are any admin users
CREATE OR REPLACE FUNCTION public.has_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE role = 'admin'
  );
$$;

-- Function to promote first user to admin if no admin exists
CREATE OR REPLACE FUNCTION public.promote_first_user_to_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Check if this is the first user and no admin exists
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE role = 'admin') THEN
    -- Update the new user to admin
    UPDATE public.profiles 
    SET role = 'admin' 
    WHERE user_id = NEW.id;
    
    -- Update the user_roles table as well
    UPDATE public.user_roles 
    SET role = 'admin' 
    WHERE user_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS promote_first_user_to_admin_trigger ON auth.users;

-- Create trigger to promote first user to admin
CREATE TRIGGER promote_first_user_to_admin_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.promote_first_user_to_admin();