import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Profile {
  id: string;
  user_id: string;
  display_name: string;
  role: 'admin' | 'leader' | 'musician' | 'member';
  ministry_function?: string;
  phone?: string;
}

const TeamMembers = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();

  useEffect(() => {
    if (profile?.team_id) {
      fetchProfiles();
    }
  }, [profile?.team_id]);

  const fetchProfiles = async () => {
    if (!profile?.team_id) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, display_name, role, ministry_function, phone')
        .eq('team_id', profile.team_id)
        .order('role', { ascending: true })
        .order('display_name', { ascending: true });

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Erro ao buscar membros da equipe:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'leader': return 'default';
      case 'musician': return 'secondary';
      case 'member': return 'outline';
      default: return 'outline';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'leader': return 'Líder';
      case 'musician': return 'Músico';
      case 'member': return 'Membro';
      default: return role;
    }
  };

  if (loading) {
    return (
      <Card className="shadow-gentle">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Membros da Equipe
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-gentle">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Membros da Equipe ({profiles.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {profiles.map((member) => (
            <div key={member.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
              <div className="p-2 bg-primary/10 rounded-lg">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium">{member.display_name}</h4>
                {member.ministry_function && (
                  <p className="text-sm text-muted-foreground">{member.ministry_function}</p>
                )}
              </div>
              <Badge variant={getRoleBadgeVariant(member.role)}>
                {getRoleLabel(member.role)}
              </Badge>
            </div>
          ))}
          {profiles.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum membro encontrado</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TeamMembers;