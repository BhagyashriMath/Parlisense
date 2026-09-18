import React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "danger" | "info" | "neutral" | "gold" | "outline";
  size?: "sm" | "md";
  pulse?: boolean;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "default",
  size = "md",
  pulse = false,
  icon,
  className = "",
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center font-bold tracking-wider rounded-md border font-mono leading-none select-none";

  const variantStyles = {
    default: "bg-slate-800 text-slate-300 border-slate-700",
    success: "bg-emerald-950/70 text-emerald-300 border-emerald-600/40",
    warning: "bg-amber-950/70 text-amber-300 border-amber-600/40",
    danger: "bg-rose-950/70 text-rose-300 border-rose-600/40",
    info: "bg-sky-950/70 text-sky-300 border-sky-600/40",
    neutral: "bg-slate-900 text-slate-400 border-slate-800",
    gold: "bg-amber-500/20 text-amber-300 border-amber-500/50",
    outline: "bg-transparent text-slate-300 border-slate-700"
  };

  const sizeStyles = {
    sm: "text-[9px] px-1.5 py-0.5 gap-1",
    md: "text-[10px] px-2 py-0.5 gap-1.5"
  };

  const pulseColors = {
    default: "bg-slate-400",
    success: "bg-emerald-400",
    warning: "bg-amber-400",
    danger: "bg-rose-400",
    info: "bg-sky-400",
    neutral: "bg-slate-400",
    gold: "bg-amber-400",
    outline: "bg-slate-400"
  };

  return (
    <span
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {pulse && (
        <span className="relative flex h-1.5 w-1.5 flex-shrink-0">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${pulseColors[variant]}`}
          />
          <span
            className={`relative inline-flex rounded-full h-1.5 w-1.5 ${pulseColors[variant]}`}
          />
        </span>
      )}
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
