import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { HomeMealEntry } from './components/HomeMealEntry';
import { PhotoInputModal } from './components/PhotoInputModal';
import { TextInputModal } from './components/TextInputModal';
import { VoiceInputModal } from './components/VoiceInputModal';
import { BarcodeModal } from './components/BarcodeModal';
import { PortionAdjustmentView } from './components/PortionAdjustmentView';
import { MealValidationSuccess } from './components/MealValidationSuccess';
import { FoodDatabaseView } from './components/FoodDatabaseView';
import { BenchmarkView } from './components/BenchmarkView';
import { HistoryView } from './components/HistoryView';
import { UserProfileModal } from './components/UserProfileModal';
import { MedicalReportModal } from './components/MedicalReportModal';
import { CGMSyncModal } from './components/CGMSyncModal';
import { PostPrandialEntryModal } from './components/PostPrandialEntryModal';
import { AutoTitrationModal } from './components/AutoTitrationModal';
import { CloudSyncModal } from './components/CloudSyncModal';
import { DoctorPortalView } from './components/DoctorPortalView';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { PWAInstallModal } from './components/PWAInstallModal';
import { PostPrandialReminderBanner } from './components/PostPrandialReminderBanner';
import { BottomNav } from './components/BottomNav';
import { LandingPageView } from './components/LandingPageView';
import { AuthScreen } from './components/AuthScreen';
import { AnalyzedMeal, InputMode, UserProfileDT1 } from './types';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, subscribeToMeals } from './services/firebase';
import {
  loadSavedMeals,
  saveMeals,
  saveSingleMeal,
  toggleFavoriteMeal,
  deleteMealFromHistory,
  clearAllMeals,
  loadUserProfile,
  saveUserProfile,
} from './utils/storage';
import {
  loadCGMConfig,
  saveCGMConfig,
  savePostPrandialMeasurement,
  CGMConfig,
} from './utils/cgmService';
import { Sparkles, RefreshCw, AlertTriangle, X } from 'lucide-react';
import { SAMPLE_MEAL_PRESETS } from './data/sampleMeals';
import {
  MealAnalysisError,
  MealAnalysisResult,
  buildMealFromPreset,
  requestMealAnalysis,
  toAnalyzedMeal,
} from './utils/mealAnalysis';
import { useLanguage } from './i18n/LanguageContext';

