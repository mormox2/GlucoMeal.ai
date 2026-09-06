export type InputMode = 'photo' | 'text' | 'voice' | 'barcode';

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export type FoodCategory =
  | 'feculents'
  | 'legumineuses'
  | 'plats'
  | 'viandes_proteines'
  | 'patisseries'
  | 'fruits_legumes'
  | 'produits_industriels'
  | 'boissons';

export interface FoodItem {
  id: string;
  name_fr: string;
  name_ar: string;
  name_tn: string;
  category: FoodCategory;
  carbs_per_100g: number;
  protein_per_100g: number;
  fat_per_100g: number;
  fiber_per_100g: number;
  default_portion_g: number;
  source: string;
  confidence_base: ConfidenceLevel;
  serving_unit_description: string;
  glycemic_index?: number; // Index Glycémique (0 - 100)
  glycemic_load?: number; // Charge Glycémique par portion standard
  aliases?: string[];
}

export interface MealComponentItem {
  id: string;
  food_id?: string;
  name_fr: string;
  name_ar?: string;
  category?: FoodCategory;
  estimated_weight_g: number;
  confirmed_weight_g: number;
  carbs_per_100g: number;
  calculated_carbs: number; // calculated deterministically: round(weight * carbs_per_100g / 100)
  confidence: ConfidenceLevel;
  original_ai_weight_g: number;
  is_corrected: boolean;
  notes?: string;
  glycemic_index?: number;
}

export interface HabitReference {
  recipe_name: string;
  similar_meals_count: number;
  usual_portion_g: number;
  usual_carbs_min: number;
  usual_carbs_max: number;
  message: string;
}

export type MealItem = MealComponentItem;

export type MealSlot = 'morning' | 'lunch' | 'dinner' | 'snack' | 'iftar' | 'sahriya' | 'shor';

export type PhysicalActivityLevel = 'none' | 'light_walk' | 'moderate' | 'intense';

export interface CalculatedBolusSummary {
  slot: MealSlot;
  icRatio: number; // g carbs per 1 UI
  mealBolus: number; // Units
  currentGlucose?: number; // In user's chosen unit
  targetGlucose?: number;
  isf?: number;
  correctionBolus: number; // Units
  totalBolus: number; // Units (meal + correction - activity)
  activityLevel?: PhysicalActivityLevel;
  activityReductionPct?: number; // ex: 0, 15, 30, 50
  activityReductionUnits?: number; // ex: 1.5 UI
  rawMealBolus?: number; // Bolus avant modulation d'effort
  isCapped?: boolean; // True si plafonné au seuil de sécurité max (20 UI)
  unclampedTotalBolus?: number; // Valeur brute avant plafonnement
  safetyWarning?: string; // Message d'alerte sécurité clinique si détection anomalie
  isHoneymoonActive?: boolean; // True si le mode rémission partielle / lune de miel est actif
  honeymoonNotice?: string; // Consigne clinique spécifique à la phase de lune de miel
}

export interface DualWaveSuggestion {
  is_recommended: boolean;
  immediate_pct: number; // ex: 60%
  immediate_units: number;
  extended_pct: number; // ex: 40%
  extended_units: number;
  duration_hours: number; // ex: 2.5 heures
  reason: string;
  reason_ar?: string;
}

export interface CGMReading {
  glucose: number;
  unit: 'g/L' | 'mg/dL';
  trend: 'flat' | 'up_slow' | 'up_fast' | 'down_slow' | 'down_fast';
  timestamp: string;
  device: 'dexcom' | 'freestyle' | 'nightscout' | 'manual' | 'simulator' | 'linx' | 'syai' | 'sibionics';
  sensorExpiryDays?: number;
  sensorSerialNumber?: string;
  sensorModelName?: string;
  mardScore?: string;
  batteryLevel?: number;
  recentSparkline?: { time: string; value: number }[];
  isSimulation?: boolean;
  source?: 'nightscout_live' | 'bluetooth_real' | 'bluetooth_simulated' | 'nfc_real' | 'nfc_simulated' | 'simulation';
  errorMessage?: string;
}

export interface CGMConfig {
  deviceType: 'dexcom' | 'freestyle' | 'nightscout' | 'simulator' | 'linx' | 'syai' | 'sibionics';
  isConnected: boolean;
  nightscoutUrl?: string;
  apiKey?: string;
  lastSync?: string;
  // LibreLinkUp Cloud Direct Connector
  libreEmail?: string;
  librePassword?: string;
  libreRegion?: 'fr' | 'eu' | 'us';
  // Dexcom Share Direct Cloud
  dexcomUsername?: string;
  dexcomPassword?: string;
  dexcomRegion?: 'eu' | 'us';
  // Chinese CGMs: LinX CGM & Syai Tag & Sibionics
  linxDeviceName?: string;
  linxSerialNumber?: string;
  linxBridgeMode?: 'ble_direct' | 'linx_cloud' | 'nightscout_bridge' | 'xdrip';
  linxCloudEmail?: string;
  linxCloudPassword?: string;
  syaiDeviceName?: string;
  syaiSerialNumber?: string;
  syaiBridgeMode?: 'ble_smart' | 'syai_link' | 'nightscout_bridge' | 'xdrip';
  syaiEmail?: string;
  syaiPassword?: string;
  sibionicsSerialNumber?: string;
  // Sensor metadata
  sensorExpiryDays?: number;
  sensorSerialNumber?: string;
  autoSyncIntervalMinutes?: number;
}

export interface PatientCustomPortion {
  food_id: string;
  food_name: string;
  custom_portion_g: number;
  default_portion_g: number;
  correction_count: number;
  last_updated: string;
  is_active: boolean;
}

