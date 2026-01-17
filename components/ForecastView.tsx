
import React, { useState, useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { ForecastPoint, ItemMaster } from '../types';
// Added RefreshCw to imports
import { Brain, TrendingUp, AlertCircle, Loader2, Download, Filter, ChevronDown, Database, Cpu, FileDown, RefreshCw } from 'lucide-react';

interface ForecastViewProps {
  data: ForecastPoint[];
  isLoading: boolean;
  onGenerate: () => void;
  insights: string;
  items: ItemMaster[];
  filters: { category: string; brand: string; sku: string };
  setFilters: React.Dispatch<React.SetStateAction<{ category: string; brand: string; sku: string }>>;
  source: 'SIMULATION' | 'BIGQUERY';
}

const ForecastView: React.FC<ForecastViewProps> = ({ 
  data, isLoading, onGenerate, insights, items, filters, setFilters, source 
}) => {
  const [activeModel, setActiveModel] = useState<string | null>(null);

  const colors = {
    actual: '#64748b',
    xgboost: '#3b82f6',
    randomForest: '#10b981',
    lightGbm: '#f59e0b',
    dnn: '#8b5cf6',
    consensus: '#1e293b'
  };

  const categories = useMemo(() => ['All Categories', ...new Set(items.map(i => i.category))], [items]);
  const brands = useMemo(() => {
    const filtered = filters.category === 'All Categories' ? items : items.filter(i => i.category === filters.category);
    return ['All Brands', ...new Set(filtered.map(i => i.brand))];
  }, [items, filters.category]);
  const skus = useMemo(() => {
    const filtered = items.filter(i => 
      (filters.category === 'All Categories' || i.category === filters.category) &&
      (filters.brand === 'All Brands' || i.brand === filters.brand)
    );
    return ['All SKUs', ...new Set(filtered.map(i => i.sku))];
  }, [items, filters.category, filters.brand]);

  const downloadCSV = () => {
    if (data.length === 0) return;
    const headers = ["Date", "Actual Sales", "XGBoost", "Random Forest", "LightGBM", "DNN", "Consensus"];
    const rows = data.map(p => [p.date, p.actual ?? "", p.xgboost ?? "", p.randomForest ?? "", p.lightGbm ?? "", p.dnn ?? "", p.consensus ?? ""]);
    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `forecast_${source}_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  };

  const formatXAxis = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length < 2) return dateStr;
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const m = parseInt(parts[1], 10) - 1;
    return `${monthNames[m]} ${parts[0].substring(2)}`;
  };

  const lastActualValue = data.filter(p => p.actual !== undefined).slice(-1)[0]?.actual || 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-2xl font-bold">ML Forecast Engine</h2>
            {data.length > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                source === 'BIGQUERY' ? 'bg-indigo-100 text-indigo-600 border border-indigo-200' : 'bg-blue-100 text-blue-600 border border-blue-200'
              }`}>
                {source === 'BIGQUERY' ? <Database size={10} /> : <Cpu size={10} />}
                Source: {source}
              </span>
            )}
          </div>
          <p className="text-slate-500 text-sm italic">Multi-model ensemble analyzing segment-specific demand patterns.</p>
        </div>
        <div className="flex gap-3">
          {data.length > 0 && (
            <button 
              onClick={downloadCSV} 
              className="bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 px-5 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 shadow-sm text-sm"
            >
              <FileDown size={18} />
              {source === 'BIGQUERY' ? 'Download BQ Dataset' : 'Download Forecast CSV'}
            </button>
          )}
          <button onClick={onGenerate} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 disabled:opacity-50 text-sm">
            {isLoading ? <Loader2 className="animate-spin" size={18} /> : (source === 'BIGQUERY' ? <RefreshCw size={18} /> : <Brain size={18} />)}
            {source === 'BIGQUERY' ? 'Fetch from BigQuery' : 'Generate Forecast'}
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2 text-slate-400 mr-2">
          <Filter size={16} />
          <span className="text-xs font-bold uppercase tracking-wider">Filters:</span>
        </div>
        <div className="relative group">
          <select 
            value={filters.category}
            onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value, brand: 'All Brands', sku: 'All SKUs' }))}
            className="appearance-none bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 pr-10 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
          >
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
        <div className="relative group">
          <select 
            value={filters.brand}
            onChange={(e) => setFilters(prev => ({ ...prev, brand: e.target.value, sku: 'All SKUs' }))}
            className="appearance-none bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 pr-10 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
          >
            {brands.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
        <div className="relative group">
          <select 
            value={filters.sku}
            onChange={(e) => setFilters(prev => ({ ...prev, sku: e.target.value }))}
            className="appearance-none bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 pr-10 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
          >
            {skus.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {data.length === 0 && !isLoading ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-3xl p-20 flex flex-col items-center text-center">
          <TrendingUp className="w-16 h-16 text-slate-200 mb-4" />
          <h3 className="text-xl font-semibold text-slate-800">No segment selected or forecast generated</h3>
          <p className="text-slate-500 max-w-md mt-2">Adjust your filters and click "Fetch from BigQuery" to pull your Colab results from the cloud warehouse.</p>
        </div>
      ) : isLoading ? (
        <div className="bg-white rounded-3xl p-20 flex flex-col items-center justify-center space-y-4 shadow-sm border border-slate-100">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
          <p className="text-slate-600 font-medium italic">
            {source === 'BIGQUERY' ? 'Querying BigQuery warehouse...' : 'Running segmented ML models...'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={formatXAxis} minTickGap={30} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} domain={['auto', 'auto']} tickFormatter={(v) => v.toLocaleString()} />
                    <Tooltip formatter={(v: number) => [Math.round(v).toLocaleString(), ""]} labelFormatter={formatXAxis} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
                    <Legend iconType="circle" verticalAlign="bottom" height={36} />
                    <Line type="monotone" dataKey="actual" name="Actual Sales" stroke={colors.actual} strokeWidth={3} dot={{ r: 4, fill: colors.actual, strokeWidth: 2, stroke: '#fff' }} connectNulls />
                    <Line type="monotone" dataKey="xgboost" name="XGBoost" stroke={colors.xgboost} strokeWidth={2} dot={false} strokeOpacity={activeModel && activeModel !== 'xgboost' ? 0.2 : 1} connectNulls />
                    <Line type="monotone" dataKey="randomForest" name="Random Forest" stroke={colors.randomForest} strokeWidth={2} dot={false} strokeOpacity={activeModel && activeModel !== 'randomForest' ? 0.2 : 1} connectNulls />
                    <Line type="monotone" dataKey="lightGbm" name="LightGBM" stroke={colors.lightGbm} strokeWidth={2} dot={false} strokeOpacity={activeModel && activeModel !== 'lightGbm' ? 0.2 : 1} connectNulls />
                    <Line type="monotone" dataKey="dnn" name="DNN" stroke={colors.dnn} strokeWidth={2} dot={false} strokeOpacity={activeModel && activeModel !== 'dnn' ? 0.2 : 1} connectNulls />
                    <Line type="monotone" dataKey="consensus" name="Consensus" stroke={colors.consensus} strokeWidth={4} strokeDasharray="8 4" dot={false} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl flex flex-col">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Brain className="text-blue-400" /> Segment Insights
              </h3>
              <div className="flex-1 overflow-y-auto pr-2 space-y-4 text-slate-300 text-sm leading-relaxed">
                {insights ? insights.split('\n').map((line, i) => <p key={i}>{line}</p>) : <p className="italic text-slate-500">Run analysis to identify segment risks.</p>}
              </div>
              <div className="mt-6 pt-6 border-t border-slate-800">
                <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-wider mb-2">
                  <AlertCircle size={14} /> AI Confidence: 89%
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ForecastView;
