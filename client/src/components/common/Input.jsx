/**
 * Reusable Input Component
 * Styled with YouTube's subtle borders and focus rings
 */
import React, { forwardRef } from 'react';

export const Input = forwardRef(
  (
    {
      type = 'text',
      placeholder = '',
      value,
      onChange,
      prefixIcon = null,
      suffixIcon = null,
      className = '',
      error = '',
      disabled = false,
      ...props
    },
    ref
  ) => {
    return (
      <div className="w-full">
        <div
          className={`flex items-center w-full transition-colors bg-transparent border rounded-full overflow-hidden ${
            error
              ? 'border-red-500'
              : 'border-neutral-300 dark:border-neutral-700 focus-within:border-blue-600 dark:focus-within:border-blue-500'
          } ${className}`}
        >
          {prefixIcon && <div className="pl-4 text-neutral-500">{prefixIcon}</div>}
          <input
            ref={ref}
            type={type}
            value={value}
            onChange={onChange}
            disabled={disabled}
            placeholder={placeholder}
            className="w-full px-4 py-2 text-sm bg-transparent text-[#0f0f0f] dark:text-[#f1f1f1] placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none"
            {...props}
          />
          {suffixIcon && <div className="pr-3 text-neutral-500">{suffixIcon}</div>}
        </div>
        {error && <p className="mt-1 text-xs text-red-500 pl-4">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
