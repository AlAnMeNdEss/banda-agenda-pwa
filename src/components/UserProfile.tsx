import { LogOut, User, Settings, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import AvatarUpload from './AvatarUpload';
import { useState } from 'react';

const UserProfile = () => {
  const { user, profile, signOut } = useAuth();
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const feedbackNumber = "5588994163669";
  const whatsappLink = `https://wa.me/${feedbackNumber}?text=${encodeURIComponent("Olá! Gostaria de enviar um feedback sobre o app da banda.")}`;

  if (!user || !profile) return null;

  const handleSignOut = async () => {
    await signOut();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
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

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full">
            <Avatar className="h-10 w-10">
              {profile.avatar_url && (
                <AvatarImage src={profile.avatar_url} alt={profile.display_name || 'Avatar'} />
              )}
              <AvatarFallback className="bg-primary text-primary-foreground">
                {getInitials(profile.display_name || user.email || 'U')}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-80" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium leading-none">
                {profile.display_name || user.email}
              </p>
              <Badge variant={getRoleBadgeVariant(profile.role)}>
                {getRoleLabel(profile.role)}
              </Badge>
            </div>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
            {profile.ministry_function && (
              <p className="text-xs leading-none text-muted-foreground">
                {profile.ministry_function}
              </p>
            )}
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          className="cursor-pointer"
          onClick={() => setProfileDialogOpen(true)}
        >
          <User className="mr-2 h-4 w-4" />
          <span>Editar Perfil</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem className="cursor-pointer">
          <Settings className="mr-2 h-4 w-4" />
          <span>Configurações</span>
        </DropdownMenuItem>

        <DropdownMenuItem asChild className="cursor-pointer">
          <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="flex items-center">
            <MessageCircle className="mr-2 h-4 w-4" />
            <span>Feedback (WhatsApp)</span>
          </a>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          className="cursor-pointer text-destructive focus:text-destructive"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

    <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
      <DialogContent className="max-w-[90vw] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Foto de Perfil</DialogTitle>
        </DialogHeader>
        <AvatarUpload
          avatarUrl={profile.avatar_url}
          displayName={profile.display_name || user.email || 'Usuário'}
          onUploadComplete={() => setProfileDialogOpen(false)}
        />
      </DialogContent>
    </Dialog>
    </>
  );
};

export default UserProfile;