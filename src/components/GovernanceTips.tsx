import React from 'react';
import { ShieldCheck, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';

interface GovernanceTipsProps {
  tips?: string[];
  analyticsTool?: string;
}

export const GovernanceTips: React.FC<GovernanceTipsProps> = ({ tips, analyticsTool }) => {
  const defaultTips = [
    'Always use lowercase snake_case for event names (e.g. checkout_started) to avoid event fragmentation in reports.',
    'Strict PII Policy: Never send personally identifiable information (emails, names, phone numbers) in parameters or URLs.',
    'Test in debug mode (e.g. GA4 DebugView or Adobe Experience Platform Debugger) before releasing tags to production.',
    'Maintain a single source of truth: Keep this tracking table updated when developers add or rename features.',
  ];

  const displayTips = tips && tips.length > 0 ? tips : defaultTips;

  return (
    <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 sm:p-6 text-xs text-slate-700">
      <div className="flex items-center gap-2 mb-3">
        <ShieldCheck className="w-4 h-4 text-sky-600" />
        <h3 className="font-bold text-slate-900 text-sm">
          Consultant Implementation & Governance Checklist
        </h3>
        {analyticsTool && (
          <span className="text-[11px] font-medium text-slate-500 ml-auto bg-white px-2 py-0.5 rounded-md border border-slate-200">
            Target Tool: {analyticsTool}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {displayTips.map((tip, idx) => (
          <div
            key={idx}
            className="flex items-start gap-2.5 bg-white p-3 rounded-xl border border-slate-200/80"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span className="text-slate-600 leading-relaxed">{tip}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
