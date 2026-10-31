import React, { useState } from 'react';
import { Sparkles, ArrowRight, Layers, Smartphone, BarChart3, HelpCircle, RotateCcw, X } from 'lucide-react';
import { PrivacyNoteBanner } from './DraftReviewBanner';

interface GoalInputFormProps {
  businessGoal: string;
  setBusinessGoal: (val: string) => void;
  industry: string;
  setIndustry: (val: string) => void;
  platform: string;
  setPlatform: (val: string) => void;
  analyticsTool: string;
  setAnalyticsTool: (val: string) => void;
  onSubmit: (e?: React.FormEvent) => void;
  isLoading: boolean;
  onReset: () => void;
  hasExistingPlan: boolean;
}

const SAMPLE_GOALS = [
  {
    label: 'E-commerce Checkout',
    goal: 'Reduce checkout drop-off and improve order completion on mobile checkout',
    industry: 'E-commerce & Retail',
    platform: 'Mobile App',
    tool: 'Google Analytics 4 (GA4)',
  },
  {
    label: 'B2B SaaS Free Trial',
    goal: 'Increase trial-to-paid conversion by tracking user onboarding and core feature adoption',
    industry: 'B2B SaaS / Software',
    platform: 'Web only',
    tool: 'Google Analytics 4 (GA4)',
  },
  {
    label: 'Lead Generation',
    goal: 'Increase qualified sales demo submissions and track multi-step form drop-off',
    industry: 'Lead Generation / Services',
    platform: 'Web only',
    tool: 'Adobe Analytics',
  },
  {
    label: 'Publishing & Media',
    goal: 'Increase reader retention, article scroll depth, and paid newsletter subscriptions',
    industry: 'Media & Publishing',
    platform: 'Both (Web & Mobile)',
    tool: 'Google Analytics 4 (GA4)',
  },
  {
    label: 'Fintech Account Opening',
    goal: 'Streamline customer identity verification and first funding deposit',
    industry: 'Financial Services / Fintech',
    platform: 'Both (Web & Mobile)',
    tool: 'Other (Mixpanel / PostHog)',
  },
];

