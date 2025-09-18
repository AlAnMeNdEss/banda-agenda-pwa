import { useState } from "react";
import { Calendar, Clock, Plus, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useEvents, Event } from "@/hooks/useEvents";

const Agenda = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: events = [], isLoading } = useEvents();

  const filteredEvents = events.filter((event: Event) =>
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (event.description && event.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
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
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">Agenda de Eventos</h1>
          <p className="text-muted-foreground">Gerencie eventos e ensaios do ministério</p>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar eventos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button className="bg-gradient-celestial hover:shadow-celestial">
            <Plus className="h-4 w-4 mr-2" />
            Novo Evento
          </Button>
        </div>

        {/* Events Grid */}
        <div className="grid gap-6">
          {filteredEvents.map((event) => (
            <Card key={event.id} className="shadow-gentle hover:shadow-celestial transition-all duration-300">
              <CardContent className="p-6">
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

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">Editar</Button>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                      Excluir
                    </Button>
                  </div>
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
      </div>
    </div>
  );
};

export default Agenda;