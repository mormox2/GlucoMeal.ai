import React from 'react';
import { Globe } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface LanguageSwitcherProps {
  variant?: 'header' | 'mobile' | 'minimal';
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ variant = 'header' }) => {
  const { language, setLanguage } = useLanguage();

  if (variant === 'mobile') {
    return (
      <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-bold text-slate-800">
            {language === 'ar' ? 'لغة التطبيق' : 'Langue'}
          </span>
        </div>
        <div className="flex bg-white rounded-xl p-1 shadow-xs border border-slate-200 gap-1 text-xs font-bold">
          <button
            onClick={() => setLanguage('fr')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              language === 'fr'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            FR
          </button>
          <button
            onClick={() => setLanguage('ar')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer font-arabic ${
              language === 'ar'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            العربية
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      id="language-switcher"
      className="inline-flex items-center bg-slate-100/90 hover:bg-slate-200/80 p-0.5 rounded-xl border border-slate-200/80 text-xs font-bold transition-colors shadow-2xs shrink-0"
      title={language === 'fr' ? 'Changer en Arabe فصحى' : 'التحويل إلى الفرنسية'}
    >
      <button
        onClick={() => setLanguage('fr')}
        className={`px-2 sm:px-2.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
          language === 'fr'
            ? 'bg-white text-emerald-800 shadow-xs font-extrabold'
            : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        <span className="text-[11px]">FR</span>
      </button>

      <button
        onClick={() => setLanguage('ar')}
        className={`px-2 sm:px-2.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 font-arabic ${
          language === 'ar'
            ? 'bg-white text-emerald-800 shadow-xs font-extrabold'
            : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        <span className="text-[12px]">العربية</span>
      </button>
    </div>
  );
};
