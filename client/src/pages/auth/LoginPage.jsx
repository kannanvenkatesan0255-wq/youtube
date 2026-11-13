/**
 * VidTube Sign-In Page
 * YouTube / Google-inspired clean sign-in experience
 */
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import Logo from '../../components/common/Logo';
import Button from '../../components/common/Button';

export const LoginPage = () => {
  const { login, authError, clearAuthError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clientErrors, setClientErrors] = useState({});

  const validate = () => {
    const errors = {};
    if (!identifier.trim()) {
      errors.identifier = 'Email or username is required.';
    }
    if (!password) {
      errors.password = 'Password is required.';
    }
    setClientErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearAuthError();

    if (!validate()) return;

    setIsSubmitting(true);
    const result = await login(identifier, password);
    setIsSubmitting(false);

    if (result.success) {
      const target = location.state?.from?.pathname || '/';
      navigate(target, { replace: true });
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-8 select-none">
      <div className="w-full max-w-[440px] bg-white dark:bg-[#1f1f1f] border border-neutral-200 dark:border-neutral-800 rounded-3xl p-8 sm:p-10 shadow-sm transition-colors">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="scale-110 mb-4">
            <Logo showCountryCode={false} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0f0f0f] dark:text-[#f1f1f1]">
            Sign in
          </h1>
          <p className="text-sm text-[#606060] dark:text-[#aaaaaa] mt-1">
            to continue to VidTube
          </p>
        </div>

        {/* Global Error Banner */}
        {authError && (
          <div className="mb-6 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-start gap-2.5 text-red-600 dark:text-red-400 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span className="leading-snug">{authError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email or Username */}
          <div>
            <label
              htmlFor="identifier"
              className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5"
            >
              Email or Username
            </label>
            <input
              id="identifier"
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Enter email or username"
              autoComplete="username"
              className={`w-full px-4 py-3 rounded-xl text-sm bg-neutral-50 dark:bg-neutral-800 border transition-all text-[#0f0f0f] dark:text-[#f1f1f1] focus:outline-none ${
                clientErrors.identifier
                  ? 'border-red-500'
                  : 'border-neutral-300 dark:border-neutral-700 focus:border-blue-600 dark:focus:border-blue-500'
              }`}
            />
            {clientErrors.identifier && (
              <p className="mt-1 text-xs text-red-500">{clientErrors.identifier}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="password"
                className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400"
              >
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                autoComplete="current-password"
                className={`w-full px-4 py-3 pr-11 rounded-xl text-sm bg-neutral-50 dark:bg-neutral-800 border transition-all text-[#0f0f0f] dark:text-[#f1f1f1] focus:outline-none ${
                  clientErrors.password
                    ? 'border-red-500'
                    : 'border-neutral-300 dark:border-neutral-700 focus:border-blue-600 dark:focus:border-blue-500'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {clientErrors.password && (
              <p className="mt-1 text-xs text-red-500">{clientErrors.password}</p>
            )}
          </div>

          {/* Remember Me */}
          <div className="flex items-center pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-neutral-600 dark:text-neutral-400">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Remember this device</span>
            </label>
          </div>

          {/* Sign In Button */}
          <div className="pt-3">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isSubmitting}
              className="w-full justify-center text-sm font-semibold rounded-full py-3"
            >
              Sign in
            </Button>
          </div>
        </form>

        {/* Footer / Create Account Link */}
        <div className="mt-8 pt-6 border-t border-neutral-200 dark:border-neutral-800 text-center text-xs text-[#606060] dark:text-[#aaaaaa]">
          <span>Don't have an account? </span>
          <Link
            to="/register"
            className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
          >
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
