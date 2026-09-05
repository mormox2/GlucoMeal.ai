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
import { TechnicalDocsView } from './components/TechnicalDocsView';
import { HistoryView } from './components/HistoryView';
import { UserProfileModal } from './components/UserProfileModal';
import { MedicalReportModal } from './components/MedicalReportModal';
import { CGMSyncModal } from './components/CGMSyncModal';
import { PostPrandialEntryModal } from './components/PostPrandialEntryModal';
import { AutoTitrationModal } from './components/AutoTitrationModal';
import { CloudSyncModal } from './components/CloudSyncModal';
import { DoctorPortalView } from './components/DoctorPortalView';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { PostPrandialReminderBanner } from './components/PostPrandialReminderBanner';
import { BottomNav } from './components/BottomNav';
import { LandingPageView } from './components/LandingPageView';
import { AuthScreen } from './components/AuthScreen';
import { AnalyzedMeal, InputMode, UserProfileDT1 } from './types';
import {
  loadSavedMeals,
  saveSingleMeal,
  toggleFavoriteMeal,
  deleteMealFromHistory,
  loadUserProfile,
  saveUserProfile,
} from './utils/storage';
import {
  loadCGMConfig,
  saveCGMConfig,
  savePostPrandialMeasurement,
  CGMConfig,
} from './utils/cgmService';
import { Sparkles, RefreshCw } from 'lucide-react';

