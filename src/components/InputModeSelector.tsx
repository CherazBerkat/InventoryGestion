import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { List, Table } from 'lucide-react';
import { InputMode } from '@/types/inventory';

interface InputModeSelectorProps {
  currentMode: InputMode;
  onModeChange: (mode: InputMode) => void;
}

export default function InputModeSelector({ currentMode, onModeChange }: InputModeSelectorProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Mode de Saisie</CardTitle>
        <CardDescription>
          Choisissez votre méthode de saisie préférée
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4">
          <Button
            variant={currentMode === 'sequential' ? "default" : "outline"}
            onClick={() => onModeChange('sequential')}
            className="flex items-center gap-2 flex-1"
          >
            <List className="h-4 w-4" />
            Mode Séquentiel
            {currentMode === 'sequential' && (
              <Badge variant="secondary" className="ml-2">Actif</Badge>
            )}
          </Button>
          <Button
            variant={currentMode === 'excel' ? "default" : "outline"}
            onClick={() => onModeChange('excel')}
            className="flex items-center gap-2 flex-1"
          >
            <Table className="h-4 w-4" />
            Mode Tableau Excel
            {currentMode === 'excel' && (
              <Badge variant="secondary" className="ml-2">Actif</Badge>
            )}
          </Button>
        </div>
        <div className="mt-4 text-sm text-gray-600">
          {currentMode === 'sequential' ? (
            <p><strong>Mode Séquentiel:</strong> Saisie article par article, un à la fois</p>
          ) : (
            <p><strong>Mode Tableau:</strong> Saisie dans un tableau comme Excel, vue d'ensemble</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}