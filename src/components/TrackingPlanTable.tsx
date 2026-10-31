import React, { useState } from 'react';
import { FileSpreadsheet, Download, Copy, Check, Search, Filter } from 'lucide-react';
import { TrackingPlanRow } from '../types';

interface TrackingPlanTableProps {
  rows: TrackingPlanRow[];
  businessGoal: string;
}

export const TrackingPlanTable: React.FC<TrackingPlanTableProps> = ({ rows, businessGoal }) => {
  const safeRows = Array.isArray(rows) ? rows : [];
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedFormat, setCopiedFormat] = useState<'tsv' | 'markdown' | null>(null);

  const filteredRows = safeRows.filter((r) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (r.eventName || '').toLowerCase().includes(term) ||
      (r.pillar || '').toLowerCase().includes(term) ||
      (r.description || '').toLowerCase().includes(term) ||
      (r.trigger || '').toLowerCase().includes(term) ||
      (r.parameters || '').toLowerCase().includes(term) ||
      (r.kpiSupported || '').toLowerCase().includes(term)
    );
  });

  // Format as Tab-Separated Values for instant paste into Google Sheets / Excel
  const copyAsTable = () => {
    const headers = ['Event Name', 'Pillar', 'Description', 'Trigger', 'Parameters', 'KPI Supported'];
    const tableLines = [
      headers.join('\t'),
      ...safeRows.map((r) =>
        [
          r.eventName || '',
          (r.pillar || 'Core').replace(/\t/g, ' '),
          (r.description || '').replace(/\t/g, ' '),
          (r.trigger || '').replace(/\t/g, ' '),
          (r.parameters || '').replace(/\t/g, ' '),
          (r.kpiSupported || '').replace(/\t/g, ' '),
        ].join('\t')
      ),
    ];

    navigator.clipboard.writeText(tableLines.join('\n'));
    setCopiedFormat('tsv');
    setTimeout(() => setCopiedFormat(null), 2500);
  };

  // Format as Markdown table
  const copyAsMarkdown = () => {
    const markdown = [
      '| Event Name | Pillar | Description | Trigger | Parameters | KPI Supported |',
      '| --- | --- | --- | --- | --- | --- |',
      ...safeRows.map(
        (r) =>
          `| \`${r.eventName || ''}\` | ${(r.pillar || 'Core').replace(/\|/g, '\\|')} | ${(r.description || '').replace(/\|/g, '\\|')} | ${(r.trigger || '').replace(
            /\|/g,
            '\\|'
          )} | ${(r.parameters || '').replace(/\|/g, '\\|')} | ${(r.kpiSupported || '').replace(/\|/g, '\\|')} |`
      ),
    ].join('\n');

    navigator.clipboard.writeText(markdown);
    setCopiedFormat('markdown');
    setTimeout(() => setCopiedFormat(null), 2500);
  };

  // Export as CSV file
  const downloadCsv = () => {
    const escapeCsv = (val: string) => {
      const sanitized = (val || '').replace(/"/g, '""');
      return `"${sanitized}"`;
    };

    const headers = ['Event Name', 'Pillar', 'Description', 'Trigger', 'Parameters', 'KPI Supported'];
    const csvContent = [
      headers.map(escapeCsv).join(','),
      ...safeRows.map((r) =>
        [
          escapeCsv(r.eventName || ''),
          escapeCsv(r.pillar || 'Core'),
          escapeCsv(r.description || ''),
          escapeCsv(r.trigger || ''),
          escapeCsv(r.parameters || ''),
          escapeCsv(r.kpiSupported || ''),
        ].join(',')
      ),
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const slug = (businessGoal || 'measurement_plan')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .slice(0, 35);
    link.setAttribute('href', url);
    link.setAttribute('download', `${slug}_tracking_plan.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-2xl border border-sky-100 shadow-xs p-5 sm:p-7">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-sm">
            3
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Section 3: Tracking Plan Table
            </h2>
            <p className="text-xs text-slate-500">
              Unified schema mapping events to triggers, parameters, and supported KPIs.
            </p>
          </div>
        </div>

        {/* Primary Export Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={copyAsTable}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-sky-50 text-sky-800 hover:bg-sky-100 border border-sky-200 transition-colors cursor-pointer"
            title="Copies table data formatted for instant paste into Google Sheets or Microsoft Excel"
          >
            {copiedFormat === 'tsv' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Copied for Sheets/Excel!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-sky-600" />
                <span>Copy as table</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={downloadCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer"
            title="Download CSV spreadsheet"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Download CSV</span>
          </button>

          <button
            type="button"
            onClick={copyAsMarkdown}
            className="inline-flex items-center gap-1 px-2.5 py-2 text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            title="Copy as Markdown table"
          >
            {copiedFormat === 'markdown' ? (
              <span className="text-emerald-600 text-[11px]">Markdown copied!</span>
            ) : (
              <span className="text-[11px]">Markdown</span>
            )}
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="mb-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter events, triggers, or KPIs..."
            className="w-full pl-9 pr-3 py-1.5 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-sky-500 focus:bg-white"
          />
        </div>
        <div className="text-xs text-slate-500 self-end sm:self-auto">
          Showing {filteredRows.length} of {safeRows.length} events
        </div>
      </div>

      {/* The Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <th className="py-3 px-3.5 whitespace-nowrap min-w-[170px]">Event Name</th>
              <th className="py-3 px-3.5 min-w-[140px]">Pillar</th>
              <th className="py-3 px-3.5 min-w-[200px]">Description</th>
              <th className="py-3 px-3.5 min-w-[210px]">Trigger</th>
              <th className="py-3 px-3.5 min-w-[170px]">Parameters</th>
              <th className="py-3 px-3.5 min-w-[160px]">KPI Supported</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {filteredRows.length > 0 ? (
              filteredRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-sky-50/30 transition-colors">
                  <td className="py-3 px-3.5 font-mono text-xs font-bold text-sky-950 align-top">
                    <span className="bg-slate-100/80 px-2 py-1 rounded-md border border-slate-200 block w-fit">
                      {row.eventName}
                    </span>
                  </td>
                  <td className="py-3 px-3.5 align-top">
                    <span className="inline-block bg-indigo-50 border border-indigo-200/80 text-indigo-800 font-semibold px-2 py-0.5 rounded text-[11px] whitespace-nowrap">
                      {row.pillar || 'Core'}
                    </span>
                  </td>
                  <td className="py-3 px-3.5 text-slate-700 align-top leading-relaxed">
                    {row.description}
                  </td>
                  <td className="py-3 px-3.5 text-slate-600 align-top leading-relaxed">
                    <span className="inline-block bg-amber-50/70 border border-amber-100/80 text-slate-700 px-2 py-1 rounded-md">
                      {row.trigger}
                    </span>
                  </td>
                  <td className="py-3 px-3.5 align-top">
                    {row.parameters ? (
                      <div className="flex flex-wrap gap-1">
                        {row.parameters.split(',').map((p, pIdx) => (
                          <span
                            key={pIdx}
                            className="font-mono text-[11px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200"
                          >
                            {p.trim()}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">None</span>
                    )}
                  </td>
                  <td className="py-3 px-3.5 align-top">
                    <span className="inline-block bg-sky-50 border border-sky-200 text-sky-900 font-medium px-2 py-0.5 rounded-md text-[11px]">
                      {row.kpiSupported}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400">
                  No tracking events match your filter "{searchTerm}".
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 px-1">
        <span>Click "Copy as table" to paste directly into Google Sheets or Excel with intact columns.</span>
        <span>Consistent snake_case convention</span>
      </div>
    </div>
  );
};
