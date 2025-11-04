import { Calendar, Music, Users, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const UserActions = () => {
  return (
    <Card className="shadow-gentle">
      <CardHeader>
        <CardTitle>Painel de Membros</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <Button asChild className="h-20 flex-col gap-2 bg-gradient-celestial hover:shadow-celestial">
            <Link to="/agenda">
              <Calendar className="h-6 w-6" />
              Ver Agenda
            </Link>
          </Button>
          <Button asChild variant="secondary" className="h-20 flex-col gap-2 hover:shadow-gentle">
            <Link to="/musicas">
              <Music className="h-6 w-6" />
              Ver Repertório
            </Link>
          </Button>
          <Button asChild className="h-20 flex-col gap-2 bg-gradient-divine hover:shadow-divine">
            <Link to="/contatos">
              <Users className="h-6 w-6" />
              Membros da Equipe
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-20 flex-col gap-2 hover:shadow-gentle">
            <Link to="/favoritas">
              <Eye className="h-6 w-6" />
              Minhas Favoritas
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserActions;