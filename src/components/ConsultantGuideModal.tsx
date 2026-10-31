import React from 'react';
import { X, BookOpen, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';

interface ConsultantGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConsultantGuideModal: React.FC<ConsultantGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-sky-100 p-6 sm:p-8 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Measurement Planning Guide for Non-Technical Teams
              </h3>
              <p className="text-xs text-slate-500">
                How marketers, product owners, and analysts translate goals into trackable events
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
          <div className="bg-sky-50/70 p-4 rounded-xl border border-sky-100">
            <h4 className="font-bold text-sky-950 mb-1 flex items-center gap-1.5">
              <span>The 3-Step Measurement Framework</span>
            </h4>
            <p className="text-xs text-slate-600">
              Never start by asking "what can we tag?" Start with the business decision you need to make:
            </p>
            <ol className="list-decimal pl-5 mt-2 space-y-1 text-xs text-slate-700 font-medium">
              <li>
                <strong>Business Goal:</strong> The outcome you want to improve (e.g. "Increase checkout conversion on mobile").
              </li>
              <li>
                <strong>KPIs:</strong> The ratio or rate that measures that outcome without guessing arbitrary benchmarks.
              </li>
              <li>
                <strong>Events & Parameters:</strong> The exact user actions that signal progress or friction along that journey.
              </li>
            </ol>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-100">
              <div className="flex items-center gap-1.5 font-bold text-emerald-900 mb-1">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Good Specific Goals</span>
              </div>
              <ul className="space-y-1 text-slate-600">
                <li>• "Increase self-serve trial-to-paid conversion in our SaaS product."</li>
                <li>• "Reduce cart abandonment at the shipping step for mobile users."</li>
                <li>• "Track lead form completion and see which fields cause drop-offs."</li>
              </ul>
            </div>

            <div className="bg-amber-50/60 p-3.5 rounded-xl border border-amber-100">
              <div className="flex items-center gap-1.5 font-bold text-amber-900 mb-1">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Vague Goals (Need Clarification)</span>
              </div>
              <ul className="space-y-1 text-slate-600">
                <li>• "Improve our website." (Which page? What action?)</li>
                <li>• "Track everything." (Creates data bloat and confusion)</li>
                <li>• "Make more sales." (Which funnel step is failing?)</li>
              </ul>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            <h4 className="font-bold text-slate-900">Why No Arbitrary Benchmarks?</h4>
            <p className="text-xs text-slate-600">
              A common trap is assuming a universal target like "10% conversion rate". Every industry,
              product price point, and traffic source is completely different. We define the
              mathematical calculation formula and focus on week-over-week trends rather than made-up target numbers.
            </p>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-medium text-xs rounded-xl shadow-xs transition-colors"
          >
            Got it, take me back
          </button>
        </div>
      </div>
    </div>
  );
};
