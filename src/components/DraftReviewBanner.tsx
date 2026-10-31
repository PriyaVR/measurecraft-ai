import React from 'react';
import { AlertCircle, ShieldAlert, CheckCircle2 } from 'lucide-react';

export const DraftReviewBanner: React.FC = () => {
  return (
    <div className="bg-amber-50/90 border border-amber-200/90 rounded-xl p-4 shadow-xs">
      <div className="flex items-start gap-3">
        <div className="p-1 rounded-md bg-amber-100 text-amber-800 shrink-0 mt-0.5">
          <AlertCircle className="w-5 h-5" />
        </div>
        <div className="text-xs sm:text-sm text-amber-900 leading-relaxed">
          <span className="font-semibold block text-amber-950 mb-0.5">
            Draft for Team Review
          </span>
          This measurement plan is an initial blueprint. Review this draft with your engineering,
          analytics, and marketing stakeholders to align on parameter names, dataLayer variables, and
          privacy compliance before implementing in Google Tag Manager or production code.
        </div>
      </div>
    </div>
  );
};

export const PrivacyNoteBanner: React.FC = () => {
  return (
    <div className="bg-sky-50/70 border border-sky-100 rounded-lg p-3 text-xs text-slate-600 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <ShieldAlert className="w-4 h-4 text-sky-600 shrink-0" />
        <span>
          <strong className="text-slate-800 font-semibold">Privacy Notice:</strong> Do not enter
          personal information (PII), confidential client names, or sensitive passwords. We do not
          store personal data.
        </span>
      </div>
      <div className="hidden sm:flex items-center gap-1 text-slate-500 text-[11px] shrink-0">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
        <span>Plain aggregate metrics only</span>
      </div>
    </div>
  );
};
