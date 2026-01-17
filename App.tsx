
import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import DataUpload from './components/DataUpload';
import ForecastView from './components/ForecastView';
import ScenarioPlanner from './components/ScenarioPlanner';
import { AppView, ForecastPoint, SalesData, ItemMaster, Promotion, DriverSetting } from './types';
import { generateForecast, analyzeForecast } from './services/geminiService';
import { Activity, LayoutDashboard, Database, TrendingUp, AlertTriangle } from 'lucide-react';

const DEFAULT_DRIVERS: DriverSetting[] = [
  { id: 'promo', name: 'Promotion Intensity', value: 0, min: -50, max: 100, step: 5, description: 'Adjusts the impact of marketing events.' },
  { id: 'price', name: 'Price Elasticity', value: 0, min: -20, max: 20, step: 1, description: 'Simulates sensitivity to price changes.' },
  { id: 'season', name: 'Seasonal Strength', value: 0, min: -30, max: 30, step: 5, description: 'Amplifies or dampens cyclical trends.' },
];

// Initial Demo Data
const MOCK_SALES: SalesData[] = [
  { date: '2023-01-01', sku: 'SKU001', quantity: 120, price: 15.99 },
  { date: '2023-02-01', sku: 'SKU001', quantity: 130, price: 15.99 },
  { date: '2023-03-01', sku: 'SKU001', quantity: 125, price: 15.99 },
  { date: '2023-04-01', sku: 'SKU001', quantity: 140, price: 15.99 },
  { date: '2023-05-01', sku: 'SKU001', quantity: 155, price: 15.99 },
  { date: '2023-06-01', sku: 'SKU001', quantity: 145, price: 15.99 },
  { date: '2023-07-01', sku: 'SKU001', quantity: 160, price: 15.99 },
  { date: '2023-08-01', sku: 'SKU001', quantity: 175, price: 15.99 },
  { date: '2023-09-01', sku: 'SKU001', quantity: 190, price: 15.99 },
  { date: '2023-10-01', sku: 'SKU001', quantity: 210, price: 15.99 },
  { date: '2023-11-01', sku: 'SKU001', quantity: 245, price: 15.99 },
  { date: '2023-12-01', sku: 'SKU001', quantity: 450, price: 15.99 },
  { date: '2024-01-01', sku: 'SKU001', quantity: 220, price: 15.99 },
  { date: '2024-02-01', sku: 'SKU001', quantity: 215, price: 15.99 },
];

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('DASHBOARD');
  const [sales, setSales] = useState<SalesData[]>(MOCK_SALES);
  const [items, setItems] = useState<ItemMaster[]>([]);
  const [promos, setPromos] = useState<Promotion[]>([]);
  const [drivers, setDrivers] = useState<DriverSetting[]>(DEFAULT_DRIVERS);
  const [combinedData, setCombinedData] = useState<ForecastPoint[]>([]);
  const [insights, setInsights] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleDataLoaded = (type: 'SALES' | 'ITEM' | 'PROMO', data: any[]) => {
    if (type === 'SALES') {
      // If data is provided, use it. If data is cleared (empty array), fallback to mock or empty.
      setSales(data.length > 0 ? data : MOCK_SALES);
      setCombinedData([]); // Reset the forecast when source data changes
    }
    if (type === 'ITEM') setItems(data);
    if (type === 'PROMO') setPromos(data);
  };

  const handleGenerateForecast = useCallback(async () => {
    if (sales.length === 0) {
      alert("Please upload sales data first.");
      return;
    }
    
    setLoading(true);
    try {
      const sortedSales = [...sales].sort((a, b) => a.date.localeCompare(b.date));
      const historicalPoints: ForecastPoint[] = sortedSales.map(s => ({
        date: s.date,
        actual: s.quantity
      }));

      const forecastResults = await generateForecast(sortedSales, items, promos, drivers);
      const merged = [...historicalPoints, ...forecastResults].sort((a, b) => a.date.localeCompare(b.date));

      setCombinedData(merged);
      
      const aiText = await analyzeForecast(forecastResults);
      setInsights(aiText);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [sales, items, promos, drivers]);

  const handleDriverChange = (id: string, value: number) => {
    setDrivers(prev => prev.map(d => d.id === id ? { ...d, value } : d));
  };

  const handleResetDrivers = () => setDrivers(DEFAULT_DRIVERS);

  const renderView = () => {
    switch (view) {
      case 'UPLOAD':
        return <DataUpload onDataLoaded={handleDataLoaded} />;
      case 'FORECAST':
        return <ForecastView data={combinedData} isLoading={loading} onGenerate={handleGenerateForecast} insights={insights} />;
      case 'SCENARIO':
        return <ScenarioPlanner drivers={drivers} onDriverChange={handleDriverChange} onReset={handleResetDrivers} />;
      case 'DASHBOARD':
      default:
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-slate-800">Demand Planning Dashboard</h2>
              <p className="text-slate-500">Global overview of supply chain performance and predictive health.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm transition-transform hover:scale-[1.02]">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-blue-100 p-2 rounded-xl text-blue-600"><LayoutDashboard size={20} /></div>
                  <span className="text-xs font-bold text-green-500 bg-green-50 px-2 py-1 rounded">+12.5%</span>
                </div>
                <div className="text-3xl font-bold">4,120</div>
                <div className="text-slate-400 text-sm font-medium mt-1">Forecast Volume (Next 6M)</div>
              </div>
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm transition-transform hover:scale-[1.02]">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-purple-100 p-2 rounded-xl text-purple-600"><Activity size={20} /></div>
                  <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded">-2.1%</span>
                </div>
                <div className="text-3xl font-bold">92.8%</div>
                <div className="text-slate-400 text-sm font-medium mt-1">Backtest Accuracy (WAPE)</div>
              </div>
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm transition-transform hover:scale-[1.02]">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-yellow-100 p-2 rounded-xl text-yellow-600"><AlertTriangle size={20} /></div>
                </div>
                <div className="text-3xl font-bold">08</div>
                <div className="text-slate-400 text-sm font-medium mt-1">High Variance SKUs</div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold mb-4">Pipeline Integration</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <Database size={18} className="text-slate-400" />
                    <span className="text-sm font-medium text-slate-700">Enterprise Data Lake</span>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-600 text-[10px] font-bold uppercase rounded-full tracking-wider border border-green-200">Connected</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <TrendingUp size={18} className="text-slate-400" />
                    <span className="text-sm font-medium text-slate-700">Predictive ML Repository</span>
                  </div>
                  <span className="px-3 py-1 bg-blue-100 text-blue-600 text-[10px] font-bold uppercase rounded-full tracking-wider border border-blue-200">Active</span>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex">
      <Sidebar currentView={view} setView={setView} />
      <main className="ml-64 flex-1 p-12 overflow-y-auto max-w-7xl mx-auto">
        {renderView()}
      </main>
    </div>
  );
};

export default App;
