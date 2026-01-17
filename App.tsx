
import React, { useState, useCallback, useMemo } from 'react';
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

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('DASHBOARD');
  const [sales, setSales] = useState<SalesData[]>([]);
  const [items, setItems] = useState<ItemMaster[]>([]);
  const [promos, setPromos] = useState<Promotion[]>([]);
  const [drivers, setDrivers] = useState<DriverSetting[]>(DEFAULT_DRIVERS);
  const [combinedData, setCombinedData] = useState<ForecastPoint[]>([]);
  const [insights, setInsights] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Filter state
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
    if (sales.length === 0) {
      alert("Please upload sales data in the Data Center first.");
      setView('UPLOAD');
      return;
    }
    
    setLoading(true);
    try {
      // 1. Filter sales based on SKU attributes
      let filteredSales = [...sales];
      if (filters.category !== 'All Categories' || filters.brand !== 'All Brands' || filters.sku !== 'All SKUs') {
        const itemMap = new Map<string, ItemMaster>(items.map(i => [i.sku, i]));
        filteredSales = sales.filter(s => {
          // Fix: itemMap.get() returns ItemMaster | undefined now that itemMap is typed
          const item = itemMap.get(s.sku);
          const matchCat = filters.category === 'All Categories' || item?.category === filters.category;
          const matchBrand = filters.brand === 'All Brands' || item?.brand === filters.brand;
          const matchSKU = filters.sku === 'All SKUs' || s.sku === filters.sku;
          return matchCat && matchBrand && matchSKU;
        });
      }

      // 2. Aggregate Sales by Date (Month)
      const aggregated = filteredSales.reduce((acc, curr) => {
        const date = curr.date;
        if (!acc[date]) acc[date] = 0;
        acc[date] += curr.quantity;
        return acc;
      }, {} as Record<string, number>);

      const sortedDates = Object.keys(aggregated).sort();
      const historicalPoints: ForecastPoint[] = sortedDates.map(date => ({
        date,
        actual: aggregated[date]
      }));

      // 3. Generate Forecast for this specific segment
      const forecastResults = await generateForecast(filteredSales, items, promos, drivers);
      
      // 4. Merge
      const merged = [...historicalPoints, ...forecastResults].sort((a, b) => a.date.localeCompare(b.date));

      setCombinedData(merged);
      const aiText = await analyzeForecast(forecastResults);
      setInsights(aiText);
    } catch (err) {
      console.error(err);
      alert("Forecasting engine encountered an error. Please check your data format.");
    } finally {
      setLoading(false);
    }
  }, [sales, items, promos, drivers, filters]);

  const handleDriverChange = (id: string, value: number) => {
    setDrivers(prev => prev.map(d => d.id === id ? { ...d, value } : d));
  };

  const handleResetDrivers = () => setDrivers(DEFAULT_DRIVERS);

  const renderView = () => {
    switch (view) {
      case 'UPLOAD':
        return <DataUpload onDataLoaded={handleDataLoaded} />;
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
          />
        );
      case 'SCENARIO':
        return <ScenarioPlanner drivers={drivers} onDriverChange={handleDriverChange} onReset={handleResetDrivers} />;
      case 'DASHBOARD':
      default:
        return (
          <div className="space-y-8">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-3xl font-bold text-slate-800">Demand Planning Dashboard</h2>
                <p className="text-slate-500">Global overview of supply chain performance and predictive health.</p>
              </div>
              <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 shadow-sm">
                Active Project: <span className="text-blue-600 font-bold">Standard_Supply_Chain_V1</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm transition-transform hover:scale-[1.02]">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-blue-100 p-2 rounded-xl text-blue-600"><LayoutDashboard size={20} /></div>
                  <span className="text-xs font-bold text-green-500 bg-green-50 px-2 py-1 rounded">+12.5%</span>
                </div>
                <div className="text-3xl font-bold">{sales.length > 0 ? sales.reduce((a,b) => a + b.quantity, 0).toLocaleString() : '0'}</div>
                <div className="text-slate-400 text-sm font-medium mt-1">Total Loaded Volume</div>
              </div>
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm transition-transform hover:scale-[1.02]">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-purple-100 p-2 rounded-xl text-purple-600"><Activity size={20} /></div>
                  <span className="text-xs font-bold text-blue-500 bg-blue-50 px-2 py-1 rounded">Live</span>
                </div>
                <div className="text-3xl font-bold">{items.length}</div>
                <div className="text-slate-400 text-sm font-medium mt-1">Active SKUs in Master</div>
              </div>
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm transition-transform hover:scale-[1.02]">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-yellow-100 p-2 rounded-xl text-yellow-600"><AlertTriangle size={20} /></div>
                </div>
                <div className="text-3xl font-bold">{promos.length}</div>
                <div className="text-slate-400 text-sm font-medium mt-1">Planned Promotions</div>
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
                  <span className={`px-3 py-1 text-[10px] font-bold uppercase rounded-full tracking-wider border ${sales.length > 0 ? 'bg-green-100 text-green-600 border-green-200' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                    {sales.length > 0 ? 'Connected' : 'Disconnected'}
                  </span>
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
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar currentView={view} setView={setView} />
      <main className="ml-64 flex-1 p-12 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {renderView()}
        </div>
      </main>
    </div>
  );
};

export default App;
