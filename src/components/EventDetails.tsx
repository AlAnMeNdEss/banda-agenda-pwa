import { useState, useEffect, useRef } from "react";
import { Calendar, Clock, MapPin, Music, Users, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Event } from "@/hooks/useEvents";
import { useEventSongs } from "@/hooks/useEventSongs";
import { useEventParticipants } from "@/hooks/useEventParticipants";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface EventDetailsProps {
  event: Event | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EventDetails = ({ event, open, onOpenChange }: EventDetailsProps) => {
  const { data: eventSongs = [] } = useEventSongs(event?.id || '');
  const { data: participants = [] } = useEventParticipants(event?.id || '');
  const [expandedChords, setExpandedChords] = useState<Record<string, boolean>>({});
  const prevOpenRef = useRef(open);

  // Expand all chords by default when dialog opens
  useEffect(() => {
    // Only run when dialog transitions from closed to open
    if (open && !prevOpenRef.current && eventSongs.length > 0) {
      const initialExpanded: Record<string, boolean> = {};
      eventSongs.forEach(eventSong => {
        if (eventSong.song?.chords) {
          initialExpanded[eventSong.id] = true;
        }
      });
      setExpandedChords(initialExpanded);
    } else if (!open && prevOpenRef.current) {
      setExpandedChords({});
    }
    
    prevOpenRef.current = open;
  }, [open, eventSongs.length]);

  if (!event) return null;

  const formatDate = (dateString: string) => {
    return format(parseISO(dateString), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  const toggleChords = (songId: string) => {
    setExpandedChords(prev => ({
      ...prev,
      [songId]: !prev[songId]
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <DialogTitle className="text-2xl mb-2">{event.title}</DialogTitle>
              <Badge 
                variant={event.event_type === 'evento' ? 'default' : 'secondary'}
                className={event.event_type === 'evento' 
                  ? 'bg-gradient-divine text-accent-foreground' 
                  : 'bg-muted text-muted-foreground'
                }
              >
                {event.event_type === 'evento' ? 'Evento' : 'Ensaio'}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
          <div className="space-y-6">
            {/* Event Info */}
            <Card>
              <CardContent className="pt-6">
                <div className="grid gap-4">
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{formatDate(event.event_date)}</span>
                  </div>
                  
                  <div className="flex items-center gap-3 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {event.event_time}
                      {event.end_time && ` - ${event.end_time}`}
                    </span>
                  </div>

                  {event.location && (
                    <div className="flex items-center gap-3 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{event.location}</span>
                    </div>
                  )}

                  {event.description && (
                    <>
                      <Separator />
                      <p className="text-sm text-muted-foreground">{event.description}</p>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Participants */}
            {participants.length > 0 && (
              <Card className="border-primary/20">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Users className="h-5 w-5 text-primary" />
                    Equipe do Evento ({participants.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {participants.map((participant) => (
                      <Card 
                        key={participant.user_id}
                        className="border hover:border-primary/30 transition-colors"
                      >
                        <CardContent className="p-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-base">
                                {participant.profile?.display_name || 'Sem nome'}
                              </span>
                              {participant.confirmed && (
                                <Badge variant="default" className="text-xs bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
                                  ✓ Confirmado
                                </Badge>
                              )}
                            </div>
                            {participant.profile?.ministry_function && (
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="text-xs">
                                  {participant.profile.ministry_function}
                                </Badge>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Repertoire */}
            {eventSongs.length > 0 && (
              <Card className="border-2 border-primary/30 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Music className="h-6 w-6 text-primary" />
                    Repertório Musical ({eventSongs.length} {eventSongs.length === 1 ? 'música' : 'músicas'})
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-6">
                    {eventSongs.map((eventSong, index) => (
                      <Card key={eventSong.id} className="border-2 border-primary/20 hover:border-primary/40 transition-all shadow-md">
                        <CardContent className="pt-6">
                          <div className="space-y-4">
                            {/* Header com informações principais */}
                            <div className="flex items-start gap-3 pb-4 border-b-2 border-primary/10">
                              <Badge variant="default" className="bg-gradient-celestial text-white text-lg px-4 py-2 font-bold shadow-md">
                                #{index + 1}
                              </Badge>
                              <div className="flex-1 space-y-2">
                                <h4 className="font-bold text-xl text-primary">{eventSong.song?.title}</h4>
                                <p className="text-base text-muted-foreground font-medium">
                                  {eventSong.song?.artist}
                                </p>
                                
                                {/* Informações musicais em destaque */}
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {eventSong.song?.musical_key && (
                                    <Badge variant="secondary" className="bg-primary/15 text-primary border-primary/30 text-sm px-3 py-1 font-semibold">
                                      🎵 Tom: {eventSong.song.musical_key}
                                    </Badge>
                                  )}
                                  {eventSong.song?.bpm && (
                                    <Badge variant="secondary" className="bg-primary/15 text-primary border-primary/30 text-sm px-3 py-1 font-semibold">
                                      ⚡ {eventSong.song.bpm} BPM
                                    </Badge>
                                  )}
                                  {eventSong.song?.category && (
                                    <Badge variant="outline" className="text-sm px-3 py-1">
                                      {eventSong.song.category}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Cifras e Letras sempre visíveis */}
                            <div className="space-y-4">
                              {eventSong.song?.chords && (
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-base font-bold text-primary">
                                      <Music className="h-5 w-5" />
                                      Cifra e Acordes
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => toggleChords(eventSong.id)}
                                      className="text-xs"
                                    >
                                      {expandedChords[eventSong.id] ? (
                                        <>
                                          <ChevronUp className="h-4 w-4 mr-1" />
                                          Recolher
                                        </>
                                      ) : (
                                        <>
                                          <ChevronDown className="h-4 w-4 mr-1" />
                                          Expandir
                                        </>
                                      )}
                                    </Button>
                                  </div>
                                  
                                  {expandedChords[eventSong.id] && (
                                    <div className="p-5 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg border-2 border-primary/20 shadow-inner">
                                      <pre className="text-sm font-mono whitespace-pre-wrap leading-relaxed text-foreground">
                                        {eventSong.song.chords}
                                      </pre>
                                    </div>
                                  )}
                                </div>
                              )}

                              {eventSong.song?.lyrics && (
                                <div className="space-y-3">
                                  <div className="flex items-center gap-2 text-base font-bold text-primary">
                                    <FileText className="h-5 w-5" />
                                    Letra
                                  </div>
                                  <div className="p-5 bg-muted/40 rounded-lg border border-muted shadow-sm">
                                    <pre className="text-sm whitespace-pre-wrap leading-relaxed">
                                      {eventSong.song.lyrics}
                                    </pre>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            {event.notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="h-5 w-5" />
                    Observações
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {event.notes}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default EventDetails;
