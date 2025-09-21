import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileSpreadsheet } from 'lucide-react';
import { parseExcelFile } from '@/lib/excelUtils';
import { InventoryItem } from '@/types/inventory';
import { toast } from 'sonner';

interface ExcelImporterProps {
  onImport: (items: InventoryItem[]) => void;
}

export default function ExcelImporter({ onImport }: ExcelImporterProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.match(/\.(xlsx|xls)$/)) {
      toast.error('Veuillez sélectionner un fichier Excel (.xlsx ou .xls)');
      return;
    }

    setIsLoading(true);
    try {
      const items = await parseExcelFile(file);
      onImport(items);
      toast.success(`${items.length} articles importés avec succès`);
    } catch (error) {
      console.error('Erreur lors de l\'importation:', error);
      toast.error('Erreur lors de l\'importation du fichier Excel');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <FileSpreadsheet className="h-6 w-6" />
          Importer Excel
        </CardTitle>
        <CardDescription>
          Importez votre fichier Excel contenant la liste des articles
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-center w-full">
            <label htmlFor="excel-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 mb-4 text-gray-500" />
                <p className="mb-2 text-sm text-gray-500">
                  <span className="font-semibold">Cliquez pour télécharger</span>
                </p>
                <p className="text-xs text-gray-500">XLSX ou XLS</p>
              </div>
              <Input
                id="excel-upload"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                disabled={isLoading}
                className="hidden"
              />
            </label>
          </div>
          {isLoading && (
            <div className="text-center">
              <Button disabled>
                Importation en cours...
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}