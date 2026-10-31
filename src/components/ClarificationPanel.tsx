import React, { useState } from 'react';
import { AlertTriangle, Check, ArrowRight, CornerDownRight, Sparkles, HelpCircle } from 'lucide-react';
import { ClarificationQuestion } from '../types';

interface ClarificationPanelProps {
  questions: ClarificationQuestion[];
  clarificationMessage?: string;
  originalGoal: string;
  onProceedWithClarifications: (answers: Record<string, string>) => void;
  isLoading: boolean;
  onEditGoalFocus?: () => void;
}

export const ClarificationPanel: React.FC<ClarificationPanelProps> = ({
  questions,
  clarificationMessage,
  originalGoal,
  onProceedWithClarifications,
  isLoading,
  onEditGoalFocus,
}) => {
  const safeQuestions = Array.isArray(questions) ? questions.slice(0, 3) : [];
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [customInputs, setCustomInputs] = useState<Record<string, string>>({});

  const handleOptionSelect = (qId: string, option: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [qId]: option,
    }));
  };

  const handleCustomChange = (qId: string, value: string) => {
    setCustomInputs((prev) => ({ ...prev, [qId]: value }));
    setSelectedAnswers((prev) => ({ ...prev, [qId]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onProceedWithClarifications(selectedAnswers);
  };

  const answeredCount = Object.keys(selectedAnswers).filter((k) => selectedAnswers[k]?.trim()).length;

  return (
    <div
      role="alert"
      className="bg-amber-50/95 border-2 border-amber-400 rounded-2xl p-5 sm:p-7 shadow-sm transition-all"
    >
      {/* Warning Box Header */}
      <div className="flex items-start gap-3.5 pb-4 mb-5 border-b border-amber-200">
        <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs ring-4 ring-amber-100">
          <AlertTriangle className="w-5 h-5 stroke-[2.2]" />
        </div>
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-200/90 text-amber-950 border border-amber-300">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-800" />
              <span>Clarification Needed</span>
            </span>
            <span className="text-xs text-amber-800 font-medium">
              Strict No-Guessing Rule
            </span>
          </div>

          <h3 className="text-base sm:text-lg font-bold text-amber-950">
            A specific, measurable metric is required before building the tracking plan
          </h3>

          <p className="text-xs sm:text-sm text-amber-900/90 leading-relaxed max-w-3xl">
            {clarificationMessage ||
              "The provided business goal is vague or underspecified (e.g., 'Make the site better'). To prevent generating meaningless tags or guessing benchmarks, please select answers to the 3 clarifying questions below, or update your input goal with a measurable metric (such as 'increase conversions' or 'reduce bounce rate on checkout')."}
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-amber-900">Entered Goal:</span>
            <span className="font-mono text-xs px-2.5 py-1 bg-white/90 text-amber-950 border border-amber-200 rounded-md italic">
              "{originalGoal}"
            </span>
            {onEditGoalFocus && (
              <button
                type="button"
                onClick={onEditGoalFocus}
                className="text-xs font-semibold text-amber-800 hover:text-amber-950 underline ml-1"
              >
                Edit in text box
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3 Clarifying Questions Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="flex items-center justify-between text-xs text-amber-900 font-medium px-1">
          <span>Answer the 3 questions below to define a scoped measurement objective:</span>
          <span>
            {answeredCount} of {safeQuestions.length} answered
          </span>
        </div>

        {safeQuestions.map((q, idx) => {
          const currentAnswer = selectedAnswers[q.id] || '';
          return (
            <div
              key={q.id}
              className="bg-white rounded-xl p-4 sm:p-5 border border-amber-200/90 shadow-2xs space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-900 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{q.question}</h4>
                    {q.context && (
                      <p className="text-xs text-slate-500 mt-0.5">{q.context}</p>
                    )}
                  </div>
                </div>

                {currentAnswer && (
                  <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200 shrink-0">
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span>Answered</span>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 gap-2 pl-0 sm:pl-7 pt-1">
                {q.options.map((opt) => {
                  const isSelected = currentAnswer === opt;
                  return (
                    <button
                      type="button"
                      key={opt}
                      onClick={() => handleOptionSelect(q.id, opt)}
                      className={`text-left text-xs sm:text-sm p-3 rounded-lg border transition-all flex items-start gap-2.5 cursor-pointer ${
                        isSelected
                          ? 'border-amber-500 bg-amber-50/70 text-amber-950 font-semibold ring-1 ring-amber-500/30'
                          : 'border-slate-200 bg-slate-50/60 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span
                        className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'border-amber-600 bg-amber-600 text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </span>
                      <span>{opt}</span>
                    </button>
                  );
                })}

                {/* Optional custom text input */}
                <div className="mt-1 pt-1.5 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                    <CornerDownRight className="w-3 h-3 text-slate-400" />
                    <span>Or provide custom specification:</span>
                  </div>
                  <input
                    type="text"
                    value={customInputs[q.id] || ''}
                    onChange={(e) => handleCustomChange(q.id, e.target.value)}
                    placeholder="Type custom page, metric, or audience..."
                    className="w-full px-3 py-1.5 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-amber-500 focus:bg-white"
                  />
                </div>
              </div>
            </div>
          );
        })}

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <p className="text-xs text-amber-900/80">
            Measurement plans will only be generated when specific success criteria are defined.
          </p>

          <button
            type="submit"
            disabled={isLoading || answeredCount === 0}
            className="w-full sm:w-auto px-6 py-2.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-medium text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span>Generating measurement plan...</span>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>
                  Apply Clarifications & Generate Plan ({answeredCount}/{safeQuestions.length})
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
