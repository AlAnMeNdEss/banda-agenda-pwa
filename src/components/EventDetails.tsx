import { useState, useEffect, useRef } from "react";
import { Calendar, Clock, MapPin, Music, Users, FileText, ExternalLink, Download, Printer } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
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

  const escapeHtml = (text: string) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  const handlePrintScale = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const eventDate = formatDate(event.event_date);
    const eventTime = escapeHtml(event.event_time);
    const eventLocation = escapeHtml(event.location || 'Local não informado');
    const eventTitle = escapeHtml(event.title);

    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Escala - ${eventTitle}</title>
        <style>
          @media print {
            @page { margin: 1cm; }
          }
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
            color: #333;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
          }
          .header h1 {
            margin: 0 0 10px 0;
            font-size: 24px;
          }
          .event-info {
            margin-bottom: 20px;
            font-size: 14px;
            line-height: 1.6;
          }
          .section {
            margin-bottom: 30px;
            page-break-inside: avoid;
          }
          .section-title {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 15px;
            padding-bottom: 8px;
            border-bottom: 1px solid #ccc;
          }
          .song-item {
            margin-bottom: 20px;
            page-break-inside: avoid;
            padding: 15px;
            border: 1px solid #ddd;
            border-radius: 5px;
          }
          .song-number {
            display: inline-block;
            background: #333;
            color: white;
            padding: 5px 15px;
            border-radius: 5px;
            font-weight: bold;
            margin-right: 10px;
          }
          .song-title {
            font-size: 18px;
            font-weight: bold;
            margin: 10px 0 5px 0;
          }
          .song-artist {
            color: #666;
            margin-bottom: 10px;
            font-size: 14px;
          }
          .song-details {
            font-size: 13px;
            color: #666;
            margin-top: 8px;
            margin-bottom: 10px;
          }
          .song-details span {
            margin-right: 15px;
          }
          .lyrics-section {
            margin-top: 15px;
            padding: 15px;
            background: #fafafa;
            border-radius: 5px;
            white-space: pre-wrap;
            font-size: 12px;
            line-height: 1.6;
          }
          .team-member {
            padding: 10px;
            margin-bottom: 8px;
            background: #f5f5f5;
            border-radius: 5px;
            border-left: 3px solid #333;
          }
          .team-member-name {
            font-weight: bold;
            margin-bottom: 4px;
          }
          .team-member-role {
            font-size: 12px;
            color: #666;
          }
          .metronome-info {
            padding: 15px;
            background: #e8f4f8;
            border-radius: 5px;
            border-left: 4px solid #2196F3;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${eventTitle}</h1>
          <div class="event-info">
            <strong>Data:</strong> ${escapeHtml(eventDate)}<br>
            <strong>Horário:</strong> ${eventTime}${event.end_time ? ` - ${escapeHtml(event.end_time)}` : ''}<br>
            <strong>Local:</strong> ${eventLocation}
            ${event.description ? `<br><br><strong>Descrição:</strong><br>${escapeHtml(event.description)}` : ''}
            ${event.notes ? `<br><br><strong>Observações:</strong><br>${escapeHtml(event.notes)}` : ''}
          </div>
        </div>

        ${participants.length > 0 ? `
        <div class="section">
          <div class="section-title">Equipe</div>
          ${participants.map(p => `
            <div class="team-member">
              <div class="team-member-name">${escapeHtml(p.profile?.display_name || 'Sem nome')}</div>
              ${p.profile?.ministry_function ? `<div class="team-member-role">${escapeHtml(p.profile.ministry_function)}</div>` : ''}
              ${p.confirmed ? '<div style="color: green; font-size: 11px; margin-top: 4px;">✓ Confirmado</div>' : ''}
            </div>
          `).join('')}
        </div>
        ` : ''}

        ${eventSongs.length > 0 ? `
        <div class="section">
          <div class="section-title">Repertório</div>
    ` : ''}

    eventSongs.forEach((eventSong, index) => {
      const song = eventSong.song;
      if (!song) return;

      htmlContent += `
        <div class="song-item">
          <div>
            <span class="song-number">${index + 1}</span>
            <span class="song-title">${escapeHtml(song.title)}</span>
          </div>
          <div class="song-artist">${escapeHtml(song.artist)}</div>
          <div class="song-details">
            ${song.musical_key ? `<span><strong>Tom:</strong> ${escapeHtml(song.musical_key)}</span>` : ''}
            ${song.bpm ? `<span><strong>BPM:</strong> ${song.bpm}</span>` : ''}
          </div>
        </div>
      `;
    });

    if (eventSongs.length > 0) {
      htmlContent += `</div>`;
    }

    // Metrônomo
    const bpmValues = eventSongs.map(es => es.song?.bpm).filter(BPM => BPM !== null && BPM !== undefined);
    if (bpmValues.length > 0) {
      const avgBpm = Math.round(bpmValues.reduce((a, b) => a + b, 0) / bpmValues.length);
      htmlContent += `
        <div class="section">
          <div class="section-title">Metrônomo</div>
          <div class="metronome-info">
            <strong>BPM Médio:</strong> ${avgBpm} BPM<br>
            <small>Baseado nas músicas do repertório</small>
          </div>
        </div>
      `;
    }

    htmlContent += `
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const handleDownloadScale = () => {
    const eventDate = formatDate(event.event_date);
    const eventTime = escapeHtml(event.event_time);
    const eventLocation = escapeHtml(event.location || 'Local não informado');
    const eventTitle = escapeHtml(event.title);

    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Escala - ${eventTitle}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
            color: #333;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
          }
          .header h1 {
            margin: 0 0 10px 0;
            font-size: 24px;
          }
          .event-info {
            margin-bottom: 20px;
            font-size: 14px;
            line-height: 1.6;
          }
          .section {
            margin-bottom: 30px;
            page-break-inside: avoid;
          }
          .section-title {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 15px;
            padding-bottom: 8px;
            border-bottom: 1px solid #ccc;
          }
          .song-item {
            margin-bottom: 20px;
            page-break-inside: avoid;
            padding: 15px;
            border: 1px solid #ddd;
            border-radius: 5px;
          }
          .song-number {
            display: inline-block;
            background: #333;
            color: white;
            padding: 5px 15px;
            border-radius: 5px;
            font-weight: bold;
            margin-right: 10px;
          }
          .song-title {
            font-size: 18px;
            font-weight: bold;
            margin: 10px 0 5px 0;
          }
          .song-artist {
            color: #666;
            margin-bottom: 10px;
            font-size: 14px;
          }
          .song-details {
            font-size: 13px;
            color: #666;
            margin-top: 8px;
            margin-bottom: 10px;
          }
          .song-details span {
            margin-right: 15px;
          }
          .lyrics-section {
            margin-top: 15px;
            padding: 15px;
            background: #fafafa;
            border-radius: 5px;
            white-space: pre-wrap;
            font-size: 12px;
            line-height: 1.6;
          }
          .team-member {
            padding: 10px;
            margin-bottom: 8px;
            background: #f5f5f5;
            border-radius: 5px;
            border-left: 3px solid #333;
          }
          .team-member-name {
            font-weight: bold;
            margin-bottom: 4px;
          }
          .team-member-role {
            font-size: 12px;
            color: #666;
          }
          .metronome-info {
            padding: 15px;
            background: #e8f4f8;
            border-radius: 5px;
            border-left: 4px solid #2196F3;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${eventTitle}</h1>
          <div class="event-info">
            <strong>Data:</strong> ${escapeHtml(eventDate)}<br>
            <strong>Horário:</strong> ${eventTime}${event.end_time ? ` - ${escapeHtml(event.end_time)}` : ''}<br>
            <strong>Local:</strong> ${eventLocation}
            ${event.description ? `<br><br><strong>Descrição:</strong><br>${escapeHtml(event.description)}` : ''}
            ${event.notes ? `<br><br><strong>Observações:</strong><br>${escapeHtml(event.notes)}` : ''}
          </div>
        </div>

        ${participants.length > 0 ? `
        <div class="section">
          <div class="section-title">Equipe</div>
          ${participants.map(p => `
            <div class="team-member">
              <div class="team-member-name">${escapeHtml(p.profile?.display_name || 'Sem nome')}</div>
              ${p.profile?.ministry_function ? `<div class="team-member-role">${escapeHtml(p.profile.ministry_function)}</div>` : ''}
              ${p.confirmed ? '<div style="color: green; font-size: 11px; margin-top: 4px;">✓ Confirmado</div>' : ''}
            </div>
          `).join('')}
        </div>
        ` : ''}

        ${eventSongs.length > 0 ? `
        <div class="section">
          <div class="section-title">Repertório</div>
    ` : ''}

    eventSongs.forEach((eventSong, index) => {
      const song = eventSong.song;
      if (!song) return;

      htmlContent += `
        <div class="song-item">
          <div>
            <span class="song-number">${index + 1}</span>
            <span class="song-title">${escapeHtml(song.title)}</span>
          </div>
          <div class="song-artist">${escapeHtml(song.artist)}</div>
          <div class="song-details">
            ${song.musical_key ? `<span><strong>Tom:</strong> ${escapeHtml(song.musical_key)}</span>` : ''}
            ${song.bpm ? `<span><strong>BPM:</strong> ${song.bpm}</span>` : ''}
          </div>
        </div>
      `;
    });

    if (eventSongs.length > 0) {
      htmlContent += `</div>`;
    }

    // Metrônomo
    const bpmValues = eventSongs.map(es => es.song?.bpm).filter(BPM => BPM !== null && BPM !== undefined);
    if (bpmValues.length > 0) {
      const avgBpm = Math.round(bpmValues.reduce((a, b) => a + b, 0) / bpmValues.length);
      htmlContent += `
        <div class="section">
          <div class="section-title">Metrônomo</div>
          <div class="metronome-info">
            <strong>BPM Médio:</strong> ${avgBpm} BPM<br>
            <small>Baseado nas músicas do repertório</small>
          </div>
        </div>
      `;
    }

    htmlContent += `
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Escala_${eventTitle.replace(/[^a-z0-9]/gi, '_')}_${eventDate.replace(/[^a-z0-9]/gi, '_')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

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
                <>
                  {/* Botões de Download e Impressão */}
                  <div className="flex gap-2 justify-end">
                    <Button 
                      onClick={handleDownloadScale}
                      variant="outline"
                      className="gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Baixar Escala
                    </Button>
                    <Button 
                      onClick={handlePrintScale}
                      variant="outline"
                      className="gap-2"
                    >
                      <Printer className="h-4 w-4" />
                      Imprimir Escala
                    </Button>
                  </div>
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

                      {/* Cifra e Letra (colapsado por padrão) */}
                      {(eventSong.song?.chords || eventSong.song?.lyrics) && (
                        <Accordion type="single" collapsible className="w-full">
                          <AccordionItem value="content" className="border rounded-lg">
                            <AccordionTrigger className="px-4 hover:no-underline">
                              <div className="flex items-center gap-2 text-lg font-bold text-primary">
                                <Music className="h-5 w-5" />
                                <span>Cifra e Letra</span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-4 pb-4">
                              <div className="space-y-6 pt-4">
                                {/* Cifras */}
                                {eventSong.song?.chords && (
                                  <div className="space-y-3">
                                    <h4 className="font-bold text-base flex items-center gap-2 text-foreground">
                                      <Music className="h-4 w-4" />
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
                                    <h4 className="font-bold text-base flex items-center gap-2 text-foreground">
                                      <FileText className="h-4 w-4" />
                                      Letra
                                    </h4>
                                    <div className="p-6 bg-accent/20 rounded-lg border">
                                      <pre className="text-base whitespace-pre-wrap leading-loose">
                                        {transposedLyrics[eventSong.id] || eventSong.song.lyrics}
                                      </pre>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      )}

                      {/* Links da música (YouTube, Spotify, etc) */}
                      {eventSong.song?.links && Array.isArray(eventSong.song.links) && eventSong.song.links.length > 0 && (
                        <Card className="bg-card/60 border-primary/10">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2">
                              <ExternalLink className="h-4 w-4" />
                              Links da música
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-0 flex flex-wrap gap-2">
                            {eventSong.song.links.map((link, linkIndex) => (
                              <a
                                key={linkIndex}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border bg-background hover:bg-accent transition-colors text-sm font-medium"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                                <span>{link.name}</span>
                              </a>
                            ))}
                          </CardContent>
                        </Card>
                      )}

                      {!eventSong.song?.chords && !eventSong.song?.lyrics && (
                        <p className="text-center text-muted-foreground py-8">
                          Nenhuma cifra ou letra disponível para esta música
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))
                </>
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

