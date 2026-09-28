import React from 'react';
import { X, Check, Palette, Sparkles, Layout, Eye } from 'lucide-react';
import { AppTheme } from '../types';
import { UI_THEMES } from '../data/themes';

interface TemplateSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: AppTheme;
  onSelectTheme: (theme: AppTheme) => void;
}

export const TemplateSelectorModal: React.FC<TemplateSelectorModalProps> = ({
  isOpen,
  onClose,
  currentTheme,
  onSelectTheme,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden animate-scaleUp border border-slate-200 flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-md">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-base sm:text-lg tracking-tight">
                  Choose UI/UX Layout & Theme
                </h2>
                <span className="bg-amber-400/20 text-amber-300 text-[11px] font-bold px-2 py-0.5 rounded-full border border-amber-400/30">
                  4 Templates
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Switch visual archetypes, color palettes, card density & styling in real time
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 bg-slate-50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {UI_THEMES.map((theme) => {
              const isSelected = currentTheme === theme.id;
              return (
                <div
                  key={theme.id}
                  onClick={() => onSelectTheme(theme.id)}
                  className={`cursor-pointer rounded-2xl p-4 sm:p-5 border-2 transition-all relative flex flex-col justify-between ${
                    isSelected
                      ? 'border-emerald-600 bg-white shadow-lg ring-2 ring-emerald-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
                  }`}
                >
                  {/* Top Row */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {theme.badge}
                      </span>
                      {isSelected ? (
                        <div className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-xs font-black border border-emerald-200">
                          <Check className="w-3.5 h-3.5" />
                          <span>Active Template</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="text-xs font-semibold text-slate-500 hover:text-slate-900"
                        >
                          Click to Apply
                        </button>
                      )}
                    </div>

                    <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                      {theme.name}
                    </h3>
                    <p className="text-xs font-medium text-slate-500 mt-0.5">
                      {theme.tagline}
                    </p>

                    <p className="text-xs text-slate-600 mt-2.5 leading-relaxed">
                      {theme.description}
                    </p>

                    {/* Color Swatch Bar */}
                    <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-slate-400">Palette:</span>
                      <div className="flex items-center gap-1.5">
                        <div
                          className="w-5 h-5 rounded-full shadow-xs border border-white ring-1 ring-slate-200"
                          style={{ backgroundColor: theme.colors.primaryDark }}
                          title="Primary Dark"
                        />
                        <div
                          className="w-5 h-5 rounded-full shadow-xs border border-white ring-1 ring-slate-200"
                          style={{ backgroundColor: theme.colors.primary }}
                          title="Primary Main"
                        />
                        <div
                          className="w-5 h-5 rounded-full shadow-xs border border-white ring-1 ring-slate-200"
                          style={{ backgroundColor: theme.colors.accent }}
                          title="Accent Highlight"
                        />
                        <div
                          className="w-5 h-5 rounded-full shadow-xs border border-slate-300"
                          style={{ backgroundColor: theme.colors.bg }}
                          title="Canvas Background"
                        />
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {theme.sampleTags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Apply Button */}
                  <div className="mt-4 pt-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectTheme(theme.id);
                      }}
                      className={`w-full py-2 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
                        isSelected
                          ? 'bg-emerald-700 text-white shadow-sm cursor-default'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Currently Selected</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          <span>Apply this UI Template</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Selected theme is automatically saved to your browser session.
          </div>
          <button
            onClick={onClose}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
