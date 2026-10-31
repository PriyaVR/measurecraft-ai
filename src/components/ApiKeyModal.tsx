/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Key,
  Shield,
  Check,
  AlertCircle,
  ExternalLink,
  Eye,
  EyeOff,
  Trash2,
  Cpu,
  Globe,
  X,
} from 'lucide-react';
import {
  getStoredApiKey,
  setStoredApiKey,
  getEffectiveApiKey,
} from '../services/measurementPlanService';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeyChange: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  onKeyChange,
}) => {
  const currentEffective = getEffectiveApiKey();
  const currentStored = getStoredApiKey();
  const isEnvProvided = !(currentStored) && Boolean(currentEffective);

  const [inputKey, setInputKey] = useState(currentStored);
  const [showKey, setShowKey] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    setStoredApiKey(inputKey);
    setSaveSuccess(true);
    onKeyChange();
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 600);
  };

  const handleClear = () => {
    setInputKey('');
    setStoredApiKey('');
    onKeyChange();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="Close API Key Settings"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center font-bold">
            <Key className="w-5 h-5 text-sky-700" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Gemini API & Deployment Settings
            </h2>
            <p className="text-xs text-slate-500">
              Configure client-side AI keys for static hosting (Netlify, Vercel, GitHub Pages)
            </p>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 bg-slate-50 border-slate-200">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-3 h-3 rounded-full ${
                currentEffective
                  ? 'bg-emerald-500 ring-4 ring-emerald-100 animate-pulse'
                  : 'bg-amber-400 ring-4 ring-amber-100'
              }`}
            />
            <div>
              <span className="font-semibold text-slate-800 block">
                {currentEffective ? 'Gemini AI Generation Active' : 'Offline / Expert Fallback Active'}
              </span>
              <span className="text-slate-500 text-[11px]">
                {currentStored
                  ? 'Using custom key saved in browser storage'
                  : isEnvProvided
                  ? 'Using VITE_GEMINI_API_KEY environment variable'
                  : 'Running locally without external API dependencies'}
              </span>
            </div>
          </div>
          {currentEffective ? (
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium text-[11px]">
              Ready
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium text-[11px]">
              Offline Mode
            </span>
          )}
        </div>

        {/* Key Input Section */}
        <div className="space-y-2">
          <label htmlFor="gemini-key" className="text-xs font-semibold text-slate-800 flex items-center justify-between">
            <span>Gemini API Key</span>
            {isEnvProvided && (
              <span className="text-[11px] font-normal text-sky-700">
                Provided via VITE_GEMINI_API_KEY
              </span>
            )}
          </label>
          <div className="relative">
            <input
              id="gemini-key"
              type={showKey ? 'text' : 'password'}
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full text-xs font-mono px-3.5 py-2.5 pr-20 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
                title={showKey ? 'Hide key' : 'Show key'}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              {inputKey && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                  title="Clear key"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          <p className="text-[11px] text-slate-500">
            Get an API key from Google AI Studio. Stored strictly in your browser's <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">localStorage</code>.
          </p>
        </div>

        {/* Security & Netlify Deployment Notes */}
        <div className="space-y-3 pt-1">
          <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3 text-xs text-amber-950 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-amber-900">
              <Shield className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              <span>Security & Client-Side Notice</span>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-900/90">
              In client-side single-page applications, API keys configured in the browser or via <code className="font-mono bg-amber-100/70 px-1 py-0.5 rounded">VITE_</code> variables are invoked directly from client browser network calls. Use restricted keys or project-specific keys with usage quotas.
            </p>
          </div>

          <div className="bg-sky-50/70 border border-sky-200/70 rounded-xl p-3 text-xs text-sky-950 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-sky-900">
              <Globe className="w-3.5 h-3.5 text-sky-700 shrink-0" />
              <span>Deploying Statically on Netlify</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-600">
              To deploy on Netlify without user key entry: add <code className="font-mono bg-sky-100/80 px-1 py-0.5 rounded text-sky-900">VITE_GEMINI_API_KEY</code> to your Netlify Site Configuration &rarr; Environment variables. Build command: <code className="font-mono bg-slate-100 px-1 rounded">npm run build</code>, Publish directory: <code className="font-mono bg-slate-100 px-1 rounded">dist</code>.
            </p>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-xs transition-all cursor-pointer"
          >
            {saveSuccess ? (
              <>
                <Check className="w-4 h-4" />
                <span>Saved!</span>
              </>
            ) : (
              <span>Save & Use</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
