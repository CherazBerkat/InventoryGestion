import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3,
  Package,
  TrendingUp,
  TrendingDown,
  FileSpreadsheet,
  RotateCcw,
  LogOut,
  Database,
} from "lucide-react";
import { InventoryItem, CountingSession, InputMode } from "@/types/inventory";
import ExcelImporter from "@/components/ExcelImporter";
import SequentialInput from "@/components/SequentialInput";
import InventoryTable from "@/components/InventoryTable";
import CountingSessionManager from "@/components/CountingSession";
import LoginForm from "@/components/LoginForm";
import PasswordDialog from "@/components/PasswordDialog";
import { toast } from "sonner";
import SearchBar from "@/components/SearchBar";
import ExcelImporterSpecial from "@/components/ExcelImporterSpecial";
import { Script } from "vm";

// Configuration des identifiants
const ADMIN_CREDENTIALS = {
  username: "admin",
  password: "inventory2024",
};

export default function Index() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [currentSession, setCurrentSession] = useState<CountingSession>({
    sessionNumber: 1,
    isActive: true,
    completedItems: [],
  });
  const [inputMode, setInputMode] = useState<InputMode>("sequential");
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([]);

  // Check authentication on component mount
  useEffect(() => {
    const savedAuth = localStorage.getItem("inventory-auth");
    if (savedAuth === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  // Load data from localStorage on component mount
  useEffect(() => {
    if (!isAuthenticated) return;

    const savedItems = localStorage.getItem("inventory-items");
    const savedSession = localStorage.getItem("current-session");

    if (savedItems) {
      const parsedItems = JSON.parse(savedItems);
      setItems(parsedItems);
    }

    if (savedSession) {
      setCurrentSession(JSON.parse(savedSession));
    }
  }, [isAuthenticated]);

  // Save data to localStorage whenever items or session changes
  useEffect(() => {
    if (!isAuthenticated) return;

    localStorage.setItem("inventory-items", JSON.stringify(items));
    localStorage.setItem("current-session", JSON.stringify(currentSession));
  }, [items, currentSession, isAuthenticated]);

  // Filter items based on session and zero variance logic
  useEffect(() => {
    let filtered = [...items];

    // For sessions 2 and 3, hide items with zero variance from previous sessions
    if (currentSession.sessionNumber === 2) {
      // Hide items where counting1 exists and variance1 = 0
      filtered = filtered.filter(
        (item) => item.counting1 === undefined || item.variance1 !== 0
      );
    } else if (currentSession.sessionNumber === 3) {
      // Hide items where:
      // - counting1 exists and variance1 = 0, OR
      // - counting2 exists and variance2 = 0
      filtered = filtered.filter(
        (item) =>
          (item.counting1 === undefined || item.variance1 !== 0) &&
          (item.counting2 === undefined || item.variance2 !== 0)
      );
    }

    setFilteredItems(filtered);
  }, [items, currentSession.sessionNumber]);

  const handleLogin = (username: string, password: string): boolean => {
    if (
      username === ADMIN_CREDENTIALS.username &&
      password === ADMIN_CREDENTIALS.password
    ) {
      setIsAuthenticated(true);
      localStorage.setItem("inventory-auth", "true");
      toast.success("Connexion réussie");
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("inventory-auth");
    toast.success("Déconnexion réussie");
  };

  const handleImportItems = (newItems: InventoryItem[]) => {
    setItems(newItems);
    toast.success(`${newItems.length} articles importés avec succès`);
  };

  const handleUpdateItem = (
    itemId: string,
    updates: Partial<InventoryItem>
  ) => {
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === itemId ? { ...item, ...updates } : item
      )
    );
  };

  const handleUpdateItemsExcel = (newItems: InventoryItem[]) => {
    setItems(newItems);
    toast.success(`${newItems.length} quantités importés avec succès`);
  };

  const handleSessionChange = (newSession: CountingSession) => {
    setCurrentSession(newSession);
  };

  const handleResetRequest = () => {
    setShowPasswordDialog(true);
  };

  const handleResetConfirm = (password: string): boolean => {
    if (password === ADMIN_CREDENTIALS.password) {
      setItems([]);
      setFilteredItems([]);
      setCurrentSession({
        sessionNumber: 1,
        isActive: true,
        completedItems: [],
      });
      localStorage.removeItem("inventory-items");
      localStorage.removeItem("current-session");
      toast.success("Données réinitialisées");
      return true;
    }
    return false;
  };
  const [searchQuery, setSearchQuery] = useState("");
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };
  // Show login form if not authenticated
  if (!isAuthenticated) {
    return <LoginForm onLogin={handleLogin} />;
  }

  // Calculate statistics based on filtered items for current session
  const totalItems = items.length;
  const filteredItemsCount = filteredItems.length;
  const completedItems = filteredItems.filter((item) => {
    const countingField =
      `counting${currentSession.sessionNumber}` as keyof InventoryItem;
    return item[countingField] !== undefined;
  }).length;

  const totalVariance = filteredItems.reduce((sum, item) => {
    const varianceField =
      `variance${currentSession.sessionNumber}` as keyof InventoryItem;
    const variance = item[varianceField] as number | undefined;
    return sum + (variance || 0);
  }, 0);

  const totalValueVariance = filteredItems.reduce((sum, item) => {
    const valueVarianceField =
      `valueVariance${currentSession.sessionNumber}` as keyof InventoryItem;
    const valueVariance = item[valueVarianceField] as number | undefined;
    return sum + (valueVariance || 0);
  }, 0);

  const positiveVariances = filteredItems.filter((item) => {
    const varianceField =
      `variance${currentSession.sessionNumber}` as keyof InventoryItem;
    const variance = item[varianceField] as number | undefined;
    return variance && variance > 0;
  }).length;

  const negativeVariances = filteredItems.filter((item) => {
    const varianceField =
      `variance${currentSession.sessionNumber}` as keyof InventoryItem;
    const variance = item[varianceField] as number | undefined;
    return variance && variance < 0;
  }).length;

  const scriptHandler = () => {
    // generate sessionId
    const year = new Date().getFullYear();
    const sessionId = `INV${year}MC`;

    // build script
    const lines: string[] = [];
    lines.push(`alter table "COSWIN"."T_COUNT_ITEM" disable all triggers;`);

    for (const item of items) {
      if (item.counting3 !== undefined) {
        lines.push(
          `UPDATE T_COUNT_ITEM SET SCIT_Adjustment_Disabled='1', scit_quantity='${item.counting3}' ` +
            `WHERE SCIT_COUNT='${sessionId}' AND SCIT_ITEM='${
              item.articleCode
            }' AND SCIT_BIN='${item.emplacement || ""}';`
        );
      }
    }

    lines.push(`alter table "COSWIN"."T_COUNT_ITEM" enable all triggers;`);
    lines.push(`commit;`);

    const script = lines.join("\n");

    // log for debug
    console.log("Script PL/SQL généré:\n", script);

    // auto-download as .sql file
    const blob = new Blob([script], { type: "text/sql" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `plsql_script_${sessionId}.sql`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const updateDbHandler = () => {
    console.log("Mise à jour de la base Oracle effectuée");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Gestion d'Inventaire
            </h1>
            <p className="text-gray-600 mt-2">
              Système de comptage avec calcul automatique des écarts
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleResetRequest}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Réinitialiser
            </Button>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Déconnexion
            </Button>
          </div>
        </div>

        {/* Statistics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Articles Total
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalItems}</div>
              {filteredItemsCount !== totalItems && (
                <p className="text-xs text-muted-foreground">
                  {filteredItemsCount} visibles (écarts non nuls)
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Progression</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {completedItems}/{filteredItemsCount}
              </div>
              <p className="text-xs text-muted-foreground">
                {filteredItemsCount > 0
                  ? Math.round((completedItems / filteredItemsCount) * 100)
                  : 0}
                % complété
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Écart Quantité
              </CardTitle>
              {totalVariance >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${
                  totalVariance >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {totalVariance >= 0 ? "+" : ""}
                {totalVariance}
              </div>
              <div className="flex gap-2 text-xs text-muted-foreground">
                <span className="text-green-600">+{positiveVariances}</span>
                <span className="text-red-600">-{negativeVariances}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Écart Valeur
              </CardTitle>
              <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${
                  totalValueVariance >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {totalValueVariance >= 0 ? "+" : ""}
                {totalValueVariance.toLocaleString("fr-DZ")} DA
              </div>
              <p className="text-xs text-muted-foreground">
                Session {currentSession.sessionNumber}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Session Controls*/}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Session de Comptage</CardTitle>
            <CardDescription>
              Gérez les sessions de comptage et suivez la progression
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CountingSessionManager
              currentSession={currentSession}
              onSessionChange={handleSessionChange}
              items={items}
              filteredItems={filteredItems}
            />
          </CardContent>
        </Card>

        {/* Import Section */}
        {items.length === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Import de Données</CardTitle>
              <CardDescription>
                Importez votre fichier Excel pour commencer l'inventaire
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ExcelImporter onImport={handleImportItems} />
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        {filteredItems.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>
                    Saisie d'Inventaire - Session {currentSession.sessionNumber}
                  </CardTitle>
                  <CardDescription>
                    {filteredItemsCount} articles à compter
                    {currentSession.sessionNumber > 1 &&
                      " (articles avec écarts uniquement)"}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs
                value={inputMode}
                onValueChange={(value) => setInputMode(value as InputMode)}
              >
                <div className="w-full flex items-center h-[200px] gap-4">
                  <Card className="flex-[7] flex flex-col items-center justify-center gap-6 h-full px-4">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="sequential">
                        Mode Séquentiel
                      </TabsTrigger>
                      <TabsTrigger value="excel">Mode Tableau</TabsTrigger>
                    </TabsList>
                    <div className="w-full">
                      <SearchBar onSearch={handleSearch} />
                    </div>
                  </Card>
                  <div className="flex-[3] h-full flex">
                    <Card
                      className={`flex-1 h-full ${
                        currentSession.completedItems.length == items.length &&
                        "opacity-50 cursor-not-allowed"
                      }`}
                    >
                      <CardHeader className="py-2">
                        <CardTitle className="text-l">
                          Importer les quantités comptées{" "}
                        </CardTitle>
                        <CardDescription>
                          Entrer les quantités comptées par un fichier Excel
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex justify-center">
                        <ExcelImporterSpecial
                          onImport={handleUpdateItemsExcel}
                          itemsIni={items}
                          CurrentSession={currentSession.sessionNumber}
                        />
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <TabsContent value="sequential" className="mt-6">
                  <SequentialInput
                    items={filteredItems}
                    currentSession={currentSession.sessionNumber}
                    onUpdateItem={handleUpdateItem}
                    searchQuery={searchQuery}
                  />
                </TabsContent>

                <TabsContent value="excel" className="mt-6">
                  <InventoryTable
                    items={filteredItems}
                    currentSession={currentSession.sessionNumber}
                    onUpdateItem={handleUpdateItem}
                    searchQuery={searchQuery}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
        {items.length > 0 && (
          <Card className="h-80">
            <CardContent className="flex justify-between items-center h-full p-6 gap-6">
              {/* Section 1 */}
              <div
                className="flex-1 flex flex-col h-full justify-center items-center text-center border rounded-lg p-6 cursor-pointer"
                onClick={scriptHandler}
              >
                <FileSpreadsheet className="w-16 h-16 text-blue-500 mb-4" />
                <CardTitle className="mb-2">Générer script PL/SQL</CardTitle>
                <CardDescription>
                  Produire un script PL/SQL basé sur un fichier Excel pour
                  exécuter ultérieurement dans Oracle.
                </CardDescription>
              </div>

              {/* Section 2 */}
              <div
                className="flex-1 flex flex-col h-full justify-center items-center text-center border rounded-lg p-6 cursor-pointer"
                onClick={updateDbHandler}
              >
                <Database className="w-16 h-16 text-green-500 mb-4" />
                <CardTitle className="mb-2">Mise à jour Oracle</CardTitle>
                <CardDescription>
                  Mettre à jour directement la base Oracle en important un
                  nouveau fichier Excel.
                </CardDescription>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Import New Data */}
        {items.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Importer de Nouvelles Données</CardTitle>
              <CardDescription>
                Remplacer les données actuelles par un nouveau fichier Excel
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ExcelImporter onImport={handleImportItems} />
            </CardContent>
          </Card>
        )}

        {/* Password Dialog */}
        <PasswordDialog
          isOpen={showPasswordDialog}
          onClose={() => setShowPasswordDialog(false)}
          onConfirm={handleResetConfirm}
          title="Confirmer la réinitialisation"
          description="Cette action supprimera toutes les données. Veuillez entrer votre mot de passe pour confirmer."
        />
      </div>
    </div>
  );
}
