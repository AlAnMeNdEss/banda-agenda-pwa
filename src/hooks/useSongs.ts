import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
  created_at: string;
  updated_at: string;
}

export const useSongs = () => {
  return useQuery({
    queryKey: ['songs'],
    queryFn: async (): Promise<Song[]> => {
      const { data, error } = await supabase
        .from('songs')
        .select('*')
        .order('title', { ascending: true });
      
      if (error) throw error;
      return (data || []) as Song[];
    },
  });
};

export const useCreateSong = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (song: Omit<Song, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('songs')
        .insert([song])
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