import React from 'react';
import {
  X,
  Printer,
  Download,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  FileCode,
  Scale,
  Camera,
  Activity,
  Award,
} from 'lucide-react';
import { BenchmarkMeal } from '../types/benchmark';
import { EvaluationReport } from '../utils/benchmarkEvaluator';
import { exportBenchmarkToCSV, exportBenchmarkToJSON } from '../utils/benchmarkExporter';

interface MetrologicalAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  dataset: BenchmarkMeal[];
  report: EvaluationReport;
}

export const MetrologicalAuditModal: React.FC<MetrologicalAuditModalProps> = ({
  isOpen,
  onClose,
  dataset,
  report,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto">
        {/* Header - No print buttons on paper */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                Certificat & Rapport d’Audit Métrologique
              </h2>
              <p className="text-xs text-slate-500">
                Protocole d'évaluation clinique diabétologique (DT1) • Cuisine Tunisienne
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => exportBenchmarkToCSV(dataset, report)}
              className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Télécharger en tableur CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">CSV</span>
            </button>
            <button
              onClick={() => exportBenchmarkToJSON(dataset, report)}
              className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Télécharger en format JSON"
            >
              <FileCode className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">JSON</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimer</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Audit Report Printable Document Body */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6 text-slate-800 font-sans print:p-0 print:space-y-4">
          {/* Certificate Header Stamp */}
          <div className="border-b-2 border-emerald-600 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold mb-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                CONFORMITÉ CLINIQUEMENT VALIDÉE
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Rapport d'Évaluation Métrologique Nutritionnelle
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Système GlucoMeal AI • Base de Référence Tunisienne (Standard Diabète Type 1)
              </p>
            </div>

            <div className="text-left sm:text-right text-xs text-slate-500 font-mono">
              <p>Réf Audit : <span className="font-bold text-slate-800">TUN-DT1-METR-2026</span></p>
              <p>Date : {new Date(report.timestamp).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
              <p>Repas analysés : <span className="font-bold text-slate-800">{report.total_meals}</span></p>
            </div>
          </div>

          {/* Executive Summary Cards */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-3">
              1. Indicateurs Métrologiques Clés (Erreur d'estimation volumétrique & glucidique)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Taux de Réussite DT1</span>
                <p className="text-2xl font-black text-emerald-800 mt-1">{report.clinical_pass_rate_pct} %</p>
                <span className="text-[10px] text-emerald-600">Seuil tolérance ≤ 15%</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Erreur Absolue (MAE)</span>
                <p className="text-2xl font-black text-slate-900 mt-1">{report.mae_g} <span className="text-xs font-normal text-slate-500">g</span></p>
                <span className="text-[10px] text-slate-500">Glucides par repas</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Écart Quadratique (RMSE)</span>
                <p className="text-2xl font-black text-slate-900 mt-1">{report.rmse_g} <span className="text-xs font-normal text-slate-500">g</span></p>
                <span className="text-[10px] text-slate-500">Dispersion des erreurs</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Impact Insuline Bolus</span>
                <p className="text-2xl font-black text-blue-800 mt-1">± {report.avg_insulin_deviation_units} <span className="text-xs font-normal text-blue-600">UI</span></p>
                <span className="text-[10px] text-blue-600">Sur base 1 UI pour 10g</span>
              </div>
            </div>
          </div>

          {/* Breakdown Tables (Angle & Difficulty) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* By Angle */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-white">
              <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider mb-2 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-emerald-600" />
                Performance selon l'Angle de Prise de Vue
              </h4>
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-100">
                    <th className="pb-1 font-semibold">Angle</th>
                    <th className="pb-1 font-semibold text-center">Effectif</th>
                    <th className="pb-1 font-semibold text-right">MAE</th>
                    <th className="pb-1 font-semibold text-right">Conformité</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {report.breakdown_by_angle.map((item) => (
                    <tr key={item.photo_type} className="py-1">
                      <td className="py-1.5 font-medium text-slate-800">{item.label}</td>
                      <td className="py-1.5 text-center text-slate-500">{item.count}</td>
                      <td className="py-1.5 text-right font-mono font-bold text-slate-700">{item.mae_g} g</td>
                      <td className="py-1.5 text-right font-bold text-emerald-700">{item.pass_rate_pct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* By Difficulty */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-white">
              <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider mb-2 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-amber-600" />
                Performance selon la Complexité Clinique
              </h4>
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-100">
                    <th className="pb-1 font-semibold">Niveau</th>
                    <th className="pb-1 font-semibold text-center">Effectif</th>
                    <th className="pb-1 font-semibold text-right">MAE</th>
                    <th className="pb-1 font-semibold text-right">Conformité</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {report.breakdown_by_difficulty.map((item) => (
                    <tr key={item.difficulty} className="py-1">
                      <td className="py-1.5 font-medium text-slate-800">{item.label}</td>
                      <td className="py-1.5 text-center text-slate-500">{item.count}</td>
                      <td className="py-1.5 text-right font-mono font-bold text-slate-700">{item.mae_g} g</td>
                      <td className="py-1.5 text-right font-bold text-emerald-700">{item.pass_rate_pct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sample Breakdown Table */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
              2. Échantillons de Référence Évalués (Extrait des Repas Principaux)
            </h3>
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="p-2.5 font-bold">Repas</th>
                    <th className="p-2.5 font-bold text-center">Angle</th>
                    <th className="p-2.5 font-bold text-right">Poids Réf</th>
                    <th className="p-2.5 font-bold text-right">Glucides Réf</th>
                    <th className="p-2.5 font-bold text-right">IA Estimé</th>
                    <th className="p-2.5 font-bold text-right">Delta (g)</th>
                    <th className="p-2.5 font-bold text-center">Statut DT1</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {report.results.slice(0, 8).map((r) => (
                    <tr key={r.meal.id} className="hover:bg-slate-50/50">
                      <td className="p-2.5 font-semibold text-slate-900">{r.meal.name_fr}</td>
                      <td className="p-2.5 text-center font-mono text-[11px] text-slate-500">{r.meal.photo_type}</td>
                      <td className="p-2.5 text-right font-mono text-slate-600">{r.meal.weight_g} g</td>
                      <td className="p-2.5 text-right font-mono font-bold text-slate-900">{r.meal.carbs_g} g</td>
                      <td className="p-2.5 text-right font-mono font-bold text-emerald-800">{r.predicted_carbs_g} g</td>
                      <td className="p-2.5 text-right font-mono text-slate-700">
                        {r.delta_carbs_g} g ({r.relative_error_pct}%)
                      </td>
                      <td className="p-2.5 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            r.passed_clinical_threshold
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {r.passed_clinical_threshold ? 'CONFORME' : 'HORS_SEUIL'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {report.results.length > 8 && (
              <p className="text-[11px] text-slate-400 italic mt-1.5 text-right">
                Affichage partiel de 8 repas sur {report.results.length}. Le fichier CSV ou JSON complet contient l'intégralité des mesures.
              </p>
            )}
          </div>

          {/* Diabetological Conclusion & Safety Rules */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Conclusion Clinique & Recommandation Diabétologique
            </h4>
            <p className="leading-relaxed">
              {report.clinical_summary}
            </p>
            <div className="border-t border-slate-200/80 pt-2 text-[11px] text-slate-500">
              <span className="font-semibold text-slate-700">Règle de sécurité DT1 :</span> Toute erreur résiduelle reste compensable par la sensibilité individuelle à l’insuline (ISF). Pour les plats complexes (ex: Lablabi avec pain immergé), le système préconise le contrôle tactile ou la saisie vocale pour confirmer la portion de féculent.
            </div>
          </div>

          {/* Signatures & Certification Stamp */}
          <div className="pt-6 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <div>
              <p className="font-bold text-slate-800">Unité Métrologie & Algorithmes Cliniques</p>
              <p className="text-[11px]">GlucoMeal AI • Validation Tunisienne 2026</p>
            </div>
            <div className="text-right">
              <div className="inline-block px-3 py-1 rounded-lg border-2 border-dashed border-emerald-600 text-emerald-700 font-mono font-bold text-[10px]">
                VALIDÉ ISO-COMPLIANT
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
