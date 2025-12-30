import { useState } from "react";
import { Music, Search, Plus, Heart, Clock, CheckSquare, Square } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useSongs, useDeleteSong, Song } from "@/hooks/useSongs";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import SongForm from "@/components/SongForm";

const Musicas = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("todas");
  const [songToView, setSongToView] = useState<Song | null>(null);
  const [songToDelete, setSongToDelete] = useState<Song | null>(null);
  const [selectedSongs, setSelectedSongs] = useState<string[]>([]);
  const { data: songs = [], isLoading } = useSongs();
  const { hasRole } = useAuth();
  const { toast } = useToast();
  const deleteSong = useDeleteSong();
  
  const canManageSongs = hasRole('admin') || hasRole('leader');

  const toggleSongSelection = (songId: string) => {
    setSelectedSongs(prev => 
      prev.includes(songId) 
        ? prev.filter(id => id !== songId)
        : [...prev, songId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedSongs.length === filteredSongs.length) {
      setSelectedSongs([]);
    } else {
      setSelectedSongs(filteredSongs.map(song => song.id));
    }
  };

  const clearSelection = () => {
    setSelectedSongs([]);
  };

  const categories = [
    { value: "todas", label: "Todas" },
    { value: "louvor", label: "Louvor" },
    { value: "adoracao", label: "Adoração" }
  ];

  const filteredSongs = songs.filter((song: Song) => {
    const matchesSearch = song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         song.artist.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "todas" || song.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getCategoryColor = (category: string) => {
    return category === 'louvor' 
      ? 'bg-gradient-celestial text-primary-foreground' 
      : 'bg-gradient-divine text-accent-foreground';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-worship flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando músicas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/80 p-2 sm:p-4">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-primary mb-1 sm:mb-2">Banco de Músicas</h1>
          <p className="text-sm text-muted-foreground">Gerencie o repertório do ministério</p>
        </div>

        {/* Card Principal */}
        <Card className="shadow-gentle">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <Music className="h-5 w-5 text-primary" />
                Repertório do Ministério
              </CardTitle>
              {canManageSongs && (
                <SongForm>
                  <Button className="bg-gradient-divine hover:shadow-divine">
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Música
                  </Button>
                </SongForm>
              )}
            </div>

            {/* Actions Bar dentro do header */}
            <div className="flex flex-col gap-3 mt-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Buscar músicas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Selection Actions */}
              {canManageSongs && filteredSongs.length > 0 && (
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={selectedSongs.length === filteredSongs.length && filteredSongs.length > 0}
                          onCheckedChange={toggleSelectAll}
                        />
                        <span className="text-sm font-medium">
                          {selectedSongs.length > 0 
                            ? `${selectedSongs.length} música(s) selecionada(s)` 
                            : 'Selecionar todas'}
                        </span>
                      </div>
                      {selectedSongs.length > 0 && (
                        <div className="flex gap-2 w-full sm:w-auto">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={clearSelection}
                            className="flex-1 sm:flex-none"
                          >
                            Limpar Seleção
                          </Button>
                          <Button 
                            size="sm"
                            className="bg-gradient-celestial flex-1 sm:flex-none"
                            onClick={() => {
                              toast({
                                title: "Músicas Selecionadas",
                                description: `${selectedSongs.length} música(s) pronta(s) para adicionar ao evento`,
                              });
                            }}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Usar no Evento
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </CardHeader>

          <CardContent>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-6">
          <Card className="border-0 md:border md:shadow-gentle">
            <CardContent className="p-3 md:p-4 text-center">
              <Music className="h-6 w-6 md:h-8 md:w-8 text-primary mx-auto mb-1 md:mb-2" />
              <div className="text-xl md:text-2xl font-bold text-primary">{songs.length}</div>
              <div className="text-xs md:text-sm text-muted-foreground">Total</div>
            </CardContent>
          </Card>
            <Card className="border-0 md:border md:shadow-gentle">
              <CardContent className="p-3 md:p-4 text-center">
                <Heart className="h-6 w-6 md:h-8 md:w-8 text-accent mx-auto mb-1 md:mb-2" />
                <div className="text-xl md:text-2xl font-bold text-primary">{songs.filter((s: Song) => s.is_favorite).length}</div>
                <div className="text-xs md:text-sm text-muted-foreground">Favoritas</div>
              </CardContent>
            </Card>
            <Card className="border-0 md:border md:shadow-gentle">
              <CardContent className="p-3 md:p-4 text-center">
                <div className="h-6 w-6 md:h-8 md:w-8 bg-gradient-celestial rounded mx-auto mb-1 md:mb-2 flex items-center justify-center text-primary-foreground font-bold text-xs md:text-sm">L</div>
                <div className="text-xl md:text-2xl font-bold text-primary">{songs.filter((s: Song) => s.category === 'louvor').length}</div>
                <div className="text-xs md:text-sm text-muted-foreground">Louvor</div>
              </CardContent>
            </Card>
            <Card className="border-0 md:border md:shadow-gentle">
              <CardContent className="p-3 md:p-4 text-center">
                <div className="h-6 w-6 md:h-8 md:w-8 bg-gradient-divine rounded mx-auto mb-1 md:mb-2 flex items-center justify-center text-accent-foreground font-bold text-xs md:text-sm">A</div>
                <div className="text-xl md:text-2xl font-bold text-primary">{songs.filter((s: Song) => s.category === 'adoracao').length}</div>
                <div className="text-xs md:text-sm text-muted-foreground">Adoração</div>
              </CardContent>
            </Card>
        </div>

            {/* Songs Grid */}
            <div className="grid gap-4">
              {filteredSongs.map((song) => (
                <Card 
                  key={song.id} 
                  className={`hover:shadow-gentle transition-shadow ${
                    selectedSongs.includes(song.id) ? 'ring-2 ring-primary bg-primary/5' : ''
                  }`}
                >
                  <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  {/* Checkbox for selection */}
                  {canManageSongs && (
                    <div className="flex-shrink-0">
                      <Checkbox
                        checked={selectedSongs.includes(song.id)}
                        onCheckedChange={() => toggleSongSelection(song.id)}
                        className="h-5 w-5"
                      />
                    </div>
                  )}

                  {/* Song Icon */}
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-gradient-celestial rounded-lg flex items-center justify-center">
                      <Music className="h-8 w-8 text-primary-foreground" />
                    </div>
                  </div>

                  {/* Song Details */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-primary flex items-center gap-2">
                          {song.title}
                          {song.is_favorite && <Heart className="h-5 w-5 text-accent fill-accent" />}
                        </h3>
                        <p className="text-muted-foreground">{song.artist}</p>
                      </div>
                      <Badge className={getCategoryColor(song.category)}>
                        {song.category === 'louvor' ? 'Louvor' : 'Adoração'}
                      </Badge>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Tom:</span>
                        <span className="px-2 py-1 bg-muted rounded text-primary font-medium">{song.musical_key || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {song.bpm || 'N/A'} BPM
                      </div>
                      <div className="flex items-center gap-1">
                        Última vez: {song.last_played ? new Date(song.last_played).toLocaleDateString('pt-BR') : 'Nunca'}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSongToView(song)}
                    >
                      Ver Cifra
                    </Button>
                    {canManageSongs && (
                      <>
                        <SongForm song={song}>
                          <Button variant="outline" size="sm">Editar</Button>
                        </SongForm>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-destructive hover:text-destructive"
                          onClick={() => setSongToDelete(song)}
                        >
                          Excluir
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

            {filteredSongs.length === 0 && (
              <div className="p-12 text-center">
                <Music className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">
                  Nenhuma música encontrada
                </h3>
                <p className="text-muted-foreground">
                  {searchTerm || categoryFilter !== "todas" 
                    ? 'Tente ajustar os filtros de busca.' 
                    : 'Adicione a primeira música ao repertório.'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog para visualizar cifra */}
      <Dialog open={!!songToView} onOpenChange={() => setSongToView(null)}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{songToView?.title}</DialogTitle>
            <DialogDescription>{songToView?.artist}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-4 text-sm text-muted-foreground">
              <span>Tom: <strong className="text-primary">{songToView?.musical_key || 'N/A'}</strong></span>
              <span>BPM: <strong className="text-primary">{songToView?.bpm || 'N/A'}</strong></span>
              <Badge className={getCategoryColor(songToView?.category || 'louvor')}>
                {songToView?.category === 'louvor' ? 'Louvor' : 'Adoração'}
              </Badge>
            </div>
            
            {songToView?.lyrics && (
              <div>
                <h3 className="font-semibold text-primary mb-2">Letra</h3>
                <div className="whitespace-pre-wrap text-sm bg-muted p-4 rounded">
                  {songToView.lyrics}
                </div>
              </div>
            )}
            
            {songToView?.chords && (
              <div>
                <h3 className="font-semibold text-primary mb-2">Cifra</h3>
                <div className="whitespace-pre-wrap text-sm bg-muted p-4 rounded font-mono">
                  {songToView.chords}
                </div>
              </div>
            )}

            {!songToView?.lyrics && !songToView?.chords && (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma letra ou cifra disponível para esta música.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para confirmar exclusão */}
      <Dialog open={!!songToDelete} onOpenChange={() => setSongToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir a música "{songToDelete?.title}"? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setSongToDelete(null)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={async () => {
                if (songToDelete) {
                  try {
                    await deleteSong.mutateAsync(songToDelete.id);
                    toast({
                      title: "Música excluída",
                      description: "A música foi removida do repertório.",
                    });
                    setSongToDelete(null);
                  } catch (error) {
                    toast({
                      title: "Erro ao excluir",
                      description: "Não foi possível excluir a música.",
                      variant: "destructive",
                    });
                  }
                }
              }}
              disabled={deleteSong.isPending}
            >
              {deleteSong.isPending ? "Excluindo..." : "Excluir"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Musicas;