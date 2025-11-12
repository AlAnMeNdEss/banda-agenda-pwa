import { Calendar, Home, Music, Users } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import UserProfile from "@/components/UserProfile";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";

const Navigation = () => {
  const { user } = useAuth();
  
  const navItems = [
    { to: "/", icon: Home, label: "Dashboard" },
    { to: "/agenda", icon: Calendar, label: "Agenda" },
    { to: "/musicas", icon: Music, label: "Músicas" },
    { to: "/contatos", icon: Users, label: "Contatos" }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t md:border-t border-border md:shadow-celestial">
      <div className="flex items-center justify-between py-3 md:py-2 px-2 md:px-4 max-w-md mx-auto">
        <div className="flex items-center justify-around flex-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center gap-1 md:gap-1 py-2 md:py-2 px-3 md:px-3 rounded-lg transition-all duration-200 min-w-0",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )
              }
            >
              <Icon className="h-6 w-6 md:h-5 md:w-5" />
              <span className="text-xs md:text-xs font-medium truncate">{label}</span>
            </NavLink>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          {user && (
            <div className="ml-1">
              <UserProfile />
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;