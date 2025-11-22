'use client';

import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export default function Input({ 
  label, 
  error, 
  helperText, 
  className,
  id,
  ...props 
}: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="w-full">
      {label && (
        <label 
          htmlFor={inputId}
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          "w-full px-3 py-2 border rounded-lg transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
          "disabled:bg-zinc-100 disabled:cursor-not-allowed dark:disabled:bg-zinc-800",
          error 
            ? "border-red-500 focus:ring-red-500" 
            : "border-zinc-300 dark:border-zinc-600",
          "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100",
          className
        )}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {helperText}
        </p>
      )}
    </div>
  );
}

// Select Component
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: Array<{ value: string; label: string }>;
}

export function Select({ 
  label, 
  error, 
  helperText, 
  options,
  className,
  id,
  ...props 
}: SelectProps) {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="w-full">
      {label && (
        <label 
          htmlFor={selectId}
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
        >
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={cn(
          "w-full px-3 py-2 border rounded-lg transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
          "disabled:bg-zinc-100 disabled:cursor-not-allowed dark:disabled:bg-zinc-800",
          error 
            ? "border-red-500 focus:ring-red-500" 
            : "border-zinc-300 dark:border-zinc-600",
          "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100",
          className
        )}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {helperText}
        </p>
      )}
    </div>
  );
}

// Textarea Component
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export function Textarea({ 
  label, 
  error, 
  helperText, 
  className,
  id,
  ...props 
}: TextareaProps) {
  const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="w-full">
      {label && (
        <label 
          htmlFor={textareaId}
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
        >
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={cn(
          "w-full px-3 py-2 border rounded-lg transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
          "disabled:bg-zinc-100 disabled:cursor-not-allowed dark:disabled:bg-zinc-800",
          error 
            ? "border-red-500 focus:ring-red-500" 
            : "border-zinc-300 dark:border-zinc-600",
          "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100",
          className
        )}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {helperText}
        </p>
      )}
    </div>
  );
}
