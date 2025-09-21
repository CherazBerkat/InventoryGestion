import * as XLSX from "xlsx";
import { InventoryItem } from "@/types/inventory";

export const parseExcelFile = (file: File): Promise<InventoryItem[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as Record<
          string,
          unknown
        >[];

        const inventoryItems: InventoryItem[] = jsonData.map(
          (row, index: number) => {
            // Map Excel columns to our data structure
            const emplacement = String(
              row["EMPLACEMENT"] || row["Emplacement"] || ""
            ).trim();
            const articleCode = String(
              row["N° PIECE"] ||
                row["Code"] ||
                row["Article"] ||
                row["SKU"] ||
                row["Référence"] ||
                `ITEM-${index + 1}`
            ).trim();
            const description =
              row["DESIGNATION"] ||
              row["Description"] ||
              row["Libellé"] ||
              row["Nom"] ||
              row["Name"] ||
              `Article ${index + 1}`;
            const reference =
              row["REFERENCE"] || row["Référence"] || row["Ref"] || "";
            const uniteMesure = row["UM"] || row["Unité"] || row["Unit"] || "";
            const prix = parseFloat(
              String(row["PRIX"] || row["Prix"] || row["Price"] || 0)
            );
            const stock = parseFloat(
              String(
                row["Quantite theorique"] ||
                  row["Quantité"] ||
                  row["Stock"] ||
                  row["Qty"] ||
                  row["Quantity"] ||
                  row["QUANTITE THEORIQUE"] ||
                  row["QUANTITÉ"] ||
                  row["STOCK"] ||
                  row["QTY"] ||
                  row["QUANTITY"] ||
                  0
              )
            );

            return {
              id: `item-${Date.now()}-${index}`,
              emplacement: String(emplacement),
              articleCode: String(articleCode),
              description: String(description),
              reference: String(reference),
              uniteMesure: String(uniteMesure),
              prix: prix,
              initialStock: stock,
              currentStock: stock,
              lastUpdated: new Date().toISOString(),
              movements: [],
            };
          }
        );

        resolve(inventoryItems);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () =>
      reject(new Error("Erreur lors de la lecture du fichier"));
    reader.readAsBinaryString(file);
  });
};

export const exportToExcel = (items: InventoryItem[]) => {
  const exportData = items.map((item) => ({
    Emplacement: item.emplacement || "",
    "Code Article": item.articleCode,
    Description: item.description,
    Référence: item.reference || "",
    "Unité Mesure": item.uniteMesure || "",
    "Prix Unitaire": item.prix || "",
    "Stock Initial": item.initialStock,
    "Stock Actuel": item.currentStock,
    "Comptage 1": item.counting1 || "",
    "Écart Qté 1": item.variance1 || "",
    "Écart Val 1": item.valueVariance1
      ? `${item.valueVariance1.toLocaleString("fr-DZ")} DA`
      : "",
    "Comptage 2": item.counting2 || "",
    "Écart Qté 2": item.variance2 || "",
    "Écart Val 2": item.valueVariance2
      ? `${item.valueVariance2.toLocaleString("fr-DZ")} DA`
      : "",
    "Comptage 3": item.counting3 || "",
    "Écart Qté 3": item.variance3 || "",
    "Écart Val 3": item.valueVariance3
      ? `${item.valueVariance3.toLocaleString("fr-DZ")} DA`
      : "",
    "Dernière MAJ": new Date(item.lastUpdated).toLocaleString("fr-FR"),
  }));

  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Inventaire");

  const fileName = `inventaire_${new Date().toISOString().split("T")[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
};
