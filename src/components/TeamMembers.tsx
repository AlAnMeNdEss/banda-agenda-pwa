import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  avatar_url?: string;
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
        .select('id, user_id, display_name, role, ministry_function, phone, avatar_url')
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

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
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
          <Users className="h-5 w-5 text-primary flex-shrink-0" />
          <span className="truncate">Membros da Equipe ({profiles.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {profiles.map((member) => (
            <Card key={member.id} className="hover:shadow-gentle transition-shadow">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Avatar className="h-12 w-12 flex-shrink-0">
                      {member.avatar_url && (
                        <AvatarImage src={member.avatar_url} alt={member.display_name} />
                      )}
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getInitials(member.display_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{member.display_name}</h4>
                      {member.ministry_function && (
                        <p className="text-sm text-muted-foreground truncate">{member.ministry_function}</p>
                      )}
                      {member.phone && (
                        <p className="text-xs text-muted-foreground truncate">{member.phone}</p>
                      )}
                    </div>
                  </div>
                  <Badge variant={getRoleBadgeVariant(member.role)} className="w-fit">
                    {getRoleLabel(member.role)}
                  </Badge>
                </div>
              </CardContent>
            </Card>
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