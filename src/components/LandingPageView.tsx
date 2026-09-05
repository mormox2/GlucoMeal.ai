import React from 'react';
import {
  ShieldCheck,
  Camera,
  Activity,
  ArrowRight,
  Wifi,
  Clock,
  Check,
  Stethoscope,
  Lock,
  HeartPulse,
  Scale,
  FileSpreadsheet,
  AlertCircle,
  Smartphone,
  ChevronRight,
} from 'lucide-react';

interface LandingPageViewProps {
  onStartSignUp: () => void;
  onStartLogin: () => void;
  onEnterAppDirectly: () => void;
  onOpenDoctorPortal?: () => void;
}

export const LandingPageView: React.FC<LandingPageViewProps> = ({
  onStartSignUp,
  onStartLogin,
  onEnterAppDirectly,
  onOpenDoctorPortal,
}) => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased font-sans">
      {/* Top Clinical Compliance Banner */}
      <div className="bg-slate-900 text-slate-200 text-xs py-2 px-4 border-b border-slate-800">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="font-medium">
              Dispositif d'aide au calcul nutritionnel pour Diabète de Type 1 (DT1) • Conforme aux recommandations ADA / ISPAD
            </span>
          </div>
          <span className="text-slate-400 text-[11px] hidden md:inline">
            Validation médicale requise par votre diabétologue
          </span>
        </div>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold text-sm">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-tight text-slate-900">
                  GlucoMeal
                </span>
                <span className="text-emerald-700 font-semibold text-xs">Clinical</span>
              </div>
              <p className="text-[10px] text-slate-500 -mt-0.5 hidden sm:block">
                Insulinothérapie fonctionnelle & pédiatrie
              </p>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-slate-600">
            <a href="#parents" className="hover:text-slate-900 transition-colors">
              Espace Parents & Pédiatrie
            </a>
            <a href="#algorithme" className="hover:text-slate-900 transition-colors">
              Méthodologie ITF
            </a>
            <a href="#base-alimentaire" className="hover:text-slate-900 transition-colors">
              Base Tunisienne & Méditerranéenne
            </a>
            {onOpenDoctorPortal && (
              <button
                type="button"
                onClick={onOpenDoctorPortal}
                className="hover:text-emerald-700 transition-colors cursor-pointer"
              >
                Portail Praticien
              </button>
            )}
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onStartLogin}
              className="text-xs font-semibold text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Connexion
            </button>
            <button
              type="button"
              onClick={onStartSignUp}
              className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              Créer un compte
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-12 pb-16 border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                <span>Accompagnement pédiatrique & patient adulte DT1</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
                L'évaluation précise des glucides et du bolus d'insuline pour le diabète de type 1.
              </h1>

              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                Une solution d'aide à la décision thérapeutique basée sur la vision assistée par ordinateur et les formules d'Insulinothérapie Fonctionnelle (ITF). Conçue pour sécuriser les repas des <strong>enfants scolarisés</strong> et simplifier l'autonomie des <strong>patients adultes</strong>, avec prise en charge approfondie de la gastronomie maghrébine et orientale.
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button
                  type="button"
                  onClick={onStartSignUp}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <span>Créer un profil Parent ou Patient</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={onEnterAppDirectly}
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold border border-slate-300 transition-colors cursor-pointer"
                >
                  <Camera className="w-4 h-4 text-slate-600" />
                  <span>Accès direct au calculateur de repas</span>
                </button>
              </div>

              {/* Strict clinical specs */}
              <div className="pt-4 border-t border-slate-100 grid grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="font-bold text-slate-900 block">Pédiatrie 0.5 UI</span>
                  <span className="text-slate-500 text-[11px]">NovoPen Echo & pompes</span>
                </div>
                <div>
                  <span className="font-bold text-slate-900 block">Base certifiée</span>
                  <span className="text-slate-500 text-[11px]">200+ plats maghrébins</span>
                </div>
                <div>
                  <span className="font-bold text-slate-900 block">Télésurveillance</span>
                  <span className="text-slate-500 text-[11px]">CGM LinX, Syai, Dexcom</span>
                </div>
              </div>
            </div>

            {/* Right Content: Clean Clinical Dashboard Preview */}
            <div className="lg:col-span-5">
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">Sarah B. • 8 ans</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        Profil Enfant
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500">
                      Tuteur : Amina B. (Maman) • Stylo NovoPen Echo (0.5 UI)
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-mono font-bold text-slate-700 bg-white px-2 py-1 rounded border border-slate-200">
                      1.18 g/L (Cible: 1.00)
                    </span>
                  </div>
                </div>

                {/* Clinical plate evaluation card */}
                <div className="bg-white rounded-lg border border-slate-200 p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-emerald-700" />
                      Repas du midi (Cantine scolaire)
                    </span>
                    <span className="text-[11px] text-slate-500">Pesée optique ITF</span>
                  </div>

                  <div className="space-y-1 text-xs border-y border-slate-100 py-2">
                    <div className="flex justify-between text-slate-600">
                      <span>Couscous agneau & légumes (portion 220g)</span>
                      <span className="font-mono font-semibold text-slate-900">46 g</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Pain baguette de blé (40g)</span>
                      <span className="font-mono font-semibold text-slate-900">22 g</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Pomme fraîche (110g)</span>
                      <span className="font-mono font-semibold text-slate-900">14 g</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs pt-0.5">
                    <span className="font-bold text-slate-700">Total glucides calculés :</span>
                    <span className="font-mono font-extrabold text-sm text-slate-900">82 g</span>
                  </div>
                </div>

                {/* Insulin dose breakdown */}
                <div className="bg-slate-100 rounded-lg p-3.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">Prescription calculée</span>
                    <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      5.5 UI
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Bolus repas : 82g ÷ 15 = 5.46 UI • Correction : (1.18 - 1.00) ÷ 0.40 = +0.45 UI • Arrondi pédiatrique sécurisé au demi-point le plus proche.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION PARENTS & PEDIATRIE */}
      <section id="parents" className="py-16 border-b border-slate-200 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mb-10 space-y-2">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
              Pédiatrie & Milieu Scolaire
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Conçu pour accompagner les parents d'enfants diabétiques
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              La gestion du diabète pédiatrique impose une vigilance continue, notamment lors des repas pris à l'extérieur (école, cantine, activités sportives).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-2.5">
              <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                01
              </div>
              <h3 className="font-bold text-sm text-slate-900">Délégation sécurisée à la cantine</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                L'accompagnant scolaire ou l'enfant prend le plateau en photo. Le calcul des glucides est transparent et permet au parent de confirmer la dose d'insuline à distance sans approximations.
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-2.5">
              <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                02
              </div>
              <h3 className="font-bold text-sm text-slate-900">Incréments pédiatriques de 0.5 UI</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Les jeunes enfants présentent une haute sensibilité à l'insuline. Le système configure par défaut un arrondi en demi-unités (compatible NovoPen Echo et JuniorSTAR) ou dixièmes (pompes) pour prévenir les hypoglycémies sévères.
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-2.5">
              <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                03
              </div>
              <h3 className="font-bold text-sm text-slate-900">Télésurveillance continue (CGM)</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Liaison directe avec les capteurs de glycémie interstitielle en continu (LinX, Syai Tag, Dexcom, FreeStyle). Les parents consultent la tendance glycémique à tout instant pendant la journée.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION ALGORITHME & METHODOLOGIE ITF */}
      <section id="algorithme" className="py-16 border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mb-10 space-y-2">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
              Mécanique Thérapeutique
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Une formule déterministe, auditable et sans approximation
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Contrairement aux générateurs de texte génériques, le calcul des doses d'insuline rapide repose sur des règles mathématiques strictes validées en diabétologie.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <Scale className="w-5 h-5 text-slate-700" />
              <h4 className="font-bold text-xs text-slate-900">Ratios Glucides / Insuline</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Ratios I:C différenciés par créneau horaire (Matin, Midi, Goûter, Soir) selon les variations circadiennes de la résistance à l'insuline.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <Activity className="w-5 h-5 text-slate-700" />
              <h4 className="font-bold text-xs text-slate-900">Facteur de Sensibilité (ISF)</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Calcul précis de la correction en cas d'hyperglycémie pré-prandiale par rapport à la glycémie cible du patient (ex : 1.00 g/L).
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <Clock className="w-5 h-5 text-slate-700" />
              <h4 className="font-bold text-xs text-slate-900">Rappel H+2 Post-Prandial</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Notifications planifiées à 120 minutes pour contrôler la glycémie résiduelle et documenter l'efficacité du bolus administré.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <HeartPulse className="w-5 h-5 text-slate-700" />
              <h4 className="font-bold text-xs text-slate-900">Modulation de l'Effort</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Réduction paramétrable du bolus de 15% à 50% lors d'une activité physique prévue dans les 2 heures suivant le repas.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION BASE DE DONNEES TUNISIENNE & RAMADAN */}
      <section id="base-alimentaire" className="py-16 border-b border-slate-200 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-4">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                Gastronomie & Spécificités Régionales
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                La référence pour les plats maghrébins et orientaux
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Les tables nutritionnelles internationales (CIQUAL, USDA) sous-évaluent souvent la complexité des sauces mijotées, des pains traditionnels et des couscous familiaux. GlucoMeal intègre une base dédiée de plus de 200 préparations tunisiennes étalonnées avec leurs grammages types.
              </p>

              <div className="space-y-2 pt-2 text-xs">
                <div className="flex items-center gap-2 text-slate-700">
                  <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Couscous, tajines tunisiens, ojja, lablabi, chakchouka, brik au thon.</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Pâtisseries et douceurs : makroudh, baklawa, zriga, dattes deglet nour.</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span><strong>Mode Ramadan dédié :</strong> sécurisation des repas d'Iftar et de Shor selon le consensus médical DAR.</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-800">Échantillon de la table nutritionnelle</span>
                <span className="text-[11px] text-slate-500 font-mono">200+ fiches</span>
              </div>

              <div className="divide-y divide-slate-100 text-xs">
                <div className="py-2 flex justify-between items-center">
                  <div>
                    <span className="font-semibold text-slate-800">Couscous à l'agneau & légumes</span>
                    <span className="text-[10px] text-slate-500 block">Portion standard : 250 g</span>
                  </div>
                  <span className="font-mono font-bold text-slate-900">52 g glucides</span>
                </div>

                <div className="py-2 flex justify-between items-center">
                  <div>
                    <span className="font-semibold text-slate-800">Brik à l'œuf et thon</span>
                    <span className="text-[10px] text-slate-500 block">1 pièce frite standard (95 g)</span>
                  </div>
                  <span className="font-mono font-bold text-slate-900">17 g glucides</span>
                </div>

                <div className="py-2 flex justify-between items-center">
                  <div>
                    <span className="font-semibold text-slate-800">Lablabi complet avec œuf</span>
                    <span className="text-[10px] text-slate-500 block">Bol moyen (350 g)</span>
                  </div>
                  <span className="font-mono font-bold text-slate-900">68 g glucides</span>
                </div>

                <div className="py-2 flex justify-between items-center">
                  <div>
                    <span className="font-semibold text-slate-800">Makroudh au four</span>
                    <span className="text-[10px] text-slate-500 block">1 pièce moyenne (45 g)</span>
                  </div>
                  <span className="font-mono font-bold text-slate-900">28 g glucides</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CALL TO ACTION */}
      <section className="py-14 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
            <Lock className="w-3.5 h-3.5 text-slate-600" />
            <span>Chiffrement Google Firebase & Mode Hors-Ligne Immédiat</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Prêt à structurer le calcul des repas de votre famille ?
          </h2>

          <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
            Créez votre profil en 2 minutes pour sauvegarder les ratios prescrits par votre diabétologue, ou utilisez directement le calculateur en mode invité.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={onStartSignUp}
              className="w-full sm:w-auto px-6 py-3 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              Créer mon compte (Parent ou Patient)
            </button>

            <button
              type="button"
              onClick={onEnterAppDirectly}
              className="w-full sm:w-auto px-5 py-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors cursor-pointer"
            >
              Accéder sans inscription
            </button>
          </div>
        </div>
      </section>

      {/* Medical Disclaimer Footer */}
      <footer className="py-8 bg-slate-900 text-slate-400 text-xs border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-300 font-medium">
            <span>GlucoMeal Clinical • Système d'aide à la décision nutritionnelle DT1</span>
            <span className="text-slate-500 text-[11px]">Version 2.0 • Hébergement sécurisé</span>
          </div>
          <div className="border-t border-slate-800 pt-3 text-[11px] leading-relaxed text-slate-500">
            <p>
              <strong>Avertissement médical réglementaire :</strong> GlucoMeal AI est un outil numérique d'aide au comptage des glucides et à l'estimation théorique du bolus d'insuline. Il ne constitue pas un avis médical et ne remplace en aucun cas la consultation, le suivi et les prescriptions de votre diabétologue traitant. En cas de doute ou de symptôme d'hypoglycémie, appliquez toujours la procédure d'urgence prescrite par votre médecin.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
