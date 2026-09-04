import { AnalyzedMeal } from '../types';

const STORAGE_KEY = 'glucomal_active_h2_reminder_v1';

export interface ActiveH2ReminderData {
  mealId: string;
  mealName: string;
  mealTime: string; // ISO string of meal creation
  scheduledH2Time: string; // ISO string 2 hours later
  totalCarbs: number;
  bolusUnits?: number;
  isDismissed?: boolean;
}

/**
 * Planifie un rappel post-prandial H+2 pour le repas donné
 */
export function scheduleH2Reminder(meal: AnalyzedMeal): ActiveH2ReminderData {
  const mealTime = meal.timestamp || meal.created_at || new Date().toISOString();
  const mealDate = new Date(mealTime);
  // H+2 = + 120 minutes (7200000 ms)
  const scheduledDate = new Date(mealDate.getTime() + 120 * 60 * 1000);

  const reminderData: ActiveH2ReminderData = {
    mealId: meal.id,
    mealName: meal.meal_name,
    mealTime: mealDate.toISOString(),
    scheduledH2Time: scheduledDate.toISOString(),
    totalCarbs: meal.total_carbs,
    bolusUnits: meal.bolus_calculated?.totalBolus,
    isDismissed: false,
  };

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reminderData));

    // Demander la permission de notification navigateur si non définie
    if ('Notification' in window && Notification.permission === 'default') {
      try {
        Notification.requestPermission();
      } catch {
        // Fallback silencieux
      }
    }
  }

  return reminderData;
}

/**
 * Récupère le rappel H+2 actif en cours (s'il existe et n'a pas été ignoré)
 */
export function getActiveH2Reminder(): ActiveH2ReminderData | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: ActiveH2ReminderData = JSON.parse(raw);
    if (parsed.isDismissed) return null;

    // Si le rappel date de plus de 6 heures, on le considère comme expiré
    const scheduledTime = new Date(parsed.scheduledH2Time).getTime();
    if (Date.now() - scheduledTime > 4 * 3600 * 1000) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return parsed;
  } catch (err) {
    console.error('Erreur lecture rappel H+2:', err);
    return null;
  }
}

/**
 * Annule ou masque le rappel actif
 */
export function dismissH2Reminder(): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getActiveH2Reminder();
    if (current) {
      current.isDismissed = true;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch (err) {
    console.error('Erreur annulation rappel H+2:', err);
  }
}

/**
 * Calcule le temps restant en minutes et format lisible
 */
export function getH2TimeStatus(scheduledH2Time: string): {
  isDue: boolean;
  minutesRemaining: number;
  formattedText: string;
} {
  const targetMs = new Date(scheduledH2Time).getTime();
  const diffMs = targetMs - Date.now();
  const totalMinutes = Math.round(diffMs / (60 * 1000));

  if (totalMinutes <= 0) {
    const elapsedMinutes = Math.abs(totalMinutes);
    return {
      isDue: true,
      minutesRemaining: 0,
      formattedText:
        elapsedMinutes === 0
          ? "C'est l'heure du contrôle H+2 !"
          : `Contrôle H+2 échu depuis ${elapsedMinutes} min`,
    };
  }

  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  let text = '';
  if (hours > 0) {
    text = `${hours}h ${mins.toString().padStart(2, '0')}m`;
  } else {
    text = `${mins} min`;
  }

  return {
    isDue: false,
    minutesRemaining: totalMinutes,
    formattedText: `Contrôle prévu dans ${text}`,
  };
}
