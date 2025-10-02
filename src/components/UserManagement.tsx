import React, { useState, useEffect } from 'react';
import { Plus, Mail, Trash2, Edit3, UserPlus, Phone, Calendar, Shield, UserX, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  user_id: string;
  display_name: string;
  role: 'admin' | 'leader' | 'musician' | 'member';
  ministry_function?: string;
  phone?: string;
  created_at: string;
  team_id?: string;
}

const UserManagement = () => {
  const { hasRole, profile } = useAuth();
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [removingUser, setRemovingUser] = useState<string | null>(null);
  
  // Invite form data
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteDisplayName, setInviteDisplayName] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'leader' | 'musician' | 'member'>('member');
  const [inviteMinistryFunction, setInviteMinistryFunction] = useState('');
  const [invitePhone, setInvitePhone] = useState('');

  // Edit form data
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editMinistryFunction, setEditMinistryFunction] = useState('');
  const [editPhone, setEditPhone] = useState('');

  // Check if user is admin
  if (!hasRole('admin')) {
    return null;
  }

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('team_id', profile?.team_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar usuários",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Call edge function to send invite email
      const { data, error } = await supabase.functions.invoke('send-invite', {
        body: {
          email: inviteEmail,
          displayName: inviteDisplayName,
          role: inviteRole,
          ministryFunction: inviteMinistryFunction
        }
      });

      if (error) throw error;

      toast({
        title: "Usuário Criado com Sucesso!",
        description: `${inviteDisplayName} foi convidado. Senha temporária: ${data?.tempPassword || 'Não disponível'}. Compartilhe estas credenciais com o usuário.`,
      });

      // Reset form and refresh profiles
      setInviteEmail('');
      setInviteDisplayName('');
      setInviteRole('member');
      setInviteMinistryFunction('');
      setInvitePhone('');
      setInviteDialogOpen(false);
      fetchProfiles();
    } catch (error) {
      console.error('Error sending invite:', error);
      toast({
        title: "Erro",
        description: "Erro ao enviar convite",
        variant: "destructive",
      });
    }
  };

  const handleUpdateRole = async (userId: string, newRole: 'admin' | 'leader' | 'musician' | 'member') => {
    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (profileError) throw profileError;

      const { error: roleError } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (roleError) throw roleError;

      toast({
        title: "Sucesso",
        description: "Nível de acesso atualizado",
      });

      fetchProfiles();
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar nível de acesso",
        variant: "destructive",
      });
    }
  };

  const handleRemoveFromTeam = async (userId: string, userName: string) => {
    // Prevent removing yourself
    if (userId === profile?.user_id) {
      toast({
        title: "Erro",
        description: "Você não pode remover sua própria conta da equipe",
        variant: "destructive",
      });
      return;
    }

    // Check if this is the last admin
    const adminCount = profiles.filter(p => p.role === 'admin').length;
    const userToRemove = profiles.find(p => p.user_id === userId);
    
    if (userToRemove?.role === 'admin' && adminCount <= 1) {
      toast({
        title: "Erro",
        description: "Não é possível remover o último administrador da equipe",
        variant: "destructive",
      });
      return;
    }

    try {
      setRemovingUser(userId);

      // Remove team_id from profile (this will prevent access to team data)
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ team_id: null })
        .eq('user_id', userId);

      if (profileError) throw profileError;

      toast({
        title: "Sucesso",
        description: `${userName} foi removido da equipe`,
      });

      fetchProfiles();
    } catch (error) {
      console.error('Error removing user from team:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover usuário da equipe",
        variant: "destructive",
      });
    } finally {
      setRemovingUser(null);
    }
  };

  const handleEditProfile = (profileToEdit: Profile) => {
    setSelectedProfile(profileToEdit);
    setEditDisplayName(profileToEdit.display_name);
    setEditMinistryFunction(profileToEdit.ministry_function || '');
    setEditPhone(profileToEdit.phone || '');
    setEditDialogOpen(true);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProfile) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: editDisplayName,
          ministry_function: editMinistryFunction || null,
          phone: editPhone || null,
        })
        .eq('user_id', selectedProfile.user_id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Perfil atualizado com sucesso",
      });

      setEditDialogOpen(false);
      setSelectedProfile(null);
      fetchProfiles();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar perfil",
        variant: "destructive",
      });
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'leader':
        return 'default';
      case 'musician':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'leader':
        return 'Líder';
      case 'musician':
        return 'Músico';
      default:
        return 'Membro';
    }
  };

  if (loading) {
    return (
      <Card className="shadow-gentle">
        <CardHeader>
          <CardTitle>Gerenciar Usuários</CardTitle>
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
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Gerenciar Usuários
          </CardTitle>
          <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-celestial hover:shadow-celestial">
                <Plus className="h-4 w-4 mr-2" />
                Convidar Usuário
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Convidar Novo Usuário</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleInviteUser} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="usuario@email.com"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="displayName">Nome de Exibição *</Label>
                  <Input
                    id="displayName"
                    value={inviteDisplayName}
                    onChange={(e) => setInviteDisplayName(e.target.value)}
                    placeholder="Nome do usuário"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="role">Nível de Acesso *</Label>
                  <Select value={inviteRole} onValueChange={(value: 'admin' | 'leader' | 'musician' | 'member') => setInviteRole(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Membro</SelectItem>
                      <SelectItem value="musician">Músico</SelectItem>
                      <SelectItem value="leader">Líder</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="ministryFunction">Função/Instrumento</Label>
                  <Input
                    id="ministryFunction"
                    value={inviteMinistryFunction}
                    onChange={(e) => setInviteMinistryFunction(e.target.value)}
                    placeholder="Ex: Vocal, Guitarra, Bateria, Baixo, Teclado..."
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={invitePhone}
                    onChange={(e) => setInvitePhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1">
                    <Mail className="h-4 w-4 mr-2" />
                    Enviar Convite
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setInviteDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {profiles.map((profile) => (
            <Card key={profile.id} className="hover:shadow-gentle transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-1 space-y-3">
                    {/* Header com nome e badge */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-primary" />
                        <h4 className="font-semibold text-lg">{profile.display_name}</h4>
                      </div>
                      <Badge variant={getRoleBadgeVariant(profile.role)}>
                        {getRoleLabel(profile.role)}
                      </Badge>
                    </div>

                    {/* Informações detalhadas */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      {profile.ministry_function && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Music className="h-3 w-3 text-primary" />
                          <span className="font-medium">{profile.ministry_function}</span>
                        </div>
                      )}
                      {profile.phone && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          <span>{profile.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>Membro desde {new Date(profile.created_at).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <Select 
                        value={profile.role} 
                        onValueChange={(value: 'admin' | 'leader' | 'musician' | 'member') => 
                          handleUpdateRole(profile.user_id, value)
                        }
                      >
                        <SelectTrigger className="w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="member">Membro</SelectItem>
                          <SelectItem value="musician">Músico</SelectItem>
                          <SelectItem value="leader">Líder</SelectItem>
                          <SelectItem value="admin">Administrador</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex gap-1">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditProfile(profile)}
                        className="flex-1"
                      >
                        <Edit3 className="h-3 w-3 mr-1" />
                        Editar
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            disabled={removingUser === profile.user_id}
                            className="hover:bg-destructive hover:text-destructive-foreground"
                          >
                            <UserX className="h-3 w-3 mr-1" />
                            Remover
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remover da Equipe</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja remover <strong>{profile.display_name}</strong> da equipe? 
                              O usuário perderá acesso aos dados da equipe, mas a conta permanecerá ativa.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleRemoveFromTeam(profile.user_id, profile.display_name)}
                              className="bg-destructive hover:bg-destructive/90"
                            >
                              Remover da Equipe
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {profiles.length === 0 && (
            <div className="text-center py-12">
              <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum membro encontrado</h3>
              <p className="text-muted-foreground mb-4">Comece convidando os primeiros membros para sua equipe.</p>
            </div>
          )}
        </div>

        {/* Dialog de Edição */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Perfil - {selectedProfile?.display_name}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <Label htmlFor="editDisplayName">Nome de Exibição *</Label>
                <Input
                  id="editDisplayName"
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  placeholder="Nome do usuário"
                  required
                />
              </div>
              <div>
                <Label htmlFor="editMinistryFunction">Função/Instrumento</Label>
                <Input
                  id="editMinistryFunction"
                  value={editMinistryFunction}
                  onChange={(e) => setEditMinistryFunction(e.target.value)}
                  placeholder="Ex: Vocal, Guitarra, Bateria, Baixo, Teclado..."
                />
              </div>
              <div>
                <Label htmlFor="editPhone">Telefone</Label>
                <Input
                  id="editPhone"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  <Edit3 className="h-4 w-4 mr-2" />
                  Salvar Alterações
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setEditDialogOpen(false)}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default UserManagement;