export default function App() {
  // Screen views: 'landing' (SaaS marketing & parental reassurance) | 'auth' (Login/Signup parent or patient) | 'app' (Main meal & bolus tool)
  const [viewScreen, setViewScreen] = useState<'landing' | 'auth' | 'app'>(() => {
    const pref = localStorage.getItem('glucomal_screen_preference_v1');
    if (pref === 'app') return 'app';
    return 'landing'; // Default to landing page
  });
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'signup'>('signup');

  const [currentTab, setCurrentTab] = useState<'app' | 'history' | 'database' | 'benchmark' | 'specs' | 'doctor'>('app');
  const [activeInputModal, setActiveInputModal] = useState<InputMode | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStepLabel, setAnalysisStepLabel] = useState('Identification visuelle des aliments…');
  const [currentMealDraft, setCurrentMealDraft] = useState<AnalyzedMeal | null>(null);
  const [mealFlowState, setMealFlowState] = useState<'idle' | 'analyzing' | 'review' | 'success'>('idle');

  // DT1 Therapeutic Profile
  const [userProfile, setUserProfile] = useState<UserProfileDT1>(() => loadUserProfile());
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Clinical modals: Medical Report, CGM Sync, Post-Prandial Entry, Auto-Titration & Cloud Sync
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isCGMModalOpen, setIsCGMModalOpen] = useState(false);
  const [isAutoTitrationOpen, setIsAutoTitrationOpen] = useState(false);
  const [isCloudSyncOpen, setIsCloudSyncOpen] = useState(false);
  const [cgmConfig, setCgmConfig] = useState<CGMConfig>(() => loadCGMConfig());
  const [postPrandialMealTarget, setPostPrandialMealTarget] = useState<AnalyzedMeal | null>(null);

  // Saved Meals persistence with LocalStorage & Cloud Sync capability
  const [savedMeals, setSavedMeals] = useState<AnalyzedMeal[]>(() => loadSavedMeals());

  const handleApplyTitrationRatios = (updatedProfile: UserProfileDT1) => {
    setUserProfile(updatedProfile);
    saveUserProfile(updatedProfile);
  };

  const handleSaveProfile = (newProfile: UserProfileDT1) => {
    setUserProfile(newProfile);
    saveUserProfile(newProfile);
  };

  const handleToggleFavorite = (mealId: string) => {
    const updated = toggleFavoriteMeal(mealId);
    setSavedMeals(updated);
  };

  const handleDeleteMeal = (mealId: string) => {
    const updated = deleteMealFromHistory(mealId);
    setSavedMeals(updated);
  };

  const handleRefreshHistory = () => {
    setSavedMeals(loadSavedMeals());
  };

  const handleSavePostPrandial = (mealId: string, glucoseValue: number) => {
    const updated = savePostPrandialMeasurement(mealId, glucoseValue, userProfile);
    setSavedMeals(updated);
  };

  const handleSaveCGMConfig = (newCfg: CGMConfig) => {
    setCgmConfig(newCfg);
    saveCGMConfig(newCfg);
  };

  // Handle Photo Analysis
  const handleAnalyzePhoto = async (imageData: string, presetName?: string) => {
    setIsAnalyzing(true);
    setAnalysisStepLabel('Identification visuelle des aliments…');
    setActiveInputModal(null);
    setMealFlowState('analyzing');

    try {
      setTimeout(() => {
        setAnalysisStepLabel('Estimation des volumes et portions…');
      }, 500);

      setTimeout(() => {
        setAnalysisStepLabel('Interrogation de la base certifiée tunisienne…');
      }, 1000);

      const response = await fetch('/api/analyze-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'photo',
          image: imageData,
          presetName,
        }),
      });

      const data = await response.json();
      const analyzedMeal: AnalyzedMeal = {
        id: `meal-${Date.now()}`,
        user_id: 'user-t1d-1',
        meal_name: data.meal_name || presetName || 'Repas photographié',
        meal_name_ar: data.meal_name_ar || '',
        created_at: new Date().toISOString(),
        input_type: 'photo',
        total_carbs: data.total_carbs,
        overall_confidence: data.overall_confidence || 'high',
        confidence_score: data.confidence_score || 90,
        notes: data.notes,
        items: data.items || [],
      };

      setCurrentMealDraft(analyzedMeal);
      setMealFlowState('review');
    } catch (err) {
      console.error('Photo analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle Text Analysis
  const handleAnalyzeText = async (text: string) => {
    setIsAnalyzing(true);
    setAnalysisStepLabel('Analyse du texte et extraction des quantités…');
    setActiveInputModal(null);
    setMealFlowState('analyzing');

    try {
      const response = await fetch('/api/analyze-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'text', text }),
      });

      const data = await response.json();
      const analyzedMeal: AnalyzedMeal = {
        id: `meal-${Date.now()}`,
        user_id: 'user-t1d-1',
        meal_name: data.meal_name || 'Repas décrit',
        meal_name_ar: data.meal_name_ar || '',
        created_at: new Date().toISOString(),
        input_type: 'text',
        total_carbs: data.total_carbs,
        overall_confidence: data.overall_confidence || 'high',
        confidence_score: data.confidence_score || 88,
        notes: data.notes,
        items: data.items || [],
      };

      setCurrentMealDraft(analyzedMeal);
      setMealFlowState('review');
    } catch (err) {
      console.error('Text analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle Voice Analysis
  const handleAnalyzeVoice = async (transcript: string) => {
    setIsAnalyzing(true);
    setAnalysisStepLabel('Transcription Derja / Français et extraction nutritionnelle…');
    setActiveInputModal(null);
    setMealFlowState('analyzing');

    try {
      const response = await fetch('/api/analyze-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'voice', audioTranscript: transcript }),
      });

      const data = await response.json();
      const analyzedMeal: AnalyzedMeal = {
        id: `meal-${Date.now()}`,
        user_id: 'user-t1d-1',
        meal_name: data.meal_name || 'Repas dicté',
        meal_name_ar: data.meal_name_ar || '',
        created_at: new Date().toISOString(),
        input_type: 'voice',
        total_carbs: data.total_carbs,
        overall_confidence: data.overall_confidence || 'high',
        confidence_score: data.confidence_score || 90,
        notes: data.notes,
        items: data.items || [],
      };

      setCurrentMealDraft(analyzedMeal);
      setMealFlowState('review');
    } catch (err) {
      console.error('Voice analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle Barcode
  const handleAnalyzeBarcode = async (code: string) => {
    setIsAnalyzing(true);
    setAnalysisStepLabel('Interrogation du code EAN et extraction nutritionnelle…');
    setActiveInputModal(null);
    setMealFlowState('analyzing');

    try {
      const response = await fetch('/api/analyze-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'barcode', barcode: code }),
      });

      const data = await response.json();
      const analyzedMeal: AnalyzedMeal = {
        id: `meal-${Date.now()}`,
        user_id: 'user-t1d-1',
        meal_name: data.meal_name || 'Produit industriel',
        meal_name_ar: data.meal_name_ar || '',
        created_at: new Date().toISOString(),
        input_type: 'barcode',
        total_carbs: data.total_carbs,
        overall_confidence: data.overall_confidence || 'high',
        confidence_score: data.confidence_score || 98,
        notes: data.notes,
        items: data.items || [],
      };

      setCurrentMealDraft(analyzedMeal);
      setMealFlowState('review');
    } catch (err) {
      console.error('Barcode analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle Nutrition Label OCR
  const handleAnalyzeLabel = async (imageOrText: string, isImage?: boolean) => {
    if (isImage || imageOrText.startsWith('data:image')) {
      setIsAnalyzing(true);
      setAnalysisStepLabel("Lecture OCR de l'étiquette nutritionnelle par IA…");
      setActiveInputModal(null);
      setMealFlowState('analyzing');

      try {
        const response = await fetch('/api/analyze-meal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode: 'label_photo', image: imageOrText }),
        });

        const data = await response.json();
        const analyzedMeal: AnalyzedMeal = {
          id: `meal-${Date.now()}`,
          user_id: 'user-t1d-1',
          meal_name: data.meal_name || 'Produit scanné (Étiquette)',
          meal_name_ar: data.meal_name_ar || '',
          created_at: new Date().toISOString(),
          input_type: 'barcode',
          total_carbs: data.total_carbs,
          overall_confidence: data.overall_confidence || 'high',
          confidence_score: data.confidence_score || 96,
          notes: data.notes,
          items: data.items || [],
        };

        setCurrentMealDraft(analyzedMeal);
        setMealFlowState('review');
      } catch (err) {
        console.error('Label OCR analysis error:', err);
      } finally {
        setIsAnalyzing(false);
      }
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
    setCurrentMealDraft(null);
    setMealFlowState('idle');
    setCurrentTab('app');
  };

  if (viewScreen === 'landing') {
    return (
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
      />
    );
  }

  if (viewScreen === 'auth') {
    return (
      <AuthScreen
        initialMode={authInitialMode}
        onSuccess={(updatedProfile) => {
          setUserProfile(updatedProfile);
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
    <div className="min-h-screen bg-slate-50/50 text-slate-900 flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* PWA offline alert & install banner */}
      <PWAInstallBanner />

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
                  Analyse de votre repas en cours…
                </h2>
                <p className="text-xs text-slate-500 mt-1 mb-6">
                  {analysisStepLabel}
                </p>

                {/* Progress Indicators */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2.5 text-left text-xs text-slate-600">
                  <div className="flex items-center gap-2 font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
                    <span>Décomposition des ingrédients visuels</span>
                  </div>
                  <div className="flex items-center gap-2 font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-600" />
                    <span>Estimation des volumes en assiette (diamètre 24 cm)</span>
                  </div>
                  <div className="flex items-center gap-2 font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-600" />
                    <span>Calcul déterministe avec la base tunisienne</span>
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

        {/* Tab 4: Benchmark Dataset */}
        {currentTab === 'benchmark' && <BenchmarkView />}

        {/* Tab 5: Technical Specifications */}
        {currentTab === 'specs' && <TechnicalDocsView />}

        {/* Tab 6: Diabetologist Portal & Telemonitoring */}
        {currentTab === 'doctor' && (
          <DoctorPortalView
            meals={savedMeals}
            userProfile={userProfile}
            onUpdateProfile={handleSaveProfile}
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
        />
      )}

      {/* DT1 Therapeutic Profile Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onSave={handleSaveProfile}
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
        onSaveConfig={handleSaveCGMConfig}
      />

      {/* Auto-Titration Algorithmic Engine Modal */}
      <AutoTitrationModal
        isOpen={isAutoTitrationOpen}
        onClose={() => setIsAutoTitrationOpen(false)}
        meals={savedMeals}
        userProfile={userProfile}
        onApplyRatios={handleApplyTitrationRatios}
      />

      {/* Cloud Synchronization Modal */}
      <CloudSyncModal
        isOpen={isCloudSyncOpen}
        onClose={() => setIsCloudSyncOpen(false)}
        onSyncComplete={handleRefreshHistory}
      />

      {/* Post-Prandial H+2 Entry Modal */}
      {postPrandialMealTarget && (
        <PostPrandialEntryModal
          isOpen={!!postPrandialMealTarget}
          onClose={() => setPostPrandialMealTarget(null)}
          meal={postPrandialMealTarget}
          userProfile={userProfile}
          onSave={handleSavePostPrandial}
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
    </div>
  );
}
