/**
 * VidTube Sign-Up / Registration Page
 * YouTube / Google-inspired registration experience
 */
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import Logo from '../../components/common/Logo';
import Button from '../../components/common/Button';
import PasswordStrength from '../../components/common/PasswordStrength';

export const RegisterPage = () => {
  const { register, authError, clearAuthError } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clientErrors, setClientErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validate = () => {
    const errors = {};
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      errors.name = 'Full name must be at least 2 characters.';
    }
    if (!formData.username.trim() || !/^[a-zA-Z0-9_]{3,30}$/.test(formData.username.trim())) {
      errors.username = 'Username must be 3-30 alphanumeric characters or underscores.';
    }
    if (!formData.email.trim() || !/^\S+@\S+\.\S+$/.test(formData.email.trim())) {
      errors.email = 'Please provide a valid email address.';
    }
    if (!formData.password) {
      errors.password = 'Password is required.';
    } else if (
      !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/.test(
        formData.password
      )
    ) {
      errors.password = 'Password does not satisfy complexity requirements below.';
    }
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }
    if (!formData.agreeToTerms) {
      errors.agreeToTerms = 'You must accept the terms of service to create an account.';
    }

    setClientErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearAuthError();

    if (!validate()) return;

    setIsSubmitting(true);
    const result = await register({
      name: formData.name,
      username: formData.username,
      email: formData.email,
      password: formData.password,
      confirmPassword: formData.confirmPassword
    });
    setIsSubmitting(false);

    if (result.success) {
      navigate('/', { replace: true });
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center px-4 py-10 select-none">
      <div className="w-full max-w-[480px] bg-white dark:bg-[#1f1f1f] border border-neutral-200 dark:border-neutral-800 rounded-3xl p-8 sm:p-10 shadow-sm transition-colors">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="scale-110 mb-4">
            <Logo showCountryCode={false} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0f0f0f] dark:text-[#f1f1f1]">
            Create your VidTube account
          </h1>
          <p className="text-sm text-[#606060] dark:text-[#aaaaaa] mt-1">
            Start streaming, sharing, and creating today
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
          {/* Full Name */}
          <div>
            <label
              htmlFor="name"
              className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1"
            >
              Full Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Alex Morgan"
              className={`w-full px-4 py-2.5 rounded-xl text-sm bg-neutral-50 dark:bg-neutral-800 border transition-all text-[#0f0f0f] dark:text-[#f1f1f1] focus:outline-none ${
                clientErrors.name
                  ? 'border-red-500'
                  : 'border-neutral-300 dark:border-neutral-700 focus:border-blue-600 dark:focus:border-blue-500'
              }`}
            />
            {clientErrors.name && (
              <p className="mt-1 text-xs text-red-500">{clientErrors.name}</p>
            )}
          </div>

          {/* Username */}
          <div>
            <label
              htmlFor="username"
              className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1"
            >
              Username & Channel Handle
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 text-sm">
                @
              </span>
              <input
                id="username"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleChange}
                placeholder="alexmorgan"
                className={`w-full pl-8 pr-4 py-2.5 rounded-xl text-sm bg-neutral-50 dark:bg-neutral-800 border transition-all text-[#0f0f0f] dark:text-[#f1f1f1] focus:outline-none ${
                  clientErrors.username
                    ? 'border-red-500'
                    : 'border-neutral-300 dark:border-neutral-700 focus:border-blue-600 dark:focus:border-blue-500'
                }`}
              />
            </div>
            {clientErrors.username && (
              <p className="mt-1 text-xs text-red-500">{clientErrors.username}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1"
            >
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="alex@example.com"
              className={`w-full px-4 py-2.5 rounded-xl text-sm bg-neutral-50 dark:bg-neutral-800 border transition-all text-[#0f0f0f] dark:text-[#f1f1f1] focus:outline-none ${
                clientErrors.email
                  ? 'border-red-500'
                  : 'border-neutral-300 dark:border-neutral-700 focus:border-blue-600 dark:focus:border-blue-500'
              }`}
            />
            {clientErrors.email && (
              <p className="mt-1 text-xs text-red-500">{clientErrors.email}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                placeholder="Create password"
                className={`w-full px-4 py-2.5 pr-11 rounded-xl text-sm bg-neutral-50 dark:bg-neutral-800 border transition-all text-[#0f0f0f] dark:text-[#f1f1f1] focus:outline-none ${
                  clientErrors.password
                    ? 'border-red-500'
                    : 'border-neutral-300 dark:border-neutral-700 focus:border-blue-600 dark:focus:border-blue-500'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {/* Password Strength Indicator */}
            <PasswordStrength password={formData.password} />
            {clientErrors.password && (
              <p className="mt-1 text-xs text-red-500">{clientErrors.password}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1"
            >
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Repeat password"
                className={`w-full px-4 py-2.5 pr-11 rounded-xl text-sm bg-neutral-50 dark:bg-neutral-800 border transition-all text-[#0f0f0f] dark:text-[#f1f1f1] focus:outline-none ${
                  clientErrors.confirmPassword
                    ? 'border-red-500'
                    : 'border-neutral-300 dark:border-neutral-700 focus:border-blue-600 dark:focus:border-blue-500'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {clientErrors.confirmPassword && (
              <p className="mt-1 text-xs text-red-500">{clientErrors.confirmPassword}</p>
            )}
          </div>

          {/* Terms Acceptance */}
          <div className="pt-2">
            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-neutral-600 dark:text-neutral-400">
              <input
                type="checkbox"
                name="agreeToTerms"
                checked={formData.agreeToTerms}
                onChange={handleChange}
                className="w-4 h-4 mt-0.5 rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
              />
              <span>
                I agree to VidTube's Terms of Service, Community Guidelines, and Privacy Policy.
              </span>
            </label>
            {clientErrors.agreeToTerms && (
              <p className="mt-1 text-xs text-red-500">{clientErrors.agreeToTerms}</p>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <Button
              type="submit"
              variant="accent"
              size="lg"
              isLoading={isSubmitting}
              className="w-full justify-center text-sm font-semibold rounded-full py-3"
            >
              Create account
            </Button>
          </div>
        </form>

        {/* Footer Link */}
        <div className="mt-8 pt-6 border-t border-neutral-200 dark:border-neutral-800 text-center text-xs text-[#606060] dark:text-[#aaaaaa]">
          <span>Already have a VidTube account? </span>
          <Link
            to="/login"
            className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