export interface ActiveReminderH2 {
  mealId: string;
  mealName: string;
  mealTime: string;
  scheduledH2Time: string;
  isDismissed?: boolean;
}

export type AccountType = 'parent' | 'patient' | 'doctor';

export interface ChildProfileInfo {
  childName: string;
  birthYear?: number;
  age?: number;
  schoolName?: string;
  schoolGrade?: string;
  insulinDeliveryType: 'pen_half_unit' | 'standard_pen' | 'pump';
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  cgmSharingActive?: boolean;
}

export interface UserProfileDT1 {
  name: string;
  glucoseUnit: 'g/L' | 'mg/dL';
  targetGlucose: number; // ex: 1.00 g/L ou 100 mg/dL
  isf: number; // Facteur de sensibilité (ISF) : chute glycémique pour 1 UI (ex: 0.40 g/L ou 40 mg/dL)
  icRatios: {
    morning: number; // Matin : ex: 8 g de glucides pour 1 UI
    lunch: number; // Midi : ex: 10 g de glucides pour 1 UI
    dinner: number; // Soir : ex: 12 g de glucides pour 1 UI
    snack: number; // Collation : ex: 10 g de glucides pour 1 UI
    iftar?: number; // Iftar (Rupture du jeûne) : ex: 8 g / 1 UI
    sahriya?: number; // Sahriya (Soirée/pâtisseries) : ex: 9 g / 1 UI
    shor?: number; // Shor (Dernier repas aube) : ex: 12 g / 1 UI
  };
  roundingStep: 0.5 | 1 | 0.1;
  accountType?: AccountType;
  childProfile?: ChildProfileInfo;
  parentEmail?: string;
  cgmConfig?: CGMConfig;
  customPortions?: PatientCustomPortion[];
  ramadanMode?: boolean;
  activeReminderH2?: ActiveReminderH2 | null;
  isHoneymoonPhase?: boolean; // Phase de lune de miel (rémission clinique partielle du DT1)
  diagnosisDate?: string; // Date de découverte du DT1 (ex: '2026-01')
  honeymoonNotes?: string; // Notes cliniques de suivi lune de miel
}

export interface AnalyzedMeal {
  id: string;
  user_id?: string;
  meal_name: string;
  meal_name_ar?: string;
  timestamp?: string;
  created_at?: string;
  input_type: InputMode;
  photo_url?: string;
  raw_input?: string;
  items: MealComponentItem[];
  total_carbs: number; // strictly integer approximation (≈ 87 g)
  overall_confidence: ConfidenceLevel;
  confidence_score: number; // 0 to 100%
  habit_match?: HabitReference;
  is_validated?: boolean;
  is_favorite?: boolean;
  bolus_calculated?: CalculatedBolusSummary;
  dual_wave?: DualWaveSuggestion;
  total_glycemic_load?: number;
  average_glycemic_index?: number;
  post_prandial_glucose?: number;
  post_prandial_timestamp?: string;
  post_prandial_evaluation?: 'target' | 'hyper' | 'hypo';
  cgm_reading?: CGMReading;
  activity_level?: PhysicalActivityLevel;
  is_ramadan_meal?: boolean;
  ramadan_slot?: 'iftar' | 'sahriya' | 'shor';
  notes?: string;
}

export type BenchmarkDifficulty = 'Facile' | 'Moyen' | 'Complexe';

export type BenchmarkPhotoAngle =
  | 'Plongeante 45°'
  | 'Zénithale 90° (Vue du dessus)'
  | 'Latérale 30°'
  | 'Multi-vues (45° + zénithale)';

export type BenchmarkReferenceMethod =
  | 'Double pesée séparée sur balance de précision (±0.1 g)'
  | 'Pesée avant trempage + tare récipient'
  | 'Décomposition anatomique et pesée des composants'
  | 'Table nutritionnelle officielle INNT + pesée directe'
  | 'Dosage chimique / chromatographie';

export interface BenchmarkIngredientItem {
  name_fr: string;
  name_ar?: string;
  weight_g: number;
  carbs_per_100g: number;
  carbs_g: number;
  is_hidden?: boolean;
  notes?: string;
}

export interface BenchmarkMeal {
  id: number;
  name_fr: string;
  name_ar: string;
  category: string;
  ingredients: string[]; // Résumé textuel pour affichage rapide
  ingredient_breakdown?: BenchmarkIngredientItem[]; // Décomposition exhaustive des ingrédients, poids et glucides
  reference_portion_g: number; // Poids total du plat en grammes
  reference_carbs_g: number; // Glucides de référence réels (Ground Truth) en grammes
  difficulty: BenchmarkDifficulty; // Degré de difficulté pour l'analyse visuelle IA
  photo_type: string; // Type d'angle de prise de vue (ex: 'Plongeante 45° - assiette creuse')
  measurement_method: string; // Méthode de référence métrologique utilisée
  container_type?: string; // Type de contenant standardisé (assiette 24cm, bol, poêlon)
  lighting_condition?: string; // Condition d'éclairage lors de la prise de vue
  validation_notes?: string; // Remarques cliniques pour le benchmark
}

export interface TunisianMealBenchmarkDataset {
  name: string;
  version: string;
  description: string;
  target_meals_count: number;
  clinical_error_threshold_pct: number; // Seuil max d'erreur acceptable (ex: 15%)
  meals: BenchmarkMeal[];
}

export interface LearningCorrectionRecord {
  id: string;
  food_name: string;
  ai_estimated_g: number;
  user_confirmed_g: number;
  delta_g: number;
  timestamp: string;
  meal_name: string;
}
