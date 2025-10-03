import { useState } from "react";
import { Music, Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useSongs } from "@/hooks/useSongs";

interface SongSelectorProps {
  selectedSongs: string[];
  onSongsChange: (songs: string[]) => void;
}

const SongSelector = ({ selectedSongs, onSongsChange }: SongSelectorProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: songs = [] } = useSongs();

  const filteredSongs = songs.filter(song =>
    song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    song.artist.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSongToggle = (songId: string) => {
    const isSelected = selectedSongs.includes(songId);
    if (isSelected) {
      onSongsChange(selectedSongs.filter(id => id !== songId));
    } else {
      onSongsChange([...selectedSongs, songId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedSongs.length === filteredSongs.length) {
      onSongsChange([]);
    } else {
      onSongsChange(filteredSongs.map(song => song.id));
    }
  };

  const clearSelection = () => {
    onSongsChange([]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Repertório do Evento</h4>
        {selectedSongs.length > 0 && (
          <Button 
            type="button"
            variant="outline" 
            size="sm" 
            onClick={clearSelection}
          >
            <X className="h-4 w-4 mr-1" />
            Limpar Seleção
          </Button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Buscar músicas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {filteredSongs.length === 0 ? (
        <Card>
          <CardContent className="p-4 text-center text-muted-foreground">
            <Music className="h-8 w-8 mx-auto mb-2 opacity-50" />
            {searchTerm ? 'Nenhuma música encontrada' : 'Nenhuma música cadastrada'}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {filteredSongs.length} música(s) disponível(eis)
            </span>
            <Button 
              type="button"
              variant="ghost" 
              size="sm" 
              onClick={handleSelectAll}
            >
              {selectedSongs.length === filteredSongs.length ? 'Desmarcar Todas' : 'Selecionar Todas'}
            </Button>
          </div>

          <div className="grid gap-2 max-h-64 overflow-y-auto">
            {filteredSongs.map((song) => (
              <Card 
                key={song.id} 
                className={`cursor-pointer transition-all ${
                  selectedSongs.includes(song.id) 
                    ? 'ring-2 ring-primary bg-accent/50' 
                    : 'hover:bg-accent/30'
                }`}
                onClick={() => handleSongToggle(song.id)}
              >
                <CardContent className="p-3 flex items-center gap-3">
                  <Checkbox 
                    checked={selectedSongs.includes(song.id)}
                    onCheckedChange={() => handleSongToggle(song.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{song.title}</span>
                      {song.musical_key && (
                        <Badge variant="outline" className="text-xs">
                          {song.musical_key}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{song.artist}</span>
                      <span>•</span>
                      <span>{song.category}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {selectedSongs.length > 0 && (
        <div className="text-sm text-muted-foreground">
          {selectedSongs.length} música(s) selecionada(s)
        </div>
      )}
    </div>
  );
};

export default SongSelector;