import React from 'react';
import { Compass, ShieldCheck, Info } from 'lucide-react';

interface HeaderProps {
  onShowGuide: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onShowGuide }) => {
  return (
    <header className="border-b border-sky-100 bg-white sticky top-0 z-30 shadow-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-700 flex items-center justify-center text-white shadow-sm ring-2 ring-sky-100">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-none">
                MeasureCraft
              </h1>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                Draft Planner
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 hidden sm:block">
              Digital Analytics Measurement Architecture for Marketers & Product Teams
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onShowGuide}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 hover:text-slate-900 rounded-lg border border-slate-200 transition-colors cursor-pointer"
            title="Read guidance on writing effective business goals"
          >
            <Info className="w-3.5 h-3.5 text-sky-600" />
            <span className="hidden sm:inline">Consultant Guide</span>
          </button>

          <div className="hidden md:flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Zero PII Policy</span>
          </div>
        </div>
      </div>
    </header>
  );
};
