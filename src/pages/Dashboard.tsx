import { Calendar, Music, Clock, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import worshipHero from "@/assets/worship-hero.jpg";
import { useEvents } from "@/hooks/useEvents";
import { useSongs } from "@/hooks/useSongs";
import { useAuth } from "@/contexts/AuthContext";
import { useTeam } from "@/hooks/useTeam";
import AdminActions from "@/components/AdminActions";
import UserActions from "@/components/UserActions";
import TeamBannerUpload from "@/components/TeamBannerUpload";

const Dashboard = () => {
  const { data: events = [] } = useEvents();
  const { data: songs = [] } = useSongs();
  const { hasRole } = useAuth();
  const { data: team } = useTeam();

  // Get upcoming events (next 3)
  const upcomingEvents = events
    .filter(event => new Date(`${event.event_date}T${event.event_time}`) >= new Date())
    .slice(0, 3);

  const stats = [
    { label: "Músicas no Repertório", value: songs.length.toString(), icon: Music },
    { label: "Próximos Eventos", value: upcomingEvents.length.toString(), icon: Calendar },
    { 
      label: "Ensaios este Mês", 
      value: events.filter(e => e.event_type === 'ensaio').length.toString(), 
      icon: Clock 
    },
    { label: "Favoritas", value: songs.filter(s => s.is_favorite).length.toString(), icon: Users },
  ];

  return (
    <div className="min-h-screen bg-gradient-worship">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <img 
          src={team?.banner_url || worshipHero} 
          alt="Worship background" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative px-6 py-20 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">
            Ministério de Louvor
          </h1>
          <p className="text-xl text-white/95 max-w-2xl mx-auto drop-shadow-md">
            Gerenciamento completo da agenda e repertório do seu ministério
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          {stats.map(({ label, value, icon: Icon }) => (
            <Card key={label} className="shadow-gentle hover:shadow-celestial transition-all duration-300">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-gradient-divine rounded-lg">
                    <Icon className="h-5 w-5 text-accent-foreground" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary mb-1">{value}</div>
                <p className="text-sm text-muted-foreground">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Próximos Eventos */}
          <Card className="shadow-gentle">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Próximos Eventos
                </CardTitle>
                <Button asChild variant="outline" size="sm">
                  <Link to="/agenda">Ver Todos</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingEvents.map((event) => (
                  <div key={event.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                    <div className="p-2 bg-primary rounded-lg">
                      <Calendar className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{event.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {new Date(event.event_date).toLocaleDateString('pt-BR')} às {event.event_time}
                      </p>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      event.event_type === 'ensaio' 
                        ? 'bg-accent/20 text-accent-foreground' 
                        : 'bg-primary/20 text-primary'
                    }`}>
                      {event.event_type === 'ensaio' ? 'Ensaio' : 'Evento'}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Ações de Visualização (apenas para membros não-admin) */}
          {!hasRole('admin') && <UserActions />}
        </div>

        {/* Ações Administrativas (apenas para admins) */}
        {hasRole('admin') && (
          <div className="mb-8">
            <AdminActions />
          </div>
        )}

        {/* Team Info for Admins */}
        {hasRole('admin') && team && (
          <div className="bg-gradient-celestial rounded-lg p-6 text-white mb-8">
            <h2 className="text-xl font-bold mb-4">Informações da Equipe</h2>
            <div className="space-y-4">
              <div>
                <p className="text-white/90 mb-2">Equipe: {team.name}</p>
                <p className="text-white/90 mb-4">Código da Equipe: <span className="font-bold tracking-widest">{team.team_code}</span></p>
                <p className="text-sm text-white/80 mb-4">Compartilhe o código acima para outros membros entrarem na equipe.</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Banner da Equipe</h3>
                <TeamBannerUpload />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;