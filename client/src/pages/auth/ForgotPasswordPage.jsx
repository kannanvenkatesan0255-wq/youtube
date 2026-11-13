/**
 * VidTube Forgot Password Page
 * Password recovery request interface
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import Logo from '../../components/common/Logo';
import Button from '../../components/common/Button';

export const ForgotPasswordPage = () => {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError('Please provide a valid email address.');
      return;
    }

    setIsSubmitting(true);
    const result = await forgotPassword(email.trim());
    setIsSubmitting(false);

    if (result.success) {
      setIsSubmitted(true);
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8 select-none">
      <div className="w-full max-w-[440px] bg-white dark:bg-[#1f1f1f] border border-neutral-200 dark:border-neutral-800 rounded-3xl p-8 sm:p-10 shadow-sm transition-colors">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="scale-110 mb-4">
            <Logo showCountryCode={false} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0f0f0f] dark:text-[#f1f1f1]">
            Find your account
          </h1>
          <p className="text-sm text-[#606060] dark:text-[#aaaaaa] mt-1">
            Enter your VidTube recovery email
          </p>
        </div>

        {/* Success View */}
        {isSubmitted ? (
          <div className="text-center py-4 space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-base font-semibold text-[#0f0f0f] dark:text-[#f1f1f1]">
              Recovery instructions sent
            </h2>
            <p className="text-xs text-[#606060] dark:text-[#aaaaaa] leading-relaxed">
              If an account is associated with <strong>{email}</strong>, you will receive an email with instructions to reset your password shortly.
            </p>
            <div className="pt-4">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#0f0f0f] text-white hover:bg-neutral-800 dark:bg-white dark:text-[#0f0f0f] dark:hover:bg-neutral-200 text-sm font-medium transition"
              >
                <ArrowLeft className="w-4 h-4" />
                Return to Sign in
              </Link>
            </div>
          </div>
        ) : (
          /* Form View */
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-start gap-2.5 text-red-600 dark:text-red-400 text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span className="leading-snug">{error}</span>
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-500 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  autoFocus
                  className="w-full pl-11 pr-4 py-3 rounded-xl text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 focus:border-blue-600 dark:focus:border-blue-500 text-[#0f0f0f] dark:text-[#f1f1f1] focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isSubmitting}
                className="w-full justify-center text-sm font-semibold rounded-full py-3"
              >
                Send reset link
              </Button>
            </div>

            <div className="text-center pt-2">
              <Link
                to="/login"
                className="text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              >
                Back to Sign in
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
