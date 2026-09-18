import React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  errorText?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, helperText, errorText, icon, className = "", id, ...props }, ref) => {
    const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, "-")}` : undefined);

    return (
      <div className="flex flex-col gap-1 w-full">
        {label && (
          <label htmlFor={inputId} className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && (
            <span className="absolute left-2.5 text-slate-500 pointer-events-none flex items-center">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`w-full bg-slate-950/90 text-slate-100 placeholder-slate-500 border rounded-lg text-xs py-1.5 transition-all duration-150 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 disabled:opacity-50 disabled:bg-slate-900 ${
              icon ? "pl-8 pr-2.5" : "px-2.5"
            } ${errorText ? "border-rose-500 focus:ring-rose-500" : "border-slate-700 hover:border-slate-600"} ${className}`}
            {...props}
          />
        </div>
        {errorText ? (
          <span className="text-[10px] text-rose-400 font-semibold">{errorText}</span>
        ) : helperText ? (
          <span className="text-[10px] text-slate-500">{helperText}</span>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
