import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Shield, Mail, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../features/auth/AuthContext.js';
import { Button } from '../../components/ui/Button.js';
import { BrandLogo } from '../../components/brand/BrandLogo.js';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export const ForgotPasswordPage: React.FC = () => {
  const { t } = useTranslation();
  const { resetUserPassword } = useAuth();

  const [authError, setAuthError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    setAuthError(null);
    setSuccessMessage(null);
    setSubmitting(true);
    try {
      await resetUserPassword(values.email);
      setSuccessMessage(t('auth.resetSent'));
    } catch (err: any) {
      let message = 'Failed to dispatch password reset email. Please try again.';
      if (err.code === 'auth/user-not-found') {
        message = 'No registered citizen account found with this email.';
      } else if (err.code === 'auth/invalid-email') {
        message = 'Invalid email address format.';
      } else if (err.message) {
        message = err.message;
      }
      setAuthError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
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
            {t('auth.forgotPasswordTitle')}
          </h2>
          <p className="text-xs sm:text-sm text-civic-muted">
            {t('auth.forgotPasswordSubtitle')}
          </p>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div
            className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-[#0F2854] text-xs flex items-start gap-2.5"
            role="status"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-blue-600" />
            <span className="leading-relaxed">{successMessage}</span>
          </div>
        )}

        {/* Error Alert */}
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
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-semibold uppercase tracking-wider text-civic-dark mb-1.5"
            >
              {t('auth.email')}
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              {...register('email')}
              className={`w-full px-3.5 py-2.5 rounded-lg border text-sm text-civic-dark bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/20 ${
                errors.email ? 'border-red-500 focus:border-red-500' : 'border-surface-border focus:border-brand-500'
              }`}
              placeholder="citizen@example.com"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-civic-critical">{errors.email.message}</p>
            )}
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full shadow-md font-semibold"
            isLoading={submitting}
          >
            {t('auth.sendResetLink')}
          </Button>
        </form>

        {/* Back Link */}
        <div className="pt-4 border-t border-surface-border text-center">
          <Link
            to="/login"
            className="inline-flex items-center text-xs font-semibold text-civic-muted hover:text-civic-dark transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
            {t('auth.backToSignIn')}
          </Link>
        </div>
      </div>
    </div>
  );
};
