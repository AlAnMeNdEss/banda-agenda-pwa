import { useState } from "react";
import { Music, Search, Plus, Heart, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSongs, Song } from "@/hooks/useSongs";

const Musicas = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("todas");
  const { data: songs = [], isLoading } = useSongs();

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
    <div className="min-h-screen bg-gradient-worship">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">Banco de Músicas</h1>
          <p className="text-muted-foreground">Gerencie o repertório do ministério</p>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
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

          <Button className="bg-gradient-divine hover:shadow-divine">
            <Plus className="h-4 w-4 mr-2" />
            Nova Música
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="shadow-gentle">
            <CardContent className="p-4 text-center">
              <Music className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold text-primary">{songs.length}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </CardContent>
          </Card>
            <Card className="shadow-gentle">
              <CardContent className="p-4 text-center">
                <Heart className="h-8 w-8 text-accent mx-auto mb-2" />
                <div className="text-2xl font-bold text-primary">{songs.filter((s: Song) => s.is_favorite).length}</div>
                <div className="text-sm text-muted-foreground">Favoritas</div>
              </CardContent>
            </Card>
            <Card className="shadow-gentle">
              <CardContent className="p-4 text-center">
                <div className="h-8 w-8 bg-gradient-celestial rounded mx-auto mb-2 flex items-center justify-center text-primary-foreground font-bold text-sm">L</div>
                <div className="text-2xl font-bold text-primary">{songs.filter((s: Song) => s.category === 'louvor').length}</div>
                <div className="text-sm text-muted-foreground">Louvor</div>
              </CardContent>
            </Card>
            <Card className="shadow-gentle">
              <CardContent className="p-4 text-center">
                <div className="h-8 w-8 bg-gradient-divine rounded mx-auto mb-2 flex items-center justify-center text-accent-foreground font-bold text-sm">A</div>
                <div className="text-2xl font-bold text-primary">{songs.filter((s: Song) => s.category === 'adoracao').length}</div>
                <div className="text-sm text-muted-foreground">Adoração</div>
              </CardContent>
            </Card>
        </div>

        {/* Songs Grid */}
        <div className="grid gap-4">
          {filteredSongs.map((song) => (
            <Card key={song.id} className="shadow-gentle hover:shadow-celestial transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
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
                    <Button variant="outline" size="sm">Ver Cifra</Button>
                    <Button variant="outline" size="sm">Editar</Button>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                      Excluir
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredSongs.length === 0 && (
          <Card className="shadow-gentle">
            <CardContent className="p-12 text-center">
              <Music className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                Nenhuma música encontrada
              </h3>
              <p className="text-muted-foreground">
                {searchTerm || categoryFilter !== "todas" 
                  ? 'Tente ajustar os filtros de busca.' 
                  : 'Adicione a primeira música ao repertório.'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Musicas;