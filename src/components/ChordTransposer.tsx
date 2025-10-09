import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ChordTransposerProps {
  originalKey?: string;
  chords?: string;
  onTranspose: (transposedChords: string, semitones: number) => void;
}

const ChordTransposer = ({ originalKey, chords, onTranspose }: ChordTransposerProps) => {
  const [semitones, setSemitones] = useState(0);

  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const alternateNotes: Record<string, string> = {
    'C#': 'Db', 'D#': 'Eb', 'F#': 'Gb', 'G#': 'Ab', 'A#': 'Bb'
  };

  const transposeChord = (chord: string, steps: number): string => {
    const chordPattern = /^([A-G][#b]?)(m|maj|dim|aug|sus|add)?(\d)?(.*)$/;
    const match = chord.match(chordPattern);
    
    if (!match) return chord;
    
    let [, root, quality = '', number = '', rest = ''] = match;
    
    // Normalize flats to sharps
    if (root.includes('b')) {
      const flatToSharp: Record<string, string> = {
        'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#'
      };
      root = flatToSharp[root] || root;
    }
    
    const index = notes.indexOf(root);
    if (index === -1) return chord;
    
    const newIndex = (index + steps + 12) % 12;
    const newRoot = notes[newIndex];
    
    return `${newRoot}${quality}${number}${rest}`;
  };

  const transposeText = (text: string, steps: number): string => {
    // Pattern to match chords (letters followed by optional modifiers)
    const chordRegex = /\b([A-G][#b]?(?:m|maj|dim|aug|sus|add)?(?:\d)?(?:\/[A-G][#b]?)?)\b/g;
    
    return text.replace(chordRegex, (match) => {
      return transposeChord(match, steps);
    });
  };

  const handleTranspose = (direction: number) => {
    const newSemitones = semitones + direction;
    setSemitones(newSemitones);
    
    if (chords) {
      const transposedChords = transposeText(chords, newSemitones);
      onTranspose(transposedChords, newSemitones);
    }
  };

  const handleReset = () => {
    setSemitones(0);
    if (chords) {
      onTranspose(chords, 0);
    }
  };

  const getCurrentKey = () => {
    if (!originalKey) return null;
    return transposeChord(originalKey, semitones);
  };

  return (
    <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg border">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">Tom:</span>
        {originalKey && (
          <Badge variant="secondary" className="text-base font-bold">
            {getCurrentKey()}
          </Badge>
        )}
      </div>
      
      <div className="flex items-center gap-2 ml-auto">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleTranspose(-1)}
          className="h-8 w-8 p-0"
          title="Diminuir meio tom"
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
        
        <Badge variant="outline" className="min-w-[60px] text-center">
          {semitones > 0 ? `+${semitones}` : semitones}
        </Badge>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleTranspose(1)}
          className="h-8 w-8 p-0"
          title="Aumentar meio tom"
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
        
        {semitones !== 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="h-8 w-8 p-0"
            title="Resetar"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default ChordTransposer;
