import React, { useState, useEffect } from 'react';
import { Clock, Bell, CheckCircle2, X, Activity, ArrowRight, Wifi } from 'lucide-react';
import { ActiveH2ReminderData, getActiveH2Reminder, dismissH2Reminder, getH2TimeStatus } from '../utils/h2Reminder';
import { AnalyzedMeal } from '../types';

interface PostPrandialReminderBannerProps {
  onOpenRecordH2?: (mealId: string) => void;
  onRecordMeasurement?: (meal: AnalyzedMeal) => void;
  onOpenCGMSync?: () => void;
  meals?: AnalyzedMeal[];
  userProfile?: any;
}

export const PostPrandialReminderBanner: React.FC<PostPrandialReminderBannerProps> = ({
  onOpenRecordH2,
  onRecordMeasurement,
  onOpenCGMSync,
  meals = [],
}) => {
  const [reminder, setReminder] = useState<ActiveH2ReminderData | null>(() => getActiveH2Reminder());
  const [timeStatus, setTimeStatus] = useState(() => {
    const active = getActiveH2Reminder();
    return active ? getH2TimeStatus(active.scheduledH2Time) : null;
  });

  // Mise à jour du timer toutes les 30 secondes
  useEffect(() => {
    const update = () => {
      const active = getActiveH2Reminder();
      setReminder(active);
      if (active) {
        // Vérifier si le repas associé n'a pas déjà reçu sa glycémie H+2
        const targetMeal = (meals || []).find((m) => m.id === active.mealId);
        if (targetMeal && targetMeal.post_prandial_glucose !== undefined) {
          dismissH2Reminder();
          setReminder(null);
          return;
        }
        setTimeStatus(getH2TimeStatus(active.scheduledH2Time));
      } else {
        setTimeStatus(null);
      }
    };

    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, [meals]);

  if (!reminder || !timeStatus) return null;

  const handleDismiss = () => {
    dismissH2Reminder();
    setReminder(null);
  };

  const handleRecord = () => {
    if (onRecordMeasurement) {
      const found = (meals || []).find((m) => m.id === reminder.mealId) || ({
        id: reminder.mealId,
        meal_name: reminder.mealName,
        items: [],
        total_carbs: reminder.totalCarbs || 0,
        overall_confidence: 'medium',
        confidence_score: 90,
        timestamp: new Date().toISOString(),
      } as AnalyzedMeal);
      onRecordMeasurement(found);
    } else if (onOpenRecordH2) {
      onOpenRecordH2(reminder.mealId);
    }
  };

  const isDue = timeStatus.isDue;

  return (
    <div
      className={`border rounded-2xl px-4 py-3 sm:py-3.5 transition-all shadow-sm mb-4 animate-in fade-in slide-in-from-top-2 ${
        isDue
          ? 'bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-50 border-amber-300/80 text-amber-950 shadow-amber-500/10'
          : 'bg-gradient-to-r from-teal-500/10 via-indigo-500/5 to-slate-50 border-teal-200/80 text-slate-800'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Info & Countdown */}
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              isDue
                ? 'bg-amber-500 text-white animate-pulse shadow-xs shadow-amber-500/30'
                : 'bg-teal-700 text-white shadow-xs'
            }`}
          >
            {isDue ? <Bell className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  isDue
                    ? 'bg-amber-200 text-amber-900 border border-amber-300'
                    : 'bg-teal-100 text-teal-800 border border-teal-200'
                }`}
              >
                {isDue ? 'Rappel Contrôle H+2 Échu' : 'Minuteur Post-Prandial H+2'}
              </span>
              <span className="text-xs font-black truncate text-slate-900">{reminder.mealName}</span>
              {reminder.bolusUnits && (
                <span className="text-[10px] text-slate-500">
                  (Bolus : {reminder.bolusUnits} UI)
                </span>
              )}
            </div>

            <p className="text-xs font-semibold text-slate-700 mt-0.5 flex items-center gap-1.5">
              <span className={isDue ? 'text-amber-800 font-black' : 'text-teal-800 font-bold'}>
                {timeStatus.formattedText}
              </span>
              <span className="text-slate-400 hidden md:inline">•</span>
              <span className="text-[11px] text-slate-500 hidden md:inline">
                Cible SFD : 0.70 à 1.80 g/L (70 - 180 mg/dL)
              </span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          {onOpenCGMSync && (
            <button
              type="button"
              onClick={onOpenCGMSync}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Lire la glycémie depuis le capteur FreeStyle / Dexcom"
            >
              <Wifi className="w-3.5 h-3.5 text-teal-600" />
              <span className="hidden xs:inline">Capteur</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleRecord}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition-all shadow-xs ${
              isDue
                ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20'
                : 'bg-teal-700 hover:bg-teal-800 text-white shadow-teal-700/20'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Saisir glycémie H+2</span>
            <ArrowRight className="w-3 h-3" />
          </button>

          <button
            type="button"
            onClick={handleDismiss}
            className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-black/5 flex items-center justify-center transition-colors cursor-pointer"
            title="Ignorer ce rappel"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