export const GoalInputForm: React.FC<GoalInputFormProps> = ({
  businessGoal,
  setBusinessGoal,
  industry,
  setIndustry,
  platform,
  setPlatform,
  analyticsTool,
  setAnalyticsTool,
  onSubmit,
  isLoading,
  onReset,
  hasExistingPlan,
}) => {
  const [showPresets, setShowPresets] = useState(false);

  const handlePresetSelect = (preset: (typeof SAMPLE_GOALS)[0]) => {
    setBusinessGoal(preset.goal);
    setIndustry(preset.industry);
    setPlatform(preset.platform);
    setAnalyticsTool(preset.tool);
    setShowPresets(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessGoal.trim() || isLoading) return;
    onSubmit();
  };

  return (
    <div className="bg-white rounded-2xl border border-sky-100 shadow-sm p-5 sm:p-7">
      <div className="mb-4">
        <PrivacyNoteBanner />
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label
              htmlFor="business-goal"
              className="text-sm font-semibold text-slate-800 flex items-center gap-1.5"
            >
              <span>What is your primary business goal?</span>
              <span className="text-rose-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => setShowPresets(!showPresets)}
              className="text-xs font-medium text-sky-700 hover:text-sky-800 flex items-center gap-1 bg-sky-50 px-2 py-1 rounded-md border border-sky-200/70 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-sky-600" />
              <span>{showPresets ? 'Hide examples' : 'Load sample goal'}</span>
            </button>
          </div>

          {showPresets && (
            <div className="mb-3 p-3 bg-sky-50/60 rounded-xl border border-sky-100 space-y-2">
              <p className="text-xs font-semibold text-slate-700">Click an example to populate:</p>
              <div className="flex flex-wrap gap-1.5">
                {SAMPLE_GOALS.map((s) => (
                  <button
                    key={s.label}
                    type="button"
                    onClick={() => handlePresetSelect(s)}
                    className="text-xs text-left px-2.5 py-1.5 rounded-lg bg-white border border-sky-200 text-slate-700 hover:bg-sky-100/60 hover:text-sky-900 transition-colors shadow-2xs"
                  >
                    <span className="font-medium text-sky-800">{s.label}:</span>{' '}
                    <span className="text-slate-600">{s.goal.slice(0, 45)}...</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="relative">
            <textarea
              id="business-goal"
              rows={3}
              value={businessGoal}
              onChange={(e) => setBusinessGoal(e.target.value)}
              placeholder="e.g., Increase our trial-to-paid conversion rate by identifying drop-off points during onboarding, or Reduce shopping cart abandonment during the mobile payment step"
              className={`w-full px-4 py-3 text-sm text-slate-800 placeholder-slate-400 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all resize-y ${
                businessGoal ? 'pr-20' : ''
              }`}
              required
            />
            {businessGoal && (
              <button
                type="button"
                onClick={() => {
                  setBusinessGoal('');
                  document.getElementById('business-goal')?.focus();
                }}
                className="absolute top-2.5 right-2.5 text-[11px] font-medium text-slate-500 hover:text-slate-800 bg-slate-100/90 hover:bg-slate-200 px-2 py-1 rounded-md transition-colors flex items-center gap-1 cursor-pointer border border-slate-200/60"
                title="Clear input text"
                aria-label="Clear input text"
              >
                <X className="w-3 h-3 text-slate-400" />
                <span>Clear</span>
              </button>
            )}
          </div>
          <p className="text-[12px] text-slate-500 mt-1.5 flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            <span>
              Tip: Describe what behavior you want to increase or where users get stuck. If your goal is broad, we'll ask 1–3 quick clarifying questions.
            </span>
          </p>
        </div>

        {/* Optional Dropdowns & Fields */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {/* Industry */}
          <div>
            <label
              htmlFor="industry-select"
              className="block text-xs font-medium text-slate-700 mb-1.5 flex items-center gap-1.5"
            >
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span>Industry</span>
              <span className="text-slate-400 text-[11px] font-normal">(optional)</span>
            </label>
            <select
              id="industry-select"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
            >
              <option value="Any">General / Any Industry</option>
              <option value="E-commerce & Retail">E-commerce & Retail</option>
              <option value="B2B SaaS / Software">B2B SaaS / Software</option>
              <option value="Lead Generation / Services">Lead Generation / Professional Services</option>
              <option value="Financial Services / Fintech">Financial Services / Fintech</option>
              <option value="Healthcare & Wellness">Healthcare & Wellness</option>
              <option value="Media & Publishing">Media & Publishing / Content</option>
              <option value="Education / EdTech">Education / EdTech</option>
              <option value="Travel & Hospitality">Travel & Hospitality</option>
              <option value="Nonprofit & Government">Nonprofit & Social Impact</option>
            </select>
          </div>

          {/* Platform */}
          <div>
            <label
              htmlFor="platform-select"
              className="block text-xs font-medium text-slate-700 mb-1.5 flex items-center gap-1.5"
            >
              <Smartphone className="w-3.5 h-3.5 text-slate-400" />
              <span>Platform</span>
              <span className="text-slate-400 text-[11px] font-normal">(optional)</span>
            </label>
            <select
              id="platform-select"
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
            >
              <option value="Both (Web & Mobile)">Both (Web & Mobile)</option>
              <option value="Web only">Web only</option>
              <option value="Mobile App (iOS/Android)">Mobile App only (iOS / Android)</option>
            </select>
          </div>

          {/* Analytics Tool */}
          <div>
            <label
              htmlFor="tool-select"
              className="block text-xs font-medium text-slate-700 mb-1.5 flex items-center gap-1.5"
            >
              <BarChart3 className="w-3.5 h-3.5 text-slate-400" />
              <span>Analytics Tool</span>
              <span className="text-slate-400 text-[11px] font-normal">(optional)</span>
            </label>
            <select
              id="tool-select"
              value={analyticsTool}
              onChange={(e) => setAnalyticsTool(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
            >
              <option value="Google Analytics 4 (GA4)">Google Analytics 4 (GA4)</option>
              <option value="Adobe Analytics">Adobe Analytics</option>
              <option value="Mixpanel">Mixpanel</option>
              <option value="Amplitude">Amplitude</option>
              <option value="PostHog">PostHog</option>
              <option value="Other / Generic">Other / Custom Tool</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
          <div className="text-xs text-slate-500">
            Strictly snake_case naming · No invented benchmarks · Ready for export
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {hasExistingPlan && (
              <button
                type="button"
                onClick={onReset}
                className="px-3.5 py-2.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Clear input and start fresh"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>Start fresh</span>
              </button>
            )}
            <button
              type="submit"
              disabled={isLoading || !businessGoal.trim()}
              className="w-full sm:w-auto px-6 py-2.5 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white font-medium text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-1 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span>Analyzing goal & drafting plan...</span>
                </>
              ) : (
                <>
                  <span>Generate plan</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
