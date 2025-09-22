import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Event {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_time: string;
  event_type: 'evento' | 'ensaio';
  location: string | null;
  team_id: string | null;
  created_at: string;
  updated_at: string;
}

export const useEvents = () => {
  const { user, profile } = useAuth();
  
  return useQuery({
    queryKey: ['events', profile?.team_id],
    queryFn: async (): Promise<Event[]> => {
      if (!profile?.team_id) return [];
      
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('team_id', profile.team_id)
        .order('event_date', { ascending: true });
      
      if (error) throw error;
      return (data || []) as Event[];
    },
    enabled: !!user && !!profile?.team_id,
  });
};

export const useCreateEvent = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  
  return useMutation({
    mutationFn: async (event: Omit<Event, 'id' | 'created_at' | 'updated_at' | 'team_id'>) => {
      const { data, error } = await supabase
        .from('events')
        .insert([{ ...event, team_id: profile?.team_id }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
};