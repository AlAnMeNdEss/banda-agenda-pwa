import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, Volume2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface MetronomeProps {
  defaultBpm?: number;
}

const Metronome = ({ defaultBpm = 120 }: MetronomeProps) => {
  const [bpm, setBpm] = useState(defaultBpm);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [beatsPerMeasure, setBeatsPerMeasure] = useState(4);
  const [volume, setVolume] = useState(0.3);
  const [lastTapTime, setLastTapTime] = useState<number | null>(null);
  const [tapTimeouts, setTapTimeouts] = useState<number[]>([]);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextNoteTimeRef = useRef(0);
  const timerIdRef = useRef<number | null>(null);

  useEffect(() => {
    // Initialize AudioContext
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    return () => {
      if (timerIdRef.current) {
        clearTimeout(timerIdRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (defaultBpm) {
      setBpm(defaultBpm);
    }
  }, [defaultBpm]);

  const playClick = (time: number, isAccent: boolean) => {
    if (!audioContextRef.current) return;

    const osc = audioContextRef.current.createOscillator();
    const gain = audioContextRef.current.createGain();

    osc.connect(gain);
    gain.connect(audioContextRef.current.destination);

    // Accent on first beat
    osc.frequency.value = isAccent ? 1000 : 800;
    gain.gain.value = isAccent ? volume : volume * 0.5;

    osc.start(time);
    osc.stop(time + 0.05);
  };

  const handleTapTempo = () => {
    const now = Date.now();
    
    if (lastTapTime && now - lastTapTime < 2000) {
      const interval = now - lastTapTime;
      const newBpm = Math.round(60000 / interval);
      if (newBpm >= 40 && newBpm <= 240) {
        setBpm(newBpm);
      }
    }
    
    setLastTapTime(now);
    
    // Clear previous timeout
    tapTimeouts.forEach(clearTimeout);
    
    // Reset tap after 2 seconds of inactivity
    const timeout = window.setTimeout(() => {
      setLastTapTime(null);
    }, 2000);
    
    setTapTimeouts([timeout]);
  };

  const scheduleNote = () => {
    const secondsPerBeat = 60.0 / bpm;
    const scheduleAheadTime = 0.1; // seconds
    
    if (!audioContextRef.current) return;

    while (nextNoteTimeRef.current < audioContextRef.current.currentTime + scheduleAheadTime) {
      const isAccent = currentBeat % beatsPerMeasure === 0;
      playClick(nextNoteTimeRef.current, isAccent);
      
      setCurrentBeat((prev) => (prev + 1) % beatsPerMeasure);
      nextNoteTimeRef.current += secondsPerBeat;
    }

    if (isPlaying) {
      timerIdRef.current = window.setTimeout(scheduleNote, 25);
    }
  };

  const startMetronome = () => {
    if (!audioContextRef.current) return;

    setIsPlaying(true);
    setCurrentBeat(0);
    nextNoteTimeRef.current = audioContextRef.current.currentTime;
    scheduleNote();
  };

  const stopMetronome = () => {
    setIsPlaying(false);
    if (timerIdRef.current) {
      clearTimeout(timerIdRef.current);
      timerIdRef.current = null;
    }
    setCurrentBeat(0);
  };

  useEffect(() => {
    if (isPlaying) {
      stopMetronome();
      startMetronome();
    }
  }, [bpm]);

  const togglePlay = () => {
    if (isPlaying) {
      stopMetronome();
    } else {
      startMetronome();
    }
  };

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Volume2 className="h-5 w-5" />
          Metrônomo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center">
          <div className="text-6xl font-bold mb-2 bg-gradient-celestial bg-clip-text text-transparent">
            {bpm}
          </div>
          <div className="text-sm text-muted-foreground">BPM</div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-1">
            <span>Andamento</span>
            <span>{bpm} BPM</span>
          </div>
          <Slider
            value={[bpm]}
            onValueChange={(value) => setBpm(value[0])}
            min={40}
            max={240}
            step={1}
            className="w-full"
            disabled={isPlaying}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>40</span>
            <span>240</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Compasso</label>
            <Select
              value={beatsPerMeasure.toString()}
              onValueChange={(value) => setBeatsPerMeasure(parseInt(value))}
              disabled={isPlaying}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2/4</SelectItem>
                <SelectItem value="3">3/4</SelectItem>
                <SelectItem value="4">4/4</SelectItem>
                <SelectItem value="6">6/8</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground flex items-center gap-2">
              <Volume2 className="h-4 w-4" />
              Volume
            </label>
            <Slider
              value={[volume * 100]}
              onValueChange={(value) => setVolume(value[0] / 100)}
              min={0}
              max={100}
              step={1}
              className="w-full"
            />
          </div>
        </div>

        <Button
          onClick={handleTapTempo}
          variant="outline"
          className="w-full"
          disabled={isPlaying}
        >
          Tap Tempo
        </Button>

        <div className="flex items-center justify-center gap-2 py-4">
          {[...Array(beatsPerMeasure)].map((_, i) => (
            <div
              key={i}
              className={`h-3 w-3 rounded-full transition-all duration-100 ${
                isPlaying && i === currentBeat
                  ? i === 0
                    ? 'bg-primary scale-150'
                    : 'bg-primary/70 scale-125'
                  : 'bg-muted'
              }`}
            />
          ))}
        </div>

        <Button
          onClick={togglePlay}
          className="w-full h-12 text-lg font-semibold"
          variant={isPlaying ? "destructive" : "default"}
        >
          {isPlaying ? (
            <>
              <Pause className="h-5 w-5 mr-2" />
              Parar
            </>
          ) : (
            <>
              <Play className="h-5 w-5 mr-2" />
              Iniciar
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default Metronome;
