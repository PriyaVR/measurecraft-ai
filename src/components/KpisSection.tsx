import React from 'react';
import { Target, HelpCircle, TrendingUp, Calculator } from 'lucide-react';
import { KPIItem } from '../types';

interface KpisSectionProps {
  kpis: KPIItem[];
}

export const KpisSection: React.FC<KpisSectionProps> = ({ kpis }) => {
  const safeKpis = Array.isArray(kpis) ? kpis : [];

  const getTypeBadgeClass = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'macro-conversion':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'micro-conversion':
        return 'bg-sky-100 text-sky-800 border-sky-200';
      case 'engagement':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'retention':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-sky-100 shadow-xs p-5 sm:p-7">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-sm">
            1
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>Section 1: Key Performance Indicators (KPIs)</span>
            </h2>
            <p className="text-xs text-slate-500">
              Clear success metrics defined conceptually without arbitrary target benchmarks.
            </p>
          </div>
        </div>
        <span className="text-xs font-medium text-slate-500 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200 self-start sm:self-auto">
          {safeKpis.length} {safeKpis.length === 1 ? 'KPI' : 'KPIs'} Recommended
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {safeKpis.map((kpi, idx) => (
          <div
            key={kpi.id || idx}
            className="flex flex-col justify-between p-4 sm:p-5 rounded-xl border border-slate-200 bg-slate-50/40 hover:bg-white hover:border-sky-300 hover:shadow-xs transition-all"
          >
            <div>
              <div className="flex flex-wrap items-center gap-1.5 mb-2">
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border uppercase tracking-wider ${getTypeBadgeClass(
                    kpi.type
                  )}`}
                >
                  {kpi.type || 'Key Metric'}
                </span>
                {kpi.pillar && (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    {kpi.pillar}
                  </span>
                )}
                <span className="text-[11px] font-medium text-slate-400 ml-auto">KPI #{idx + 1}</span>
              </div>

              <h3 className="text-base font-bold text-slate-900 tracking-tight mb-2">
                {kpi.name}
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="font-semibold text-slate-700 flex items-center gap-1 mb-0.5">
                    <Target className="w-3.5 h-3.5 text-sky-600" />
                    <span>Short Definition</span>
                  </span>
                  <p className="text-slate-600 leading-relaxed bg-white p-2.5 rounded-lg border border-slate-200/70">
                    {kpi.shortDefinition}
                  </p>
                </div>

                <div>
                  <span className="font-semibold text-slate-700 flex items-center gap-1 mb-0.5">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Why It Matters</span>
                  </span>
                  <p className="text-slate-600 leading-relaxed bg-white p-2.5 rounded-lg border border-slate-200/70">
                    {kpi.whyItMatters}
                  </p>
                </div>
              </div>
            </div>

            {kpi.measurementFormula && (
              <div className="mt-4 pt-3 border-t border-slate-200/70">
                <span className="text-[11px] font-semibold text-slate-600 flex items-center gap-1 mb-1">
                  <Calculator className="w-3 h-3 text-slate-500" />
                  <span>Calculation Logic</span>
                </span>
                <code className="text-[11px] block font-mono text-slate-700 bg-slate-100 px-2 py-1.5 rounded-md border border-slate-200 break-words">
                  {kpi.measurementFormula}
                </code>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
