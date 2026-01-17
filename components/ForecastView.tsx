
import React, { useState } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { ForecastPoint } from '../types';
import { Brain, TrendingUp, AlertCircle, Loader2, Download } from 'lucide-react';

interface ForecastViewProps {
  data: ForecastPoint[];
  isLoading: boolean;
  onGenerate: () => void;
  insights: string;
}

const ForecastView: React.FC<ForecastViewProps> = ({ data, isLoading, onGenerate, insights }) => {
  const [activeModel, setActiveModel] = useState<string | null>(null);

  const colors = {
    actual: '#64748b',
    xgboost: '#3b82f6',
    randomForest: '#10b981',
    lightGbm: '#f59e0b',
    dnn: '#8b5cf6',
    consensus: '#1e293b'
  };

  const downloadCSV = () => {
    if (data.length === 0) return;

    const headers = ["Date", "Actual Sales", "XGBoost", "Random Forest", "LightGBM", "DNN", "Consensus"];
    const rows = data.map(p => [
      p.date,
      p.actual ?? "",
      p.xgboost ?? "",
      p.randomForest ?? "",
      p.lightGbm ?? "",
      p.dnn ?? "",
      p.consensus ?? ""
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(e => e.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const timestamp = new Date().toISOString().split('T')[0];
    link.setAttribute("href", url);
    link.setAttribute("download", `demand_forecast_export_${timestamp}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Robust date formatting that ignores timezone offsets
  const formatXAxis = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length < 2) return dateStr;
    const year = parts[0].substring(2);
    const monthIndex = parseInt(parts[1], 10) - 1;
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${monthNames[monthIndex]} ${year}`;
  };

  const lastActualValue = data
    .filter(p => p.actual !== undefined && p.actual !== null)
    .slice(-1)[0]?.actual || 0;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold mb-2">AI Forecast Engine</h2>
          <p className="text-slate-500">Comparing historical actuals with multi-model predictive scenarios.</p>
        </div>
        <div className="flex gap-3">
          {data.length > 0 && (
            <button 
              onClick={downloadCSV}
              className="bg-white border border-slate-200 hover:border-slate-300 text-slate-700 px-5 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 shadow-sm"
            >
              <Download size={18} />
              Export CSV
            </button>
          )}
          <button 
            onClick={onGenerate}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : <Brain size={20} />}
            {data.length > 0 ? 'Recalculate' : 'Generate Forecast'}
          </button>
        </div>
      </div>

      {data.length === 0 && !isLoading ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-3xl p-20 flex flex-col items-center text-center">
          <TrendingUp className="w-16 h-16 text-slate-200 mb-4" />
          <h3 className="text-xl font-semibold text-slate-800">Ready for Analysis</h3>
          <p className="text-slate-500 max-w-md mt-2">Historical sales are loaded. Click generate to compute ML forecasts across multiple architectures.</p>
        </div>
      ) : isLoading ? (
        <div className="bg-white rounded-3xl p-20 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
          <p className="text-slate-600 font-medium italic">Synchronizing ETL data and running ensemble models...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <TrendingUp className="text-blue-500" />
                  Actual Sales & ML Models
                </h3>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                  Data points: {data.length}
                </div>
              </div>
              <div className="h-[450px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#94a3b8" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false}
                      tickFormatter={formatXAxis}
                      minTickGap={30}
                    />
                    <YAxis 
                      stroke="#94a3b8" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false}
                      domain={['auto', 'auto']}
                      tickFormatter={(value) => value.toLocaleString()}
                    />
                    <Tooltip 
                      formatter={(value: number) => [Math.round(value).toLocaleString(), ""]}
                      labelFormatter={formatXAxis}
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)' }} 
                    />
                    <Legend iconType="circle" verticalAlign="bottom" height={36} />
                    <Line 
                      type="monotone" 
                      dataKey="actual" 
                      name="Actual Sales" 
                      stroke={colors.actual} 
                      strokeWidth={3} 
                      dot={{ r: 4, fill: colors.actual, strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 6 }}
                      strokeOpacity={activeModel && activeModel !== 'actual' ? 0.2 : 1}
                      connectNulls={true}
                    />
                    <Line type="monotone" dataKey="xgboost" name="XGBoost" stroke={colors.xgboost} strokeWidth={2} dot={false} strokeOpacity={activeModel && activeModel !== 'xgboost' ? 0.2 : 1} connectNulls={true} />
                    <Line type="monotone" dataKey="randomForest" name="Random Forest" stroke={colors.randomForest} strokeWidth={2} dot={false} strokeOpacity={activeModel && activeModel !== 'randomForest' ? 0.2 : 1} connectNulls={true} />
                    <Line type="monotone" dataKey="lightGbm" name="LightGBM" stroke={colors.lightGbm} strokeWidth={2} dot={false} strokeOpacity={activeModel && activeModel !== 'lightGbm' ? 0.2 : 1} connectNulls={true} />
                    <Line type="monotone" dataKey="dnn" name="DNN" stroke={colors.dnn} strokeWidth={2} dot={false} strokeOpacity={activeModel && activeModel !== 'dnn' ? 0.2 : 1} connectNulls={true} />
                    <Line type="monotone" dataKey="consensus" name="Consensus" stroke={colors.consensus} strokeWidth={4} strokeDasharray="8 4" dot={false} connectNulls={true} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl flex flex-col">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Brain className="text-blue-400" />
                Plan Analytics
              </h3>
              <div className="flex-1 overflow-y-auto pr-2 space-y-4 text-slate-300 text-sm leading-relaxed scrollbar-hide">
                {insights ? insights.split('\n').map((line, i) => (
                  <p key={i}>{line}</p>
                )) : <p className="italic text-slate-500">Run analysis to identify demand drivers and SKU-level risks.</p>}
              </div>
              <div className="mt-6 pt-6 border-t border-slate-800">
                <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-wider mb-2">
                  <AlertCircle size={14} /> AI Confidence: 89%
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
             <button 
                onClick={() => setActiveModel(activeModel === 'actual' ? null : 'actual')}
                className={`p-5 rounded-2xl border transition-all text-left ${
                  activeModel === 'actual' 
                    ? 'border-slate-500 bg-slate-50 ring-2 ring-slate-100' 
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Latest Actual</div>
                <div className="text-lg font-bold text-slate-800">
                  {Math.round(lastActualValue).toLocaleString()}
                </div>
              </button>
            {['xgboost', 'randomForest', 'lightGbm', 'dnn'].map((model) => (
              <button 
                key={model}
                onClick={() => setActiveModel(activeModel === model ? null : model)}
                className={`p-5 rounded-2xl border transition-all text-left ${
                  activeModel === model 
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-100' 
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{model}</div>
                <div className="text-lg font-bold text-slate-800">
                  {Math.round(data[data.length - 1][model as keyof ForecastPoint] as number || 0).toLocaleString()}
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ForecastView;
