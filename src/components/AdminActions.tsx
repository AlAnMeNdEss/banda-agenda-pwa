import { Calendar, Clock, Music, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const AdminActions = () => {
  return (
    <Card className="shadow-gentle">
      <CardHeader>
        <CardTitle>Painel Administrativo</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <Button asChild className="h-20 flex-col gap-2 bg-gradient-celestial hover:shadow-celestial">
            <Link to="/agenda?new=event">
              <Calendar className="h-6 w-6" />
              Novo Evento
            </Link>
          </Button>
          <Button asChild variant="secondary" className="h-20 flex-col gap-2 hover:shadow-gentle">
            <Link to="/agenda?new=rehearsal">
              <Clock className="h-6 w-6" />
              Agendar Ensaio
            </Link>
          </Button>
          <Button asChild className="h-20 flex-col gap-2 bg-gradient-divine hover:shadow-divine">
            <Link to="/musicas?new=true">
              <Music className="h-6 w-6" />
              Nova Música
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-20 flex-col gap-2 hover:shadow-gentle">
            <Link to="/agenda?manage=true">
              <Users className="h-6 w-6" />
              Gerenciar Equipe
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminActions;