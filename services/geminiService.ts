
import { GoogleGenAI, Type } from "@google/genai";
import { ForecastPoint, SalesData, ItemMaster, Promotion, DriverSetting } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateForecast = async (
  salesHistory: SalesData[],
  itemMaster: ItemMaster[],
  promotions: Promotion[],
  drivers: DriverSetting[]
): Promise<ForecastPoint[]> => {
  const prompt = `
    Act as a Senior Data Scientist. I am providing you with historical sales data, item metadata, promotions, and external planning drivers.
    Your task is to simulate the output of four specific machine learning models (XGBoost, Random Forest, LightGBM, and Deep Neural Network) for the next 6 months.

    Sales History Summary: ${JSON.stringify(salesHistory.slice(-50))}
    Item Master: ${JSON.stringify(itemMaster)}
    Promotions: ${JSON.stringify(promotions)}
    Driver Constraints: ${JSON.stringify(drivers)}

    Please generate a forecasting dataset.
    Rules:
    1. Provide monthly data points starting from the month after the last sales date.
    2. Each point should contain simulated values for 'xgboost', 'randomForest', 'lightGbm', and 'dnn'.
    3. Ensure 'xgboost' is slightly more sensitive to promotions.
    4. Ensure 'dnn' is smoother.
    5. Ensure the values are realistic based on the historical quantity average.
    6. Include a 'consensus' value which is the weighted average.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            date: { type: Type.STRING },
            xgboost: { type: Type.NUMBER },
            randomForest: { type: Type.NUMBER },
            lightGbm: { type: Type.NUMBER },
            dnn: { type: Type.NUMBER },
            consensus: { type: Type.NUMBER },
          },
          required: ["date", "xgboost", "randomForest", "lightGbm", "dnn", "consensus"],
        },
      },
    },
  });

  try {
    return JSON.parse(response.text);
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    return [];
  }
};

export const analyzeForecast = async (forecast: ForecastPoint[]): Promise<string> => {
  const prompt = `Analyze this demand forecast data and provide 3 key business insights and a risk assessment. Keep it professional and concise. Data: ${JSON.stringify(forecast)}`;
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
  });
  return response.text || "No insights available.";
};
