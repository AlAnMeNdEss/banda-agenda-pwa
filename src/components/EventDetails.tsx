import { useState, useEffect, useRef } from "react";
import { Calendar, Clock, MapPin, Music, Users, FileText, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Event } from "@/hooks/useEvents";
import { useEventSongs } from "@/hooks/useEventSongs";
import { useEventParticipants } from "@/hooks/useEventParticipants";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import ChordTransposer from "@/components/ChordTransposer";
import Metronome from "@/components/Metronome";

interface EventDetailsProps {
  event: Event | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EventDetails = ({ event, open, onOpenChange }: EventDetailsProps) => {
  const { data: eventSongs = [] } = useEventSongs(event?.id || '');
  const { data: participants = [] } = useEventParticipants(event?.id || '');
  const [activeTab, setActiveTab] = useState("info");
  const [transposedChords, setTransposedChords] = useState<Record<string, string>>({});
  const [transposedLyrics, setTransposedLyrics] = useState<Record<string, string>>({});

  if (!event) return null;

  const formatDate = (dateString: string) => {
    return format(parseISO(dateString), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  // Parse attachments
  let attachments: Array<{name: string; url: string; type: string}> = [];
  try {
    if (event.attachments) {
      attachments = JSON.parse(event.attachments);
    }
  } catch (e) {
    console.error('Error parsing attachments:', e);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] p-0 flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-4 border-b bg-gradient-to-r from-primary/5 to-transparent shrink-0">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <DialogTitle className="text-3xl font-bold">{event.title}</DialogTitle>
              <div className="flex items-center gap-3 flex-wrap">
                <Badge 
                  variant={event.event_type === 'evento' ? 'default' : 'secondary'}
                  className={`text-base px-3 py-1 ${
                    event.event_type === 'evento' 
                      ? 'bg-gradient-divine text-white' 
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {event.event_type === 'evento' ? '🎵 Evento' : '🎹 Ensaio'}
                </Badge>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span className="font-medium">{formatDate(event.event_date)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{event.event_time}{event.end_time && ` - ${event.end_time}`}</span>
                </div>
                {event.location && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{event.location}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden min-h-0">
          <TabsList className="mx-6 mt-4 grid w-auto grid-cols-4 gap-2 shrink-0">
            <TabsTrigger value="info" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <FileText className="h-4 w-4 mr-2" />
              Informações
            </TabsTrigger>
            <TabsTrigger value="repertorio" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Music className="h-4 w-4 mr-2" />
              Repertório ({eventSongs.length})
            </TabsTrigger>
            <TabsTrigger value="equipe" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Users className="h-4 w-4 mr-2" />
              Equipe ({participants.length})
            </TabsTrigger>
            <TabsTrigger value="metronomo" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Clock className="h-4 w-4 mr-2" />
              Metrônomo
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-hidden min-h-0">
            <ScrollArea className="h-full px-6 pb-6">
            {/* Tab: Informações */}
            <TabsContent value="info" className="mt-6 space-y-4">
              {event.description && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Descrição</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">{event.description}</p>
                  </CardContent>
                </Card>
              )}

              {event.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Observações Importantes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">{event.notes}</p>
                  </CardContent>
                </Card>
              )}

              {attachments.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <ExternalLink className="h-5 w-5" />
                      Links e Materiais
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {attachments.map((attachment, index) => (
                        <a
                          key={index}
                          href={attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors group"
                        >
                          <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                          <span className="flex-1 text-sm font-medium group-hover:text-primary">{attachment.name}</span>
                          <span className="text-xs text-muted-foreground">Abrir ↗</span>
                        </a>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Tab: Repertório */}
            <TabsContent value="repertorio" className="mt-6 space-y-6">
              {eventSongs.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Music className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">Nenhuma música adicionada ao repertório</p>
                  </CardContent>
                </Card>
              ) : (
                eventSongs.map((eventSong, index) => (
                  <Card key={eventSong.id} className="overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent pb-4">
                      <div className="flex items-start gap-4">
                        <Badge variant="default" className="bg-primary text-primary-foreground text-xl px-4 py-2 font-bold">
                          {index + 1}
                        </Badge>
                        <div className="flex-1 space-y-2">
                          <CardTitle className="text-2xl">{eventSong.song?.title}</CardTitle>
                          <p className="text-base text-muted-foreground font-medium">
                            {eventSong.song?.artist}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {eventSong.song?.musical_key && (
                              <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30">
                                🎵 Tom: {eventSong.song.musical_key}
                              </Badge>
                            )}
                            {eventSong.song?.bpm && (
                              <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30">
                                ⚡ {eventSong.song.bpm} BPM
                              </Badge>
                            )}
                            {eventSong.song?.category && (
                              <Badge variant="outline">{eventSong.song.category}</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                      {/* Versões e Links - Aparecem primeiro, próximo ao cabeçalho */}
                      {attachments.length > 0 && (
                        <div className="space-y-3 pb-4 border-b">
                          <h4 className="font-bold text-lg flex items-center gap-2 text-primary">
                            <ExternalLink className="h-5 w-5" />
                            Versões e Materiais de Estudo
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {attachments.map((attachment, idx) => (
                              <a
                                key={idx}
                                href={attachment.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent transition-colors group"
                              >
                                <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0" />
                                <span className="flex-1 text-sm font-medium group-hover:text-primary truncate">{attachment.name}</span>
                                <span className="text-xs text-muted-foreground shrink-0">↗</span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Transpositor de Acordes */}
                      {(eventSong.song?.chords || eventSong.song?.lyrics) && (
                        <ChordTransposer
                          originalKey={eventSong.song?.musical_key}
                          chords={eventSong.song?.chords || eventSong.song?.lyrics}
                          onTranspose={(transposed, semitones) => {
                            const songId = eventSong.id;
                            if (eventSong.song?.chords) {
                              setTransposedChords(prev => ({ ...prev, [songId]: transposed }));
                            }
                            if (eventSong.song?.lyrics) {
                              setTransposedLyrics(prev => ({ ...prev, [songId]: transposed }));
                            }
                          }}
                        />
                      )}

                      {/* Cifras */}
                      {eventSong.song?.chords && (
                        <div className="space-y-3">
                          <h4 className="font-bold text-lg flex items-center gap-2 text-primary">
                            <Music className="h-5 w-5" />
                            Cifra e Acordes
                          </h4>
                          <div className="p-6 bg-muted/50 rounded-lg border-2 border-primary/10">
                            <pre className="font-mono text-base whitespace-pre-wrap leading-loose tracking-wide">
                              {transposedChords[eventSong.id] || eventSong.song.chords}
                            </pre>
                          </div>
                        </div>
                      )}

                      {/* Letra */}
                      {eventSong.song?.lyrics && (
                        <div className="space-y-3">
                          <h4 className="font-bold text-lg flex items-center gap-2 text-primary">
                            <FileText className="h-5 w-5" />
                            Letra
                          </h4>
                          <div className="p-6 bg-accent/20 rounded-lg border">
                            <pre className="text-base whitespace-pre-wrap leading-loose">
                              {transposedLyrics[eventSong.id] || eventSong.song.lyrics}
                            </pre>
                          </div>
                        </div>
                      )}

                      {!eventSong.song?.chords && !eventSong.song?.lyrics && !attachments.length && (
                        <p className="text-center text-muted-foreground py-8">
                          Nenhuma cifra, letra ou versão disponível para esta música
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* Tab: Equipe */}
            <TabsContent value="equipe" className="mt-6">
              {participants.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">Nenhum participante confirmado</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {participants.map((participant) => (
                    <Card key={participant.user_id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <h4 className="font-bold text-lg mb-1">
                                {participant.profile?.display_name || 'Sem nome'}
                              </h4>
                              {participant.profile?.ministry_function && (
                                <Badge variant="secondary" className="text-xs">
                                  {participant.profile.ministry_function}
                                </Badge>
                              )}
                            </div>
                            {participant.confirmed && (
                              <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
                                ✓ Confirmado
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Tab: Metrônomo */}
            <TabsContent value="metronomo" className="mt-6">
              <div className="max-w-md mx-auto">
                <Metronome defaultBpm={eventSongs[0]?.song?.bpm} />
              </div>
            </TabsContent>
            </ScrollArea>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default EventDetails;
