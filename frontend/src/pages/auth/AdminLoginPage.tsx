import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ShieldAlert,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../features/auth/AuthContext.js';
import { BrandLogo } from '../../components/brand/BrandLogo.js';

const adminLoginSchema = z.object({
  email: z.string().email('Please enter a valid official email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type AdminLoginFormValues = z.infer<typeof adminLoginSchema>;

export const AdminLoginPage: React.FC = () => {
  const { loginUser, logoutUser } = useAuth();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [demoActive, setDemoActive] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<AdminLoginFormValues>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Hackathon Admin Demo Autofill (populates fields without auto-submitting)
  const handleAutofillAdminDemo = () => {
    setValue('email', 'admin@civicresolve.org', { shouldValidate: true });
    setValue('password', 'AdminDemo@2026', { shouldValidate: true });
    setDemoActive(true);
    setAuthError(null);
  };

  const onSubmit = async (values: AdminLoginFormValues) => {
    setAuthError(null);
    setSubmitting(true);
    try {
      const { user, isAdmin } = await loginUser(values.email, values.password);

      // Verify authoritative server-side custom claim
      if (!isAdmin) {
        await logoutUser();
        setAuthError(
          'Access Denied: This account is authenticated as a Citizen, not a Municipal Administrator. Please sign in via the Citizen Portal.'
        );
        return;
      }

      navigate('/admin', { replace: true });
    } catch (err: any) {
      let message = 'Failed to authenticate administrator credentials.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        message = 'Invalid administrator email or password. Please verify your credentials.';
      } else if (err.code === 'auth/user-not-found') {
        message = 'No municipal administrator record found with this email.';
      } else if (err.code === 'auth/too-many-requests') {
        message = 'Access temporarily throttled due to multiple failed attempts. Please retry later.';
      } else if (err.message) {
        message = err.message;
      }
      setAuthError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50/50">
      <div className="w-full max-w-md space-y-7 bg-white p-6 sm:p-10 rounded-3xl border border-slate-200 shadow-elevation">
        {/* Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-block mx-auto mb-2 group">
            <BrandLogo variant="full" size="lg" className="h-12 sm:h-14 w-auto mx-auto group-hover:scale-105 transition-transform" />
          </Link>
          <div className="inline-flex w-12 h-12 rounded-2xl bg-orange-50 border border-orange-200 items-center justify-center p-2 shadow-xs mb-1">
            <BrandLogo variant="icon" size="sm" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F2854] tracking-tight">
            Administrator Login
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Authorized civic administrators can manage, review, and resolve public complaints.
          </p>
        </div>

        {/* Hackathon Demo Autofill Widget */}
        <div className="p-3.5 rounded-2xl bg-orange-50/60 border border-orange-200 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-orange-800">
              <Sparkles className="w-3.5 h-3.5 text-orange-600" />
              <span>Admin Demo Account</span>
            </div>
            <span className="text-[10px] uppercase font-bold text-orange-700 bg-white px-2 py-0.5 rounded border border-orange-200">
              Judges Mode
            </span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            Prefill authorized municipal administrator credentials with verified custom claims.
          </p>
          <button
            type="button"
            onClick={handleAutofillAdminDemo}
            className="w-full py-1.5 rounded-xl bg-white hover:bg-orange-50 border border-orange-300 text-xs font-bold text-orange-800 transition-colors shadow-2xs flex items-center justify-center gap-1.5"
          >
            <span>Autofill Admin Demo</span>
          </button>
          {demoActive && (
            <p className="text-[10px] text-emerald-700 font-semibold text-center animate-fadeIn">
              ✓ Admin credentials loaded. Click "Sign In as Administrator" below.
            </p>
          )}
        </div>

        {/* Error Alert */}
        {authError && (
          <div
            className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5"
            role="alert"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
            <span className="leading-relaxed">{authError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-medium text-slate-700 mb-1"
            >
              Official municipal email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              {...register('email')}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 ${
                errors.email ? 'border-red-500 focus:border-red-500' : 'border-slate-200 focus:border-orange-500'
              }`}
              placeholder="admin@civicresolve.org"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="password"
                className="block text-xs font-medium text-slate-700"
              >
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-xs font-semibold text-orange-600 hover:text-orange-700"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                {...register('password')}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm text-slate-900 bg-white pr-10 focus:outline-none focus:ring-2 focus:ring-orange-500/20 ${
                  errors.password ? 'border-red-500 focus:border-red-500' : 'border-slate-200 focus:border-orange-500'
                }`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-1"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
            )}
          </div>

          <div className="pt-1">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-medium text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Lock className="w-4 h-4" />
              <span>{submitting ? 'Verifying Authorization...' : 'Sign In as Administrator'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
          <span>Are you a citizen? </span>
          <Link to="/citizen/login" className="font-bold text-[#0F2854] hover:underline">
            Switch to Citizen Login
          </Link>
        </div>
      </div>
    </div>
  );
};
