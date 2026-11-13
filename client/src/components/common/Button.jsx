/**
 * Reusable Button Component
 * Matches YouTube button states, pill buttons, icon buttons, and focus styling
 */
import React from 'react';

export const Button = ({
  children,
  variant = 'secondary',
  size = 'md',
  className = '',
  disabled = false,
  isLoading = false,
  icon = null,
  onClick,
  type = 'button',
  title = '',
  ariaLabel = '',
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium transition-colors duration-150 select-none focus:outline-none disabled:opacity-50 disabled:pointer-events-none';

  const variants = {
    primary:
      'bg-[#0f0f0f] text-white hover:bg-neutral-800 dark:bg-white dark:text-[#0f0f0f] dark:hover:bg-neutral-200 rounded-full',
    secondary:
      'bg-neutral-100 text-[#0f0f0f] hover:bg-neutral-200 dark:bg-neutral-800 dark:text-[#f1f1f1] dark:hover:bg-neutral-700 rounded-full',
    accent:
      'bg-[#FF0033] text-white hover:bg-[#CC0000] rounded-full shadow-sm',
    outline:
      'border border-neutral-300 dark:border-neutral-700 text-[#0f0f0f] dark:text-[#f1f1f1] hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full',
    ghost:
      'text-[#0f0f0f] dark:text-[#f1f1f1] hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full',
    icon:
      'p-2 text-[#0f0f0f] dark:text-[#f1f1f1] hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full'
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2.5',
    icon: 'w-10 h-10 p-0'
  };

  const selectedSize = variant === 'icon' ? sizes.icon : sizes[size];

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      title={title}
      aria-label={ariaLabel || title}
      className={`${baseStyles} ${variants[variant] || variants.secondary} ${selectedSize} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <>
          {icon && <span className="flex-shrink-0">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
};

export default Button;
