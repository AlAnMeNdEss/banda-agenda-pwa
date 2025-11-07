import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Agenda from "./pages/Agenda";
import EventoDetalhes from "./pages/EventoDetalhes";
import Musicas from "./pages/Musicas";
import Favoritas from "./pages/Favoritas";
import Contatos from "./pages/Contatos";
import Auth from "./pages/Auth";
import Navigation from "./components/Navigation";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./contexts/AuthContext";

const AppContent = () => {
  const location = useLocation();
  const showNavigation = location.pathname !== '/auth';

  return (
    <div className="min-h-screen pb-20">
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/agenda" element={
          <ProtectedRoute>
            <Agenda />
          </ProtectedRoute>
        } />
        <Route path="/evento/:id" element={
          <ProtectedRoute>
            <EventoDetalhes />
          </ProtectedRoute>
        } />
        <Route path="/musicas" element={
          <ProtectedRoute>
            <Musicas />
          </ProtectedRoute>
        } />
        <Route path="/favoritas" element={
          <ProtectedRoute>
            <Favoritas />
          </ProtectedRoute>
        } />
        <Route path="/contatos" element={
          <ProtectedRoute>
            <Contatos />
          </ProtectedRoute>
        } />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      {showNavigation && <Navigation />}
    </div>
  );
};

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
