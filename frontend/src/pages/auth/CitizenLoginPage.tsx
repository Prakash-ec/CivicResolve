import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import {
  User,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../features/auth/AuthContext.js';
import { BrandLogo } from '../../components/brand/BrandLogo.js';
import { Button } from '../../components/ui/Button.js';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const CitizenLoginPage: React.FC = () => {
  const { t } = useTranslation();
  const { loginUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [demoActive, setDemoActive] = useState(false);

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: true,
    },
  });

  // Hackathon Citizen Demo Autofill (populates fields without auto-submitting)
  const handleAutofillCitizenDemo = () => {
    setValue('email', 'citizen@civicresolve.org', { shouldValidate: true });
    setValue('password', 'CitizenDemo@2026', { shouldValidate: true });
    setDemoActive(true);
    setAuthError(null);
  };

  const onSubmit = async (values: LoginFormValues) => {
    setAuthError(null);
    setSubmitting(true);
    try {
      const { user, isAdmin } = await loginUser(values.email, values.password);
      if (isAdmin) {
        // If an admin logs into citizen portal, gracefully route them to admin portal
        navigate('/admin', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      let message = 'Failed to sign in. Please verify your citizen credentials.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        message = 'Invalid email or password. Please check your credentials.';
      } else if (err.code === 'auth/user-not-found') {
        message = 'No registered citizen account found with this email.';
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
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-7 bg-white p-6 sm:p-10 rounded-3xl border border-slate-200 shadow-elevation">
        {/* Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-block mx-auto mb-2 group">
            <BrandLogo variant="full" size="lg" className="h-12 sm:h-14 w-auto mx-auto group-hover:scale-105 transition-transform" />
          </Link>
          <div className="inline-flex w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 items-center justify-center p-2 shadow-xs mb-1">
            <BrandLogo variant="icon" size="sm" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F2854] tracking-tight">
            Citizen Login
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Sign in to report civic issues, track complaints, and make your community better.
          </p>
        </div>

        {/* Hackathon Demo Autofill Widget */}
        <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#0F2854]">
              <Sparkles className="w-3.5 h-3.5 text-orange-500" />
              <span>Hackathon Quick Demo</span>
            </div>
            <span className="text-[10px] uppercase font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
              Judges Mode
            </span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            Prefill validated citizen credentials for instant hackathon evaluation.
          </p>
          <button
            type="button"
            onClick={handleAutofillCitizenDemo}
            className="w-full py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-blue-300 text-xs font-bold text-[#0F2854] transition-colors shadow-2xs flex items-center justify-center gap-1.5"
          >
            <span>Autofill Citizen Demo</span>
          </button>
          {demoActive && (
            <p className="text-[10px] text-emerald-700 font-semibold text-center animate-fadeIn">
              ✓ Demo credentials loaded. Click "Sign In as Citizen" below.
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

        {/* Login Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-medium text-slate-700 mb-1"
            >
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              {...register('email')}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#0F2854]/20 ${
                errors.email ? 'border-red-500 focus:border-red-500' : 'border-slate-200 focus:border-[#0F2854]'
              }`}
              placeholder="citizen@civicresolve.org"
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
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm text-slate-900 bg-white pr-10 focus:outline-none focus:ring-2 focus:ring-[#0F2854]/20 ${
                  errors.password ? 'border-red-500 focus:border-red-500' : 'border-slate-200 focus:border-[#0F2854]'
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

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600">
              <input
                type="checkbox"
                {...register('rememberMe')}
                className="rounded border-slate-300 text-[#0F2854] focus:ring-[#0F2854]"
              />
              <span>Remember this session</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded-lg bg-[#0F2854] hover:bg-[#1C4D8D] text-white font-medium text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>{submitting ? 'Authenticating...' : 'Sign In as Citizen'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Footer & Portal Switch */}
        <div className="pt-4 border-t border-slate-100 space-y-2 text-center text-xs text-slate-500">
          <div>
            <span>Don't have an account? </span>
            <Link to="/register" className="font-bold text-orange-600 hover:text-orange-700 underline">
              Create citizen account
            </Link>
          </div>
          <div>
            <span>Municipal authority? </span>
            <Link to="/admin/login" className="font-bold text-[#0F2854] hover:underline">
              Switch to Admin Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
