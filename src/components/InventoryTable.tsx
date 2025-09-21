import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Save, Download, Search } from "lucide-react";
import { InventoryItem, StockMovement } from "@/types/inventory";
import { exportToExcel } from "@/lib/excelUtils";
import { toast } from "sonner";

interface InventoryTableProps {
  items: InventoryItem[];
  currentSession: number;
  onUpdateItem: (itemId: string, updates: Partial<InventoryItem>) => void;
  searchQuery;
}

export default function InventoryTable({
  items,
  currentSession,
  onUpdateItem,
  searchQuery,
}: InventoryTableProps) {
  const [editingValues, setEditingValues] = useState<Record<string, string>>(
    {}
  );

  // Filter items based on search query
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const query = searchQuery.toLowerCase();
    return items.filter(
      (item) =>
        item.articleCode.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        (item.emplacement && item.emplacement.toLowerCase().includes(query)) ||
        (item.reference && item.reference.toLowerCase().includes(query))
    );
  }, [items, searchQuery]);

  const handleCountingInput = (itemId: string, value: string) => {
    setEditingValues((prev) => ({
      ...prev,
      [`${itemId}-${currentSession}`]: value,
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent, item: InventoryItem) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveCountingValue(item);
    }
  };

  const saveCountingValue = (item: InventoryItem) => {
    const key = `${item.id}-${currentSession}`;
    const value = editingValues[key];

    if (!value || isNaN(Number(value))) {
      toast.error("Veuillez saisir une valeur numérique valide");
      return;
    }

    const countingValue = Number(value);
    const countingField = `counting${currentSession}` as keyof InventoryItem;
    const varianceField = `variance${currentSession}` as keyof InventoryItem;
    const valueVarianceField =
      `valueVariance${currentSession}` as keyof InventoryItem;
    const variance = countingValue - item.initialStock;
    const valueVariance = item.prix ? variance * item.prix : 0;

    // Create stock movement for tracking
    const movement: StockMovement = {
      id: `movement-${Date.now()}`,
      type: "counting",
      quantity: countingValue,
      session: currentSession,
      timestamp: new Date().toISOString(),
      note: `Comptage ${currentSession}`,
    };

    // Update item with new counting value, variance, and value variance
    const updatedItem: Partial<InventoryItem> = {
      [countingField]: countingValue,
      [varianceField]: variance,
      [valueVarianceField]: valueVariance,
      lastUpdated: new Date().toISOString(),
      movements: [...item.movements, movement],
      isCountingCompleted: true,
    };

    onUpdateItem(item.id, updatedItem);

    // Clear editing value
    setEditingValues((prev) => {
      const newValues = { ...prev };
      delete newValues[key];
      return newValues;
    });

    toast.success(
      `Comptage ${currentSession} sauvegardé pour ${item.articleCode}`
    );
  };

  const handleExport = () => {
    exportToExcel(filteredItems);
    toast.success("Fichier Excel exporté avec succès");
  };

  const getCountingValue = (item: InventoryItem, session: number) => {
    const field = `counting${session}` as keyof InventoryItem;
    return item[field] as number | undefined;
  };

  const getVariance = (item: InventoryItem, session: number) => {
    const field = `variance${session}` as keyof InventoryItem;
    return item[field] as number | undefined;
  };

  const getValueVariance = (item: InventoryItem, session: number) => {
    const field = `valueVariance${session}` as keyof InventoryItem;
    return item[field] as number | undefined;
  };

  const isItemCompleted = (item: InventoryItem, session: number) => {
    return getCountingValue(item, session) !== undefined;
  };

  return (
    <div className="space-y-4">
      <Card className="w-full">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Mode Tableau - Session {currentSession}</CardTitle>
              <CardDescription>
                {filteredItems.length} articles affichés
                {searchQuery && ` (filtré sur "${searchQuery}")`}
                {filteredItems.length !== items.length &&
                  ` sur ${items.length} total`}
              </CardDescription>
            </div>
            <Button onClick={handleExport} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Exporter Excel
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {filteredItems.length === 0 ? (
            <div className="text-center py-8">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchQuery
                  ? `Aucun article trouvé pour "${searchQuery}"`
                  : "Aucun article disponible"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Emplacement</TableHead>
                    <TableHead>Code Article</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Référence</TableHead>
                    <TableHead>UM</TableHead>
                    <TableHead>Prix Unit.</TableHead>
                    <TableHead>Stock Initial</TableHead>
                    <TableHead>Stock Actuel</TableHead>
                    <TableHead>Comptage 1</TableHead>
                    <TableHead>Écart Qté 1</TableHead>
                    <TableHead>Écart Val 1</TableHead>
                    <TableHead>Comptage 2</TableHead>
                    <TableHead>Écart Qté 2</TableHead>
                    <TableHead>Écart Val 2</TableHead>
                    <TableHead>Comptage 3</TableHead>
                    <TableHead>Écart Qté 3</TableHead>
                    <TableHead>Écart Val 3</TableHead>
                    <TableHead>Saisie Session {currentSession}</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => {
                    const editingKey = `${item.id}-${currentSession}`;
                    const isCompleted = isItemCompleted(item, currentSession);

                    return (
                      <TableRow
                        key={item.id}
                        className={
                          isCompleted
                            ? "bg-green-50 hover:bg-green-100"
                            : "hover:bg-gray-50"
                        }
                      >
                        <TableCell>{item.emplacement || "-"}</TableCell>
                        <TableCell className="font-medium">
                          {item.articleCode}
                        </TableCell>
                        <TableCell
                          className="max-w-xs truncate"
                          title={item.description}
                        >
                          {item.description}
                        </TableCell>
                        <TableCell>{item.reference || "-"}</TableCell>
                        <TableCell>{item.uniteMesure || "-"}</TableCell>
                        <TableCell>
                          {item.prix
                            ? `${item.prix.toLocaleString("fr-DZ")} DA`
                            : "-"}
                        </TableCell>
                        <TableCell>{item.initialStock}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{item.currentStock}</Badge>
                        </TableCell>

                        {/* Comptage 1 */}
                        <TableCell>
                          {item.counting1 !== undefined ? (
                            <Badge variant="outline">{item.counting1}</Badge>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {item.variance1 !== undefined ? (
                            <Badge
                              variant={
                                item.variance1 >= 0 ? "default" : "destructive"
                              }
                              className="text-xs"
                            >
                              {item.variance1 >= 0 ? "+" : ""}
                              {item.variance1}
                            </Badge>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {item.valueVariance1 !== undefined ? (
                            <Badge
                              variant={
                                item.valueVariance1 >= 0
                                  ? "default"
                                  : "destructive"
                              }
                              className="text-xs"
                            >
                              {item.valueVariance1 >= 0 ? "+" : ""}
                              {item.valueVariance1.toLocaleString("fr-DZ")} DA
                            </Badge>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>

                        {/* Comptage 2 */}
                        <TableCell>
                          {item.counting2 !== undefined ? (
                            <Badge variant="outline">{item.counting2}</Badge>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {item.variance2 !== undefined ? (
                            <Badge
                              variant={
                                item.variance2 >= 0 ? "default" : "destructive"
                              }
                              className="text-xs"
                            >
                              {item.variance2 >= 0 ? "+" : ""}
                              {item.variance2}
                            </Badge>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {item.valueVariance2 !== undefined ? (
                            <Badge
                              variant={
                                item.valueVariance2 >= 0
                                  ? "default"
                                  : "destructive"
                              }
                              className="text-xs"
                            >
                              {item.valueVariance2 >= 0 ? "+" : ""}
                              {item.valueVariance2.toLocaleString("fr-DZ")} DA
                            </Badge>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>

                        {/* Comptage 3 */}
                        <TableCell>
                          {item.counting3 !== undefined ? (
                            <Badge variant="outline">{item.counting3}</Badge>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {item.variance3 !== undefined ? (
                            <Badge
                              variant={
                                item.variance3 >= 0 ? "default" : "destructive"
                              }
                              className="text-xs"
                            >
                              {item.variance3 >= 0 ? "+" : ""}
                              {item.variance3}
                            </Badge>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {item.valueVariance3 !== undefined ? (
                            <Badge
                              variant={
                                item.valueVariance3 >= 0
                                  ? "default"
                                  : "destructive"
                              }
                              className="text-xs"
                            >
                              {item.valueVariance3 >= 0 ? "+" : ""}
                              {item.valueVariance3.toLocaleString("fr-DZ")} DA
                            </Badge>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>

                        {/* Current Session Input */}
                        <TableCell>
                          <Input
                            type="number"
                            placeholder="Quantité"
                            value={editingValues[editingKey] || ""}
                            onChange={(e) =>
                              handleCountingInput(item.id, e.target.value)
                            }
                            onKeyPress={(e) => handleKeyPress(e, item)}
                            className="w-24"
                            disabled={isCompleted}
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            onClick={() => saveCountingValue(item)}
                            disabled={!editingValues[editingKey] || isCompleted}
                            className="flex items-center gap-1"
                          >
                            <Save className="h-3 w-3" />
                            {isCompleted ? "Fait" : "Sauver"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
