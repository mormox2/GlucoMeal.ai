import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  X,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  Focus,
  Compass,
  Layers,
  HelpCircle,
  Eye,
  Info,
} from 'lucide-react';
import { SAMPLE_MEAL_PRESETS, PresetMealSample } from '../data/sampleMeals';

interface PhotoInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalyze: (imageData: string, presetName?: string) => void;
  isAnalyzing: boolean;
}

export const PhotoInputModal: React.FC<PhotoInputModalProps> = ({
  isOpen,
  onClose,
  onAnalyze,
  isAnalyzing,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'presets' | 'camera' | 'upload'>('presets');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<PresetMealSample | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Optical guidance & metrology states
  const [guidedAngle, setGuidedAngle] = useState<'45' | '90'>('45');
  const [showPlateOverlay, setShowPlateOverlay] = useState<boolean>(true);
  const [actualTilt, setActualTilt] = useState<number | null>(44);
  const [showGuidanceInfo, setShowGuidanceInfo] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Device orientation tilt sensor (mobile gyroscope)
  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (typeof e.beta === 'number') {
        const tilt = Math.round(Math.abs(e.beta));
        setActualTilt(tilt);
      }
    };

    if (typeof window !== 'undefined' && 'DeviceOrientationEvent' in window && activeSubTab === 'camera') {
      window.addEventListener('deviceorientation', handleOrientation);
      return () => {
        window.removeEventListener('deviceorientation', handleOrientation);
      };
    }
  }, [activeSubTab]);

  // Stop camera when closing
  useEffect(() => {
    if (!isOpen || activeSubTab !== 'camera') {
      if (cameraStream) {
        cameraStream.getTracks().forEach((t) => t.stop());
        setCameraStream(null);
      }
    }
  }, [isOpen, activeSubTab]);

  if (!isOpen) return null;

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setCameraError("Impossible d'accéder à la caméra de l'appareil. Vous pouvez téléverser une photo ou choisir un repas type ci-dessous.");
    }
  };

  const capturePhotoFromCamera = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setPreviewImage(dataUrl);
      setSelectedPreset(null);
      // Stop camera
      if (cameraStream) {
        cameraStream.getTracks().forEach((t) => t.stop());
        setCameraStream(null);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewImage(reader.result as string);
      setSelectedPreset(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPreset = (preset: PresetMealSample) => {
    setSelectedPreset(preset);
    setPreviewImage(preset.sample_image_url);
  };

  const handleConfirmAnalyze = () => {
    if (previewImage) {
      onAnalyze(previewImage, selectedPreset?.name);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Photographier mon repas
              </h2>
              <p className="text-xs text-slate-500">
                L’IA identifie les composants et estime les portions en grammes
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

        {/* Source Subtabs */}
        <div className="flex border-b border-slate-100 bg-slate-50/70 p-1.5 gap-1 text-xs font-semibold">
          <button
            onClick={() => {
              setActiveSubTab('presets');
              setCameraError(null);
            }}
            className={`flex-1 py-2 rounded-xl transition-all ${
              activeSubTab === 'presets'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Plats tunisiens types (Démo)
          </button>
          <button
            onClick={() => {
              setActiveSubTab('camera');
              startCamera();
            }}
            className={`flex-1 py-2 rounded-xl transition-all ${
              activeSubTab === 'camera'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Appareil photo
          </button>
          <button
            onClick={() => {
              setActiveSubTab('upload');
              setCameraError(null);
            }}
            className={`flex-1 py-2 rounded-xl transition-all ${
              activeSubTab === 'upload'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Importer photo
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1">
          {/* Preset Selection Tab */}
          {activeSubTab === 'presets' && (
            <div>
              <p className="text-xs text-slate-600 mb-3">
                Sélectionnez un repas tunisien typique pour tester immédiatement l’analyse d’image et le calcul déterministe :
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                {SAMPLE_MEAL_PRESETS.map((preset) => {
                  const isSelected = selectedPreset?.id === preset.id;
                  return (
                    <div
                      key={preset.id}
                      onClick={() => handleSelectPreset(preset)}
                      className={`group relative rounded-2xl border-2 overflow-hidden cursor-pointer transition-all ${
                        isSelected
                          ? 'border-emerald-600 ring-2 ring-emerald-500/20'
                          : 'border-slate-200/80 hover:border-emerald-300'
                      }`}
                    >
                      <div className="h-28 bg-slate-100 relative overflow-hidden">
                        <img
                          src={preset.sample_image_url}
                          alt={preset.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                        )}
                        <span className="absolute bottom-1.5 left-2 px-2 py-0.5 rounded-md bg-slate-900/80 text-[10px] text-white font-medium backdrop-blur-xs">
                          {preset.category}
                        </span>
                      </div>
                      <div className="p-2.5 bg-white">
                        <h4 className="text-xs font-bold text-slate-900 line-clamp-1">
                          {preset.name}
                        </h4>
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                          {preset.name_ar}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Camera Capture Tab with Optical Guidance UX */}
          {activeSubTab === 'camera' && (
            <div className="flex flex-col items-center">
              {cameraError ? (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-center w-full">
                  <p className="text-xs text-amber-800 mb-3">{cameraError}</p>
                  <button
                    onClick={() => setActiveSubTab('presets')}
                    className="px-3 py-1.5 rounded-xl bg-amber-600 text-white text-xs font-semibold cursor-pointer"
                  >
                    Essayer avec un plat type
                  </button>
                </div>
              ) : previewImage && !cameraStream ? (
                <div className="w-full text-center space-y-3">
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-xs">
                    <img
                      src={previewImage}
                      alt="Photo prise"
                      className="w-full h-64 object-cover"
                    />
                    <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-xs text-[11px] font-bold text-white flex items-center gap-1.5">
                      <Focus className="w-3 h-3 text-emerald-400" />
                      <span>Calibré angle {guidedAngle}°</span>
                    </div>
                  </div>
                  <button
                    onClick={startCamera}
                    className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Reprendre une autre photo
                  </button>
                </div>
              ) : (
                <div className="w-full space-y-3">
                  {/* Optical Guidance Selector Toolbar */}
                  <div className="p-2.5 rounded-2xl bg-slate-100/90 border border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                    {/* Angle Choice */}
                    <div className="flex items-center gap-1 bg-white p-1 rounded-xl shadow-2xs border border-slate-200/60">
                      <button
                        onClick={() => setGuidedAngle('45')}
                        className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                          guidedAngle === '45'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                        title="Recommandé pour plats pyramidaux & étagés (Couscous, Tajines, Ojja)"
                      >
                        <span>📐 45° Latérale (Relief)</span>
                      </button>
                      <button
                        onClick={() => setGuidedAngle('90')}
                        className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                          guidedAngle === '90'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                        title="Recommandé pour surfaces planes & bols (Lablabi, Soupe Chorba)"
                      >
                        <span>🧭 90° Zénithale (Bols)</span>
                      </button>
                    </div>

                    {/* Plate Grid Toggle & Help */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setShowPlateOverlay(!showPlateOverlay)}
                        className={`px-2 py-1 rounded-lg font-medium border text-[11px] cursor-pointer transition-colors flex items-center gap-1 ${
                          showPlateOverlay
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : 'bg-white text-slate-600 border-slate-200'
                        }`}
                      >
                        <Focus className="w-3 h-3 text-emerald-600" />
                        <span>Gabarit 24 cm</span>
                      </button>

                      <button
                        onClick={() => setShowGuidanceInfo(!showGuidanceInfo)}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white transition-colors cursor-pointer"
                        title="Conseils optiques pour diabétiques"
                      >
                        <HelpCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Contextual Clinical Advice Accordion */}
                  {showGuidanceInfo && (
                    <div className="p-3 rounded-2xl bg-blue-50/80 border border-blue-200 text-xs text-blue-900 space-y-1 animate-in fade-in duration-150">
                      <div className="font-bold flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 text-blue-600" />
                        <span>Pourquoi l'angle de prise de vue est crucial pour le DT1 :</span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-blue-800">
                        • <strong>Vue à 45°</strong> : Permet au modèle d'estimer le relief 3D et l'épaisseur de semoule de couscous ou la sauce.
                        <br />
                        • <strong>Vue à 90°</strong> : Indispensable pour voir l'intégralité du bol de lablabi et identifier le pain au fond.
                        <br />
                        • <strong>Règle d'or</strong> : Cadrez toujours le pain tabouna et les verres de boisson dans le même cliché.
                      </p>
                    </div>
                  )}

                  {/* Camera Viewfinder with Augmented HUD Overlays */}
                  <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-4/3 flex items-center justify-center shadow-inner border border-slate-800">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />

                    {/* HUD Top Status Bar */}
                    <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none">
                      <div className="px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-xs text-white text-[11px] font-mono flex items-center gap-1.5 border border-white/10">
                        <Compass className="w-3 h-3 text-emerald-400" />
                        <span>Angle cible : {guidedAngle}°</span>
                        <span className="text-emerald-400 font-bold">● Alignement OK</span>
                      </div>

                      <div className="px-2 py-0.5 rounded-full bg-emerald-950/80 backdrop-blur-xs text-emerald-300 text-[10px] font-mono border border-emerald-500/30">
                        Échelle : Assiette 24 cm
                      </div>
                    </div>

                    {/* Augmented Metrological Plate Wireframe Overlay */}
                    {showPlateOverlay && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        {guidedAngle === '45' ? (
                          // Perspective Ellipse for 45°
                          <div className="relative w-3/4 h-3/5 rounded-[50%] border-2 border-dashed border-emerald-400/70 flex items-center justify-center shadow-2xl">
                            {/* Crosshairs */}
                            <div className="absolute inset-x-0 h-px bg-emerald-400/30" />
                            <div className="absolute inset-y-0 w-px bg-emerald-400/30" />
                            <div className="px-3 py-1 rounded-full bg-slate-900/80 text-[10px] font-bold text-emerald-300 backdrop-blur-xs border border-emerald-500/40">
                              Assiette étalon ~24 cm (Vue 45°)
                            </div>
                          </div>
                        ) : (
                          // Concentric Circle for 90°
                          <div className="relative w-3/5 aspect-square rounded-full border-2 border-dashed border-emerald-400/80 flex items-center justify-center shadow-2xl">
                            <div className="absolute w-4/5 aspect-square rounded-full border border-emerald-400/40" />
                            <div className="absolute inset-x-0 h-px bg-emerald-400/30" />
                            <div className="absolute inset-y-0 w-px bg-emerald-400/30" />
                            <div className="px-3 py-1 rounded-full bg-slate-900/80 text-[10px] font-bold text-emerald-300 backdrop-blur-xs border border-emerald-500/40">
                              Bol / Assiette zénithale (90°)
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Bottom DT1 Guidance Ribbon */}
                    <div className="absolute bottom-20 inset-x-4 flex justify-center pointer-events-none">
                      <div className="px-3 py-1 rounded-full bg-slate-900/85 backdrop-blur-xs text-[10px] text-amber-200 border border-amber-500/40 flex items-center gap-1.5 shadow-lg">
                        <span>🥖 Inclure le pain / boissons</span>
                        <span className="text-slate-500">•</span>
                        <span>💡 Éviter les ombres portées</span>
                      </div>
                    </div>

                    {/* Shutter Button */}
                    <div className="absolute inset-x-0 bottom-4 flex justify-center">
                      <button
                        onClick={capturePhotoFromCamera}
                        className="w-16 h-16 rounded-full bg-white border-4 border-emerald-500 shadow-xl flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition-transform"
                        title="Capturer le repas"
                      >
                        <div className="w-11 h-11 rounded-full bg-emerald-600" />
                      </button>
                    </div>
                  </div>

                  <p className="text-center text-[11px] text-slate-500">
                    {guidedAngle === '45'
                      ? 'Vue 45° active : Idéale pour le couscous, le tajine tunisien et les plats à relief.'
                      : 'Vue 90° active : Idéale pour le lablabi, les soupes, la salade méchouia et les bols.'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Upload File Tab */}
          {activeSubTab === 'upload' && (
            <div>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              {previewImage ? (
                <div className="text-center">
                  <img
                    src={previewImage}
                    alt="Aperçu import"
                    className="w-full h-60 object-cover rounded-2xl border border-slate-200"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-3 inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Changer de photo
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-8 text-center cursor-pointer hover:bg-emerald-50/30 transition-colors"
                >
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-3">
                    <Upload className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-semibold text-slate-800 block">
                    Glissez-déposez ou cliquez pour importer une photo
                  </span>
                  <span className="text-xs text-slate-500 mt-1 block">
                    JPG, PNG ou HEIC (photo de votre repas)
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Selected Preview Banner */}
          {previewImage && (
            <div className="mt-4 p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <img
                  src={previewImage}
                  alt="Vignette"
                  className="w-10 h-10 rounded-xl object-cover border border-emerald-300"
                />
                <div>
                  <span className="text-xs font-bold text-emerald-950 block">
                    {selectedPreset ? selectedPreset.name : 'Photo prête pour analyse'}
                  </span>
                  <span className="text-[11px] text-emerald-700">
                    Prêt pour décomposition et calcul des glucides
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            Annuler
          </button>

          <button
            id="btn-confirm-analyze-photo"
            disabled={!previewImage || isAnalyzing}
            onClick={handleConfirmAnalyze}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer ${
              !previewImage || isAnalyzing
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/25'
            }`}
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Analyse de votre repas…</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Analyser le repas</span>
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
