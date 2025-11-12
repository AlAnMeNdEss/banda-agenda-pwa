import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, Music } from "lucide-react";
import { Event } from "@/hooks/useEvents";
import { format, isSameDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CalendarViewProps {
  events: Event[];
  onEventClick: (event: Event) => void;
}

const CalendarView = ({ events, onEventClick }: CalendarViewProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  // Encontrar eventos da data selecionada
  const eventsOnSelectedDate = selectedDate
    ? events.filter((event) => isSameDay(parseISO(event.event_date), selectedDate))
    : [];

  // Datas que têm eventos
  const eventDates = events.map((event) => parseISO(event.event_date));

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Calendário</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            locale={ptBR}
            className="rounded-md border pointer-events-auto"
            modifiers={{
              hasEvent: eventDates,
            }}
            modifiersStyles={{
              hasEvent: {
                fontWeight: 'bold',
                textDecoration: 'underline',
                color: 'hsl(var(--primary))',
              },
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {selectedDate
              ? format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
              : "Selecione uma data"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {eventsOnSelectedDate.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <p>Nenhum evento nesta data</p>
            </div>
          ) : (
            <div className="space-y-4">
              {eventsOnSelectedDate.map((event) => (
                <Card
                  key={event.id}
                  className="cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => onEventClick(event)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{event.title}</h3>
                          <Badge
                            variant={event.event_type === "evento" ? "default" : "secondary"}
                          >
                            {event.event_type === "evento" ? "Evento" : "Ensaio"}
                          </Badge>
                        </div>

                        {event.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {event.description}
                          </p>
                        )}

                        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>
                              {event.event_time}
                              {event.end_time && ` - ${event.end_time}`}
                            </span>
                          </div>

                          {event.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              <span>{event.location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CalendarView;
