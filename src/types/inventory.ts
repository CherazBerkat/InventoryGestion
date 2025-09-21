export interface InventoryItem {
  id: string;
  emplacement?: string;
  articleCode: string;
  description: string;
  reference?: string;
  uniteMesure?: string;
  prix?: number;
  initialStock: number;
  currentStock: number;
  counting1?: number;
  counting2?: number;
  counting3?: number;
  variance1?: number;
  variance2?: number;
  variance3?: number;
  valueVariance1?: number; // Écart en valeur (variance * prix unitaire)
  valueVariance2?: number;
  valueVariance3?: number;
  lastUpdated: string;
  movements: StockMovement[];
  isCountingCompleted?: boolean;
}

export interface StockMovement {
  id: string;
  type: 'counting' | 'external';
  quantity: number;
  session?: number;
  timestamp: string;
  note?: string;
}

export interface CountingSession {
  sessionNumber: 1 | 2 | 3;
  isActive: boolean;
  completedItems: string[];
}

export type InputMode = 'sequential' | 'excel';