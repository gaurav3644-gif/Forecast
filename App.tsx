
import React, { useState, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import DataUpload from './components/DataUpload';
import ForecastView from './components/ForecastView';
import ScenarioPlanner from './components/ScenarioPlanner';
import { AppView, ForecastPoint, SalesData, ItemMaster, Promotion, DriverSetting, BigQueryConfig } from './types';
import { generateForecast, analyzeForecast } from './services/geminiService';
import { fetchForecastFromBigQuery } from './services/bigQueryService';
import { Activity, LayoutDashboard, Database, TrendingUp, AlertTriangle } from 'lucide-react';

const DEFAULT_DRIVERS: DriverSetting[] = [
  { id: 'promo', name: 'Promotion Intensity', value: 0, min: -50, max: 100, step: 5, description: 'Adjusts the impact of marketing events.' },
  { id: 'price', name: 'Price Elasticity', value: 0, min: -20, max: 20, step: 1, description: 'Simulates sensitivity to price changes.' },
  { id: 'season', name: 'Seasonal Strength', value: 0, min: -30, max: 30, step: 5, description: 'Amplifies or dampens cyclical trends.' },
];

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('DASHBOARD');
  const [sales, setSales] = useState<SalesData[]>([]);
  const [items, setItems] = useState<ItemMaster[]>([]);
  const [promos, setPromos] = useState<Promotion[]>([]);
  const [drivers, setDrivers] = useState<DriverSetting[]>(DEFAULT_DRIVERS);
  const [combinedData, setCombinedData] = useState<ForecastPoint[]>([]);
  const [insights, setInsights] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [activeDataSource, setActiveDataSource] = useState<'SIMULATION' | 'BIGQUERY'>('SIMULATION');

  const [bqConfig, setBqConfig] = useState<BigQueryConfig>({
    projectId: '',
    datasetId: '',
    tableId: '',
    accessToken: '',
    enabled: false
  });

  const [filters, setFilters] = useState({
    category: 'All Categories',
    brand: 'All Brands',
    sku: 'All SKUs'
  });

  const handleDataLoaded = (type: 'SALES' | 'ITEM' | 'PROMO', data: any[]) => {
    if (type === 'SALES') {
      setSales(data);
      setCombinedData([]); 
    }
    if (type === 'ITEM') setItems(data);
    if (type === 'PROMO') setPromos(data);
  };

  const handleGenerateForecast = useCallback(async () => {
    if (sales.length === 0 && !bqConfig.enabled) {
      alert("Please upload sales history in Data Center or enable BigQuery connection.");
      setView('UPLOAD');
      return;
    }
    
    setLoading(true);
    try {
      let historicalPoints: ForecastPoint[] = [];
      if (sales.length > 0) {
        let filteredSales = [...sales];
        if (filters.category !== 'All Categories' || filters.brand !== 'All Brands' || filters.sku !== 'All SKUs') {
          const itemMap = new Map<string, ItemMaster>(items.map(i => [i.sku, i]));
          filteredSales = sales.filter(s => {
            const item = itemMap.get(s.sku);
            const matchCat = filters.category === 'All Categories' || item?.category === filters.category;
            const matchBrand = filters.brand === 'All Brands' || item?.brand === filters.brand;
            const matchSKU = filters.sku === 'All SKUs' || s.sku === filters.sku;
            return matchCat && matchBrand && matchSKU;
          });
        }

        const aggregated = filteredSales.reduce((acc, curr) => {
          const date = curr.date;
          acc[date] = (acc[date] || 0) + curr.quantity;
          return acc;
        }, {} as Record<string, number>);

        historicalPoints = Object.keys(aggregated).sort().map(date => ({
          date,
          actual: aggregated[date]
        }));
      }

      let forecastResults: ForecastPoint[] = [];
      if (bqConfig.enabled && bqConfig.accessToken) {
        setActiveDataSource('BIGQUERY');
        const bqResult = await fetchForecastFromBigQuery(
          bqConfig.projectId,
          bqConfig.datasetId,
          bqConfig.tableId,
          bqConfig.accessToken
        );
        forecastResults = bqResult.mappedData;
      } else {
        setActiveDataSource('SIMULATION');
        const filteredSalesForGemini = sales.length > 0 ? sales : []; 
        forecastResults = await generateForecast(filteredSalesForGemini, items, promos, drivers);
      }
      
      const merged = [...historicalPoints, ...forecastResults].sort((a, b) => a.date.localeCompare(b.date));
      setCombinedData(merged);
      const aiText = await analyzeForecast(forecastResults);
      setInsights(aiText);
    } catch (err: any) {
      console.error(err);
      alert(`Pipeline error: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, [sales, items, promos, drivers, filters, bqConfig]);

  const renderView = () => {
    switch (view) {
      case 'UPLOAD':
        return <DataUpload onDataLoaded={handleDataLoaded} bqConfig={bqConfig} setBqConfig={setBqConfig} />;
      case 'FORECAST':
        return (
          <ForecastView 
            data={combinedData} 
            isLoading={loading} 
            onGenerate={handleGenerateForecast} 
            insights={insights}
            items={items}
            filters={filters}
            setFilters={setFilters}
            source={activeDataSource}
          />
        );
      case 'SCENARIO':
        return <ScenarioPlanner drivers={drivers} onDriverChange={(id, v) => setDrivers(d => d.map(x => x.id === id ? {...x, value: v} : x))} onReset={() => setDrivers(DEFAULT_DRIVERS)} />;
      case 'DASHBOARD':
      default:
        return (
          <div className="space-y-8">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-3xl font-bold text-slate-800">Demand Planning Dashboard</h2>
                <p className="text-slate-500">Global overview of supply chain performance.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-blue-100 p-2 rounded-xl text-blue-600"><LayoutDashboard size={20} /></div>
                  <span className="text-xs font-bold text-green-500 bg-green-50 px-2 py-1 rounded">+12.5%</span>
                </div>
                <div className="text-3xl font-bold">{sales.length > 0 ? sales.reduce((a,b) => a + b.quantity, 0).toLocaleString() : '0'}</div>
                <div className="text-slate-400 text-sm font-medium mt-1">Total Loaded Volume</div>
              </div>
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-purple-100 p-2 rounded-xl text-purple-600"><Activity size={20} /></div>
                </div>
                <div className="text-3xl font-bold">{items.length}</div>
                <div className="text-slate-400 text-sm font-medium mt-1">Active SKUs</div>
              </div>
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-yellow-100 p-2 rounded-xl text-yellow-600"><Database size={20} /></div>
                </div>
                <div className="text-3xl font-bold">{bqConfig.enabled ? 'Live' : 'Off'}</div>
                <div className="text-slate-400 text-sm font-medium mt-1">BigQuery Bridge</div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar currentView={view} setView={setView} />
      <main className="ml-64 flex-1 p-12 overflow-y-auto">
        <div className="max-w-7xl mx-auto">{renderView()}</div>
      </main>
    </div>
  );
};

export default App;
