import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Clock, Plus, Search, List, CalendarDays } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEvents, Event, useDeleteEvent } from "@/hooks/useEvents";
import { useAuth } from "@/contexts/AuthContext";
import EventForm from "@/components/EventForm";
import CalendarView from "@/components/CalendarView";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

const Agenda = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);
  const { data: events = [], isLoading } = useEvents();
  const { hasRole } = useAuth();
  const deleteEvent = useDeleteEvent();
  const { toast } = useToast();

  const filteredEvents = events.filter((event: Event) =>
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (event.description && event.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T12:00:00');
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleDeleteEvent = async () => {
    if (!deletingEventId) return;
    
    try {
      await deleteEvent.mutateAsync(deletingEventId);
      toast({
        title: "Evento excluído",
        description: "O evento foi excluído com sucesso.",
      });
      setDeletingEventId(null);
    } catch (error) {
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o evento.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-worship flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando eventos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-worship">
      <div className="max-w-7xl mx-auto px-2 md:px-6 py-6 md:py-12">
        {/* Header */}
        <div className="mb-4 md:mb-8 px-2 md:px-0">
          <h1 className="text-2xl md:text-3xl font-bold text-primary mb-1 md:mb-2">Agenda de Eventos</h1>
          <p className="text-sm md:text-base text-muted-foreground">Gerencie eventos e ensaios do ministério</p>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col md:flex-row gap-3 md:gap-4 mb-4 md:mb-8 px-2 md:px-0">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar eventos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          {hasRole('admin') && (
            <EventForm>
              <Button className="bg-gradient-celestial hover:shadow-celestial">
                <Plus className="h-4 w-4 mr-2" />
                Novo Evento
              </Button>
            </EventForm>
          )}
        </div>

        {/* Tabs para alternar entre visualizações */}
        <Tabs defaultValue="list" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
            <TabsTrigger value="list" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              Lista
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Calendário
            </TabsTrigger>
          </TabsList>

          {/* Vista de Lista */}
          <TabsContent value="list" className="space-y-6">
            <div className="grid gap-6">
              {filteredEvents.map((event) => (
                <Card 
                  key={event.id} 
                  className="border-0 md:border md:shadow-gentle md:hover:shadow-celestial transition-all duration-300 cursor-pointer"
                  onClick={() => navigate(`/evento/${event.id}`)}
                >
                  <CardContent className="p-3 md:p-6">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      {/* Date Badge */}
                      <div className="flex-shrink-0">
                        <div className="bg-gradient-celestial text-primary-foreground rounded-lg p-4 text-center min-w-[120px]">
                          <div className="text-sm font-medium opacity-90">
                            {formatDate(event.event_date).split(' ')[1]} {formatDate(event.event_date).split(' ')[2]}
                          </div>
                          <div className="text-2xl font-bold">
                            {formatDate(event.event_date).split(' ')[0]}
                          </div>
                        </div>
                      </div>

                      {/* Event Details */}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start gap-3">
                          <h3 className="text-xl font-semibold text-primary flex-1">{event.title}</h3>
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
                        
                        <p className="text-muted-foreground">{event.description || 'Sem descrição'}</p>
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {event.event_time}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {event.location || 'Local não informado'}
                          </div>
                        </div>
                      </div>

                      {/* Actions - Only show for admins */}
                      {hasRole('admin') && (
                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                          <EventForm event={event}>
                            <Button variant="outline" size="sm">Editar</Button>
                          </EventForm>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingEventId(event.id);
                            }}
                          >
                            Excluir
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredEvents.length === 0 && (
              <Card className="shadow-gentle">
                <CardContent className="p-12 text-center">
                  <Calendar className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">
                    Nenhum evento encontrado
                  </h3>
                  <p className="text-muted-foreground">
                    {searchTerm ? 'Tente um termo de busca diferente.' : 'Adicione o primeiro evento à agenda.'}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Vista de Calendário */}
          <TabsContent value="calendar">
            <CalendarView 
              events={filteredEvents}
              onEventClick={(event) => navigate(`/evento/${event.id}`)}
            />
          </TabsContent>
        </Tabs>

        <AlertDialog open={!!deletingEventId} onOpenChange={(open) => !open && setDeletingEventId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir este evento? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteEvent} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default Agenda;