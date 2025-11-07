import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface EventSong {
  id: string;
  event_id: string;
  song_id: string;
  song_order: number;
  created_at: string;
  song?: {
    id: string;
    title: string;
    artist: string;
    musical_key: string | null;
    category: string;
    bpm: number | null;
    lyrics: string | null;
    chords: string | null;
    links: Array<{name: string; url: string}> | null;
  } | null;
}

export const useEventSongs = (eventId: string) => {
  return useQuery({
    queryKey: ['event-songs', eventId],
    queryFn: async (): Promise<EventSong[]> => {
      const { data, error } = await supabase
        .from('event_songs')
        .select(`
          id,
          event_id,
          song_id,
          song_order,
          created_at
        `)
        .eq('event_id', eventId)
        .order('song_order', { ascending: true });
      
      if (error) throw error;

      // Buscar as músicas separadamente
      if (!data || data.length === 0) return [];
      
      const songIds = data.map(es => es.song_id);
      const { data: songs, error: songsError } = await supabase
        .from('songs')
        .select('id, title, artist, musical_key, category, bpm, lyrics, chords, links')
        .in('id', songIds);
      
      if (songsError) throw songsError;
      
      return data.map(eventSong => ({
        ...eventSong,
        song: songs?.find(s => s.id === eventSong.song_id) || null
      })) as EventSong[];
    },
    enabled: !!eventId,
  });
};

export const useAddEventSong = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      eventId, 
      songId, 
      order = 0 
    }: { 
      eventId: string; 
      songId: string; 
      order?: number; 
    }) => {
      const { data, error } = await supabase
        .from('event_songs')
        .insert([{ event_id: eventId, song_id: songId, song_order: order }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: ['event-songs', eventId] });
    },
  });
};

export const useRemoveEventSong = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ eventId, songId }: { eventId: string; songId: string }) => {
      const { error } = await supabase
        .from('event_songs')
        .delete()
        .eq('event_id', eventId)
        .eq('song_id', songId);
      
      if (error) throw error;
    },
    onSuccess: (_, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: ['event-songs', eventId] });
    },
  });
};