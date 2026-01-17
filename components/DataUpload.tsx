
import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, Trash2, Loader2, Database, Key, Globe, AlertCircle, RefreshCw } from 'lucide-react';
import { BigQueryConfig } from '../types';
import { testBigQueryConnection } from '../services/bigQueryService';

interface DataUploadProps {
  onDataLoaded: (type: 'SALES' | 'ITEM' | 'PROMO', data: any[]) => void;
  bqConfig: BigQueryConfig;
  setBqConfig: (config: BigQueryConfig) => void;
}

const DataUpload: React.FC<DataUploadProps> = ({ onDataLoaded, bqConfig, setBqConfig }) => {
  const [files, setFiles] = useState<{ [key: string]: string | null }>({
    SALES: null,
    ITEM: null,
    PROMO: null,
  });
  const [parsing, setParsing] = useState<{ [key: string]: boolean }>({
    SALES: false,
    ITEM: false,
    PROMO: false,
  });
  const [testingConn, setTestingConn] = useState(false);
  const [connStatus, setConnStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const parseCSV = (text: string, type: 'SALES' | 'ITEM' | 'PROMO') => {
    const lines = text.split('\n').filter(line => line.trim() !== '');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const data = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      const obj: any = {};
      
      headers.forEach((header, index) => {
        let val: any = values[index];
        if (['quantity', 'price', 'unitcost', 'discountpercent'].includes(header)) {
          val = parseFloat(val) || 0;
        }
        obj[header] = val;
      });

      if (type === 'SALES') {
        return { date: obj.date, sku: obj.sku, quantity: obj.quantity, price: obj.price };
      } else if (type === 'ITEM') {
        return { sku: obj.sku, category: obj.category, brand: obj.brand, unitCost: obj.unitcost };
      } else if (type === 'PROMO') {
        return { sku: obj.sku, startDate: obj.startdate || obj.date, endDate: obj.enddate || obj.date, discountPercent: obj.discountpercent };
      }
      return obj;
    });

    return data;
  };

  const handleFileUpload = (type: 'SALES' | 'ITEM' | 'PROMO', file: File) => {
    setParsing(prev => ({ ...prev, [type]: true }));
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsedData = parseCSV(text, type);
      setFiles(prev => ({ ...prev, [type]: file.name }));
      onDataLoaded(type, parsedData);
      setParsing(prev => ({ ...prev, [type]: false }));
    };
    reader.readAsText(file);
  };

  const handleTestConnection = async () => {
    if (!bqConfig.projectId || !bqConfig.datasetId || !bqConfig.tableId || !bqConfig.accessToken) {
      setConnStatus('error');
      setErrorMsg("Please fill in all BigQuery fields before testing.");
      return;
    }
    setTestingConn(true);
    setErrorMsg('');
    try {
      const success = await testBigQueryConnection(
        bqConfig.projectId,
        bqConfig.datasetId,
        bqConfig.tableId,
        bqConfig.accessToken
      );
      setConnStatus(success ? 'success' : 'error');
      if (!success) setErrorMsg("Connection failed. Check your token or table existence.");
    } catch (err: any) {
      setConnStatus('error');
      setErrorMsg(err.message || "Failed to connect to BigQuery.");
    } finally {
      setTestingConn(false);
    }
  };

  const sections = [
    { id: 'SALES', title: 'Sales Transactions', desc: 'date, sku, quantity, price' },
    { id: 'ITEM', title: 'Item Master', desc: 'sku, category, brand, unitCost' },
    { id: 'PROMO', title: 'Promotion Calendar', desc: 'sku, startDate, endDate, discountPercent' },
  ];

  return (
    <div className="space-y-12">
      <div>
        <h2 className="text-2xl font-bold mb-2">Data Center</h2>
        <p className="text-slate-500">Configure your data pipeline using local files or cloud warehouses.</p>
      </div>

      <section>
        <div className="flex items-center gap-2 mb-6">
          <FileText className="text-blue-500" size={20} />
          <h3 className="font-bold text-slate-800">Local Files (Historical Data)</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {sections.map((section) => (
            <div key={section.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-slate-800">{section.title}</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{section.desc}</p>
              </div>

              <div className="flex-1 flex flex-col justify-center items-center border-2 border-dashed border-slate-200 rounded-xl p-8 hover:border-blue-400 transition-colors group cursor-pointer relative">
                <input 
                  type="file" 
                  accept=".csv"
                  className="absolute inset-0 opacity-0 cursor-pointer" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(section.id as any, file);
                  }}
                />
                {parsing[section.id] ? (
                  <div className="flex flex-col items-center">
                    <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-2" />
                    <span className="text-sm font-medium text-slate-500">Parsing...</span>
                  </div>
                ) : files[section.id] ? (
                  <div className="flex flex-col items-center text-center">
                    <FileText className="w-8 h-8 text-blue-500 mb-2" />
                    <span className="text-sm font-bold text-slate-700 truncate max-w-[150px]">{files[section.id]}</span>
                    <button onClick={(e) => { e.stopPropagation(); setFiles(prev => ({ ...prev, [section.id]: null })); onDataLoaded(section.id as any, []); }} className="mt-4 text-red-500 hover:text-red-700 text-xs font-bold flex items-center gap-1 bg-red-50 px-3 py-1.5 rounded-lg">
                      <Trash2 size={14} /> Remove
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-10 h-10 text-slate-300 group-hover:text-blue-500 mb-2 transition-colors" />
                    <span className="text-sm text-slate-400 font-medium">Click to upload CSV</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-900 rounded-3xl p-8 text-white shadow-xl">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500 p-2 rounded-xl">
              <Database size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold">Google BigQuery Connector</h3>
              <p className="text-slate-400 text-sm">Fetch ML results directly from your warehouse.</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {connStatus === 'success' && <span className="text-green-400 text-xs font-bold flex items-center gap-1 bg-green-400/10 px-3 py-1.5 rounded-full border border-green-400/20"><CheckCircle size={14} /> Connected</span>}
            {connStatus === 'error' && <span className="text-red-400 text-xs font-bold flex items-center gap-1 bg-red-400/10 px-3 py-1.5 rounded-full border border-red-400/20"><AlertCircle size={14} /> Error</span>}
            <button 
              onClick={handleTestConnection}
              disabled={testingConn}
              className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 border border-white/10 disabled:opacity-50"
            >
              {testingConn ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
              Test Connection
            </button>
            <label className="flex items-center cursor-pointer ml-4 border-l border-white/10 pl-4">
              <div className="mr-3 text-sm font-bold text-slate-400">Pipeline Enabled</div>
              <div className="relative">
                <input 
                  type="checkbox" 
                  className="sr-only" 
                  checked={bqConfig.enabled}
                  onChange={(e) => setBqConfig({ ...bqConfig, enabled: e.target.checked })}
                />
                <div className={`block w-14 h-8 rounded-full transition-colors ${bqConfig.enabled ? 'bg-blue-500' : 'bg-slate-700'}`}></div>
                <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${bqConfig.enabled ? 'translate-x-6' : ''}`}></div>
              </div>
            </label>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm flex items-center gap-3">
            <AlertCircle size={18} />
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Globe size={12} /> Project ID
            </label>
            <input 
              type="text" 
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-all text-white"
              placeholder="my-gcp-project"
              value={bqConfig.projectId}
              onChange={(e) => setBqConfig({ ...bqConfig, projectId: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Database size={12} /> Dataset ID
            </label>
            <input 
              type="text" 
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-all text-white"
              placeholder="demand_planning"
              value={bqConfig.datasetId}
              onChange={(e) => setBqConfig({ ...bqConfig, datasetId: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <FileText size={12} /> Table ID
            </label>
            <input 
              type="text" 
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-all text-white"
              placeholder="ml_forecasts"
              value={bqConfig.tableId}
              onChange={(e) => setBqConfig({ ...bqConfig, tableId: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Key size={12} /> Access Token
            </label>
            <input 
              type="password" 
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-all text-white"
              placeholder="ya29.a0AfH6S..."
              value={bqConfig.accessToken}
              onChange={(e) => setBqConfig({ ...bqConfig, accessToken: e.target.value })}
            />
          </div>
        </div>

        <div className="mt-8 p-4 bg-slate-800/50 border border-slate-700 rounded-2xl flex items-center gap-4">
          <div className="bg-yellow-500/20 text-yellow-500 p-2 rounded-lg">
            <CheckCircle size={18} />
          </div>
          <p className="text-xs text-slate-400">
            <strong>Pro Tip:</strong> Ensure your BigQuery table has a <code className="bg-slate-700 px-1 py-0.5 rounded text-slate-200">date</code> column and numeric columns for your models (e.g., <code className="bg-slate-700 px-1 py-0.5 rounded text-slate-200">xgboost</code>).
          </p>
        </div>
      </section>
    </div>
  );
};

export default DataUpload;
