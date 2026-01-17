
import { ForecastPoint } from "../types";

export const testBigQueryConnection = async (
  projectId: string,
  datasetId: string,
  tableId: string,
  accessToken: string
): Promise<boolean> => {
  const query = `SELECT * FROM \`${projectId}.${datasetId}.${tableId}\` LIMIT 1`;
  const url = `https://bigquery.googleapis.com/bigquery/v2/projects/${projectId}/queries`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, useLegacySql: false }),
  });

  return response.ok;
};

export const fetchForecastFromBigQuery = async (
  projectId: string,
  datasetId: string,
  tableId: string,
  accessToken: string
): Promise<ForecastPoint[]> => {
  // Query handles various naming conventions typically used in Colab/BigQuery
  const query = `
    SELECT 
      *
    FROM \`${projectId}.${datasetId}.${tableId}\`
    ORDER BY date ASC
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
    throw new Error(msg);
  }

  const data = await response.json();
  if (!data.rows) return [];

  const fields = data.schema.fields.map((f: any) => f.name.toLowerCase());

  return data.rows.map((row: any) => {
    const obj: any = {};
    row.f.forEach((cell: any, idx: number) => {
      const name = fields[idx];
      let val = cell.v;

      // Mapping logic for common variations in column naming
      if (name === 'date') obj.date = val;
      else if (name.includes('xgboost')) obj.xgboost = parseFloat(val);
      else if (name.includes('random_forest') || name.includes('randomforest')) obj.randomForest = parseFloat(val);
      else if (name.includes('light_gbm') || name.includes('lightgbm')) obj.lightGbm = parseFloat(val);
      else if (name.includes('dnn')) obj.dnn = parseFloat(val);
      else if (name.includes('consensus')) obj.consensus = parseFloat(val);
      else if (name === 'actual' || name === 'quantity') obj.actual = parseFloat(val);
    });
    return obj as ForecastPoint;
  });
};
