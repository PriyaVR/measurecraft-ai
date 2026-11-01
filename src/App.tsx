/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Header } from './components/Header';
import { DraftReviewBanner } from './components/DraftReviewBanner';
import { GoalInputForm } from './components/GoalInputForm';
import { ClarificationPanel } from './components/ClarificationPanel';
import { KpisSection } from './components/KpisSection';
import { EventsSection } from './components/EventsSection';
import { TrackingPlanTable } from './components/TrackingPlanTable';
import { GovernanceTips } from './components/GovernanceTips';
import { ConsultantGuideModal } from './components/ConsultantGuideModal';
import {
  MeasurementPlan,
  PlanApiResponse,
  ClarificationQuestion,
  DefinitionData,
} from './types';
import {
  generateMeasurementPlan,
} from './services/measurementPlanService';
import {
  checkGoalScope,
  checkGoalClarity,
  classifyGoalIntent,
  OUT_OF_SCOPE_MESSAGE,
  DEFAULT_CLARIFYING_QUESTIONS,
} from './utils/goalValidator';
import {
  extractDefinitionQuery,
  getMetricDefinition,
} from './utils/metricDefinitions';
import {
  Sparkles,
  Layers,
  Smartphone,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  BookOpen,
  Target,
  ArrowRight,
} from 'lucide-react';

