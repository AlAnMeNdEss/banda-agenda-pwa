import { useState } from "react";
import { Check, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  user_id: string;
  display_name: string | null;
  role: string;
  ministry_function: string | null;
}

interface ParticipantSelectorProps {
  selectedParticipants: string[];
  onParticipantsChange: (participants: string[]) => void;
}

const ParticipantSelector = ({ selectedParticipants, onParticipantsChange }: ParticipantSelectorProps) => {
  const { profile } = useAuth();
  
  const { data: teamMembers = [] } = useQuery({
    queryKey: ['team-members', profile?.team_id],
    queryFn: async (): Promise<Profile[]> => {
      if (!profile?.team_id) return [];
      
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, display_name, role, ministry_function')
        .eq('team_id', profile.team_id)
        .order('display_name');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.team_id,
  });

  const handleParticipantToggle = (userId: string) => {
    const isSelected = selectedParticipants.includes(userId);
    if (isSelected) {
      onParticipantsChange(selectedParticipants.filter(id => id !== userId));
    } else {
      onParticipantsChange([...selectedParticipants, userId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedParticipants.length === teamMembers.length) {
      onParticipantsChange([]);
    } else {
      onParticipantsChange(teamMembers.map(member => member.user_id));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Participantes do Evento</h4>
        <Button 
          type="button"
          variant="outline" 
          size="sm" 
          onClick={handleSelectAll}
        >
          {selectedParticipants.length === teamMembers.length ? (
            <>
              <X className="h-4 w-4 mr-1" />
              Desmarcar Todos
            </>
          ) : (
            <>
              <Check className="h-4 w-4 mr-1" />
              Selecionar Todos
            </>
          )}
        </Button>
      </div>

      {teamMembers.length === 0 ? (
        <Card>
          <CardContent className="p-4 text-center text-muted-foreground">
            Nenhum membro encontrado na equipe
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-2 max-h-48 overflow-y-auto">
          {teamMembers.map((member) => (
            <Card 
              key={member.user_id} 
              className={`cursor-pointer transition-all ${
                selectedParticipants.includes(member.user_id) 
                  ? 'ring-2 ring-primary bg-accent/50' 
                  : 'hover:bg-accent/30'
              }`}
              onClick={() => handleParticipantToggle(member.user_id)}
            >
              <CardContent className="p-3 flex items-center gap-3">
                <Checkbox 
                  checked={selectedParticipants.includes(member.user_id)}
                  onCheckedChange={() => handleParticipantToggle(member.user_id)}
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {member.display_name || 'Sem nome'}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {member.role}
                    </Badge>
                  </div>
                  {member.ministry_function && (
                    <p className="text-sm text-muted-foreground">
                      {member.ministry_function}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedParticipants.length > 0 && (
        <div className="text-sm text-muted-foreground">
          {selectedParticipants.length} participante(s) selecionado(s)
        </div>
      )}
    </div>
  );
};

export default ParticipantSelector;