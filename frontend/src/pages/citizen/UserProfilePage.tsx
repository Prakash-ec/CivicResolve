import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  User,
  Shield,
  Award,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  MapPin,
  Save,
  Check,
  Phone,
  Smartphone,
  KeyRound,
  Loader2,
  AlertCircle,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { PhoneAuthProvider, ConfirmationResult } from 'firebase/auth';
import { useAuth } from '../../features/auth/AuthContext.js';

interface Voucher {
  id: string;
  title: string;
  provider: string;
  creditsCost: number;
  discount: string;
  category: string;
  code?: string;
  redeemed?: boolean;
}

export const UserProfilePage: React.FC = () => {
  const {
    currentUser,
    userProfile,
    isAdmin,
    phoneVerified,
    phoneNumber,
    linkPhoneCredential,
    setupRecaptcha,
    sendPhoneVerificationCode,
  } = useAuth();

  const { i18n } = useTranslation();
  const activeCode = ((i18n.language || 'en').split('-')[0]) as 'en' | 'ta' | 'hi' | 'te' | 'kn';

  const [displayName, setDisplayName] = useState(
    isAdmin
      ? (userProfile?.displayName && userProfile.displayName !== 'Citizen' ? userProfile.displayName : 'Municipal Administrator')
      : (userProfile?.displayName || currentUser?.displayName || 'Active Citizen')
  );
  const [ward, setWard] = useState('Ward 114 - Thousand Lights, Zone 9');
  const [language, setLanguage] = useState<'en' | 'ta' | 'hi' | 'te' | 'kn'>(activeCode || 'en');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Phone OTP Authentication & Linking States
  const [phoneInput, setPhoneInput] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpStep, setOtpStep] = useState<'idle' | 'code_sent' | 'verified'>('idle');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [phoneSuccess, setPhoneSuccess] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(0);
  const recaptchaVerifierRef = useRef<any>(null);

  // ResolveRewards™ Engine Simulation
  const [creditsBalance, setCreditsBalance] = useState(185);
  const [claimedVouchers, setClaimedVouchers] = useState<Record<string, string>>({});
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);

  // Countdown timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const vouchers: Voucher[] = [
    {
      id: 'vouch-1',
      title: 'Metro Rail Smartcard Recharge Voucher',
      provider: 'Chennai Metro Rail Limited (CMRL)',
      creditsCost: 80,
      discount: '₹100 Transit Credit',
      category: 'Public Transport',
    },
    {
      id: 'vouch-2',
      title: 'Municipal Property Tax Assessment Rebate',
      provider: 'Greater Chennai Municipal Corporation',
      creditsCost: 150,
      discount: '5% Deduction on Next Half-Year Bill',
      category: 'Municipal Utility',
    },
    {
      id: 'vouch-3',
      title: 'Green City Tree Plantation In Your Ward',
      provider: 'Urban Forestry Division',
      creditsCost: 40,
      discount: 'Sapling planted in citizen’s name + Geo-tag certificate',
      category: 'Environment',
    },
    {
      id: 'vouch-4',
      title: 'Civic Pride Gold Digital Badge & Certificate',
      provider: 'CivicResolve Governance Council',
      creditsCost: 25,
      discount: 'Official Verified Good Samaritan Certificate',
      category: 'Civic Recognition',
    },
  ];

  const handleRedeem = (voucher: Voucher) => {
    if (creditsBalance < voucher.creditsCost) {
      alert(`Insufficient ResolveRewards™ credits. You need ${voucher.creditsCost} credits, but have ${creditsBalance}.`);
      return;
    }
    const generatedCode = `CR-VOUCH-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    setCreditsBalance((prev) => prev - voucher.creditsCost);
    setClaimedVouchers((prev) => ({
      ...prev,
      [voucher.id]: generatedCode,
    }));
    setSelectedVoucher({ ...voucher, code: generatedCode });
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    i18n.changeLanguage(language);
    localStorage.setItem('civicresolve_lang', language);
    document.documentElement.lang = language;
    window.dispatchEvent(new CustomEvent('civicresolve_lang_changed', { detail: language }));
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // Trigger Phone OTP Code Send
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneError(null);
    setPhoneSuccess(null);

    // Validate 10-digit Indian Mobile Number
    const cleanedDigits = phoneInput.replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(cleanedDigits)) {
      setPhoneError('Please enter a valid 10-digit Indian mobile number (starting with 6, 7, 8, or 9).');
      return;
    }

    const fullPhoneNumber = `+91${cleanedDigits}`;
    setPhoneLoading(true);

    try {
      // Initialize reCAPTCHA
      const verifier = setupRecaptcha('recaptcha-container');
      recaptchaVerifierRef.current = verifier;

      const confResult = await sendPhoneVerificationCode(fullPhoneNumber, verifier);
      setConfirmationResult(confResult);
      setOtpStep('code_sent');
      setResendTimer(60);
      setPhoneSuccess(`Verification code dispatched via SMS to ${fullPhoneNumber}.`);
    } catch (err: any) {
      console.error('Phone OTP error:', err);
      let message = 'Failed to dispatch OTP code. Please try again.';
      if (err.code === 'auth/quota-exceeded') {
        message = 'Daily SMS quota reached for test projects. You can use Firebase authorized test numbers (e.g. +91 9999999999) with code 123456.';
      } else if (err.code === 'auth/invalid-phone-number') {
        message = 'Invalid phone number format. Please provide a valid +91 number.';
      } else if (err.code === 'auth/too-many-requests') {
        message = 'Too many requests. Please wait a moment before trying again.';
      } else if (err.message) {
        message = err.message;
      }
      setPhoneError(message);
    } finally {
      setPhoneLoading(false);
    }
  };

  // Verify OTP and Link Credential to Current User UID
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationResult) {
      setPhoneError('Session expired. Please request a new verification code.');
      return;
    }
    if (!/^\d{6}$/.test(otpCode.trim())) {
      setPhoneError('Please enter the 6-digit verification code.');
      return;
    }

    setPhoneLoading(true);
    setPhoneError(null);
    setPhoneSuccess(null);

    try {
      const credential = PhoneAuthProvider.credential(
        confirmationResult.verificationId,
        otpCode.trim()
      );

      // Link credential to existing Firebase user UID
      await linkPhoneCredential(credential);

      setOtpStep('verified');
      setPhoneSuccess('Mobile number verified & securely linked to your citizen account!');
      setOtpCode('');
      setPhoneInput('');
    } catch (err: any) {
      console.error('OTP Verification Error:', err);
      let message = 'Invalid or expired verification code. Please check and retry.';
      if (err.code === 'auth/credential-already-in-use') {
        message = 'This phone number is already linked to another CivicResolve account.';
      } else if (err.code === 'auth/invalid-verification-code') {
        message = 'Incorrect 6-digit verification code. Please re-enter.';
      } else if (err.code === 'auth/session-expired') {
        message = 'SMS code has expired. Please request a new OTP.';
      }
      setPhoneError(message);
    } finally {
      setPhoneLoading(false);
    }
  };

  const userTier =
    creditsBalance >= 300
      ? 'Platinum'
      : creditsBalance >= 150
      ? 'Gold'
      : creditsBalance >= 50
      ? 'Silver'
      : 'Bronze';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Profile Summary Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-[#0F2854] text-orange-400 border border-blue-900 flex items-center justify-center font-bold text-2xl shadow-md shrink-0">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-[#0F2854]">
                {displayName}
              </h1>
              <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${isAdmin ? 'bg-orange-50 text-orange-800 border border-orange-200' : 'bg-blue-50 text-[#0F2854] border border-blue-200'}`}>
                <Shield className={`w-3 h-3 ${isAdmin ? 'text-orange-600' : 'text-orange-500'}`} />
                {isAdmin ? 'Municipal Administrator' : 'Verified Citizen'}
              </span>
              {phoneVerified ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Phone Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                  <Clock className="w-3 h-3 text-amber-600" />
                  Phone Unlinked
                </span>
              )}
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                Tier: {userTier} Guardian
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {currentUser?.email} • {phoneNumber || 'No phone linked'} • Member since 2026
            </p>
          </div>
        </div>

        {/* ResolveRewards Wallet Tile */}
        <div className="bg-[#0F2854] text-white p-4 sm:p-5 rounded-xl min-w-[240px] space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
            <span>ResolveRewards™ Balance</span>
            <Award className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-semibold text-white font-mono tabular-nums">
            {creditsBalance} <span className="text-xs font-sans text-slate-400 font-normal">Credits</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Earned via verified civic grievance submissions and confirmation actions.
          </p>
        </div>
      </div>

      {/* Main Two-Column Grid: Profile & Phone Settings + Rewards Store */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 1 Column: Profile & Phone Verification Settings */}
        <div className="space-y-6">
          {/* Profile Details Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-card space-y-5">
            <h2 className="text-base font-bold text-[#0F2854] flex items-center gap-2">
              <User className="w-4 h-4 text-orange-500" />
              <span>Citizen Profile Details</span>
            </h2>

            {savedSuccess && (
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-[#0F2854] text-xs flex items-center gap-2 animate-fadeIn">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Profile preferences updated successfully!</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Full Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F2854]/20 focus:border-[#0F2854]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Registered Email Address
                </label>
                <input
                  type="email"
                  value={currentUser?.email || ''}
                  disabled
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Default Municipal Ward / Zone
                </label>
                <input
                  type="text"
                  value={ward}
                  onChange={(e) => setWard(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F2854]/20 focus:border-[#0F2854]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Preferred Interface Language
                </label>
                <select
                  value={language}
                  onChange={(e) => {
                    const newLang = e.target.value as any;
                    setLanguage(newLang);
                    i18n.changeLanguage(newLang);
                    localStorage.setItem('civicresolve_lang', newLang);
                    document.documentElement.lang = newLang;
                    window.dispatchEvent(new CustomEvent('civicresolve_lang_changed', { detail: newLang }));
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F2854]/20 focus:border-[#0F2854]"
                >
                  <option value="en">English (Official Municipal)</option>
                  <option value="ta">தமிழ் (Tamil)</option>
                  <option value="hi">हिन्दी (Hindi)</option>
                  <option value="te">తెలుగు (Telugu)</option>
                  <option value="kn">ಕನ್ನಡ (Kannada)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#0F2854] hover:bg-[#1C4D8D] text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Profile Preferences</span>
              </button>
            </form>
          </div>

          {/* Phone OTP Verification & Account Linking Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[#0F2854] flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-orange-500" />
                <span>Phone OTP Verification</span>
              </h2>
              {phoneVerified && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Linked
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500">
              Link your Indian mobile number via Firebase SMS OTP for municipal emergency alerts, dispatch updates, and verified citizen badge.
            </p>

            {/* Hidden reCAPTCHA container for Firebase Web SDK */}
            <div id="recaptcha-container"></div>

            {phoneError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>{phoneError}</span>
              </div>
            )}

            {phoneSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{phoneSuccess}</span>
              </div>
            )}

            {phoneVerified ? (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Verified Mobile Number</span>
                  <span className="font-mono font-bold text-[#0F2854]">{phoneNumber}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Authenticated via Firebase Security Provider</span>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {otpStep === 'idle' ? (
                  <form onSubmit={handleSendOtp} className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Mobile Number (+91)
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 select-none">
                          🇮🇳 +91
                        </span>
                        <input
                          type="tel"
                          maxLength={10}
                          placeholder="e.g. 9876543210"
                          value={phoneInput}
                          onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, ''))}
                          className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F2854]/20 focus:border-[#0F2854]"
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Demo tip: Test numbers like <code className="font-mono text-slate-600">+91 9999999999</code> bypass SMS quotas.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={phoneLoading || phoneInput.length < 10}
                      className="w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2"
                    >
                      {phoneLoading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Generating reCAPTCHA & OTP...</span>
                        </>
                      ) : (
                        <>
                          <Phone className="w-3.5 h-3.5" />
                          <span>Send 6-Digit Verification Code</span>
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-semibold text-slate-700">
                          Enter 6-Digit OTP Code
                        </label>
                        <button
                          type="button"
                          onClick={() => setOtpStep('idle')}
                          className="text-[11px] text-orange-600 hover:underline"
                        >
                          Change Number
                        </button>
                      </div>
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="••••••"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                        className="w-full px-3 py-2 text-center font-mono tracking-widest text-lg rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F2854]/20 focus:border-[#0F2854]"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={phoneLoading || otpCode.length !== 6}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2"
                    >
                      {phoneLoading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Linking Credential to UID...</span>
                        </>
                      ) : (
                        <>
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>Verify & Secure Account</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                      <span>Didn't receive SMS?</span>
                      {resendTimer > 0 ? (
                        <span className="text-slate-400 font-mono">Resend in {resendTimer}s</span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleSendOtp}
                          disabled={phoneLoading}
                          className="text-orange-600 font-bold hover:underline flex items-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Resend OTP</span>
                        </button>
                      )}
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right 2 Columns: ResolveRewards™ Engine & Vouchers */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-card space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-orange-500" />
                  <h2 className="text-lg font-bold text-[#0F2854]">
                    ResolveRewards™ Utility Vouchers
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Redeem your earned civic credits for government rebates, transit passes, and environmental perks.
                </p>
              </div>

              <div className="text-xs font-mono font-bold text-orange-600 bg-orange-50 px-3 py-1 rounded-full border border-orange-200 self-start sm:self-auto">
                Algorithm: Multiplier-Indexed
              </div>
            </div>

            {/* Vouchers Catalog */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {vouchers.map((vouch) => {
                const claimedCode = claimedVouchers[vouch.id];
                const canAfford = creditsBalance >= vouch.creditsCost;

                return (
                  <div
                    key={vouch.id}
                    className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-blue-400 hover:shadow-card transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-slate-500 uppercase">
                          {vouch.category}
                        </span>
                        <span className="font-mono font-bold text-[#0F2854] bg-blue-100 px-2 py-0.5 rounded">
                          {vouch.creditsCost} Credits
                        </span>
                      </div>

                      <h3 className="font-bold text-sm text-[#0F2854] leading-snug">
                        {vouch.title}
                      </h3>
                      <p className="text-xs font-semibold text-orange-600">
                        {vouch.discount}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Issued by: {vouch.provider}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-200">
                      {claimedCode ? (
                        <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-1">
                          <span className="text-[10px] uppercase font-bold text-emerald-800 block">
                            Voucher Claimed
                          </span>
                          <span className="font-mono text-xs font-bold text-emerald-950 block select-all">
                            {claimedCode}
                          </span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={!canAfford}
                          onClick={() => handleRedeem(vouch)}
                          className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${
                            canAfford
                              ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-xs'
                              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          {canAfford ? 'Redeem Voucher' : `Needs ${vouch.creditsCost - creditsBalance} More Credits`}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
