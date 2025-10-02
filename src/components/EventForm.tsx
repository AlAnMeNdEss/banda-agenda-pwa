import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Calendar, Clock, MapPin, FileText, Users, Music, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCreateEvent } from "@/hooks/useEvents";
import { useToast } from "@/hooks/use-toast";
import ParticipantSelector from "@/components/ParticipantSelector";
import SongSelector from "@/components/SongSelector";
import { useAddEventParticipant } from "@/hooks/useEventParticipants";
import { useAddEventSong } from "@/hooks/useEventSongs";

const eventSchema = z.object({
  title: z.string().min(1, "Título é obrigatório").max(100, "Título deve ter no máximo 100 caracteres"),
  description: z.string().max(500, "Descrição deve ter no máximo 500 caracteres").optional(),
  event_date: z.string().min(1, "Data é obrigatória"),
  event_time: z.string().min(1, "Horário de início é obrigatório"),
  end_time: z.string().optional(),
  event_type: z.enum(["evento", "ensaio"], { required_error: "Tipo de evento é obrigatório" }),
  location: z.string().max(200, "Local deve ter no máximo 200 caracteres").optional(),
  notes: z.string().max(1000, "Observações devem ter no máximo 1000 caracteres").optional(),
  participants: z.array(z.string()).default([]),
  songs: z.array(z.string()).default([]),
  attachments: z.array(z.object({
    name: z.string(),
    url: z.string(),
    type: z.string(),
  })).default([]),
});

type EventFormData = z.infer<typeof eventSchema>;

interface EventFormProps {
  children: React.ReactNode;
}

