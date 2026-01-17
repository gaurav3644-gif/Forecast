
import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, Trash2, Loader2 } from 'lucide-react';

interface DataUploadProps {
  onDataLoaded: (type: 'SALES' | 'ITEM' | 'PROMO', data: any[]) => void;
}

const DataUpload: React.FC<DataUploadProps> = ({ onDataLoaded }) => {
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

  const parseCSV = (text: string, type: 'SALES' | 'ITEM' | 'PROMO') => {
    const lines = text.split('\n').filter(line => line.trim() !== '');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const data = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      const obj: any = {};
      
      headers.forEach((header, index) => {
        let val: any = values[index];
        // Type conversion based on expected fields
        if (['quantity', 'price', 'unitcost', 'discountpercent'].includes(header)) {
          val = parseFloat(val) || 0;
        }
        obj[header] = val;
      });

      // Map back to our camelCase interface keys if necessary
      if (type === 'SALES') {
        return {
          date: obj.date,
          sku: obj.sku,
          quantity: obj.quantity,
          price: obj.price
        };
      } else if (type === 'ITEM') {
        return {
          sku: obj.sku,
          category: obj.category,
          brand: obj.brand,
          unitCost: obj.unitcost
        };
      } else if (type === 'PROMO') {
        return {
          sku: obj.sku,
          startDate: obj.startdate || obj.date,
          endDate: obj.enddate || obj.date,
          discountPercent: obj.discountpercent
        };
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

    reader.onerror = () => {
      setParsing(prev => ({ ...prev, [type]: false }));
      alert("Failed to read file");
    };

    reader.readAsText(file);
  };

  const removeFile = (type: 'SALES' | 'ITEM' | 'PROMO') => {
    setFiles(prev => ({ ...prev, [type]: null }));
    onDataLoaded(type, []); // Clear data
  };

  const sections = [
    { id: 'SALES', title: 'Sales Transactions', desc: 'Columns: date, sku, quantity, price' },
    { id: 'ITEM', title: 'Item Master', desc: 'Columns: sku, category, brand, unitCost' },
    { id: 'PROMO', title: 'Promotion Calendar', desc: 'Columns: sku, startDate, endDate, discountPercent' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-2">Data Center</h2>
        <p className="text-slate-500">Upload CSV files to replace mock data with your actual enterprise records.</p>
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
                  <span className="text-sm font-medium text-slate-500">Parsing CSV...</span>
                </div>
              ) : files[section.id] ? (
                <div className="flex flex-col items-center text-center">
                  <div className="bg-blue-50 p-3 rounded-full mb-2">
                    <FileText className="w-8 h-8 text-blue-500" />
                  </div>
                  <span className="text-sm font-bold text-slate-700 truncate max-w-[150px]">{files[section.id]}</span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); removeFile(section.id as any); }}
                    className="mt-4 text-red-500 hover:text-red-700 text-xs font-bold flex items-center gap-1 bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Trash2 size={14} /> Remove
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="w-10 h-10 text-slate-300 group-hover:text-blue-500 mb-2 transition-colors" />
                  <span className="text-sm text-slate-400 group-hover:text-blue-600 font-medium">Click to upload CSV</span>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl flex items-start gap-4 shadow-sm">
        <div className="bg-blue-500 p-2 rounded-lg text-white shadow-md">
          <CheckCircle size={20} />
        </div>
        <div>
          <h4 className="font-bold text-blue-900">ETL Pipeline Connected</h4>
          <p className="text-blue-700/80 text-sm mt-1 leading-relaxed">
            The system maps your CSV columns to the ML engine automatically. For best results, ensure your Date column uses the format <code className="bg-blue-100 px-1 rounded">YYYY-MM-DD</code>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DataUpload;
