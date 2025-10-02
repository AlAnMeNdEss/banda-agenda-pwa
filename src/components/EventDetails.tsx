import { Calendar, Clock, MapPin, Music, Users, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Event } from "@/hooks/useEvents";
import { useEventSongs } from "@/hooks/useEventSongs";
import { useEventParticipants } from "@/hooks/useEventParticipants";

interface EventDetailsProps {
  event: Event | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EventDetails = ({ event, open, onOpenChange }: EventDetailsProps) => {
  const { data: eventSongs = [] } = useEventSongs(event?.id || '');
  const { data: participants = [] } = useEventParticipants(event?.id || '');

  if (!event) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
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
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Users className="h-5 w-5" />
                    Participantes ({participants.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {participants.map((participant) => (
                      <div 
                        key={participant.user_id}
                        className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                      >
                        <span className="text-sm font-medium">
                          {participant.profile?.display_name || 'Sem nome'}
                        </span>
                        {participant.confirmed && (
                          <Badge variant="outline" className="text-xs">
                            Confirmado
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Repertoire */}
            {eventSongs.length > 0 && (
              <Card className="border-primary/20">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Music className="h-5 w-5 text-primary" />
                    Repertório ({eventSongs.length} músicas)
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-6">
                    {eventSongs.map((eventSong, index) => (
                      <Card key={eventSong.id} className="border-2 hover:border-primary/30 transition-colors">
                        <CardContent className="pt-6">
                          <div className="space-y-4">
                            {/* Header */}
                            <div className="flex items-start gap-3 pb-3 border-b">
                              <Badge variant="default" className="bg-gradient-celestial text-white text-base px-3 py-1">
                                {index + 1}
                              </Badge>
                              <div className="flex-1">
                                <h4 className="font-bold text-lg mb-1">{eventSong.song?.title}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {eventSong.song?.artist}
                                </p>
                              </div>
                              {eventSong.song?.musical_key && (
                                <div className="flex gap-2 text-xs">
                                  <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                                    Tom: {eventSong.song.musical_key}
                                  </Badge>
                                  {eventSong.song.bpm && (
                                    <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                                      {eventSong.song.bpm} BPM
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Chords & Lyrics Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                              {eventSong.song?.chords && (
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                                    <Music className="h-4 w-4" />
                                    Cifra
                                  </div>
                                  <div className="p-4 bg-muted/50 rounded-lg border border-primary/10">
                                    <pre className="text-sm font-mono whitespace-pre-wrap leading-relaxed">
                                      {eventSong.song.chords}
                                    </pre>
                                  </div>
                                </div>
                              )}

                              {eventSong.song?.lyrics && (
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                                    <FileText className="h-4 w-4" />
                                    Letra
                                  </div>
                                  <div className="p-4 bg-muted/30 rounded-lg border border-muted">
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