export default function App() {
  const { language, isRtl, t } = useLanguage();
  const isAr = language === 'ar';

  // Screen views: 'landing' (SaaS marketing & parental reassurance) | 'auth' (Login/Signup parent or patient) | 'app' (Main meal & bolus tool)
  const [viewScreen, setViewScreen] = useState<'landing' | 'auth' | 'app'>(() => {
    const pref = localStorage.getItem('glucomal_screen_preference_v1');
    if (pref === 'app') return 'app';
    return 'landing'; // Default to landing page
  });
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'signup'>('signup');

  const [currentTab, setCurrentTab] = useState<'app' | 'history' | 'database' | 'benchmark' | 'doctor'>('app');
  const [activeInputModal, setActiveInputModal] = useState<InputMode | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStepLabel, setAnalysisStepLabel] = useState(() =>
    isAr ? 'التعرف البصري على الأطعمة…' : 'Identification visuelle des aliments…'
  );
  const [currentMealDraft, setCurrentMealDraft] = useState<AnalyzedMeal | null>(null);
  const [mealFlowState, setMealFlowState] = useState<'idle' | 'analyzing' | 'review' | 'success'>('idle');
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // DT1 Therapeutic Profile
  const [userProfile, setUserProfile] = useState<UserProfileDT1>(() => loadUserProfile());
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Clinical modals: Medical Report, CGM Sync, Post-Prandial Entry, Auto-Titration & Cloud Sync
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isCGMModalOpen, setIsCGMModalOpen] = useState(false);
  const [isAutoTitrationOpen, setIsAutoTitrationOpen] = useState(false);
  const [isCloudSyncOpen, setIsCloudSyncOpen] = useState(false);
  const [isPWAInstallModalOpen, setIsPWAInstallModalOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [cgmConfig, setCgmConfig] = useState<CGMConfig>(() => loadCGMConfig());
  const [postPrandialMealTarget, setPostPrandialMealTarget] = useState<AnalyzedMeal | null>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  // Écoute temps réel des repas depuis Firestore dès que l'utilisateur est authentifié
  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | null = null;
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        if (unsubscribeSnapshot) unsubscribeSnapshot();
        unsubscribeSnapshot = subscribeToMeals(user.uid, (remoteMeals) => {
          if (remoteMeals && remoteMeals.length > 0) {
            setSavedMeals((prev) => {
              const remoteIds = new Set(remoteMeals.map((m) => m.id));
              const localUnsynced = prev.filter((m) => !remoteIds.has(m.id));
              const merged = [...remoteMeals, ...localUnsynced];
              saveMeals(merged);
              return merged;
            });
          }
        });
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  // Saved Meals persistence with LocalStorage & Cloud Sync capability
  const [savedMeals, setSavedMeals] = useState<AnalyzedMeal[]>(() => loadSavedMeals());

  // Un profil hors bornes cliniques est refusé par saveUserProfile : l'état n'est alors pas modifié
  const handleApplyTitrationRatios = (updatedProfile: UserProfileDT1) => {
    if (saveUserProfile(updatedProfile).length === 0) {
      setUserProfile(updatedProfile);
    }
  };

  const handleSaveProfile = (newProfile: UserProfileDT1) => {
    if (saveUserProfile(newProfile).length === 0) {
      setUserProfile(newProfile);
    }
  };

  const handleToggleFavorite = (mealId: string) => {
    const updated = toggleFavoriteMeal(mealId);
    setSavedMeals(updated);
  };

  const handleDeleteMeal = (mealId: string) => {
    const updated = deleteMealFromHistory(mealId);
    setSavedMeals(updated);
  };

  const handleClearAllMeals = () => {
    const updated = clearAllMeals();
    setSavedMeals(updated);
  };

  const handleRefreshHistory = () => {
    setSavedMeals(loadSavedMeals());
  };

  const handleSavePostPrandial = (mealId: string, glucoseValue: number) => {
    try {
      const updated = savePostPrandialMeasurement(
        mealId,
        glucoseValue,
        userProfile.targetGlucose,
        userProfile.glucoseUnit
      );
      setSavedMeals(updated);
    } catch (err) {
      // La saisie est déjà validée dans la fenêtre H+2 ; une valeur ininterprétable n'est jamais enregistrée
      console.error('Glycémie post-prandiale refusée:', err);
    }
  };

  const handleSaveCGMConfig = (newCfg: CGMConfig) => {
    setCgmConfig(newCfg);
    saveCGMConfig(newCfg);
    // Mettre à jour également dans le profil patient pour la cohérence globale
    const updatedProfile = { ...userProfile, cgmConfig: newCfg };
    setUserProfile(updatedProfile);
    saveUserProfile(updatedProfile);
  };

  // Lance une analyse de repas. En cas d'échec, aucune estimation n'est inventée :
  // l'utilisateur revient à l'accueil avec un message d'erreur explicite.
  const runMealAnalysis = async (
    stepLabel: string,
    inputType: InputMode,
    defaultName: string,
    getResult: () => Promise<MealAnalysisResult>
  ) => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysisStepLabel(stepLabel);
    setActiveInputModal(null);
    setMealFlowState('analyzing');

    try {
      const result = await getResult();
      setCurrentMealDraft(toAnalyzedMeal(result, inputType, defaultName, auth.currentUser?.uid || 'user-local'));
      setMealFlowState('review');
    } catch (err) {
      console.error(`Meal analysis error (${inputType}):`, err);
      const message =
        err instanceof MealAnalysisError
          ? err.message
          : 'Analyse impossible. Réessayez ou saisissez votre repas manuellement.';
      setAnalysisError(
        isAr
          ? `تعذر تحليل الوجبة، لم يتم احتساب أي جرعة. (${message})`
          : `${message} Aucune estimation de glucides ni de dose n'a été calculée.`
      );
      setCurrentMealDraft(null);
      setMealFlowState('idle');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle Photo Analysis
  const handleAnalyzePhoto = async (imageData: string, presetName?: string) => {
    const preset = presetName ? SAMPLE_MEAL_PRESETS.find((p) => p.name === presetName) : undefined;
    await runMealAnalysis(
      isAr ? 'التعرف البصري على الأطعمة…' : 'Identification visuelle des aliments…',
      'photo',
      presetName || (isAr ? 'وجبة مصورة' : 'Repas photographié'),
      // Les exemples de démonstration utilisent leur composition de référence (pas d'analyse IA de l'image d'exemple)
      () => (preset ? Promise.resolve(buildMealFromPreset(preset)) : requestMealAnalysis({ mode: 'photo', image: imageData }))
    );
  };

  // Handle Text Analysis
  const handleAnalyzeText = async (text: string) => {
    await runMealAnalysis(
      isAr ? 'تحليل النص واستخراج الكميات والمكونات…' : 'Analyse du texte et extraction des quantités…',
      'text',
      isAr ? 'وجبة مكتوبة' : 'Repas décrit',
      () => requestMealAnalysis({ mode: 'text', text })
    );
  };

  // Handle Voice Analysis
  const handleAnalyzeVoice = async (transcript: string, voiceLang?: string) => {
    await runMealAnalysis(
      isAr
        ? 'التعرف على الصوت واستخراج القيم الغذائية…'
        : 'Transcription Derja / Français et extraction nutritionnelle…',
      'voice',
      isAr ? 'وجبة مسجلة صوتياً' : 'Repas dicté',
      () => requestMealAnalysis({ mode: 'voice', audioTranscript: transcript, voiceLang: voiceLang || 'fr-FR' })
    );
  };

  // Handle Barcode
  const handleAnalyzeBarcode = async (code: string) => {
    await runMealAnalysis(
      isAr
        ? 'البحث عن رمز EAN وقراءة الحقائق الغذائية للمنتج…'
        : 'Interrogation du code EAN et extraction nutritionnelle…',
      'barcode',
      isAr ? 'منتج غذائي' : 'Produit industriel',
      () => requestMealAnalysis({ mode: 'barcode', barcode: code })
    );
  };

  // Handle Nutrition Label OCR
  const handleAnalyzeLabel = async (imageOrText: string, isImage?: boolean) => {
    if (isImage || imageOrText.startsWith('data:image')) {
      await runMealAnalysis(
        isAr
          ? 'قراءة جدول القيمة الغذائية بالذكاء الاصطناعي (OCR)…'
          : "Lecture OCR de l'étiquette nutritionnelle par IA…",
        'barcode',
        isAr ? 'منتج ممسوح (البطاقة الغذائية)' : 'Produit scanné (Étiquette)',
        () => requestMealAnalysis({ mode: 'label_photo', image: imageOrText })
      );
    } else {
      handleAnalyzeText(imageOrText);
    }
  };

  // Handle Validation and Commit
  const handleConfirmMeal = (validatedMeal: AnalyzedMeal) => {
    saveSingleMeal(validatedMeal);
    setSavedMeals((prev) => [validatedMeal, ...prev.filter((m) => m.id !== validatedMeal.id)]);
    setCurrentMealDraft(validatedMeal);
    setMealFlowState('success');
  };

  const handleStartNewMeal = () => {
    setAnalysisError(null);
    setCurrentMealDraft(null);
    setMealFlowState('idle');
    setCurrentTab('app');
  };

  if (viewScreen === 'landing') {
    return (
      <>
        <LandingPageView
          onStartSignUp={() => {
            setAuthInitialMode('signup');
            setViewScreen('auth');
          }}
          onStartLogin={() => {
            setAuthInitialMode('login');
            setViewScreen('auth');
          }}
          onEnterAppDirectly={() => {
            localStorage.setItem('glucomal_screen_preference_v1', 'app');
            setViewScreen('app');
          }}
          onOpenDoctorPortal={() => {
            localStorage.setItem('glucomal_screen_preference_v1', 'app');
            setCurrentTab('doctor');
            setViewScreen('app');
          }}
          onOpenInstallModal={() => setIsPWAInstallModalOpen(true)}
          deferredPrompt={deferredPrompt}
        />
        <PWAInstallBanner onOpenInstallModal={() => setIsPWAInstallModalOpen(true)} />
        <PWAInstallModal
          isOpen={isPWAInstallModalOpen}
          onClose={() => setIsPWAInstallModalOpen(false)}
          deferredPrompt={deferredPrompt}
          onInstalledSuccess={() => {
            setIsPWAInstallModalOpen(false);
          }}
        />
      </>
    );
  }

  if (viewScreen === 'auth') {
    return (
      <AuthScreen
        initialMode={authInitialMode}
        onSuccess={(updatedProfile) => {
          setUserProfile(updatedProfile);
          setSavedMeals(loadSavedMeals());
          localStorage.setItem('glucomal_screen_preference_v1', 'app');
          setViewScreen('app');
        }}
        onCancel={() => {
          localStorage.setItem('glucomal_screen_preference_v1', 'app');
          setViewScreen('app');
        }}
        onBackToLanding={() => setViewScreen('landing')}
      />
    );
  }

  return (
    <div className={`min-h-screen bg-slate-50/50 text-slate-900 flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900 ${isRtl ? 'font-arabic' : ''}`} dir={isRtl ? 'rtl' : 'ltr'}>
      {/* PWA offline alert & install banner */}
      <PWAInstallBanner onOpenInstallModal={() => setIsPWAInstallModalOpen(true)} />

      {/* Clinically Styled Header */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        activeMealCount={savedMeals.length}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
        onOpenMedicalReport={() => setIsReportModalOpen(true)}
        onOpenCGM={() => setIsCGMModalOpen(true)}
        onOpenCloudSync={() => setIsCloudSyncOpen(true)}
        onOpenLanding={() => setViewScreen('landing')}
        onOpenAuth={() => {
          setAuthInitialMode('login');
          setViewScreen('auth');
        }}
        onOpenInstallModal={() => setIsPWAInstallModalOpen(true)}
        userProfile={userProfile}
      />

      {/* Main App Body */}
      <main className="flex-1 pb-16">
        {/* Rappels H+2 Post-Prandiaux Actifs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3">
          <PostPrandialReminderBanner
            meals={savedMeals}
            userProfile={userProfile}
            onRecordMeasurement={(meal) => setPostPrandialMealTarget(meal)}
            onOpenRecordH2={(mealId) => {
              const target = savedMeals.find((m) => m.id === mealId);
              if (target) setPostPrandialMealTarget(target);
            }}
            onOpenCGMSync={() => setIsCGMModalOpen(true)}
          />
        </div>

        {/* Tab 1: App Workflow */}
        {currentTab === 'app' && (
          <div>
            {mealFlowState === 'idle' && analysisError && (
              <div className="max-w-3xl mx-auto px-4 pt-4">
                <div
                  role="alert"
                  className="p-3.5 rounded-2xl bg-rose-50 border border-rose-300 text-rose-900 text-xs font-semibold flex items-start gap-2.5"
                >
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span className="flex-1">{analysisError}</span>
                  <button
                    type="button"
                    onClick={() => setAnalysisError(null)}
                    className="text-rose-700 hover:text-rose-900 cursor-pointer"
                    aria-label={isAr ? 'إغلاق' : 'Fermer'}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {mealFlowState === 'idle' && (
              <HomeMealEntry
                onSelectMode={(mode) => setActiveInputModal(mode)}
                recentMeals={savedMeals}
                onSelectRecentMeal={(meal) => {
                  setCurrentMealDraft(meal);
                  setMealFlowState('review');
                }}
                onOpenBenchmark={() => setCurrentTab('benchmark')}
              />
            )}

            {mealFlowState === 'analyzing' && (
              <div className="max-w-md mx-auto py-20 px-4 text-center animate-in fade-in">
                <div className="w-18 h-18 rounded-3xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-emerald-500/20">
                  <RefreshCw className="w-8 h-8 animate-spin" />
                </div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  {isAr ? 'جاري تحليل وجبتك وحساب الكربوهيدرات…' : 'Analyse de votre repas en cours…'}
                </h2>
                <p className="text-xs text-slate-500 mt-1 mb-6">
                  {analysisStepLabel}
                </p>

                {/* Progress Indicators */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2.5 text-left rtl:text-right text-xs text-slate-600">
                  <div className="flex items-center gap-2 font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
                    <span>{isAr ? 'تفكيك المكونات البصرية للمكونات' : 'Décomposition des ingrédients visuels'}</span>
                  </div>
                  <div className="flex items-center gap-2 font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-600" />
                    <span>{isAr ? 'تقدير الكميات والأحجام في الصحن (قطر 24 سم)' : 'Estimation des volumes en assiette (diamètre 24 cm)'}</span>
                  </div>
                  <div className="flex items-center gap-2 font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-600" />
                    <span>{isAr ? 'حساب دقيق بالاعتماد على القاعدة التونسية' : 'Calcul déterministe avec la base tunisienne'}</span>
                  </div>
                </div>
              </div>
            )}

            {mealFlowState === 'review' && currentMealDraft && (
              <PortionAdjustmentView
                meal={currentMealDraft}
                userProfile={userProfile}
                onUpdateMeal={(updated) => setCurrentMealDraft(updated)}
                onConfirmMeal={handleConfirmMeal}
                onCancel={handleStartNewMeal}
                onOpenProfileModal={() => setIsProfileModalOpen(true)}
                recentMeals={savedMeals}
              />
            )}

            {mealFlowState === 'success' && currentMealDraft && (
              <MealValidationSuccess
                meal={currentMealDraft}
                onNewMeal={handleStartNewMeal}
                onViewHistory={() => setCurrentTab('history')}
              />
            )}
          </div>
        )}

        {/* Tab 2: History & Habits */}
        {currentTab === 'history' && (
          <HistoryView
            meals={savedMeals}
            userProfile={userProfile}
            onSelectMeal={(meal) => {
              setCurrentMealDraft(meal);
              setMealFlowState('review');
              setCurrentTab('app');
            }}
            onNewMeal={handleStartNewMeal}
            onToggleFavorite={handleToggleFavorite}
            onDeleteMeal={handleDeleteMeal}
            onClearAllMeals={handleClearAllMeals}
            onRefreshHistory={handleRefreshHistory}
            onOpenMedicalReport={() => setIsReportModalOpen(true)}
            onOpenCGMSync={() => setIsCGMModalOpen(true)}
            onRecordPostPrandial={(meal) => setPostPrandialMealTarget(meal)}
            onOpenAutoTitration={() => setIsAutoTitrationOpen(true)}
            onOpenCloudSync={() => setIsCloudSyncOpen(true)}
            onQuickSelectMeal={(mealText) => {
              setCurrentTab('app');
              handleAnalyzeText(mealText);
            }}
          />
        )}

        {/* Tab 3: Tunisian Food Database */}
        {currentTab === 'database' && <FoodDatabaseView />}

        {/* Tab 4: Benchmark Dataset — dev-only QA tool, hidden in production */}
        {import.meta.env.DEV && currentTab === 'benchmark' && <BenchmarkView />}

        {/* Tab 5: Diabetologist Portal & Telemonitoring */}
        {currentTab === 'doctor' && (
          <DoctorPortalView
            meals={savedMeals}
            userProfile={userProfile}
            onOpenMedicalReport={() => setIsReportModalOpen(true)}
          />
        )}
      </main>

      {/* Mobile Fixed Bottom Navigation Bar (Hidden in portion review so sticky bolus confirmation has full viewport priority) */}
      {mealFlowState !== 'review' && (
        <BottomNav
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          activeMealCount={savedMeals.length}
          onOpenProfileModal={() => setIsProfileModalOpen(true)}
          onOpenMedicalReport={() => setIsReportModalOpen(true)}
          onOpenCGM={() => setIsCGMModalOpen(true)}
          onOpenCloudSync={() => setIsCloudSyncOpen(true)}
          onOpenAutoTitration={() => setIsAutoTitrationOpen(true)}
          onOpenInstallModal={() => setIsPWAInstallModalOpen(true)}
        />
      )}

      {/* DT1 Therapeutic Profile Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onSave={handleSaveProfile}
        profile={userProfile}
        currentProfile={userProfile}
      />

      {/* Medical Report / Diabetologist Consultation Modal */}
      <MedicalReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        meals={savedMeals}
        userProfile={userProfile}
      />

      {/* CGM Sensor Gateway Modal */}
      <CGMSyncModal
        isOpen={isCGMModalOpen}
        onClose={() => setIsCGMModalOpen(false)}
        config={cgmConfig}
        userProfile={userProfile}
        onSaveConfig={handleSaveCGMConfig}
      />

      {/* Auto-Titration Algorithmic Engine Modal */}
      <AutoTitrationModal
        isOpen={isAutoTitrationOpen}
        onClose={() => setIsAutoTitrationOpen(false)}
        meals={savedMeals}
        userProfile={userProfile}
        onApplyRatios={handleApplyTitrationRatios}
        onApplyNewRatio={(slot, newRatio) => {
          handleApplyTitrationRatios({
            ...userProfile,
            icRatios: {
              ...userProfile.icRatios,
              [slot]: newRatio,
            },
          });
        }}
      />

      {/* Cloud Synchronization Modal */}
      <CloudSyncModal
        isOpen={isCloudSyncOpen}
        onClose={() => setIsCloudSyncOpen(false)}
        onSyncComplete={handleRefreshHistory}
        currentProfile={userProfile}
        onProfileApplied={(profile) => setUserProfile(profile)}
      />

      {/* Post-Prandial H+2 Entry Modal */}
      {postPrandialMealTarget && (
        <PostPrandialEntryModal
          isOpen={!!postPrandialMealTarget}
          onClose={() => setPostPrandialMealTarget(null)}
          meal={postPrandialMealTarget}
          userProfile={userProfile}
          onSave={handleSavePostPrandial}
          onSavePostPrandial={handleSavePostPrandial}
        />
      )}

      {/* Input Modals */}
      <PhotoInputModal
        isOpen={activeInputModal === 'photo'}
        onClose={() => setActiveInputModal(null)}
        onAnalyze={handleAnalyzePhoto}
        isAnalyzing={isAnalyzing}
      />

      <TextInputModal
        isOpen={activeInputModal === 'text'}
        onClose={() => setActiveInputModal(null)}
        onAnalyze={handleAnalyzeText}
        isAnalyzing={isAnalyzing}
      />

      <VoiceInputModal
        isOpen={activeInputModal === 'voice'}
        onClose={() => setActiveInputModal(null)}
        onAnalyze={handleAnalyzeVoice}
        isAnalyzing={isAnalyzing}
      />

      <BarcodeModal
        isOpen={activeInputModal === 'barcode'}
        onClose={() => setActiveInputModal(null)}
        onAnalyzeBarcode={handleAnalyzeBarcode}
        onAnalyzeNutritionLabel={handleAnalyzeLabel}
        isAnalyzing={isAnalyzing}
      />

      {/* PWA Install Instructions & 1-Click Action Modal */}
      <PWAInstallModal
        isOpen={isPWAInstallModalOpen}
        onClose={() => setIsPWAInstallModalOpen(false)}
        deferredPrompt={deferredPrompt}
        onInstalledSuccess={() => {
          setIsPWAInstallModalOpen(false);
        }}
      />
    </div>
  );
}
