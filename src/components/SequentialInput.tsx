import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Save, SkipForward, Search } from 'lucide-react';
import { InventoryItem } from '@/types/inventory';
import { toast } from 'sonner';
import SearchBar from './SearchBar';

interface SequentialInputProps {
  items: InventoryItem[];
  currentSession: number;
  onUpdateItem: (itemId: string, updates: Partial<InventoryItem>) => void;
}

export default function SequentialInput({ items, currentSession, onUpdateItem }: SequentialInputProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [countingValue, setCountingValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter items based on search query
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    
    const query = searchQuery.toLowerCase();
    return items.filter(item => 
      item.articleCode.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      (item.emplacement && item.emplacement.toLowerCase().includes(query)) ||
      (item.reference && item.reference.toLowerCase().includes(query))
    );
  }, [items, searchQuery]);

  const currentItem = filteredItems[currentIndex];
  
  // Reset index when search changes
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentIndex(0);
    setCountingValue('');
  };

  if (!currentItem) {
    return (
      <div className="space-y-4">
        <SearchBar onSearch={handleSearch} />
        <Card className="w-full">
          <CardContent className="text-center py-8">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              {searchQuery ? `Aucun article trouvé pour "${searchQuery}"` : 'Aucun article disponible'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSave = () => {
    if (!countingValue || isNaN(Number(countingValue))) {
      toast.error('Veuillez saisir une valeur numérique valide');
      return;
    }

    const value = Number(countingValue);
    const countingField = `counting${currentSession}` as keyof InventoryItem;
    const varianceField = `variance${currentSession}` as keyof InventoryItem;
    const valueVarianceField = `valueVariance${currentSession}` as keyof InventoryItem;
    const variance = value - currentItem.initialStock;
    const valueVariance = currentItem.prix ? variance * currentItem.prix : 0;

    const updates: Partial<InventoryItem> = {
      [countingField]: value,
      [varianceField]: variance,
      [valueVarianceField]: valueVariance,
      lastUpdated: new Date().toISOString(),
      isCountingCompleted: true
    };

    onUpdateItem(currentItem.id, updates);
    setCountingValue('');
    
    toast.success(`Comptage sauvegardé pour ${currentItem.articleCode}`);
    
    // Auto-advance to next item
    if (currentIndex < filteredItems.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
  };

  const handleSkip = () => {
    if (currentIndex < filteredItems.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
    setCountingValue('');
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
    setCountingValue('');
  };

  const handleNext = () => {
    if (currentIndex < filteredItems.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
    setCountingValue('');
  };

  const getCurrentCounting = () => {
    const field = `counting${currentSession}` as keyof InventoryItem;
    return currentItem[field] as number | undefined;
  };

  const getCurrentVariance = () => {
    const field = `variance${currentSession}` as keyof InventoryItem;
    return currentItem[field] as number | undefined;
  };

  const getCurrentValueVariance = () => {
    const field = `valueVariance${currentSession}` as keyof InventoryItem;
    return currentItem[field] as number | undefined;
  };

  const isCompleted = getCurrentCounting() !== undefined;

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <SearchBar onSearch={handleSearch} />

      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Mode Séquentiel - Session {currentSession}</CardTitle>
              <CardDescription>
                Article {currentIndex + 1} sur {filteredItems.length}
                {searchQuery && ` (filtré sur "${searchQuery}")`}
              </CardDescription>
            </div>
            <Badge variant={isCompleted ? "default" : "secondary"}>
              {isCompleted ? "Complété" : "En attente"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / filteredItems.length) * 100}%` }}
            />
          </div>

          {/* Current Item Info */}
          <div className={`p-6 rounded-lg border-2 ${isCompleted ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {currentItem.emplacement && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Emplacement</label>
                  <p className="text-lg font-bold">{currentItem.emplacement}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-600">Code Article</label>
                <p className="text-xl font-bold">{currentItem.articleCode}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Stock Initial</label>
                <p className="text-xl font-bold">{currentItem.initialStock}</p>
              </div>
              {currentItem.reference && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Référence</label>
                  <p className="text-lg">{currentItem.reference}</p>
                </div>
              )}
              {currentItem.uniteMesure && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Unité</label>
                  <p className="text-lg">{currentItem.uniteMesure}</p>
                </div>
              )}
              {currentItem.prix && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Prix Unitaire</label>
                  <p className="text-lg font-semibold">{currentItem.prix.toLocaleString('fr-DZ')} DA</p>
                </div>
              )}
            </div>
            <div className="mt-4">
              <label className="text-sm font-medium text-gray-600">Description</label>
              <p className="text-lg">{currentItem.description}</p>
            </div>
          </div>

          {/* Previous Countings */}
          {(currentItem.counting1 !== undefined || currentItem.counting2 !== undefined || currentItem.counting3 !== undefined) && (
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map(session => {
                const counting = currentItem[`counting${session}` as keyof InventoryItem] as number | undefined;
                const variance = currentItem[`variance${session}` as keyof InventoryItem] as number | undefined;
                const valueVariance = currentItem[`valueVariance${session}` as keyof InventoryItem] as number | undefined;
                
                return (
                  <div key={session} className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Comptage {session}</p>
                    {counting !== undefined ? (
                      <div className="space-y-1">
                        <p className="text-lg font-bold">{counting}</p>
                        {variance !== undefined && (
                          <Badge variant={variance >= 0 ? "default" : "destructive"} className="text-xs">
                            Qté: {variance >= 0 ? '+' : ''}{variance}
                          </Badge>
                        )}
                        {valueVariance !== undefined && currentItem.prix && (
                          <Badge variant={valueVariance >= 0 ? "default" : "destructive"} className="text-xs block mt-1">
                            Val: {valueVariance >= 0 ? '+' : ''}{valueVariance.toLocaleString('fr-DZ')} DA
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-400">-</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Current Session Input */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Quantité Comptée - Session {currentSession}
              </label>
              <div className="flex gap-2 mt-2">
                <Input
                  type="number"
                  placeholder="Saisir la quantité"
                  value={countingValue}
                  onChange={(e) => setCountingValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="text-lg"
                  autoFocus
                />
                <Button onClick={handleSave} disabled={!countingValue} className="px-6">
                  <Save className="h-4 w-4 mr-2" />
                  Sauver
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Appuyez sur Entrée pour sauvegarder</p>
            </div>

            {/* Current Counting Display */}
            {isCompleted && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-green-800 font-medium">Comptage actuel: {getCurrentCounting()}</span>
                    <Badge variant={getCurrentVariance()! >= 0 ? "default" : "destructive"}>
                      Écart Qté: {getCurrentVariance()! >= 0 ? '+' : ''}{getCurrentVariance()}
                    </Badge>
                  </div>
                  {getCurrentValueVariance() !== undefined && currentItem.prix && (
                    <div className="flex justify-between items-center">
                      <span className="text-green-800 font-medium">Valeur unitaire: {currentItem.prix.toLocaleString('fr-DZ')} DA</span>
                      <Badge variant={getCurrentValueVariance()! >= 0 ? "default" : "destructive"}>
                        Écart Val: {getCurrentValueVariance()! >= 0 ? '+' : ''}{getCurrentValueVariance()!.toLocaleString('fr-DZ')} DA
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <Button 
              variant="outline" 
              onClick={handlePrevious} 
              disabled={currentIndex === 0}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Précédent
            </Button>

            <Button 
              variant="outline" 
              onClick={handleSkip}
              className="flex items-center gap-2"
            >
              <SkipForward className="h-4 w-4" />
              Passer
            </Button>

            <Button 
              variant="outline" 
              onClick={handleNext} 
              disabled={currentIndex === filteredItems.length - 1}
              className="flex items-center gap-2"
            >
              Suivant
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}