import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Calendar, Clock, MapPin, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useCreateEvent } from "@/hooks/useEvents";
import { useToast } from "@/hooks/use-toast";

const eventSchema = z.object({
  title: z.string().min(1, "Título é obrigatório").max(100, "Título deve ter no máximo 100 caracteres"),
  description: z.string().max(500, "Descrição deve ter no máximo 500 caracteres").optional(),
  event_date: z.string().min(1, "Data é obrigatória"),
  event_time: z.string().min(1, "Horário é obrigatório"),
  event_type: z.enum(["evento", "ensaio"], { required_error: "Tipo de evento é obrigatório" }),
  location: z.string().max(200, "Local deve ter no máximo 200 caracteres").optional(),
});

type EventFormData = z.infer<typeof eventSchema>;

interface EventFormProps {
  children: React.ReactNode;
}

const EventForm = ({ children }: EventFormProps) => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const createEvent = useCreateEvent();

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: "",
      description: "",
      event_date: "",
      event_time: "",
      event_type: "evento",
      location: "",
    },
  });

  const onSubmit = async (data: EventFormData) => {
    try {
      const eventData = {
        title: data.title,
        description: data.description || null,
        event_date: data.event_date,
        event_time: data.event_time,
        event_type: data.event_type,
        location: data.location || null,
      };
      
      await createEvent.mutateAsync(eventData);
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Novo Evento</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título do Evento</FormLabel>
                  <FormControl>
                    <Input placeholder="Digite o título do evento" {...field} />
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
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descreva o evento (opcional)" 
                      className="resize-none" 
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="event_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
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
                    <FormLabel>Horário</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
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
                  <FormLabel>Local</FormLabel>
                  <FormControl>
                    <Input placeholder="Local do evento (opcional)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpen(false)}
                disabled={createEvent.isPending}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="bg-gradient-celestial hover:shadow-celestial"
                disabled={createEvent.isPending}
              >
                {createEvent.isPending ? "Criando..." : "Criar Evento"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EventForm;