
import { ForecastPoint } from "../types";

export interface BigQueryFetchResult {
  mappedData: ForecastPoint[];
  rawRows: any[];
  fields: string[];
}

export const testBigQueryConnection = async (
  projectId: string,
  datasetId: string,
  tableId: string,
  accessToken: string
): Promise<boolean> => {
  const query = `SELECT * FROM \`${projectId}.${datasetId}.${tableId}\` LIMIT 1`;
  const url = `https://bigquery.googleapis.com/bigquery/v2/projects/${projectId}/queries`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, useLegacySql: false }),
    });
    return response.ok;
  } catch (e) {
    return false;
  }
};

export const fetchForecastFromBigQuery = async (
  projectId: string,
  datasetId: string,
  tableId: string,
  accessToken: string
): Promise<BigQueryFetchResult> => {
  const query = `
    SELECT 
      *
    FROM \`${projectId}.${datasetId}.${tableId}\`
    ORDER BY 1 ASC
    LIMIT 1000
  `;

  const url = `https://bigquery.googleapis.com/bigquery/v2/projects/${projectId}/queries`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: query,
      useLegacySql: false,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    const msg = error.error?.message || "Unknown BigQuery Error";
    if (msg.includes("401")) throw new Error("Access Token has expired. Please run '!gcloud auth print-access-token' in Colab again.");
    if (msg.includes("404")) throw new Error("Table not found. Please check Project, Dataset, and Table IDs.");
    if (msg.includes("403")) throw new Error("Permission denied. Ensure your token has 'BigQuery Data Viewer' and 'BigQuery Job User' roles.");
    throw new Error(msg);
  }

  const data = await response.json();
  if (!data.rows || data.rows.length === 0) {
    return { mappedData: [], rawRows: [], fields: [] };
  }

  const fields = data.schema.fields.map((f: any) => f.name);
  const rawRows = data.rows.map((row: any) => {
    const obj: any = {};
    row.f.forEach((cell: any, idx: number) => {
      obj[fields[idx]] = cell.v;
    });
    return obj;
  });

  const mappedData = rawRows.map((row: any) => {
    const obj: ForecastPoint = { date: "" };
    Object.entries(row).forEach(([key, val]: [string, any]) => {
      const name = key.toLowerCase();
      
      // Robust mapping for various naming styles
      if (name === 'date' || name.includes('timestamp') || name === 'ds') {
        // Clean ISO strings for cleaner display
        obj.date = typeof val === 'string' ? val.split('T')[0] : val;
      } else if (name.includes('xgboost') || name.includes('xgb')) {
        obj.xgboost = parseFloat(val);
      } else if (name.includes('random_forest') || name.includes('randomforest') || name === 'rf' || name === 'forest') {
        obj.randomForest = parseFloat(val);
      } else if (name.includes('light_gbm') || name.includes('lightgbm') || name === 'lgbm') {
        obj.lightGbm = parseFloat(val);
      } else if (name.includes('dnn') || name.includes('deep_neural') || name.includes('neural')) {
        obj.dnn = parseFloat(val);
      } else if (name.includes('consensus') || name === 'ensemble' || name === 'final_forecast' || name === 'prediction' || name === 'yhat') {
        obj.consensus = parseFloat(val);
      } else if (name === 'actual' || name === 'quantity' || name === 'sales' || name === 'y') {
        obj.actual = parseFloat(val);
      }
    });
    return obj;
  });

  return { mappedData, rawRows, fields };
};
