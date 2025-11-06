import { useState, useEffect } from "react";
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
import { useCreateEvent, useUpdateEvent, Event } from "@/hooks/useEvents";
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
  event?: Event | null;
  onOpenChange?: (open: boolean) => void;
}

const EventForm = ({ children, event, onOpenChange }: EventFormProps) => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const addEventParticipant = useAddEventParticipant();
  const addEventSong = useAddEventSong();
  
  const isEditing = !!event;

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

  useEffect(() => {
    if (event && open) {
      form.reset({
        title: event.title,
        description: event.description || "",
        event_date: event.event_date,
        event_time: event.event_time,
        end_time: event.end_time || "",
        event_type: event.event_type,
        location: event.location || "",
        notes: event.notes || "",
        participants: [],
        songs: [],
        attachments: event.attachments ? JSON.parse(event.attachments) : [],
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, open]);

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
      
      if (isEditing && event) {
        await updateEvent.mutateAsync({ id: event.id, ...eventData });
        toast({
          title: "Evento atualizado!",
          description: "As alterações foram salvas com sucesso.",
        });
      } else {
        const newEvent = await createEvent.mutateAsync(eventData);
        
        // Adicionar participantes à tabela event_participants
        if (data.participants.length > 0) {
          await Promise.all(
            data.participants.map(userId =>
              addEventParticipant.mutateAsync({ eventId: newEvent.id, userId })
            )
          );
        }
        
        // Adicionar músicas à tabela event_songs
        if (data.songs.length > 0) {
          await Promise.all(
            data.songs.map((songId, index) =>
              addEventSong.mutateAsync({ eventId: newEvent.id, songId, order: index })
            )
          );
        }
        
        toast({
          title: "Evento criado!",
          description: "O evento foi adicionado à agenda com sucesso.",
        });
      }
      
      form.reset();
      setOpen(false);
      onOpenChange?.(false);
    } catch (error) {
      toast({
        title: isEditing ? "Erro ao atualizar evento" : "Erro ao criar evento",
        description: "Ocorreu um erro. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      onOpenChange?.(newOpen);
    }}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-8 pt-8 pb-6 bg-gradient-to-br from-primary/5 via-primary/5 to-transparent border-b shrink-0">
          <div className="space-y-2">
            <DialogTitle className="text-3xl font-bold text-foreground">
              {isEditing ? "Editar Evento" : "Criar Novo Evento"}
            </DialogTitle>
            <p className="text-muted-foreground">
              {isEditing ? "Atualize as informações do evento" : "Preencha os detalhes e organize seu evento"}
            </p>
          </div>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
            <Tabs defaultValue="basic" className="w-full flex-1 flex flex-col min-h-0">
              <TabsList className="grid w-full grid-cols-4 h-auto p-1.5 gap-1 bg-muted/50 mx-8 mt-6 rounded-lg shrink-0">
                <TabsTrigger 
                  value="basic" 
                  className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all"
                >
                  <Calendar className="h-4 w-4" />
                  <span className="hidden sm:inline">Informações</span>
                  <span className="sm:hidden">Info</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="participants" 
                  className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all"
                >
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Equipe</span>
                  <span className="sm:hidden">Equipe</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="songs" 
                  className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all"
                >
                  <Music className="h-4 w-4" />
                  <span className="hidden sm:inline">Músicas</span>
                  <span className="sm:hidden">Músicas</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="attachments" 
                  className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all"
                >
                  <Paperclip className="h-4 w-4" />
                  <span className="hidden sm:inline">Materiais</span>
                  <span className="sm:hidden">Links</span>
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 min-h-0 overflow-hidden">
                <div className="h-full overflow-y-auto px-8 pb-6">
              <TabsContent value="basic" className="space-y-6 mt-6">
                <div className="space-y-5 animate-fade-in">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-base font-semibold">
                          <FileText className="h-4 w-4 text-primary" />
                          Título do Evento
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Ex: Culto de Celebração, Ensaio Geral" 
                            className="h-12 text-base"
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
                        <FormLabel className="flex items-center gap-2 text-base font-semibold">
                          <FileText className="h-4 w-4 text-primary" />
                          Descrição
                        </FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Descrição breve do evento (opcional)" 
                            className="resize-none min-h-[90px] text-base" 
                            rows={3}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <FormField
                    control={form.control}
                    name="event_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 font-semibold">
                          <Calendar className="h-4 w-4 text-primary" />
                          Data
                        </FormLabel>
                        <FormControl>
                          <Input type="date" className="h-12 text-base" {...field} />
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
                        <FormLabel className="flex items-center gap-2 font-semibold">
                          <Clock className="h-4 w-4 text-primary" />
                          Início
                        </FormLabel>
                        <FormControl>
                          <Input type="time" className="h-12 text-base" {...field} />
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
                        <FormLabel className="flex items-center gap-2 font-semibold">
                          <Clock className="h-4 w-4 text-primary" />
                          Término
                        </FormLabel>
                        <FormControl>
                          <Input type="time" className="h-12 text-base" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <FormField
                    control={form.control}
                    name="event_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold">Tipo de Evento</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12 text-base">
                              <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="evento">🎵 Evento</SelectItem>
                            <SelectItem value="ensaio">🎹 Ensaio</SelectItem>
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
                        <FormLabel className="flex items-center gap-2 font-semibold">
                          <MapPin className="h-4 w-4 text-primary" />
                          Local
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Ex: Igreja Principal, Sala 2" 
                            className="h-12 text-base"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold">Observações Importantes</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Informações adicionais sobre o evento..." 
                          className="resize-none min-h-[90px] text-base" 
                          rows={3}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="participants" className="space-y-6 mt-6">
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

              <TabsContent value="songs" className="space-y-6 mt-6">
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

              <TabsContent value="attachments" className="space-y-6 mt-6">
                <FormField
                  control={form.control}
                  name="attachments"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold">Links e Materiais de Apoio</FormLabel>
                      <FormControl>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Input 
                              placeholder="Cole o link aqui (YouTube, Google Drive, etc.)" 
                              className="h-12 text-base"
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
                            <p className="text-sm text-muted-foreground">
                              💡 Pressione Enter para adicionar. Adicione playlists, cifras, slides...
                            </p>
                          </div>
                          {field.value.length > 0 && (
                            <div className="space-y-2">
                              {field.value.map((attachment, index) => (
                                <div key={index} className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors">
                                  <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <Paperclip className="h-5 w-5 text-primary shrink-0" />
                                    <span className="text-sm font-medium truncate">{attachment.name}</span>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="shrink-0"
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
                </div>
              </div>
            </Tabs>

            <div className="flex justify-end gap-3 pt-4 border-t px-6 pb-6 shrink-0">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setOpen(false);
                  onOpenChange?.(false);
                }}
                disabled={createEvent.isPending || updateEvent.isPending}
                className="min-w-[100px]"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="bg-gradient-celestial hover:shadow-celestial min-w-[140px]"
                disabled={createEvent.isPending || updateEvent.isPending}
              >
                {isEditing 
                  ? (updateEvent.isPending ? "Salvando..." : "💾 Salvar")
                  : (createEvent.isPending ? "Criando..." : "✨ Criar Evento")
                }
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EventForm;