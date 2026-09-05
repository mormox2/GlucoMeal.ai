import React, { useState } from 'react';
import { BookOpen, Copy, Check, ChevronDown, ChevronUp, Code2, Database, Shield, Layers } from 'lucide-react';
import { TECHNICAL_SPECIFICATIONS, SpecSection } from '../data/technicalSpecs';

export const TechnicalDocsView: React.FC = () => {
  const [selectedSectionId, setSelectedSectionId] = useState<string>(TECHNICAL_SPECIFICATIONS[0].id);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  const activeSection = TECHNICAL_SPECIFICATIONS.find((s) => s.id === selectedSectionId) || TECHNICAL_SPECIFICATIONS[0];

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold mb-2">
          <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
          <span>Document Maître • Étape 2 Spécifications V1</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Cahier des Charges & Spécifications Techniques MVP
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl">
          Document complet transformé en référence d’implémentation pour le développement mobile Kotlin / Compose et le backend Supabase.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-1 bg-white p-2 rounded-3xl border border-slate-200/80 shadow-xs h-fit">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 py-2 block">
            Sections A → K
          </span>
          {TECHNICAL_SPECIFICATIONS.map((sec) => {
            const isSelected = sec.id === selectedSectionId;
            return (
              <button
                key={sec.id}
                onClick={() => setSelectedSectionId(sec.id)}
                className={`w-full text-left p-3 rounded-2xl transition-all cursor-pointer flex items-center gap-2.5 text-xs font-semibold ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span
                  className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {sec.letter}
                </span>
                <span className="truncate">{sec.title.split(' ')[0]} {sec.title.split(' ')[1]}</span>
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 font-extrabold flex items-center justify-center text-sm">
                {activeSection.letter}
              </span>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {activeSection.title}
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {activeSection.summary}
                </p>
              </div>
            </div>

            {/* Markdown / Formatted Text Content */}
            <div className="prose prose-slate max-w-none text-xs sm:text-sm text-slate-700 whitespace-pre-line leading-relaxed border-t border-slate-100 pt-6">
              {activeSection.content}
            </div>

            {/* Code Snippet if present */}
            {activeSection.codeSnippet && (
              <div className="mt-6 rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 text-slate-100">
                <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <Code2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="uppercase font-mono">{activeSection.codeSnippet.language}</span>
                  </div>
                  <button
                    onClick={() => handleCopyCode(activeSection.codeSnippet!.code, activeSection.id)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium transition-colors cursor-pointer"
                  >
                    {copiedCodeId === activeSection.id ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>Copié !</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copier</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-4 text-xs font-mono overflow-x-auto text-emerald-300 leading-relaxed">
                  <code>{activeSection.codeSnippet.code}</code>
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