export default function App() {
  const [businessGoal, setBusinessGoal] = useState('');
  const [industry, setIndustry] = useState('Any');
  const [platform, setPlatform] = useState('Both (Web & Mobile)');
  const [analyticsTool, setAnalyticsTool] = useState('Google Analytics 4 (GA4)');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Intent & Scope error state (for UI/UX, CSS, front-end development, non-analytical queries)
  const [outOfScopeError, setOutOfScopeError] = useState<string | null>(null);

  // Definition Question state (e.g. "What is bounce rate?")
  const [definitionData, setDefinitionData] = useState<DefinitionData | null>(null);

  // Clarification state
  const [isVague, setIsVague] = useState(false);
  const [clarificationQuestions, setClarificationQuestions] = useState<ClarificationQuestion[]>([]);
  const [clarificationMessage, setClarificationMessage] = useState<string>('');

  // Generated Plan
  const [plan, setPlan] = useState<MeasurementPlan | null>(null);

  // Guide modal
  const [showGuide, setShowGuide] = useState(false);

  const resultsRef = useRef<HTMLDivElement>(null);
  const clarificationRef = useRef<HTMLDivElement>(null);

  const fetchPlan = async (
    clarifications: Record<string, string> = {}
  ) => {
    if (!businessGoal.trim()) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const data: PlanApiResponse = await generateMeasurementPlan({
        businessGoal: businessGoal.trim(),
        industry,
        platform,
        analyticsTool,
        clarifications,
      });

      if (data.isDefinition && data.definition) {
        setPlan(null);
        setIsVague(false);
        setOutOfScopeError(null);
        setClarificationQuestions([]);
        setDefinitionData(data.definition);
        return;
      }

      if (data.isOutOfScope) {
        setPlan(null);
        setDefinitionData(null);
        setIsVague(false);
        setClarificationQuestions([]);
        setOutOfScopeError(data.outOfScopeError || OUT_OF_SCOPE_MESSAGE);
        return;
      }

      if (data.isVague && data.clarificationQuestions && data.clarificationQuestions.length > 0) {
        // STRICT: Never keep or render plan sections if vague!
        setPlan(null);
        setDefinitionData(null);
        setOutOfScopeError(null);
        setIsVague(true);
        setClarificationQuestions(data.clarificationQuestions);
        setClarificationMessage(
          data.clarificationMessage ||
            "A specific, measurable metric is required. The provided business goal is underspecified. Please provide a clear definition of success (such as 'increase conversions' or 'reduce bounce rate on checkout') or answer the 3 clarifying questions below."
        );
        setTimeout(() => {
          clarificationRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else if (data.plan) {
        setDefinitionData(null);
        setOutOfScopeError(null);
        setIsVague(false);
        setPlan(data.plan);
        setTimeout(() => {
          resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 150);
      } else {
        throw new Error(data.error || 'No measurement plan received. Please try again.');
      }
    } catch (err: any) {
      console.error('Plan generation failed:', err);
      setErrorMessage(
        err.message || 'An unexpected error occurred while communicating with the analytics engine.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleInitialSubmit = () => {
    // 1. Intent Classification Check:
    // Evaluate the user's input goal against four strict categories:
    // - Type A (Valid Goal): Actionable tracking/business objectives -> Proceed to generate full plan.
    // - Type B (Vague/Broad Goal): Underspecified inputs -> Halt generation and output 3 clarifying questions.
    // - Type C (Informational Question): Asking for metrics definitions -> Provide 2-sentence definition and prompt to turn into goal.
    // - Type D (Completely Out-of-Scope): Coding, UI/UX design, or high-stakes business strategy -> Refusal banner.
    const classification = classifyGoalIntent(businessGoal);

    // Type D: Completely Out-of-Scope (Coding, UI/UX, or high-stakes business strategy)
    if (classification.category === 'TYPE_D_OUT_OF_SCOPE') {
      setPlan(null);
      setDefinitionData(null);
      setIsVague(false);
      setClarificationQuestions([]);
      setErrorMessage(null);
      setOutOfScopeError(classification.outOfScopeReason || OUT_OF_SCOPE_MESSAGE);
      return;
    }

    // Type C: Informational Question (Asking for metrics definitions)
    if (classification.category === 'TYPE_C_INFORMATIONAL_QUESTION') {
      const localDef = getMetricDefinition(businessGoal);
      setPlan(null);
      setIsVague(false);
      setOutOfScopeError(null);
      setClarificationQuestions([]);
      if (localDef) {
        setDefinitionData(localDef);
      }
      fetchPlan({});
      return;
    }

    // Type B: Vague/Broad Goal (Underspecified inputs like 'make the site better', 'grow my business')
    if (classification.category === 'TYPE_B_VAGUE_GOAL') {
      setPlan(null);
      setDefinitionData(null);
      setOutOfScopeError(null);
      setIsVague(true);
      setClarificationQuestions(classification.questions || DEFAULT_CLARIFYING_QUESTIONS);
      setClarificationMessage(
        classification.clarificationMessage ||
          "A specific, measurable metric is required. The provided business goal is underspecified. Please provide a clear definition of success (such as 'increase conversions' or 'reduce bounce rate on checkout') or answer the 3 clarifying questions below."
      );
      setTimeout(() => {
        clarificationRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      return;
    }

    // Type A: Valid Goal (Actionable tracking/business objectives e.g., 'increase signups', 'reduce checkout drop-off', 'track blog reads')
    // Proceed to generate full plan!
    setDefinitionData(null);
    setOutOfScopeError(null);
    setPlan(null);
    setIsVague(false);
    fetchPlan({});
  };

  const handleSelectSuggestedGoal = async (suggestedGoal: string) => {
    setBusinessGoal(suggestedGoal);
    setDefinitionData(null);
    setOutOfScopeError(null);
    setIsVague(false);
    setPlan(null);
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const data: PlanApiResponse = await generateMeasurementPlan({
        businessGoal: suggestedGoal.trim(),
        industry,
        platform,
        analyticsTool,
      });

      if (data.plan) {
        setPlan(data.plan);
        setTimeout(() => {
          resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 150);
      } else if (data.isVague) {
        setIsVague(true);
        setClarificationQuestions(data.clarificationQuestions || DEFAULT_CLARIFYING_QUESTIONS);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to generate plan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProceedWithClarifications = (answers: Record<string, string>) => {
    setOutOfScopeError(null);
    setDefinitionData(null);
    fetchPlan(answers);
  };

  const handleReset = () => {
    setBusinessGoal('');
    setDefinitionData(null);
    setOutOfScopeError(null);
    setPlan(null);
    setIsVague(false);
    setClarificationQuestions([]);
    setErrorMessage(null);

    setTimeout(() => {
      const el = document.getElementById('business-goal');
      if (el) {
        el.focus();
      }
    }, 50);
  };

  /**
   * Strictly renders the measurement plan.
   * Invoked ONLY when a valid analytics tracking goal is provided (neither out-of-scope, definition, nor vague).
   */
  const renderPlan = () => {
    if (outOfScopeError || isVague || definitionData || !plan) {
      return null;
    }

    const safeKpis = Array.isArray(plan.kpis) ? plan.kpis : [];
    const safeEvents = Array.isArray(plan.events) ? plan.events : [];
    const safeTable = Array.isArray(plan.trackingPlanTable) ? plan.trackingPlanTable : [];

    return (
      <div ref={resultsRef} className="space-y-6 pt-2">
        {/* Draft Review Banner */}
        <DraftReviewBanner />

        {/* Plan Context Meta Bar */}
        <div className="bg-white rounded-xl border border-sky-100 p-4 shadow-2xs flex flex-col gap-3 text-xs text-slate-600">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-slate-900">Plan Context:</span>
              <span className="bg-sky-50 text-sky-900 border border-sky-200 px-2.5 py-0.5 rounded-full font-medium">
                {plan.industry || 'Multi-industry'}
              </span>
              <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-0.5 rounded-full">
                {plan.platform || 'Web & Mobile'}
              </span>
              <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-0.5 rounded-full font-mono">
                {plan.analyticsTool || 'GA4'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Total Scope:</span>
              <span className="font-semibold text-slate-800">
                {safeKpis.length} KPIs · {safeEvents.length} Events
              </span>
            </div>
          </div>

          {/* Detected Pillars Multi-Objective Coverage */}
          {Array.isArray(plan.detectedPillars) && plan.detectedPillars.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 text-xs">
              <span className="text-slate-500 font-semibold">Pillars Addressed:</span>
              {plan.detectedPillars.map((p, pIdx) => (
                <span
                  key={pIdx}
                  className="bg-indigo-50 text-indigo-700 border border-indigo-200/80 px-2 py-0.5 rounded-md font-medium text-[11px]"
                >
                  {p}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Consultant Summary */}
        {plan.summary && (
          <div className="bg-sky-50/50 rounded-xl border border-sky-100 p-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
            <span className="font-semibold text-sky-950 block mb-1">
              Executive Measurement Objective:
            </span>
            {plan.summary}
          </div>
        )}

        {/* Section 1: KPIs */}
        <KpisSection kpis={safeKpis} />

        {/* Section 2: Events to Track */}
        <EventsSection events={safeEvents} />

        {/* Section 3: Tracking Plan Table */}
        <TrackingPlanTable
          rows={safeTable}
          businessGoal={plan.businessGoal || businessGoal}
        />

        {/* Section 4: Implementation Governance Checklist */}
        <GovernanceTips
          tips={plan.governanceTips}
          analyticsTool={plan.analyticsTool || analyticsTool}
        />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-800 font-sans antialiased flex flex-col selection:bg-sky-100 selection:text-sky-900">
      <Header onShowGuide={() => setShowGuide(true)} />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Intro Hero Box */}
        <div className="bg-gradient-to-r from-sky-900 via-blue-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-sky-400/10 to-transparent pointer-events-none" />
          <div className="max-w-2xl relative z-10 space-y-2.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-sky-200 text-xs font-medium backdrop-blur-xs border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-sky-300" />
              <span>Digital Analytics Architecture</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Turn Business Goals Into a Draft Measurement Plan
            </h1>
            <p className="text-sm text-sky-100/90 leading-relaxed">
              Designed for marketers, product owners, and junior analysts. Define what success looks
              like, uncover key friction points, and output concrete snake_case tracking
              specifications without guesswork or invented numbers.
            </p>
          </div>
        </div>

        {/* Input Form */}
        <GoalInputForm
          businessGoal={businessGoal}
          setBusinessGoal={setBusinessGoal}
          industry={industry}
          setIndustry={setIndustry}
          platform={platform}
          setPlatform={setPlatform}
          analyticsTool={analyticsTool}
          setAnalyticsTool={setAnalyticsTool}
          onSubmit={handleInitialSubmit}
          isLoading={isLoading}
          onReset={handleReset}
          hasExistingPlan={
            !!plan || isVague || !!outOfScopeError || !!definitionData || !!businessGoal.trim()
          }
        />

        {/* Definition Question Explanation & Suggested Goals Card */}
        {definitionData && (
          <div
            role="region"
            aria-label="Metric Definition and Suggested Goals"
            className="bg-white rounded-2xl border-2 border-sky-200 p-6 sm:p-7 shadow-xs space-y-5 animate-fadeIn"
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center font-bold">
                  <BookOpen className="w-5 h-5 text-sky-700" />
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-sky-700">
                    Analytics Metric Concept
                  </span>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                    {definitionData.metricName}
                  </h2>
                </div>
              </div>
              <span className="text-[11px] font-medium bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full border border-slate-200">
                Definition Guide
              </span>
            </div>

            <div className="text-slate-700 text-xs sm:text-sm leading-relaxed bg-sky-50/60 rounded-xl p-4 border border-sky-100 space-y-2">
              <p>{definitionData.explanation}</p>
              {definitionData.calculationFormula && (
                <div className="pt-2 border-t border-sky-200/60 flex flex-wrap items-center gap-2 text-xs text-sky-900 font-mono">
                  <span className="font-sans font-semibold text-sky-950">Calculation Formula:</span>
                  <span>{definitionData.calculationFormula}</span>
                </div>
              )}
            </div>

            {definitionData.promptToTurnIntoGoal && (
              <div className="bg-sky-50 border border-sky-200 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-sky-950 font-medium">
                <Target className="w-4 h-4 text-sky-700 shrink-0 mt-0.5" />
                <span>{definitionData.promptToTurnIntoGoal}</span>
              </div>
            )}

            {definitionData.suggestedGoals && definitionData.suggestedGoals.length > 0 && (
              <div className="space-y-3 pt-1">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-sky-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Suggested Tracking Goals to Plan For:
                  </h3>
                </div>
                <p className="text-xs text-slate-500">
                  Select a suggested business objective below to build a dedicated behavioral measurement plan:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {definitionData.suggestedGoals.map((sGoal, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectSuggestedGoal(sGoal)}
                      className="text-left p-3.5 rounded-xl border border-sky-200 bg-white hover:bg-sky-50 hover:border-sky-300 transition-all group flex flex-col justify-between gap-2 shadow-2xs cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-800 group-hover:text-sky-900 leading-snug">
                          {sGoal}
                        </span>
                        <ArrowRight className="w-4 h-4 text-sky-500 group-hover:translate-x-0.5 transition-transform shrink-0 mt-0.5" />
                      </div>
                      <span className="text-[11px] text-sky-600 font-medium">
                        Plan this tracking goal &rarr;
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Out-of-Scope Error Banner (Strict Intent & Scope Check for UI/UX / Front-End / Non-Analytics) */}
        {outOfScopeError && (
          <div
            role="alert"
            className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 text-amber-950 shadow-xs flex items-start gap-3.5"
          >
            <div className="p-2 bg-amber-100 rounded-xl text-amber-700 shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5 text-amber-700" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-amber-900 tracking-tight">
                Invalid Analytics Goal
              </h3>
              <p className="text-xs sm:text-sm text-amber-900 leading-relaxed font-medium">
                {outOfScopeError}
              </p>
            </div>
          </div>
        )}

        {/* Error notification if any general API error occurs */}
        {errorMessage && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-xs text-rose-800 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block">Generation Error</span>
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        {/* Clarification Questions Panel (if goal is vague) */}
        {isVague && clarificationQuestions.length > 0 && (
          <div ref={clarificationRef}>
            <ClarificationPanel
              questions={clarificationQuestions}
              clarificationMessage={clarificationMessage}
              originalGoal={businessGoal}
              onProceedWithClarifications={handleProceedWithClarifications}
              isLoading={isLoading}
              onEditGoalFocus={() => {
                const el = document.getElementById('business-goal');
                el?.focus();
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
            />
          </div>
        )}

        {/* Generated Plan Output: Ensure renderPlan() is only invoked when a valid analytics tracking goal is provided */}
        {renderPlan()}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white mt-12 py-6 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            MeasureCraft · Digital Analytics Consulting System. Draft plans are advisory and must be
            reviewed before implementation.
          </p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>No personal or client data collected</span>
            <span>·</span>
            <span>snake_case standards</span>
          </div>
        </div>
      </footer>

      {/* Consultant Guide Modal */}
      <ConsultantGuideModal isOpen={showGuide} onClose={() => setShowGuide(false)} />
    </div>
  );
}
