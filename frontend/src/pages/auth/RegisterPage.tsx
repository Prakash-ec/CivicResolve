import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Shield, Eye, EyeOff, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../features/auth/AuthContext.js';
import { Button } from '../../components/ui/Button.js';
import { BrandLogo } from '../../components/brand/BrandLogo.js';

const registerSchema = z
  .object({
    fullName: z.string().min(2, 'Full name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Please confirm your password'),
    preferredLanguage: z.enum(['en', 'ta', 'hi', 'te', 'kn']),
    termsAccepted: z.literal(true, {
      errorMap: () => ({ message: 'You must accept the terms to register' }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export const RegisterPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { registerUser } = useAuth();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      preferredLanguage: (((i18n.language || 'en').split('-')[0]) as any) || 'en',
      termsAccepted: true,
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setAuthError(null);
    setSubmitting(true);
    try {
      await registerUser(
        values.fullName,
        values.email,
        values.password,
        values.preferredLanguage
      );
      i18n.changeLanguage(values.preferredLanguage);
      localStorage.setItem('civicresolve_lang', values.preferredLanguage);
      document.documentElement.lang = values.preferredLanguage;
      window.dispatchEvent(new CustomEvent('civicresolve_lang_changed', { detail: values.preferredLanguage }));
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      let message = 'Failed to register account. Please try again.';
      if (err.code === 'auth/email-already-in-use') {
        message = 'An account is already registered with this email. Please sign in instead.';
      } else if (err.code === 'auth/weak-password') {
        message = 'Password is too weak. Please use at least 6 characters.';
      } else if (err.code === 'auth/invalid-email') {
        message = 'The email address format is invalid.';
      } else if (err.code === 'auth/configuration-not-found') {
        message =
          'Firebase Authentication is pending activation in the Firebase console. Please ensure Email/Password provider is enabled.';
      } else if (err.message) {
        message = err.message;
      }
      setAuthError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6 bg-white p-6 sm:p-10 rounded-2xl border border-surface-border shadow-elevation">
        {/* Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-block mx-auto mb-2 group">
            <BrandLogo variant="full" size="lg" className="h-12 sm:h-14 w-auto mx-auto group-hover:scale-105 transition-transform" />
          </Link>
          <div className="inline-flex w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 items-center justify-center p-2 shadow-xs mb-1">
            <BrandLogo variant="icon" size="sm" className="w-full h-full object-contain" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-civic-dark tracking-tight">
            {t('auth.registerTitle')}
          </h2>
          <p className="text-xs sm:text-sm text-civic-muted">
            {t('auth.registerSubtitle')}
          </p>
        </div>

        {/* Global Error Alert */}
        {authError && (
          <div
            className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-civic-critical text-xs flex items-start gap-2.5"
            role="alert"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{authError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {/* Full Name */}
          <div>
            <label
              htmlFor="fullName"
              className="block text-xs font-semibold uppercase tracking-wider text-civic-dark mb-1"
            >
              {t('auth.fullName')}
            </label>
            <input
              id="fullName"
              type="text"
              autoComplete="name"
              {...register('fullName')}
              className={`w-full px-3.5 py-2 rounded-lg border text-sm text-civic-dark bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/20 ${
                errors.fullName ? 'border-red-500 focus:border-red-500' : 'border-surface-border focus:border-brand-500'
              }`}
              placeholder="e.g. Ramesh Kumar"
            />
            {errors.fullName && (
              <p className="mt-1 text-xs text-civic-critical">{errors.fullName.message}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-semibold uppercase tracking-wider text-civic-dark mb-1"
            >
              {t('auth.email')}
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              {...register('email')}
              className={`w-full px-3.5 py-2 rounded-lg border text-sm text-civic-dark bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/20 ${
                errors.email ? 'border-red-500 focus:border-red-500' : 'border-surface-border focus:border-brand-500'
              }`}
              placeholder="citizen@example.com"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-civic-critical">{errors.email.message}</p>
            )}
          </div>

          {/* Preferred Language */}
          <div>
            <label
              htmlFor="preferredLanguage"
              className="block text-xs font-semibold uppercase tracking-wider text-civic-dark mb-1"
            >
              {t('auth.preferredLanguage')}
            </label>
            <select
              id="preferredLanguage"
              {...register('preferredLanguage')}
              className="w-full px-3.5 py-2 rounded-lg border border-surface-border text-sm text-civic-dark bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            >
              <option value="en">English</option>
              <option value="ta">தமிழ் (Tamil)</option>
              <option value="hi">हिन्दी (Hindi)</option>
              <option value="te">తెలుగు (Telugu)</option>
              <option value="kn">ಕನ್ನಡ (Kannada)</option>
            </select>
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-xs font-semibold uppercase tracking-wider text-civic-dark mb-1"
            >
              {t('auth.password')}
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                {...register('password')}
                className={`w-full px-3.5 py-2 rounded-lg border text-sm text-civic-dark bg-white pr-10 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/20 ${
                  errors.password ? 'border-red-500 focus:border-red-500' : 'border-surface-border focus:border-brand-500'
                }`}
                placeholder="At least 6 characters"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-civic-muted hover:text-civic-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-1"
                aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-civic-critical">{errors.password.message}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-xs font-semibold uppercase tracking-wider text-civic-dark mb-1"
            >
              {t('auth.confirmPassword')}
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                {...register('confirmPassword')}
                className={`w-full px-3.5 py-2 rounded-lg border text-sm text-civic-dark bg-white pr-10 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/20 ${
                  errors.confirmPassword
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-surface-border focus:border-brand-500'
                }`}
                placeholder="Re-enter password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-civic-muted hover:text-civic-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-1"
                aria-label={showConfirmPassword ? t('auth.hidePassword') : t('auth.showPassword')}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-civic-critical">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          {/* Terms checkbox */}
          <div className="pt-1">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                {...register('termsAccepted')}
                className="mt-0.5 h-4 w-4 rounded border-surface-border text-brand-500 focus:ring-brand-500"
              />
              <span className="text-xs text-civic-muted leading-tight">
                {t('auth.termsNotice')}
              </span>
            </label>
            {errors.termsAccepted && (
              <p className="mt-1 text-xs text-civic-critical">
                {errors.termsAccepted.message}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            size="lg"
            className="w-full shadow-md font-semibold mt-2"
            isLoading={submitting}
          >
            <span>{t('auth.registerButton')}</span>
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </form>

        {/* Footer Link to Login */}
        <div className="pt-4 border-t border-surface-border text-center text-xs text-civic-muted">
          <span>{t('auth.haveAccount')} </span>
          <Link
            to="/login"
            className="font-semibold text-brand-600 hover:text-brand-700 transition-colors"
          >
            {t('auth.signInButton')}
          </Link>
        </div>
      </div>
    </div>
  );
};
