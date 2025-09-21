import * as XLSX from "xlsx";
import { InventoryItem } from "@/types/inventory";

export const parseExcelFileSpecial = (
  file: File,
  itemsIni: InventoryItem[],
  currentSession: 1 | 2 | 3
): Promise<InventoryItem[]> => {
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

        // Build a lookup map from Excel rows using articleCode+emplacement
        const excelMap = new Map<string, { quantity: number }>();
        jsonData.forEach((row, index) => {
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

          const key = `${articleCode}_${emplacement}`;
          excelMap.set(key, { quantity: stock });
        });

        // Update itemsIni based on Excel data
        const updatedItems = itemsIni.map((item) => {
          const key = `${item.articleCode}_${item.emplacement || ""}`;
          const row = excelMap.get(key);

          if (!row) {
            return item;
          }
          const newCounting = row.quantity;
          const updatedItem = { ...item };

          if (currentSession === 1) {
            updatedItem.counting1 = newCounting;
            updatedItem.variance1 = newCounting - item.initialStock;
            updatedItem.valueVariance1 =
              updatedItem.variance1 * (item.prix || 0);
          } else if (currentSession === 2) {
            updatedItem.counting2 = newCounting;
            updatedItem.variance2 =
              newCounting - (item.counting1 ?? item.initialStock);
            updatedItem.valueVariance2 =
              updatedItem.variance2 * (item.prix || 0);
          } else if (currentSession === 3) {
            updatedItem.counting3 = newCounting;
            updatedItem.variance3 =
              newCounting -
              (item.counting2 ?? item.counting1 ?? item.initialStock);
            updatedItem.valueVariance3 =
              updatedItem.variance3 * (item.prix || 0);
          }

          updatedItem.lastUpdated = new Date().toISOString();
          updatedItem.isCountingCompleted = true;
          return updatedItem;
        });
        resolve(updatedItems);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () =>
      reject(new Error("Erreur lors de la lecture du fichier"));
    reader.readAsBinaryString(file);
  });
};
