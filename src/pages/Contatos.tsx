import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import UserManagement from "@/components/UserManagement";
import TeamMembers from "@/components/TeamMembers";

const Contatos = () => {
  const { hasRole } = useAuth();
  const isAdmin = hasRole('admin');

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/80 p-2 sm:p-4">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        <div className="flex items-center gap-2 sm:gap-4">
          <Button asChild variant="outline" size="icon" className="flex-shrink-0">
            <Link to="/">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold truncate">
            {isAdmin ? "Gerenciar Contatos" : "Contatos da Equipe"}
          </h1>
        </div>
        
        {isAdmin ? (
          <UserManagement />
        ) : (
          <TeamMembers />
        )}
      </div>
    </div>
  );
};

export default Contatos;