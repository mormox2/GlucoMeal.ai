import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, X, Sparkles, RefreshCw, Globe } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface VoiceInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalyze: (transcript: string) => void;
  isAnalyzing: boolean;
}

export const VoiceInputModal: React.FC<VoiceInputModalProps> = ({
  isOpen,
  onClose,
  onAnalyze,
  isAnalyzing,
}) => {
  const { language: appLanguage } = useLanguage();
  const isAr = appLanguage === 'ar';

  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [language, setLanguage] = useState<'fr-FR' | 'ar-TN'>(() => (isAr ? 'ar-TN' : 'fr-FR'));
  const [speechSupported, setSpeechSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen) {
      setLanguage(isAr ? 'ar-TN' : 'fr-FR');
    }
  }, [isOpen, isAr]);

  useEffect(() => {
    if (!isOpen) {
      if (isRecording) {
        stopListening();
      }
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      setSpeechSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language;

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition event:', event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    } else {
      setSpeechSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
    };
  }, [isOpen, language]);

  if (!isOpen) return null;

  const startListening = () => {
    setTranscript('');
    setIsRecording(true);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.lang = language;
        recognitionRef.current.start();
      } catch (e) {
        console.warn('Could not start recognition:', e);
      }
    }
  };

  const stopListening = () => {
    setIsRecording(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
    }
  };

  const spokenTunisianExamples = [
    { text: 'كلّيت صحن مقرونة و زوز خبزات', lang: 'ar-TN', label: isAr ? 'مقرونة + قطعتان خبز' : 'Derja : Pâtes + 2 morceaux de pain' },
    { text: 'صحن لبلابي مع عظمة و شوية تن', lang: 'ar-TN', label: isAr ? 'لبلابي كامل + بيضة + تونة' : 'Derja : Lablabi complet + œuf + thon' },
    { text: 'صحن كسكسي بالعلوش وزوز طوابع خبز وتفاحة', lang: 'ar-TN', label: isAr ? 'كسكسي + خبز + تفاحة' : 'Derja : Couscous + 2 pains + pomme' },
    { text: 'عجة بالمرقاز مع 2 عظم وشطر خبزة طابونة', lang: 'ar-TN', label: isAr ? 'عجة بالمرقاز + خبز طابونة' : 'Derja : Ojja merguez + tabouna' },
  ];

  const handleApplyPresetVoice = (text: string) => {
    setTranscript(text);
  };

  const handleConfirm = () => {
    if (transcript.trim() && !isAnalyzing) {
      onAnalyze(transcript.trim());
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 ${isAr ? 'font-arabic' : ''}`}>
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {isAr ? 'وصف الوجبة بالصوت' : 'Décrire mon repas à la voix'}
              </h2>
              <p className="text-xs text-slate-500">
                {isAr
                  ? 'التعرف الصوتي بالدارجة التونسية أو اللغة الفرنسية'
                  : 'Reconnaissance vocale en français et dialecte tunisien (Derja)'}
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

        {/* Language Toggle */}
        <div className="px-5 pt-4 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            {isAr ? 'لغة الإملاء:' : 'Langue parlée :'}
          </span>
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setLanguage('ar-TN')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                language === 'ar-TN' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600'
              }`}
            >
              تونسي (دارجة)
            </button>
            <button
              onClick={() => setLanguage('fr-FR')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                language === 'fr-FR' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600'
              }`}
            >
              Français
            </button>
          </div>
        </div>

        {/* Microphone Recording Center */}
        <div className="p-6 flex flex-col items-center justify-center text-center">
          <div className="relative mb-4">
            {isRecording && (
              <div className="absolute -inset-4 rounded-full bg-teal-500/20 animate-ping" />
            )}
            <button
              id="btn-toggle-mic"
              onClick={isRecording ? stopListening : startListening}
              className={`w-20 h-20 rounded-full flex items-center justify-center text-white shadow-xl transition-all cursor-pointer ${
                isRecording
                  ? 'bg-rose-500 hover:bg-rose-600 scale-105 shadow-rose-500/30'
                  : 'bg-gradient-to-tr from-teal-500 to-emerald-600 hover:scale-105 shadow-teal-500/30'
              }`}
            >
              {isRecording ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
            </button>
          </div>

          <p className="text-xs font-medium text-slate-600">
            {isRecording
              ? (isAr ? 'جاري الاستماع… تكلم بطبيعتك' : 'Écoute en cours… Parlez naturellement')
              : (isAr ? 'انقر على الميكروفون لبدء التحدث' : 'Touchez le micro pour commencer à parler')}
          </p>

          {/* Transcript Box */}
          <div className="w-full mt-5 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-left rtl:text-right min-h-20 flex flex-col justify-center">
            {transcript ? (
              <p className="text-sm font-semibold text-slate-900 leading-relaxed">
                « {transcript} »
              </p>
            ) : (
              <p className="text-xs text-slate-400 italic text-center">
                {isAr ? 'سيظهر كلامك المنطوق هنا…' : 'Votre description vocale apparaîtra ici…'}
              </p>
            )}
          </div>

          {/* Quick Voice Simulation Presets */}
          <div className="w-full mt-5 text-left rtl:text-right">
            <span className="text-[11px] font-semibold text-slate-500 block mb-2">
              {isAr ? 'أو جرّب إحدى العبارات التونسية الشائعة:' : 'Ou simuler un message vocal tunisien typique :'}
            </span>
            <div className="space-y-1.5">
              {spokenTunisianExamples.map((ex, i) => (
                <button
                  key={i}
                  onClick={() => handleApplyPresetVoice(ex.text)}
                  className="w-full p-2 rounded-xl bg-teal-50/50 hover:bg-teal-50 text-slate-800 text-xs flex items-center justify-between border border-teal-100/70 transition-colors text-left rtl:text-right cursor-pointer"
                >
                  <span className="font-medium">« {ex.text} »</span>
                  <span className="text-[10px] text-teal-700 font-semibold shrink-0 mx-2">
                    {ex.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            {isAr ? 'إلغاء' : 'Annuler'}
          </button>

          <button
            id="btn-confirm-voice"
            disabled={!transcript.trim() || isAnalyzing}
            onClick={handleConfirm}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer ${
              !transcript.trim() || isAnalyzing
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                : 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-600/25'
            }`}
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{isAr ? 'جاري التحليل الصوتي…' : 'Analyse audio…'}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{isAr ? 'تقدير الكربوهيدرات والجرعة' : 'Estimer les glucides'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
