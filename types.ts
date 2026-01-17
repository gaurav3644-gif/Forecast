
export interface SalesData {
  date: string;
  sku: string;
  quantity: number;
  price: number;
}

export interface ItemMaster {
  sku: string;
  category: string;
  brand: string;
  unitCost: number;
}

export interface Promotion {
  sku: string;
  startDate: string;
  endDate: string;
  discountPercent: number;
}

export interface ForecastPoint {
  date: string;
  actual?: number;
  xgboost?: number;
  randomForest?: number;
  lightGbm?: number;
  dnn?: number;
  consensus?: number;
}

export interface DriverSetting {
  id: string;
  name: string;
  value: number;
  min: number;
  max: number;
  step: number;
  description: string;
}

export interface BigQueryConfig {
  projectId: string;
  datasetId: string;
  tableId: string;
  accessToken: string;
  enabled: boolean;
}

export type AppView = 'DASHBOARD' | 'UPLOAD' | 'FORECAST' | 'SCENARIO';
