import React, { useState } from 'react';
import { Keyboard, X, Sparkles, RefreshCw, CornerDownLeft } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface TextInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalyze: (text: string) => void;
  isAnalyzing: boolean;
}

export const TextInputModal: React.FC<TextInputModalProps> = ({
  isOpen,
  onClose,
  onAnalyze,
  isAnalyzing,
}) => {
  const { language, isRtl } = useLanguage();
  const [textInput, setTextInput] = useState('');

  if (!isOpen) return null;

  const samplePhrasesFr = [
    '2 tranches de pain + omelette + une pomme',
    'Un plat de couscous agneau, deux morceaux de pain et une orange',
    'Lablabi complet avec œuf poché, thon et un morceau de pain',
    'Makrouna bel salsa (pâtes piquantes), poulet et un quart de baguette',
    'Ojja merguez avec 2 œufs et 1/2 pain tabouna',
    'Brik à l’œuf et au thon avec salade méchouia',
  ];

  const samplePhrasesAr = [
    '2 شرائح خبز طابونة + عجة بيض + تفاحة',
    'صحن كسكسي بلحم الخروف، قطعتين خبز وبرتقالة',
    'لبلابي كامل مع عظمة مروبة، تن وشوية خبز',
    'مقرونة بالصلصة الحارة، دجاج وربع باقات',
    'عجة مرقاز مع زوز عظمات ونصف خبزة طابونة',
    'بريكة بالعظمة والتن مع سلاطة مشوية',
  ];

  const samplePhrases = language === 'ar' ? samplePhrasesAr : samplePhrasesFr;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (textInput.trim() && !isAnalyzing) {
      onAnalyze(textInput.trim());
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 ${isRtl ? 'font-arabic' : ''}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {language === 'ar' ? 'كتابة الوجبة' : 'Écrire mon repas'}
              </h2>
              <p className="text-xs text-slate-500">
                {language === 'ar' ? 'صف الأطعمة والكميات المتناولة في الوجبة' : 'Décrivez les aliments et quantités consommées'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              {language === 'ar' ? 'وصف الوجبة :' : 'Description du repas :'}
            </label>
            <textarea
              id="input-meal-text"
              rows={3}
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={
                language === 'ar'
                  ? 'مثال: 2 شرائح خبز طابونة، عجة مرقاز، وتفاحة أو برتقالة...'
                  : 'Ex : 2 tranches de pain tabouna, une ojja merguez et une orange...'
              }
              className="w-full p-3.5 rounded-2xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm text-slate-800 resize-none outline-none"
              autoFocus
            />
          </div>

          {/* Quick Suggestions */}
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block mb-2">
              {language === 'ar' ? 'أمثلة شائعة للاختبار بنقرة واحدة :' : 'Exemples fréquents à tester en 1 clic :'}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {samplePhrases.map((phrase, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setTextInput(phrase)}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 text-xs text-left transition-colors border border-slate-200/60 cursor-pointer"
                >
                  {phrase}
                </button>
              ))}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            {language === 'ar' ? 'إلغاء' : 'Annuler'}
          </button>

          <button
            id="btn-submit-meal-text"
            type="button"
            disabled={!textInput.trim() || isAnalyzing}
            onClick={() => handleSubmit()}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer ${
              !textInput.trim() || isAnalyzing
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/25'
            }`}
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{language === 'ar' ? 'جاري تحليل النص…' : 'Analyse du texte…'}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{language === 'ar' ? 'حساب الكربوهيدرات' : 'Calculer les glucides'}</span>
                <CornerDownLeft className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
