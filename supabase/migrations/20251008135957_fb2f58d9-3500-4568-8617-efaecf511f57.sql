-- Recriar o trigger para criar perfis automaticamente quando novos usuários se registram
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Criar perfis para usuários existentes que não possuem perfil
INSERT INTO public.profiles (user_id, display_name, role)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'display_name', au.email),
  'member'::app_role
FROM auth.users au
LEFT JOIN public.profiles p ON p.user_id = au.id
WHERE p.user_id IS NULL;

-- Criar roles para usuários existentes que não possuem role
INSERT INTO public.user_roles (user_id, role)
SELECT 
  au.id,
  'member'::app_role
FROM auth.users au
LEFT JOIN public.user_roles ur ON ur.user_id = au.id
WHERE ur.user_id IS NULL;