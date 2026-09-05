import React, { useState } from 'react';
import {
  Users,
  User,
  Stethoscope,
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  ArrowLeft,
  HeartPulse,
} from 'lucide-react';
import { registerWithEmail, loginWithEmail, syncProfileToFirestore } from '../services/firebase';
import { UserProfileDT1, AccountType, ChildProfileInfo } from '../types';
import { saveUserProfile, loadUserProfile } from '../utils/storage';
import { useLanguage } from '../i18n/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';

interface AuthScreenProps {
  initialMode?: 'login' | 'signup';
  onSuccess: (profile: UserProfileDT1) => void;
  onCancel: () => void;
  onBackToLanding: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  initialMode = 'signup',
  onSuccess,
  onCancel,
  onBackToLanding,
}) => {
  const { t, isRtl } = useLanguage();
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [accountType, setAccountType] = useState<AccountType>('parent');

  // Identifiants utilisateur / parent
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userName, setUserName] = useState(''); // Nom du parent ou de l'adulte

  // Champs spécifiques enfant (si compte parent)
  const [childName, setChildName] = useState('');
  const [childAge, setChildAge] = useState('8');
  const [insulinDeliveryType, setInsulinDeliveryType] = useState<'pen_half_unit' | 'standard_pen' | 'pump'>('pen_half_unit');
  const [schoolName, setSchoolName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');

  // États UI
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const currentProfile = loadUserProfile();

      if (mode === 'signup') {
        if (!email || !password) {
          throw new Error(isRtl ? 'يرجى إدخال البريد الإلكتروني وكلمة المرور.' : 'Veuillez renseigner votre e-mail et un mot de passe.');
        }

        if (accountType === 'parent' && !childName.trim()) {
          throw new Error(isRtl ? 'يرجى إدخال اسم الطفل.' : "Veuillez renseigner le prénom de votre enfant.");
        }

        // Inscription Firebase
        try {
          await registerWithEmail(email, password);
        } catch (firebaseErr: any) {
          if (firebaseErr.code === 'auth/email-already-in-use') {
            throw new Error(isRtl ? 'هذا البريد الإلكتروني مسجل بالفعل. يرجى تسجيل الدخول.' : 'Cet e-mail est déjà associé à un compte. Veuillez vous connecter.');
          } else if (firebaseErr.code === 'auth/weak-password') {
            throw new Error(isRtl ? 'يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.' : 'Le mot de passe doit comporter au moins 6 caractères.');
          } else if (firebaseErr.code === 'auth/invalid-email') {
            throw new Error(isRtl ? 'صيغة البريد الإلكتروني غير صالحة.' : 'Format d’adresse e-mail invalide.');
          } else {
            throw new Error(
              firebaseErr.message ||
                (isRtl ? 'فشل إنشاء الحساب. يرجى المحاولة مرة أخرى.' : 'Échec de création de compte. Veuillez réessayer.')
            );
          }
        }

        // Préparation du profil
        const childInfo: ChildProfileInfo | undefined =
          accountType === 'parent'
            ? {
                childName: childName.trim(),
                age: Number(childAge) || 8,
                insulinDeliveryType,
                schoolName: schoolName.trim() || undefined,
                emergencyContactPhone: emergencyContactPhone.trim() || undefined,
                cgmSharingActive: true,
              }
            : undefined;

        // Arrondi adapté : 0.5 U pour les stylos demi-unités pédiatriques, 0.1 pour les pompes, 1.0 U pour les stylos standard
        const roundingStep =
          accountType === 'parent'
            ? insulinDeliveryType === 'pen_half_unit'
              ? 0.5
              : insulinDeliveryType === 'pump'
              ? 0.1
              : 1.0
            : currentProfile.roundingStep || 0.5;

        const updatedProfile: UserProfileDT1 = {
          ...currentProfile,
          accountType,
          parentEmail: email.trim(),
          name: userName.trim() || (accountType === 'parent' ? 'Parent' : 'Patient'),
          childProfile: childInfo,
          roundingStep,
        };

        saveUserProfile(updatedProfile);

        // Synchroniser vers Firestore si disponible
        try {
          await syncProfileToFirestore(updatedProfile);
        } catch (syncErr) {
          console.warn('Sync notice:', syncErr);
        }

        onSuccess(updatedProfile);
      } else {
        // Mode Login
        if (!email || !password) {
          throw new Error(isRtl ? 'يرجى إدخال البريد الإلكتروني وكلمة المرور.' : 'Veuillez saisir votre e-mail et mot de passe.');
        }

        try {
          await loginWithEmail(email, password);
        } catch (firebaseErr: any) {
          console.error('Firebase login error:', firebaseErr);
          if (
            firebaseErr.code === 'auth/wrong-password' ||
            firebaseErr.code === 'auth/invalid-credential' ||
            firebaseErr.code === 'auth/user-not-found'
          ) {
            throw new Error(
              isRtl
                ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة.'
                : 'Adresse e-mail ou mot de passe incorrect.'
            );
          } else if (firebaseErr.code === 'auth/too-many-requests') {
            throw new Error(
              isRtl
                ? 'تم حظر الحساب مؤقتًا بسبب كثرة المحاولات. يرجى المحاولة لاحقًا.'
                : 'Trop de tentatives infructueuses. Veuillez patienter avant de réessayer.'
            );
          } else {
            throw new Error(
              firebaseErr.message ||
                (isRtl ? 'فشل تسجيل الدخول. يرجى التحقق من اتصالك.' : 'Échec de connexion. Veuillez vérifier vos identifiants.')
            );
          }
        }

        const updatedProfile: UserProfileDT1 = {
          ...currentProfile,
          parentEmail: email.trim(),
        };

        saveUserProfile(updatedProfile);
        onSuccess(updatedProfile);
      }
    } catch (err: any) {
      setErrorMsg(err.message || (isRtl ? 'حدث خطأ أثناء العملية.' : "Une erreur est survenue lors de l'opération."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-10 px-4 sm:px-6">
      {/* Navigation retour & langue */}
      <div className="max-w-md w-full mx-auto mb-4 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onBackToLanding}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className={`w-4 h-4 shrink-0 transition-transform ${isRtl ? 'rotate-180' : ''}`} />
          <span>{t('auth_back_to_landing')}</span>
        </button>

        <div className="flex items-center gap-2">
          <LanguageSwitcher variant="header" />
          <button
            type="button"
            onClick={onCancel}
            className="text-xs font-semibold text-slate-700 hover:text-slate-950 underline cursor-pointer whitespace-nowrap"
          >
            {t('auth_access_without_account')}
          </button>
        </div>
      </div>

      <div className="max-w-md w-full mx-auto bg-white rounded-xl shadow-xs border border-slate-200 p-6 sm:p-7 space-y-5">
        {/* En-tête sobre et médical */}
        <div className="text-center space-y-1.5 pb-2">
          <div className="w-10 h-10 rounded-lg bg-emerald-700 text-white mx-auto flex items-center justify-center font-bold text-sm">
            <HeartPulse className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            {mode === 'signup' ? t('auth_signup_title') : t('auth_login_title')}
          </h2>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            {mode === 'signup' ? t('auth_signup_subtitle') : t('auth_login_subtitle')}
          </p>
        </div>

        {/* Sélecteur Mode Inscription / Connexion */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs">
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setErrorMsg(null);
            }}
            className={`py-1.5 font-bold rounded-md transition-colors cursor-pointer ${
              mode === 'signup'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('auth_tab_signup')}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMsg(null);
            }}
            className={`py-1.5 font-bold rounded-md transition-colors cursor-pointer ${
              mode === 'login'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('auth_tab_login')}
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {mode === 'signup' && (
            <>
              {/* Type de compte : Parent vs Patient vs Praticien */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 block">
                  {t('auth_user_profile_label')}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setAccountType('parent')}
                    className={`p-2.5 rounded-lg border text-center transition-all cursor-pointer ${
                      accountType === 'parent'
                        ? 'bg-slate-900 border-slate-900 text-white font-bold'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Users className="w-4 h-4 mx-auto mb-1" />
                    <div className="font-semibold text-xs">{t('auth_type_parent')}</div>
                    <div className={`text-[10px] ${accountType === 'parent' ? 'text-slate-300' : 'text-slate-400'}`}>
                      {t('auth_type_parent_desc')}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAccountType('patient')}
                    className={`p-2.5 rounded-lg border text-center transition-all cursor-pointer ${
                      accountType === 'patient'
                        ? 'bg-slate-900 border-slate-900 text-white font-bold'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <User className="w-4 h-4 mx-auto mb-1" />
                    <div className="font-semibold text-xs">{t('auth_type_patient')}</div>
                    <div className={`text-[10px] ${accountType === 'patient' ? 'text-slate-300' : 'text-slate-400'}`}>
                      {t('auth_type_patient_desc')}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAccountType('doctor')}
                    className={`p-2.5 rounded-lg border text-center transition-all cursor-pointer ${
                      accountType === 'doctor'
                        ? 'bg-slate-900 border-slate-900 text-white font-bold'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Stethoscope className="w-4 h-4 mx-auto mb-1" />
                    <div className="font-semibold text-xs">{t('auth_type_doctor')}</div>
                    <div className={`text-[10px] ${accountType === 'doctor' ? 'text-slate-300' : 'text-slate-400'}`}>
                      {t('auth_type_doctor_desc')}
                    </div>
                  </button>
                </div>
              </div>

              {/* Encadré clinique spécifique à l'enfant malade */}
              {accountType === 'parent' && (
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                    <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>{t('auth_child_info_section')}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                        {t('auth_child_name_label')}
                      </label>
                      <input
                        type="text"
                        required
                        value={childName}
                        onChange={(e) => setChildName(e.target.value)}
                        placeholder={t('auth_child_name_placeholder')}
                        className="w-full px-2.5 py-1.5 text-xs rounded-md bg-white border border-slate-300 focus:outline-none focus:border-slate-800"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                        {t('auth_child_age_label')}
                      </label>
                      <select
                        value={childAge}
                        onChange={(e) => setChildAge(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-md bg-white border border-slate-300 focus:outline-none focus:border-slate-800"
                      >
                        {[3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17].map((a) => (
                          <option key={a} value={a}>
                            {a} {isRtl ? 'سنوات' : 'ans'}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                      {t('auth_delivery_label')}
                    </label>
                    <select
                      value={insulinDeliveryType}
                      onChange={(e) => setInsulinDeliveryType(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-md bg-white border border-slate-300 focus:outline-none focus:border-slate-800"
                    >
                      <option value="pen_half_unit">{t('auth_delivery_pen_half')}</option>
                      <option value="pump">{t('auth_delivery_pump')}</option>
                      <option value="standard_pen">{t('auth_delivery_pen_std')}</option>
                    </select>
                    <p className="text-[10px] text-slate-500 mt-1">
                      {t('auth_pediatric_security_note')}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                        {t('auth_school_label')}
                      </label>
                      <input
                        type="text"
                        value={schoolName}
                        onChange={(e) => setSchoolName(e.target.value)}
                        placeholder={t('auth_school_placeholder')}
                        className="w-full px-2.5 py-1.5 text-xs rounded-md bg-white border border-slate-300 focus:outline-none focus:border-slate-800"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                        {t('auth_emergency_phone_label')}
                      </label>
                      <input
                        type="tel"
                        value={emergencyContactPhone}
                        onChange={(e) => setEmergencyContactPhone(e.target.value)}
                        placeholder={t('auth_emergency_phone_placeholder')}
                        className="w-full px-2.5 py-1.5 text-xs rounded-md bg-white border border-slate-300 focus:outline-none focus:border-slate-800"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  {t('auth_parent_name_label')}
                </label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder={t('auth_parent_name_placeholder')}
                  className="w-full px-2.5 py-1.5 rounded-md bg-white border border-slate-300 focus:outline-none focus:border-slate-800"
                />
              </div>
            </>
          )}

          {/* Email */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              {t('auth_email_label')}
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('auth_email_placeholder')}
                className={`w-full ${isRtl ? 'pr-8 pl-3' : 'pl-8 pr-3'} py-1.5 rounded-md bg-white border border-slate-300 focus:outline-none focus:border-slate-800`}
              />
              <Mail className={`w-3.5 h-3.5 text-slate-400 absolute ${isRtl ? 'right-2.5' : 'left-2.5'} top-2.5`} />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              {t('auth_password_label')}
            </label>
            <div className="relative">
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('auth_password_placeholder')}
                className={`w-full ${isRtl ? 'pr-8 pl-3' : 'pl-8 pr-3'} py-1.5 rounded-md bg-white border border-slate-300 focus:outline-none focus:border-slate-800`}
              />
              <Lock className={`w-3.5 h-3.5 text-slate-400 absolute ${isRtl ? 'right-2.5' : 'left-2.5'} top-2.5`} />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 px-4 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {loading ? (
              <span>{t('auth_btn_loading')}</span>
            ) : mode === 'signup' ? (
              <>
                <span>{t('auth_btn_submit_signup')}</span>
                <ArrowRight className={`w-4 h-4 shrink-0 transition-transform ${isRtl ? 'rotate-180' : ''}`} />
              </>
            ) : (
              <>
                <span>{t('auth_btn_submit_login')}</span>
                <ArrowRight className={`w-4 h-4 shrink-0 transition-transform ${isRtl ? 'rotate-180' : ''}`} />
              </>
            )}
          </button>
        </form>

        <div className="pt-3 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-500">
            {isRtl ? 'بيانات مشفرة ومحمية • استضافة سحابية Google Firestore' : 'Données protégées • Hébergement sécurisé Google Firestore'}
          </p>
        </div>
      </div>
    </div>
  );
};
