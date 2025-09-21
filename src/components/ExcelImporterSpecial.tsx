import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Upload, FileSpreadsheet } from "lucide-react";
import { parseExcelFile } from "@/lib/excelUtils";
import { InventoryItem } from "@/types/inventory";
import { toast } from "sonner";

interface ExcelImporterProps {
  onImport: (items: InventoryItem[]) => void;
}

export default function ExcelImporterSpecial({ onImport }: ExcelImporterProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.match(/\.(xlsx|xls)$/)) {
      toast.error("Veuillez sélectionner un fichier Excel (.xlsx ou .xls)");
      return;
    }

    setIsLoading(true);
    try {
      const items = await parseExcelFile(file);
      onImport(items);
      toast.success(`${items.length} articles importés avec succès`);
    } catch (error) {
      console.error("Erreur lors de l'importation:", error);
      toast.error("Erreur lors de l'importation du fichier Excel");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full w-full mx-8">
      <div className="flex items-center justify-center w-full h-full">
        <label
          htmlFor="excel-upload"
          className="flex flex-col items-center justify-center w-full h-full border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
        >
          <div className="flex flex-col items-center justify-center py-3">
            <Upload className="w-6 h-6 mb-2 text-gray-500" />
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
          <Button disabled>Importation en cours...</Button>
        </div>
      )}
    </div>
  );
}
