import React, { useState } from 'react';
import { Users, Plus, LogIn, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface TeamSetupProps {
  onComplete: () => void;
}

const TeamSetup = ({ onComplete }: TeamSetupProps) => {
  const { toast } = useToast();
  const [mode, setMode] = useState<'choose' | 'create' | 'join'>('choose');
  const [loading, setLoading] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamCode, setTeamCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) return;

    setLoading(true);
    try {
      // Get current user first
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        throw new Error('Usuário não autenticado');
      }

      const userId = userData.user.id;

      // Generate team code
      const { data: codeData, error: codeError } = await supabase
        .rpc('generate_team_code');

      if (codeError) throw codeError;

      // Create team
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .insert({
          name: teamName,
          team_code: codeData,
          created_by: userId
        })
        .select()
        .single();

      if (teamError) throw teamError;

      // Update user profile to be admin and link to team
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          team_id: team.id,
          role: 'admin'
        })
        .eq('user_id', userId);

      if (profileError) throw profileError;

      // Update user_roles
      const { error: roleError } = await supabase
        .from('user_roles')
        .update({ role: 'admin' })
        .eq('user_id', userId);

      if (roleError) throw roleError;

      setGeneratedCode(team.team_code);
      
      toast({
        title: "Equipe Criada!",
        description: `Equipe "${teamName}" criada com sucesso. Código: ${team.team_code}`,
      });

      // Show the code for a moment then complete
      setTimeout(() => {
        onComplete();
      }, 5000);
    } catch (error) {
      console.error('Error creating team:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar equipe",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleJoinTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamCode.trim()) return;

    setLoading(true);
    try {
      // Get current user first
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        throw new Error('Usuário não autenticado');
      }

      const userId = userData.user.id;

      // Find team by code
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .select('*')
        .eq('team_code', teamCode.toUpperCase())
        .single();

      if (teamError || !team) {
        throw new Error('Código da equipe não encontrado');
      }

      // Update user profile to link to team
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          team_id: team.id,
          role: 'member'
        })
        .eq('user_id', userId);

      if (profileError) throw profileError;

      // Update user_roles
      const { error: roleError } = await supabase
        .from('user_roles')
        .update({ role: 'member' })
        .eq('user_id', userId);

      if (roleError) throw roleError;

      toast({
        title: "Bem-vindo!",
        description: `Você entrou na equipe "${team.name}"`,
      });

      onComplete();
    } catch (error: any) {
      console.error('Error joining team:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao entrar na equipe",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Copiado!",
      description: "Código da equipe copiado para a área de transferência",
    });
  };

  if (generatedCode) {
    return (
      <div className="min-h-screen bg-gradient-worship flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-celestial">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-2xl">
              <Users className="h-6 w-6 text-primary" />
              Equipe Criada!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">
                Sua equipe foi criada com sucesso! Compartilhe o código abaixo com outros membros:
              </p>
              <div className="p-6 bg-gradient-celestial rounded-lg">
                <div className="text-3xl font-bold text-white tracking-widest text-center mb-4">
                  {generatedCode}
                </div>
                <Button 
                  onClick={copyToClipboard}
                  variant="secondary"
                  className="w-full"
                  disabled={copied}
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copiar Código
                    </>
                  )}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Redirecionando para o dashboard em alguns segundos...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (mode === 'choose') {
    return (
      <div className="min-h-screen bg-gradient-worship flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-celestial">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-2xl">
              <Users className="h-6 w-6 text-primary" />
              Configurar Equipe
            </CardTitle>
            <p className="text-muted-foreground">
              Crie uma nova equipe ou entre numa equipe existente
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={() => setMode('create')}
              className="w-full h-16 flex-col gap-2 bg-gradient-celestial hover:shadow-celestial"
            >
              <Plus className="h-6 w-6" />
              Criar Nova Equipe
            </Button>
            
            <Separator />
            
            <Button 
              onClick={() => setMode('join')}
              variant="outline"
              className="w-full h-16 flex-col gap-2 hover:shadow-gentle"
            >
              <LogIn className="h-6 w-6" />
              Entrar numa Equipe
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (mode === 'create') {
    return (
      <div className="min-h-screen bg-gradient-worship flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-celestial">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-2xl">
              <Plus className="h-6 w-6 text-primary" />
              Criar Equipe
            </CardTitle>
            <p className="text-muted-foreground">
              Você será o administrador da equipe
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateTeam} className="space-y-4">
              <div>
                <Label htmlFor="teamName">Nome da Equipe *</Label>
                <Input
                  id="teamName"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="Ex: Ministério de Louvor IBC"
                  required
                  disabled={loading}
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setMode('choose')}
                  disabled={loading}
                  className="flex-1"
                >
                  Voltar
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading || !teamName.trim()}
                  className="flex-1"
                >
                  {loading ? 'Criando...' : 'Criar Equipe'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-worship flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-celestial">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-2xl">
            <LogIn className="h-6 w-6 text-primary" />
            Entrar na Equipe
          </CardTitle>
          <p className="text-muted-foreground">
            Digite o código da equipe fornecido pelo administrador
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleJoinTeam} className="space-y-4">
            <div>
              <Label htmlFor="teamCode">Código da Equipe *</Label>
              <Input
                id="teamCode"
                value={teamCode}
                onChange={(e) => setTeamCode(e.target.value)}
                placeholder="Ex: ABC123"
                required
                disabled={loading}
                className="text-center text-lg font-bold tracking-widest uppercase"
                maxLength={6}
              />
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setMode('choose')}
                disabled={loading}
                className="flex-1"
              >
                Voltar
              </Button>
              <Button 
                type="submit" 
                disabled={loading || !teamCode.trim()}
                className="flex-1"
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeamSetup;