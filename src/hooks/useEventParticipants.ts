import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface EventParticipant {
  id: string;
  event_id: string;
  user_id: string;
  confirmed: boolean;
  created_at: string;
  profile?: {
    display_name: string | null;
    role: string;
    ministry_function: string | null;
  } | null;
}

export const useEventParticipants = (eventId: string) => {
  return useQuery({
    queryKey: ['event-participants', eventId],
    queryFn: async (): Promise<EventParticipant[]> => {
      const { data, error } = await supabase
        .from('event_participants')
        .select(`
          id,
          event_id,
          user_id,
          confirmed,
          created_at
        `)
        .eq('event_id', eventId);
      
      if (error) throw error;

      // Buscar os profiles separadamente
      if (!data || data.length === 0) return [];
      
      const userIds = data.map(p => p.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, display_name, role, ministry_function')
        .in('user_id', userIds);
      
      if (profilesError) throw profilesError;
      
      return data.map(participant => ({
        ...participant,
        profile: profiles?.find(p => p.user_id === participant.user_id) || null
      })) as EventParticipant[];
    },
    enabled: !!eventId,
  });
};

export const useAddEventParticipant = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ eventId, userId }: { eventId: string; userId: string }) => {
      const { data, error } = await supabase
        .from('event_participants')
        .insert([{ event_id: eventId, user_id: userId }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: ['event-participants', eventId] });
    },
  });
};

export const useRemoveEventParticipant = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ eventId, userId }: { eventId: string; userId: string }) => {
      const { error } = await supabase
        .from('event_participants')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', userId);
      
      if (error) throw error;
    },
    onSuccess: (_, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: ['event-participants', eventId] });
    },
  });
};