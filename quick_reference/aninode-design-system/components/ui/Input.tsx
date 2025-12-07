import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input: React.FC<InputProps> = ({ label, className, ...props }) => {
  return (
    <div className="flex flex-col gap-1.5 mb-4">
      {label && <label className="text-xs text-neutral-500 font-mono uppercase tracking-wider">{label}</label>}
      <input
        className={`bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white text-sm rounded px-3 py-2 focus:outline-none focus:border-accent-red focus:shadow-[0_0_10px_rgba(255,31,31,0.2)] transition-all duration-200 font-mono ${className}`}
        {...props}
      />
    </div>
  );
};

export const Slider: React.FC<InputProps & { min: number, max: number }> = ({ label, value, ...props }) => {
  return (
    <div className="flex flex-col gap-2 mb-4">
      <div className="flex justify-between items-center">
         {label && <label className="text-xs text-neutral-500 font-mono uppercase tracking-wider">{label}</label>}
         <span className="text-xs font-mono text-accent-red">{value}</span>
      </div>
      <input
        type="range"
        className="w-full h-1 bg-neutral-200 dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-accent-red"
        value={value}
        {...props}
      />
    </div>
  );
};