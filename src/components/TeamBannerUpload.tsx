import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Camera, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTeam } from "@/hooks/useTeam";

const TeamBannerUpload = () => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const { profile } = useAuth();
  const { data: team, refetch } = useTeam();

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const file = event.target.files[0];

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Erro",
          description: "Por favor, selecione uma imagem válida.",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Erro",
          description: "A imagem deve ter no máximo 5MB.",
          variant: "destructive",
        });
        return;
      }

      if (!team?.id) {
        toast({
          title: "Erro",
          description: "Equipe não encontrada.",
          variant: "destructive",
        });
        return;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${team.id}-${Math.random()}.${fileExt}`;
      const filePath = fileName;

      // Remove old banner if exists
      if (team.banner_url) {
        const oldPath = team.banner_url.split('/').pop();
        if (oldPath) {
          await supabase.storage.from('team-banners').remove([oldPath]);
        }
      }

      // Upload new banner
      const { error: uploadError } = await supabase.storage
        .from('team-banners')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('team-banners')
        .getPublicUrl(filePath);

      // Update team record
      const { error: updateError } = await supabase
        .from('teams')
        .update({ banner_url: publicUrl })
        .eq('id', team.id);

      if (updateError) throw updateError;

      await refetch();

      toast({
        title: "Sucesso",
        description: "Banner da equipe atualizado com sucesso!",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao fazer upload",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    try {
      setUploading(true);

      if (!team?.banner_url || !team?.id) return;

      const filePath = team.banner_url.split('/').pop();
      if (filePath) {
        await supabase.storage.from('team-banners').remove([filePath]);
      }

      const { error } = await supabase
        .from('teams')
        .update({ banner_url: null })
        .eq('id', team.id);

      if (error) throw error;

      await refetch();

      toast({
        title: "Sucesso",
        description: "Banner removido com sucesso!",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao remover banner",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          variant="outline"
          disabled={uploading}
          className="relative"
          asChild
        >
          <label className="cursor-pointer">
            <Camera className="h-4 w-4 mr-2" />
            {uploading ? "Enviando..." : "Escolher Banner"}
            <input
              type="file"
              accept="image/*"
              onChange={handleUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </Button>

        {team?.banner_url && (
          <Button
            variant="destructive"
            onClick={handleRemove}
            disabled={uploading}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Remover
          </Button>
        )}
      </div>
      
      <p className="text-sm text-muted-foreground">
        Recomendado: 1920x400px ou proporção 16:3 • Máximo 5MB
      </p>
    </div>
  );
};

export default TeamBannerUpload;
