import { ArrowLeft, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";

const Favoritas = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/80 p-2 sm:p-4">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        <div className="flex items-center gap-4">
          <Button asChild variant="outline" size="icon">
            <Link to="/">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Minhas Favoritas</h1>
        </div>
        
        <Card className="shadow-gentle">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" />
              Músicas Favoritas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <Heart className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhuma música favorita ainda</p>
              <p className="text-sm">Suas músicas favoritas aparecerão aqui</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Favoritas;