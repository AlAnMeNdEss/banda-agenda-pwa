import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Music, Plus, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useCreateSong, useUpdateSong, Song } from "@/hooks/useSongs";
import { useToast } from "@/hooks/use-toast";

const songSchema = z.object({
  title: z.string().min(1, "Título é obrigatório").max(200, "Título deve ter no máximo 200 caracteres"),
  artist: z.string().min(1, "Artista é obrigatório").max(200, "Artista deve ter no máximo 200 caracteres"),
  musical_key: z.string().optional(),
  bpm: z.coerce.number().min(1).max(300).optional().nullable(),
  category: z.enum(["louvor", "adoracao"], { required_error: "Categoria é obrigatória" }),
  is_favorite: z.boolean().default(false),
  lyrics: z.string().max(10000, "Letra deve ter no máximo 10000 caracteres").optional(),
  chords: z.string().max(5000, "Cifra deve ter no máximo 5000 caracteres").optional(),
  links: z.array(z.object({
    name: z.string().min(1, "Nome é obrigatório"),
    url: z.string().url("URL inválida"),
  })).optional(),
});

type SongFormData = z.infer<typeof songSchema>;

interface SongFormProps {
  children: React.ReactNode;
  song?: Song;
}

const SongForm = ({ children, song }: SongFormProps) => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const createSong = useCreateSong();
  const updateSong = useUpdateSong();

  const form = useForm<SongFormData>({
    resolver: zodResolver(songSchema),
    defaultValues: song ? {
      title: song.title,
      artist: song.artist,
      musical_key: song.musical_key || "",
      bpm: song.bpm || undefined,
      category: song.category,
      is_favorite: song.is_favorite,
      lyrics: song.lyrics || "",
      chords: song.chords || "",
      links: song.links || [],
    } : {
      title: "",
      artist: "",
      musical_key: "",
      bpm: undefined,
      category: "louvor",
      is_favorite: false,
      lyrics: "",
      chords: "",
      links: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "links",
  });

  const onSubmit = async (data: SongFormData) => {
    try {
      const validLinks = data.links?.filter(link => link.name && link.url) as Array<{name: string; url: string}> | undefined;
      
      const songData = {
        title: data.title,
        artist: data.artist,
        category: data.category,
        is_favorite: data.is_favorite,
        musical_key: data.musical_key || null,
        bpm: data.bpm || null,
        lyrics: data.lyrics || null,
        chords: data.chords || null,
        last_played: null,
        links: validLinks && validLinks.length > 0 ? validLinks : null,
      };
      
      if (song) {
        await updateSong.mutateAsync({ id: song.id, ...songData });
        toast({
          title: "Música atualizada!",
          description: "A música foi atualizada com sucesso.",
        });
      } else {
        await createSong.mutateAsync(songData);
        toast({
          title: "Música adicionada!",
          description: "A música foi adicionada ao repertório com sucesso.",
        });
      }
      
      form.reset();
      setOpen(false);
    } catch (error) {
      toast({
        title: song ? "Erro ao atualizar música" : "Erro ao adicionar música",
        description: "Ocorreu um erro. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{song ? "Editar Música" : "Nova Música"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título da Música</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Maravilhoso é o Teu Nome" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="artist"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Artista/Ministério</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Hillsong, Vineyard, Thalles Roberto..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="louvor">Louvor</SelectItem>
                        <SelectItem value="adoracao">Adoração</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="musical_key"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tom</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: C, Dm, G#" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bpm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>BPM</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Ex: 120" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="is_favorite"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Marcar como favorita</FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lyrics"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Letra (opcional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Cole aqui a letra completa da música" 
                      className="resize-none min-h-32" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="chords"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cifra (opcional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Cole aqui a cifra ou acordes da música" 
                      className="resize-none min-h-32" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <FormLabel className="text-base">Links e Materiais</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ name: "", url: "" })}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Link
                </Button>
              </div>
              
              {fields.length > 0 && (
                <div className="space-y-3">
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex gap-2 items-start p-3 border rounded-md bg-muted/30">
                      <div className="flex-1 space-y-2">
                        <FormField
                          control={form.control}
                          name={`links.${index}.name`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input placeholder="Nome (ex: YouTube, Spotify)" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`links.${index}.url`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input placeholder="URL completa (https://...)" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                        className="mt-1"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpen(false)}
                disabled={createSong.isPending || updateSong.isPending}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="bg-gradient-divine hover:shadow-divine"
                disabled={createSong.isPending || updateSong.isPending}
              >
                {createSong.isPending || updateSong.isPending ? "Salvando..." : song ? "Atualizar" : "Adicionar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default SongForm;
