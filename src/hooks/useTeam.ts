import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Team {
  id: string;
  name: string;
  team_code: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export const useTeam = () => {
  const { profile } = useAuth();
  
  return useQuery({
    queryKey: ['team', profile?.team_id],
    queryFn: async (): Promise<Team | null> => {
      if (!profile?.team_id) return null;
      
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('id', profile.team_id)
        .single();
      
      if (error) throw error;
      return data as Team;
    },
    enabled: !!profile?.team_id,
  });
};