const EventForm = ({ children }: EventFormProps) => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const createEvent = useCreateEvent();
  const addEventParticipant = useAddEventParticipant();
  const addEventSong = useAddEventSong();

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: "",
      description: "",
      event_date: "",
      event_time: "",
      end_time: "",
      event_type: "evento",
      location: "",
      notes: "",
      participants: [],
      songs: [],
      attachments: [],
    },
  });

  const onSubmit = async (data: EventFormData) => {
    try {
      const eventData = {
        title: data.title,
        description: data.description || null,
        event_date: data.event_date,
        event_time: data.event_time,
        end_time: data.end_time || null,
        event_type: data.event_type,
        location: data.location || null,
        notes: data.notes || null,
        participants: null,
        songs: null,
        attachments: JSON.stringify(data.attachments),
      };
      
      const event = await createEvent.mutateAsync(eventData);
      
      // Adicionar participantes à tabela event_participants
      if (data.participants.length > 0) {
        await Promise.all(
          data.participants.map(userId =>
            addEventParticipant.mutateAsync({ eventId: event.id, userId })
          )
        );
      }
      
      // Adicionar músicas à tabela event_songs
      if (data.songs.length > 0) {
        await Promise.all(
          data.songs.map((songId, index) =>
            addEventSong.mutateAsync({ eventId: event.id, songId, order: index })
          )
        );
      }
      
      toast({
        title: "Evento criado!",
        description: "O evento foi adicionado à agenda com sucesso.",
      });
      form.reset();
      setOpen(false);
    } catch (error) {
      toast({
        title: "Erro ao criar evento",
        description: "Ocorreu um erro ao criar o evento. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="text-2xl font-bold bg-gradient-celestial bg-clip-text text-transparent">
            ✨ Novo Evento
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
            <Tabs defaultValue="basic" className="w-full flex-1 overflow-hidden flex flex-col">
              <TabsList className="grid w-full grid-cols-4 h-auto p-1 bg-muted/30">
                <TabsTrigger value="basic" className="data-[state=active]:bg-gradient-celestial data-[state=active]:text-white">
                  <Calendar className="h-4 w-4 mr-2" />
                  Básico
                </TabsTrigger>
                <TabsTrigger value="participants" className="data-[state=active]:bg-gradient-celestial data-[state=active]:text-white">
                  <Users className="h-4 w-4 mr-2" />
                  Participantes
                </TabsTrigger>
                <TabsTrigger value="songs" className="data-[state=active]:bg-gradient-celestial data-[state=active]:text-white">
                  <Music className="h-4 w-4 mr-2" />
                  Repertório
                </TabsTrigger>
                <TabsTrigger value="attachments" className="data-[state=active]:bg-gradient-celestial data-[state=active]:text-white">
                  <Paperclip className="h-4 w-4 mr-2" />
                  Anexos
                </TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4 overflow-y-auto flex-1 pr-2">
                <div className="space-y-4 animate-fade-in">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-base">
                          <FileText className="h-4 w-4 text-primary" />
                          Título do Evento
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Ex: Ensaio de Louvor, Culto da Família" 
                            className="h-11"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-base">
                          <FileText className="h-4 w-4 text-primary" />
                          Descrição
                        </FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Descreva o evento (opcional)" 
                            className="resize-none min-h-[80px]" 
                            rows={3}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="event_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-primary" />
                          Data
                        </FormLabel>
                        <FormControl>
                          <Input type="date" className="h-11" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="event_time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-primary" />
                          Início
                        </FormLabel>
                        <FormControl>
                          <Input type="time" className="h-11" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="end_time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          Término
                        </FormLabel>
                        <FormControl>
                          <Input type="time" className="h-11" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="event_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Evento</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="evento">Evento</SelectItem>
                          <SelectItem value="ensaio">Ensaio</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-base">
                        <MapPin className="h-4 w-4 text-primary" />
                        Local
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Igreja, casa de membro, estúdio, online..." 
                          className="h-11"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Detalhes importantes: trazer instrumentos, repertório será definido antes..." 
                          className="resize-none" 
                          rows={3}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="participants" className="space-y-4">
                <FormField
                  control={form.control}
                  name="participants"
                  render={({ field }) => (
                    <FormItem>
                      <ParticipantSelector
                        selectedParticipants={field.value}
                        onParticipantsChange={field.onChange}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="songs" className="space-y-4">
                <FormField
                  control={form.control}
                  name="songs"
                  render={({ field }) => (
                    <FormItem>
                      <SongSelector
                        selectedSongs={field.value}
                        onSongsChange={field.onChange}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="attachments" className="space-y-4">
                <FormField
                  control={form.control}
                  name="attachments"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Anexos e Links</FormLabel>
                      <FormControl>
                        <div className="space-y-2">
                          <Input 
                            placeholder="Cole aqui links para PDFs, playlists, slides..." 
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                const input = e.target as HTMLInputElement;
                                const url = input.value.trim();
                                if (url) {
                                  const newAttachment = {
                                    name: url.split('/').pop() || 'Link',
                                    url: url,
                                    type: 'link'
                                  };
                                  field.onChange([...field.value, newAttachment]);
                                  input.value = '';
                                }
                              }
                            }}
                          />
                          <div className="text-sm text-muted-foreground">
                            Pressione Enter para adicionar cada link
                          </div>
                          {field.value.length > 0 && (
                            <div className="space-y-2">
                              {field.value.map((attachment, index) => (
                                <div key={index} className="flex items-center justify-between p-2 border rounded">
                                  <div className="flex items-center gap-2">
                                    <Paperclip className="h-4 w-4" />
                                    <span className="text-sm">{attachment.name}</span>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      const updated = field.value.filter((_, i) => i !== index);
                                      field.onChange(updated);
                                    }}
                                  >
                                    Remover
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-3 pt-4 border-t mt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpen(false)}
                disabled={createEvent.isPending}
                className="min-w-[100px]"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="bg-gradient-celestial hover:shadow-celestial min-w-[140px]"
                disabled={createEvent.isPending}
              >
                {createEvent.isPending ? "Criando..." : "✨ Criar Evento"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EventForm;