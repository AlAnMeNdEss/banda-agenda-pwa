import React, { useState, useEffect } from 'react';
import { Plus, Mail, Trash2, Edit3, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
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
}

const UserManagement = () => {
  const { hasRole, profile } = useAuth();
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [deletingUser, setDeletingUser] = useState<string | null>(null);
  
  // Invite form data
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteDisplayName, setInviteDisplayName] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'leader' | 'musician' | 'member'>('member');
  const [inviteMinistryFunction, setInviteMinistryFunction] = useState('');

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

  const handleDeleteUser = async (userId: string, userName: string) => {
    // Prevent deleting yourself
    if (userId === profile?.user_id) {
      toast({
        title: "Erro",
        description: "Você não pode excluir sua própria conta",
        variant: "destructive",
      });
      return;
    }

    // Check if this is the last admin
    const adminCount = profiles.filter(p => p.role === 'admin').length;
    const userToDelete = profiles.find(p => p.user_id === userId);
    
    if (userToDelete?.role === 'admin' && adminCount <= 1) {
      toast({
        title: "Erro",
        description: "Não é possível excluir o último administrador",
        variant: "destructive",
      });
      return;
    }

    try {
      setDeletingUser(userId);

      // Delete from user_roles first (due to foreign key constraints)
      const { error: roleError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (roleError) throw roleError;

      // Delete from profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', userId);

      if (profileError) throw profileError;

      // Delete the user from auth (this will cascade to related tables)
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);
      
      // Note: auth.admin.deleteUser might not work from client side depending on RLS
      // If it fails, the user record will remain but won't be able to access the system
      if (authError) {
        console.warn('Could not delete user from auth:', authError);
      }

      toast({
        title: "Sucesso",
        description: `${userName} foi removido da equipe`,
      });

      fetchProfiles();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir usuário",
        variant: "destructive",
      });
    } finally {
      setDeletingUser(null);
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
                  <Label htmlFor="ministryFunction">Função no Ministério</Label>
                  <Input
                    id="ministryFunction"
                    value={inviteMinistryFunction}
                    onChange={(e) => setInviteMinistryFunction(e.target.value)}
                    placeholder="Ex: Vocal, Guitarra, Bateria..."
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
            <div key={profile.id} className="flex items-center gap-4 p-4 rounded-lg border">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="font-medium">{profile.display_name}</h4>
                  <Badge variant={getRoleBadgeVariant(profile.role)}>
                    {getRoleLabel(profile.role)}
                  </Badge>
                </div>
                {profile.ministry_function && (
                  <p className="text-sm text-muted-foreground">{profile.ministry_function}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Membro desde {new Date(profile.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <div className="flex gap-2">
                <Select 
                  value={profile.role} 
                  onValueChange={(value: 'admin' | 'leader' | 'musician' | 'member') => 
                    handleUpdateRole(profile.user_id, value)
                  }
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Membro</SelectItem>
                    <SelectItem value="musician">Músico</SelectItem>
                    <SelectItem value="leader">Líder</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="icon"
                      disabled={deletingUser === profile.user_id}
                      className="hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja excluir <strong>{profile.display_name}</strong>? 
                        Esta ação não pode ser desfeita e o usuário perderá acesso ao sistema.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDeleteUser(profile.user_id, profile.display_name)}
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default UserManagement;