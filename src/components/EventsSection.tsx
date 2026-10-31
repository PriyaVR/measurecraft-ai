import React, { useState } from 'react';
import { Activity, Copy, Check, Zap, Tag, ChevronDown, ChevronUp } from 'lucide-react';
import { TrackingEvent } from '../types';

interface EventsSectionProps {
  events: TrackingEvent[];
}

export const EventsSection: React.FC<EventsSectionProps> = ({ events }) => {
  const safeEvents = Array.isArray(events) ? events : [];
  const [copiedEvent, setCopiedEvent] = useState<string | null>(null);
  const [expandedEvents, setExpandedEvents] = useState<Record<string, boolean>>(() => {
    // Expand the first 3 by default
    const initial: Record<string, boolean> = {};
    if (Array.isArray(events)) {
      events.slice(0, 3).forEach((ev) => {
        if (ev?.eventName) {
          initial[ev.eventName] = true;
        }
      });
    }
    return initial;
  });

  const handleCopyEventName = (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(name);
    setCopiedEvent(name);
    setTimeout(() => setCopiedEvent(null), 2000);
  };

  const toggleExpand = (name: string) => {
    setExpandedEvents((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  const toggleAll = (expand: boolean) => {
    const updated: Record<string, boolean> = {};
    safeEvents.forEach((ev) => {
      if (ev?.eventName) {
        updated[ev.eventName] = expand;
      }
    });
    setExpandedEvents(updated);
  };

  return (
    <div className="bg-white rounded-2xl border border-sky-100 shadow-xs p-5 sm:p-7">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-sm">
            2
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Section 2: Events to Track
            </h2>
            <p className="text-xs text-slate-500">
              Standardized snake_case behavioral events with specific trigger moments and payload parameters.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => toggleAll(true)}
            className="text-xs text-slate-500 hover:text-slate-800 font-medium px-2 py-1 rounded-md hover:bg-slate-100 transition-colors"
          >
            Expand all
          </button>
          <span className="text-slate-300">·</span>
          <button
            type="button"
            onClick={() => toggleAll(false)}
            className="text-xs text-slate-500 hover:text-slate-800 font-medium px-2 py-1 rounded-md hover:bg-slate-100 transition-colors"
          >
            Collapse all
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {safeEvents.map((ev, idx) => {
          const isExpanded = expandedEvents[ev.eventName] ?? true;
          const isCopied = copiedEvent === ev.eventName;

          return (
            <div
              key={ev.id || ev.eventName || idx}
              className={`rounded-xl border transition-all ${
                isExpanded
                  ? 'border-sky-200 bg-white shadow-xs'
                  : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
              }`}
            >
              {/* Header Bar */}
              <div
                onClick={() => toggleExpand(ev.eventName)}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none"
              >
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-700 border border-sky-200 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 font-mono text-xs font-semibold">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200 text-sky-950">
                        {ev.eventName}
                      </span>
                      {ev.pillar && (
                        <span className="text-[11px] font-semibold text-sky-850 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
                          {ev.pillar}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => handleCopyEventName(ev.eventName, e)}
                        className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
                        title="Copy event name"
                      >
                        {isCopied ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-1 sm:line-clamp-none">
                      {ev.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                  {ev.supportedKpi && (
                    <span className="text-[11px] font-medium text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md max-w-[180px] truncate">
                      Supports: {ev.supportedKpi}
                    </span>
                  )}
                  <div className="text-slate-400 p-1">
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </div>
              </div>

              {/* Collapsible Content */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-1 border-t border-slate-100 space-y-4">
                  {/* Trigger Box */}
                  <div className="bg-sky-50/50 rounded-xl p-3 border border-sky-100 flex items-start gap-2.5">
                    <Zap className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-semibold text-slate-800 block mb-0.5">
                        Trigger Condition (When it fires)
                      </span>
                      <p className="text-xs text-slate-600 leading-relaxed">{ev.trigger}</p>
                    </div>
                  </div>

                  {/* Key Parameters */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Tag className="w-3.5 h-3.5 text-sky-600" />
                      <span className="text-xs font-semibold text-slate-800">
                        Key Parameters ({ev.keyParameters?.length || 0})
                      </span>
                    </div>

                    {ev.keyParameters && ev.keyParameters.length > 0 ? (
                      <div className="overflow-x-auto rounded-lg border border-slate-200">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 text-slate-700 font-medium border-b border-slate-200">
                            <tr>
                              <th className="py-2 px-3">Parameter Name</th>
                              <th className="py-2 px-3">Purpose & Description</th>
                              <th className="py-2 px-3">Example Value</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {ev.keyParameters.map((param, pIdx) => (
                              <tr key={pIdx} className="hover:bg-slate-50/50">
                                <td className="py-2 px-3 font-mono text-[11px] font-semibold text-sky-900 whitespace-nowrap">
                                  {param.name}
                                </td>
                                <td className="py-2 px-3 text-slate-600">
                                  {param.description}
                                </td>
                                <td className="py-2 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                                  {param.example || '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No custom parameters required.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
