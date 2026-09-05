import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Barcode,
  Camera,
  X,
  Sparkles,
  Search,
  RefreshCw,
  FileText,
  Upload,
  Zap,
  ZapOff,
  SwitchCamera,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  ScanLine,
} from 'lucide-react';
import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser';

interface BarcodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalyzeBarcode: (code: string) => void;
  onAnalyzeNutritionLabel: (imageOrText: string, isImage?: boolean) => void;
  isAnalyzing: boolean;
}

export const BarcodeModal: React.FC<BarcodeModalProps> = ({
  isOpen,
  onClose,
  onAnalyzeBarcode,
  onAnalyzeNutritionLabel,
  isAnalyzing,
}) => {
  const [activeTab, setActiveTab] = useState<'barcode' | 'label'>('barcode');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [labelValue, setLabelValue] = useState('');
  const [labelImagePreview, setLabelImagePreview] = useState<string | null>(null);

  // Camera states
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasTorch, setHasTorch] = useState<boolean>(false);
  const [isTorchOn, setIsTorchOn] = useState<boolean>(false);
  const [detectedCode, setDetectedCode] = useState<string | null>(null);
  const [isDecodingFile, setIsDecodingFile] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scannerControlsRef = useRef<IScannerControls | null>(null);
  const fileInputBarcodeRef = useRef<HTMLInputElement | null>(null);
  const fileInputLabelRef = useRef<HTMLInputElement | null>(null);
  const isScanningRef = useRef<boolean>(false);

  const quickTunisianBarcodes = [
    { code: '6191234567890', name: 'Boga Cidre (Canette 250 ml)', carbs: '26 g glucides' },
    { code: '6191234567891', name: 'Boga Lim (Canette 250 ml)', carbs: '25 g glucides' },
    { code: '6194000123456', name: 'Biscuits Saïda Carré (4 biscuits)', carbs: '22 g glucides' },
    { code: '6194000654321', name: 'Biscuits Saïda Major Chocolat', carbs: '24 g glucides' },
    { code: '6192000543210', name: 'Yaourt Délice Danone fraise', carbs: '22 g glucides' },
    { code: '6191000888999', name: 'Tomate concentrée Sicam (30g)', carbs: '4 g glucides' },
  ];

  // Subtle audio & haptic feedback on scan
  const triggerScanFeedback = useCallback(() => {
    try {
      if (typeof window !== 'undefined') {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const audioCtx = new AudioContextClass();
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(987.77, audioCtx.currentTime); // Note B5
          gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start();
          osc.stop(audioCtx.currentTime + 0.12);
        }
      }
    } catch {
      // Audio playback blocked by policy
    }

    try {
      if (navigator.vibrate) {
        navigator.vibrate(120);
      }
    } catch {
      // Vibration not supported
    }
  }, []);

  const handleDetectedBarcode = useCallback(
    (code: string) => {
      const clean = code.trim();
      if (!clean || clean === detectedCode) return;
      setDetectedCode(clean);
      triggerScanFeedback();

      // Stop camera stream cleanly before delegating
      stopCamera();

      // Trigger analysis
      onAnalyzeBarcode(clean);
    },
    [detectedCode, triggerScanFeedback, onAnalyzeBarcode]
  );

  // Stop camera tracks cleanly
  const stopCamera = useCallback(() => {
    if (scannerControlsRef.current) {
      try {
        scannerControlsRef.current.stop();
      } catch (e) {
        console.warn('Error stopping scanner controls:', e);
      }
      scannerControlsRef.current = null;
    }

    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
      } catch (e) {
        console.warn('Error stopping stream tracks:', e);
      }
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsCameraActive(false);
    setIsTorchOn(false);
    setHasTorch(false);
    isScanningRef.current = false;
  }, []);

  // Start live camera stream
  const startCamera = useCallback(async () => {
    stopCamera();
    setCameraError(null);
    setDetectedCode(null);

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }

      setIsCameraActive(true);
      isScanningRef.current = true;

      // Check for torch capability
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack && videoTrack.getCapabilities) {
        const capabilities: any = videoTrack.getCapabilities();
        if (capabilities && 'torch' in capabilities) {
          setHasTorch(true);
        }
      }

      // 1. Try modern native BarcodeDetector if available (Chromium / Android Chrome)
      let nativeDetector: any = null;
      if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
        try {
          nativeDetector = new (window as any).BarcodeDetector({
            formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'qr_code'],
          });
        } catch (e) {
          console.warn('Native BarcodeDetector initialization fallback:', e);
        }
      }

      // Interval scanner using native detector or ZXing
      const codeReader = new BrowserMultiFormatReader();

      if (nativeDetector) {
        const scanInterval = setInterval(async () => {
          if (!isScanningRef.current || !videoRef.current || videoRef.current.readyState < 2) {
            return;
          }
          try {
            const detected = await nativeDetector.detect(videoRef.current);
            if (detected && detected.length > 0) {
              const rawVal = detected[0].rawValue;
              if (rawVal) {
                clearInterval(scanInterval);
                handleDetectedBarcode(rawVal);
              }
            }
          } catch {
            // Frame detection skipped
          }
        }, 220);

        // Store interval handle into controls object
        scannerControlsRef.current = {
          stop: () => clearInterval(scanInterval),
        } as IScannerControls;
      } else if (videoRef.current) {
        // 2. Use ZXing decodeFromVideoElement
        try {
          const controls = await codeReader.decodeFromVideoElement(
            videoRef.current,
            (result, err, ctrl) => {
              if (result && isScanningRef.current) {
                const text = result.getText();
                if (text) {
                  ctrl.stop();
                  handleDetectedBarcode(text);
                }
              }
            }
          );
          scannerControlsRef.current = controls;
        } catch (zxingErr) {
          console.warn('ZXing live scanner error:', zxingErr);
        }
      }
    } catch (err: any) {
      console.warn('Camera access denied or unavailable:', err);
      setIsCameraActive(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError(
          "L'autorisation d'accès à la caméra a été refusée. Veuillez l'activer dans les paramètres de votre navigateur, ou téléversez une photo ci-dessous."
        );
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError("Aucun appareil photo ou webcam détecté sur cet appareil.");
      } else {
        setCameraError("Impossible d'activer la caméra (" + (err.message || 'Erreur inconnue') + ").");
      }
    }
  }, [facingMode, handleDetectedBarcode, stopCamera]);

  // Toggle torch / flash
  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;
    try {
      const nextState = !isTorchOn;
      await (track as any).applyConstraints({
        advanced: [{ torch: nextState }],
      });
      setIsTorchOn(nextState);
    } catch (e) {
      console.warn('Failed to toggle torch:', e);
    }
  };

  // Flip camera between back and front
  const toggleCameraFacing = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Start camera when modal opens in barcode tab, clean on close
  useEffect(() => {
    if (isOpen) {
      if (activeTab === 'barcode') {
        startCamera();
      } else {
        stopCamera();
      }
    } else {
      stopCamera();
      setDetectedCode(null);
      setCameraError(null);
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab, startCamera, stopCamera]);

  // Re-run camera when user changes facing mode
  useEffect(() => {
    if (isOpen && activeTab === 'barcode' && isCameraActive) {
      startCamera();
    }
  }, [facingMode]);

  // Decode barcode from an uploaded image file
  const handleBarcodeFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsDecodingFile(true);
    setCameraError(null);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result as string;
        const codeReader = new BrowserMultiFormatReader();
        try {
          const img = new Image();
          img.src = dataUrl;
          await new Promise((res) => {
            img.onload = res;
          });

          // 1. Try native BarcodeDetector on image
          if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
            try {
              const nativeDetector = new (window as any).BarcodeDetector({
                formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'qr_code'],
              });
              const detected = await nativeDetector.detect(img);
              if (detected && detected.length > 0 && detected[0].rawValue) {
                handleDetectedBarcode(detected[0].rawValue);
                setIsDecodingFile(false);
                return;
              }
            } catch {
              // fallback to zxing
            }
          }

          // 2. Try ZXing decodeFromImageUrl
          const result = await codeReader.decodeFromImageUrl(dataUrl);
          if (result && result.getText()) {
            handleDetectedBarcode(result.getText());
          } else {
            setCameraError(
              "Aucun code-barres lisible n'a été détecté dans cette photo. Rapprochez l'appareil ou saisissez le code EAN manuellement."
            );
          }
        } catch (decErr) {
          console.warn('Barcode image decode error:', decErr);
          setCameraError(
            "Code-barres illisible dans cette photo. Assurez-vous d'un bon éclairage sans reflet ou saisissez le code ci-dessous."
          );
        } finally {
          setIsDecodingFile(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error('File read error:', err);
      setIsDecodingFile(false);
    }
  };

  // Capture photo from live camera for nutrition label OCR
  const handleSnapLabelFromCamera = async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setLabelImagePreview(dataUrl);
      stopCamera();
    }
  };

  // Upload photo of nutrition label
  const handleLabelFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setLabelImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmLabelAnalysis = () => {
    if (labelImagePreview) {
      onAnalyzeNutritionLabel(labelImagePreview, true);
    } else if (labelValue.trim()) {
      onAnalyzeNutritionLabel(labelValue.trim(), false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="modal-barcode-scanner"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-md shadow-amber-500/20 font-bold">
              <Barcode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                Scanner produit & Code-barres
              </h2>
              <p className="text-xs text-slate-500">
                Caméra en direct EAN-13 ou lecture d’étiquette nutritionnelle
              </p>
            </div>
          </div>
          <button
            id="btn-close-barcode-modal"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
            title="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Subtabs */}
        <div className="flex border-b border-slate-100 bg-slate-50/80 p-1.5 gap-1 text-xs font-semibold">
          <button
            id="tab-barcode-camera"
            onClick={() => {
              setActiveTab('barcode');
              setLabelImagePreview(null);
            }}
            className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'barcode'
                ? 'bg-white text-amber-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ScanLine className="w-3.5 h-3.5 text-amber-600" />
            <span>Code-barres EAN en direct</span>
          </button>
          <button
            id="tab-label-ocr"
            onClick={() => {
              setActiveTab('label');
              stopCamera();
            }}
            className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'label'
                ? 'bg-white text-amber-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-amber-600" />
            <span>Photographier l’étiquette</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4">
          {activeTab === 'barcode' ? (
            <div className="space-y-4">
              {/* REAL LIVE CAMERA VIEWFINDER */}
              <div className="relative rounded-2xl bg-slate-950 aspect-[4/3] sm:h-60 w-full flex flex-col items-center justify-center text-white overflow-hidden border-2 border-slate-800 shadow-inner">
                {/* Live Video Element */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                    isCameraActive ? 'opacity-100' : 'opacity-0'
                  }`}
                />

                {/* Reticle Overlay when Camera is Active */}
                {isCameraActive && (
                  <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                    <div className="relative w-64 h-32 border-2 border-amber-400/90 rounded-2xl shadow-lg shadow-amber-500/20 flex items-center justify-center bg-amber-500/5">
                      {/* Laser Line */}
                      <div className="absolute inset-x-0 top-1/2 h-0.5 bg-rose-500 shadow-lg shadow-rose-500 animate-pulse" />
                      {/* Corner Target Markers */}
                      <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-amber-300 rounded-tl" />
                      <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-amber-300 rounded-tr" />
                      <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-amber-300 rounded-bl" />
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-amber-300 rounded-br" />

                      <span className="text-[10px] text-amber-200 font-medium bg-slate-950/80 px-2 py-0.5 rounded-full border border-amber-400/30">
                        Alignez le code-barres dans le cadre
                      </span>
                    </div>

                    <span className="text-[11px] text-emerald-400 font-semibold mt-3 bg-slate-950/80 px-3 py-1 rounded-full flex items-center gap-1.5 border border-emerald-500/30">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      Reconnaissance continue active
                    </span>
                  </div>
                )}

                {/* Camera Inactive / Permission Prompt Screen */}
                {!isCameraActive && (
                  <div className="p-5 text-center flex flex-col items-center justify-center z-10 max-w-sm">
                    <div className="w-12 h-12 rounded-2xl bg-slate-800 text-amber-400 flex items-center justify-center mb-3">
                      <Camera className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-white mb-1">
                      Caméra en attente d’activation
                    </h3>
                    <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                      Cliquez ci-dessous pour lancer le scanner en direct sur votre appareil.
                    </p>
                    <button
                      id="btn-start-scanner-camera"
                      onClick={startCamera}
                      className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md cursor-pointer transition-all active:scale-95"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Activer la caméra</span>
                    </button>
                  </div>
                )}

                {/* Top Controls Bar (Torch & Flip) */}
                {isCameraActive && (
                  <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between z-20 pointer-events-auto">
                    <span className="text-[10px] font-bold text-slate-200 bg-slate-900/80 backdrop-blur-xs px-2.5 py-1 rounded-full border border-slate-700">
                      EAN-13 / EAN-8
                    </span>
                    <div className="flex items-center gap-1.5">
                      {hasTorch && (
                        <button
                          onClick={toggleTorch}
                          className={`p-2 rounded-xl backdrop-blur-xs transition-colors cursor-pointer ${
                            isTorchOn ? 'bg-amber-500 text-slate-950' : 'bg-slate-900/80 text-white'
                          }`}
                          title="Lampe torche"
                        >
                          {isTorchOn ? <Zap className="w-4 h-4" /> : <ZapOff className="w-4 h-4" />}
                        </button>
                      )}
                      <button
                        onClick={toggleCameraFacing}
                        className="p-2 rounded-xl bg-slate-900/80 text-white hover:bg-slate-800 backdrop-blur-xs transition-colors cursor-pointer"
                        title="Changer de caméra"
                      >
                        <SwitchCamera className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Camera Error / Warning Banner */}
              {cameraError && (
                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold">{cameraError}</p>
                    <p className="text-[11px] text-amber-800 mt-0.5">
                      Vous pouvez aussi téléverser une photo du code-barres prise avec votre téléphone.
                    </p>
                  </div>
                </div>
              )}

              {/* File upload fallback button */}
              <div className="flex gap-2">
                <button
                  id="btn-upload-barcode-photo"
                  onClick={() => fileInputBarcodeRef.current?.click()}
                  disabled={isDecodingFile}
                  className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 hover:border-amber-400 bg-slate-50/60 hover:bg-amber-50/50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {isDecodingFile ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-600" />
                      <span>Décodage de la photo en cours…</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5 text-amber-600" />
                      <span>Prendre ou importer une photo du code</span>
                    </>
                  )}
                </button>
                <input
                  ref={fileInputBarcodeRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleBarcodeFileChange}
                />
              </div>

              {/* Manual EAN Input */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Ou saisir manuellement le code EAN :
                </label>
                <div className="flex gap-2">
                  <input
                    id="input-ean-barcode"
                    type="text"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && barcodeInput.trim()) {
                        handleDetectedBarcode(barcodeInput);
                      }
                    }}
                    className="flex-1 p-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:outline-hidden text-xs font-mono bg-white"
                    placeholder="Ex : 6191234567890"
                  />
                  <button
                    id="btn-search-barcode"
                    onClick={() => handleDetectedBarcode(barcodeInput)}
                    disabled={!barcodeInput.trim()}
                    className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Rechercher</span>
                  </button>
                </div>
              </div>

              {/* Quick Tunisian Industrial Presets */}
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-600 block mb-2">
                  Codes fréquents du marché tunisien (1 clic) :
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {quickTunisianBarcodes.map((prod) => (
                    <div
                      key={prod.code}
                      onClick={() => handleDetectedBarcode(prod.code)}
                      className="p-2.5 rounded-xl bg-amber-50/40 hover:bg-amber-100/60 border border-amber-200/60 flex items-center justify-between cursor-pointer transition-colors"
                    >
                      <div className="pr-2 min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 truncate">{prod.name}</h4>
                        <span className="text-[10px] font-mono text-slate-500">{prod.code}</span>
                      </div>
                      <span className="text-[11px] font-extrabold text-amber-900 bg-amber-100/80 px-2 py-0.5 rounded-md whitespace-nowrap">
                        {prod.carbs}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* TAB 2: PHOTOGRAPHIER L'ÉTIQUETTE NUTRITIONNELLE */
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
                <FileText className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold">Lecture IA du tableau nutritionnel</h4>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    Photographiez le tableau au dos de l’emballage (lignes « Glucides / Carbohydrates »,
                    « dont sucres », « portion »). L’IA extrait directement les valeurs pour le bolus.
                  </p>
                </div>
              </div>

              {/* Live Viewfinder for Label OR Preview of Captured Photo */}
              {labelImagePreview ? (
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 max-h-60 flex items-center justify-center">
                  <img
                    src={labelImagePreview}
                    alt="Étiquette nutritionnelle capturée"
                    className="max-h-60 w-full object-contain"
                  />
                  <button
                    onClick={() => setLabelImagePreview(null)}
                    className="absolute top-2 right-2 p-1.5 bg-slate-900/80 text-white rounded-full hover:bg-rose-600 transition-colors cursor-pointer"
                    title="Reprendre la photo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : isCameraActive ? (
                <div className="relative rounded-2xl bg-slate-950 aspect-[4/3] sm:h-56 w-full flex flex-col items-center justify-center text-white overflow-hidden border border-slate-800">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-amber-400/80 m-4 rounded-xl flex items-center justify-center">
                    <span className="text-[11px] bg-slate-950/80 text-amber-200 px-2 py-0.5 rounded">
                      Cadrer le tableau nutritionnel
                    </span>
                  </div>
                  <button
                    onClick={handleSnapLabelFromCamera}
                    className="absolute bottom-3 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 cursor-pointer z-10"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Prendre la photo</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    onClick={startCamera}
                    className="p-4 rounded-2xl border-2 border-dashed border-amber-300 hover:border-amber-500 bg-amber-50/40 hover:bg-amber-50 flex flex-col items-center justify-center text-center gap-2 cursor-pointer transition-all"
                  >
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                      <Camera className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-slate-800">
                      Ouvrir la caméra
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Photographier directement
                    </span>
                  </button>

                  <button
                    onClick={() => fileInputLabelRef.current?.click()}
                    className="p-4 rounded-2xl border-2 border-dashed border-slate-200 hover:border-amber-400 bg-slate-50 hover:bg-amber-50/30 flex flex-col items-center justify-center text-center gap-2 cursor-pointer transition-all"
                  >
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                      <Upload className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-slate-800">
                      Importer une photo
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Galerie / Fichier
                    </span>
                  </button>
                  <input
                    ref={fileInputLabelRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLabelFileChange}
                  />
                </div>
              )}

              {/* Or Manual Nutritional Text */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ou coller le texte nutritionnel :
                </label>
                <textarea
                  rows={2}
                  value={labelValue}
                  onChange={(e) => setLabelValue(e.target.value)}
                  placeholder="Ex : Glucides : 52g pour 100g, dont sucres 18g, portion 40g..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-hidden focus:border-amber-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            Fermer
          </button>

          {activeTab === 'label' && (
            <button
              onClick={handleConfirmLabelAnalysis}
              disabled={!labelImagePreview && !labelValue.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white shadow-md cursor-pointer transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Analyser avec l’IA</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
