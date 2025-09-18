import { Calendar, Home, Music, Menu, X } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { to: "/", icon: Home, label: "Dashboard" },
    { to: "/agenda", icon: Calendar, label: "Agenda" },
    { to: "/musicas", icon: Music, label: "Músicas" }
  ];

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden fixed top-4 right-4 z-50 bg-card/80 backdrop-blur-md shadow-gentle"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-background/80 backdrop-blur-md z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Navigation */}
      <nav className={cn(
        "fixed md:static top-0 left-0 h-full md:h-auto w-64 md:w-full bg-gradient-celestial md:bg-transparent p-6 md:p-4 transform transition-transform duration-300 z-40",
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="flex flex-col md:flex-row gap-4 md:gap-2 mt-16 md:mt-0">
          <div className="md:hidden mb-8">
            <h2 className="text-xl font-bold text-primary-foreground">Ministério de Louvor</h2>
          </div>
          
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-4 py-3 md:py-2 rounded-lg transition-all duration-200 font-medium",
                  isActive
                    ? "bg-accent text-accent-foreground shadow-divine md:bg-primary md:text-primary-foreground"
                    : "text-primary-foreground hover:bg-primary-glow/20 md:text-muted-foreground md:hover:bg-muted md:hover:text-foreground"
                )
              }
              onClick={() => setIsOpen(false)}
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  );
};

export default Navigation;