import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Song {
  id: string;
  title: string;
  artist: string;
  musical_key: string | null;
  bpm: number | null;
  category: 'louvor' | 'adoracao';
  is_favorite: boolean;
  lyrics: string | null;
  chords: string | null;
  last_played: string | null;
  team_id: string | null;
  links: Array<{name: string; url: string}> | null;
  created_at: string;
  updated_at: string;
}

export const useSongs = () => {
  const { user, profile } = useAuth();
  
  return useQuery({
    queryKey: ['songs', profile?.team_id],
    queryFn: async (): Promise<Song[]> => {
      if (!profile?.team_id) return [];
      
      const { data, error } = await supabase
        .from('songs')
        .select('*')
        .eq('team_id', profile.team_id)
        .order('title', { ascending: true });
      
      if (error) throw error;
      return (data || []) as Song[];
    },
    enabled: !!user && !!profile?.team_id,
  });
};

export const useCreateSong = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  
  return useMutation({
    mutationFn: async (song: Omit<Song, 'id' | 'created_at' | 'updated_at' | 'team_id'>) => {
      const { data, error } = await supabase
        .from('songs')
        .insert([{ ...song, team_id: profile?.team_id }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['songs'] });
    },
  });
};

export const useUpdateSong = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...song }: Partial<Song> & { id: string }) => {
      const { data, error } = await supabase
        .from('songs')
        .update(song)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['songs'] });
    },
  });
};

export const useDeleteSong = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (songId: string) => {
      const { error } = await supabase
        .from('songs')
        .delete()
        .eq('id', songId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['songs'] });
    },
  });
};