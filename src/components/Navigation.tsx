import { Calendar, Home, Music } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

const Navigation = () => {
  const navItems = [
    { to: "/", icon: Home, label: "Dashboard" },
    { to: "/agenda", icon: Calendar, label: "Agenda" },
    { to: "/musicas", icon: Music, label: "Músicas" }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border shadow-celestial">
      <div className="flex items-center justify-around py-2 px-4 max-w-md mx-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-all duration-200 min-w-0 flex-1",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )
            }
          >
            <Icon className="h-5 w-5" />
            <span className="text-xs font-medium truncate">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default Navigation;