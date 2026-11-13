/**
 * Password Strength Meter Component
 * VidTube Platform Architecture - Phase 2
 */
import React from 'react';
import { Check, X } from 'lucide-react';

export const PasswordStrength = ({ password = '' }) => {
  const requirements = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'One uppercase letter (A-Z)', met: /[A-Z]/.test(password) },
    { label: 'One lowercase letter (a-z)', met: /[a-z]/.test(password) },
    { label: 'One number (0-9)', met: /\d/.test(password) },
    { label: 'One special character (!@#$%^&*)', met: /[@$!%*?&#^()_+\-=[\]{};':"\\|,.<>/?]/.test(password) }
  ];

  const score = requirements.filter((r) => r.met).length;

  const getStrengthMeta = () => {
    if (!password) return { text: '', color: 'bg-neutral-200 dark:bg-neutral-700', width: '0%' };
    if (score <= 2) return { text: 'Weak', color: 'bg-red-500', width: '25%' };
    if (score === 3) return { text: 'Fair', color: 'bg-amber-500', width: '50%' };
    if (score === 4) return { text: 'Good', color: 'bg-blue-500', width: '75%' };
    return { text: 'Strong', color: 'bg-emerald-500', width: '100%' };
  };

  const meta = getStrengthMeta();

  if (!password) return null;

  return (
    <div className="mt-2 space-y-2 select-none">
      {/* Strength Bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${meta.color}`}
            style={{ width: meta.width }}
          />
        </div>
        <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 min-w-12 text-right">
          {meta.text}
        </span>
      </div>

      {/* Checklist Rules */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] pt-1">
        {requirements.map((req, idx) => (
          <div
            key={idx}
            className={`flex items-center gap-1.5 ${
              req.met
                ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                : 'text-neutral-500 dark:text-neutral-400'
            }`}
          >
            {req.met ? (
              <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
            ) : (
              <X className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
            )}
            <span>{req.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PasswordStrength;
