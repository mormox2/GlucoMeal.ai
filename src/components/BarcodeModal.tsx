import React, { useState } from 'react';
import { Barcode, Camera, X, Sparkles, Search, RefreshCw, FileText } from 'lucide-react';

interface BarcodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalyzeBarcode: (code: string) => void;
  onAnalyzeNutritionLabel: (imageOrText: string) => void;
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
  const [barcodeInput, setBarcodeInput] = useState('6191234567890');
  const [labelValue, setLabelValue] = useState('Glucides : 52 g / 100 g, Portion : 40 g');

  if (!isOpen) return null;

  const quickTunisianBarcodes = [
    { code: '6191234567890', name: 'Boga Cidre (Canette 250 ml)', carbs: '≈ 26 g glucides' },
    { code: '6194000123456', name: 'Biscuits Saïda Carré (4 biscuits)', carbs: '≈ 22 g glucides' },
    { code: '6192000543210', name: 'Yaourt Délice à boire fraise', carbs: '≈ 22 g glucides' },
  ];

  const handleScanBarcode = (code: string) => {
    onAnalyzeBarcode(code);
  };

  const handleConfirmLabel = () => {
    onAnalyzeNutritionLabel(labelValue);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <Barcode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Produit industriel & Code-barres
              </h2>
              <p className="text-xs text-slate-500">
                Scan code EAN ou lecture d’étiquette nutritionnelle
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

        {/* Subtabs */}
        <div className="flex border-b border-slate-100 bg-slate-50/70 p-1.5 gap-1 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('barcode')}
            className={`flex-1 py-2 rounded-xl transition-all ${
              activeTab === 'barcode'
                ? 'bg-white text-amber-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Code-barres EAN-13
          </button>
          <button
            onClick={() => setActiveTab('label')}
            className={`flex-1 py-2 rounded-xl transition-all ${
              activeTab === 'label'
                ? 'bg-white text-amber-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Photographier l’étiquette
          </button>
        </div>

        {/* Body */}
        <div className="p-5 flex-1 overflow-y-auto">
          {activeTab === 'barcode' ? (
            <div className="space-y-4">
              {/* Camera Scanner Simulation Frame */}
              <div className="relative rounded-2xl bg-slate-900 h-44 flex flex-col items-center justify-center text-white overflow-hidden border border-slate-700">
                <div className="w-56 h-28 border-2 border-dashed border-amber-400/80 rounded-xl flex items-center justify-center relative">
                  <div className="absolute inset-x-0 top-1/2 h-0.5 bg-rose-500 shadow-lg shadow-rose-500 animate-pulse" />
                  <span className="text-[11px] text-amber-200/90 font-medium bg-slate-950/70 px-2 py-0.5 rounded">
                    Centrer le code-barres ici
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 mt-2">
                  Scanner automatique actif
                </span>
              </div>

              {/* Manual Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ou saisir le code EAN :
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    className="flex-1 p-2.5 rounded-xl border border-slate-200 text-xs font-mono"
                    placeholder="Ex: 6191234567890"
                  />
                  <button
                    onClick={() => handleScanBarcode(barcodeInput)}
                    className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Search className="w-3.5 h-3.5" />
                    Rechercher
                  </button>
                </div>
              </div>

              {/* Quick Tunisian Industrial Presets */}
              <div>
                <span className="text-[11px] font-semibold text-slate-500 block mb-2">
                  Produits tunisiens fréquents préenregistrés :
                </span>
                <div className="space-y-2">
                  {quickTunisianBarcodes.map((prod) => (
                    <div
                      key={prod.code}
                      onClick={() => handleScanBarcode(prod.code)}
                      className="p-2.5 rounded-xl bg-amber-50/50 hover:bg-amber-50 border border-amber-200/60 flex items-center justify-between cursor-pointer transition-colors"
                    >
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{prod.name}</h4>
                        <span className="text-[10px] font-mono text-slate-500">EAN {prod.code}</span>
                      </div>
                      <span className="text-xs font-extrabold text-amber-900 bg-amber-100/70 px-2 py-0.5 rounded-md">
                        {prod.carbs}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-center">
                <FileText className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                <h4 className="text-xs font-bold text-amber-900">
                  Lecture intelligente d’étiquette nutritionnelle
                </h4>
                <p className="text-xs text-amber-800/90 mt-1">
                  Si le code-barres n’est pas référencé, photographiez le tableau des valeurs nutritionnelles au dos du produit.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reconnaissance OCR de l’étiquette :
                </label>
                <textarea
                  rows={3}
                  value={labelValue}
                  onChange={(e) => setLabelValue(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-800"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                <strong>Extrait détecté :</strong> 52 g de glucides pour 100 g. Portion consommée : 40 g → <strong>≈ 21 g de glucides</strong>.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            Annuler
          </button>

          {activeTab === 'label' && (
            <button
              onClick={handleConfirmLabel}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-md cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Valider l’étiquette</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
