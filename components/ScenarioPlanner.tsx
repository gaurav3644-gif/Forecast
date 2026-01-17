
import React from 'react';
import { DriverSetting } from '../types';
import { Sliders, RefreshCw, Info } from 'lucide-react';

interface ScenarioPlannerProps {
  drivers: DriverSetting[];
  onDriverChange: (id: string, value: number) => void;
  onReset: () => void;
}

const ScenarioPlanner: React.FC<ScenarioPlannerProps> = ({ drivers, onDriverChange, onReset }) => {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold mb-2">Scenario Planner</h2>
          <p className="text-slate-500">Fine-tune your demand drivers to see how they impact the AI models in real-time.</p>
        </div>
        <button 
          onClick={onReset}
          className="text-slate-500 hover:text-slate-800 flex items-center gap-2 font-medium"
        >
          <RefreshCw size={18} /> Reset Defaults
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-8">
            <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
              <Sliders className="text-blue-500" /> Control Knobs
            </h3>
            
            {drivers.map((driver) => (
              <div key={driver.id} className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    {driver.name}
                    <div className="group relative">
                      <Info size={14} className="text-slate-300 cursor-help" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        {driver.description}
                      </div>
                    </div>
                  </label>
                  <span className="text-sm font-bold bg-blue-50 text-blue-600 px-2 py-1 rounded">
                    {driver.value > 0 ? '+' : ''}{driver.value}%
                  </span>
                </div>
                <input 
                  type="range"
                  min={driver.min}
                  max={driver.max}
                  step={driver.step}
                  value={driver.value}
                  onChange={(e) => onDriverChange(driver.id, parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                  <span>Conservative</span>
                  <span>Optimistic</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Simulation Summary</h3>
          <div className="flex-1 flex flex-col justify-center items-center text-center p-10 space-y-4">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
              <Sliders size={32} />
            </div>
            <p className="text-slate-500 max-w-xs italic">
              "By increasing promotion intensity by 15%, the XGBoost model anticipates a significant inventory risk in Q3."
            </p>
            <div className="pt-6 grid grid-cols-2 gap-4 w-full">
              <div className="bg-white p-4 rounded-2xl border border-slate-200">
                <div className="text-xs text-slate-400 uppercase font-bold">Rev Impact</div>
                <div className="text-lg font-bold text-green-600">+$240k</div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200">
                <div className="text-xs text-slate-400 uppercase font-bold">Vol Impact</div>
                <div className="text-lg font-bold text-blue-600">+12.4%</div>
              </div>
            </div>
          </div>
          <p className="mt-8 text-xs text-slate-400 text-center">Changes applied here are reflected immediately in the ML Forecasting tab.</p>
        </div>
      </div>
    </div>
  );
};

export default ScenarioPlanner;
