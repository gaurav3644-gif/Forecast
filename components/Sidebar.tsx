
import React from 'react';
import { AppView } from '../types';
import { LayoutDashboard, Upload, TrendingUp, Sliders, Settings, Package } from 'lucide-react';

interface SidebarProps {
  currentView: AppView;
  setView: (view: AppView) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView }) => {
  const navItems = [
    { id: 'DASHBOARD' as AppView, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'UPLOAD' as AppView, label: 'Data Center', icon: Upload },
    { id: 'FORECAST' as AppView, label: 'ML Forecasting', icon: TrendingUp },
    { id: 'SCENARIO' as AppView, label: 'Scenario Planner', icon: Sliders },
  ];

  return (
    <div className="w-64 bg-slate-900 h-screen flex flex-col text-white fixed left-0 top-0 border-r border-slate-800">
      <div className="p-6 flex items-center gap-3">
        <div className="bg-blue-500 p-2 rounded-lg">
          <Package className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold tracking-tight">PredictX</h1>
      </div>

      <nav className="flex-1 mt-6 px-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white transition-colors">
          <Settings size={20} />
          <span className="font-medium">Settings</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
