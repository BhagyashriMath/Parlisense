import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: boolean;
  variant?: "default" | "panel" | "danger" | "emerald";
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ children, glow = false, variant = "default", className = "", ...props }, ref) => {
    const variantStyles = {
      default: "bg-slate-900/95 border-slate-800",
      panel: "bg-slate-950/90 border-slate-800/80",
      danger: "bg-rose-950/40 border-rose-600/40",
      emerald: "bg-emerald-950/40 border-emerald-600/40"
    };

    return (
      <div
        ref={ref}
        className={`rounded-xl border shadow-sm transition-all overflow-hidden ${variantStyles[variant]} ${
          glow ? "shadow-[0_0_20px_rgba(245,158,11,0.12)] border-amber-500/40" : ""
        } ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = "Card";

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ children, className = "", ...props }, ref) => (
    <div
      ref={ref}
      className={`px-3 py-2.5 border-b border-slate-800/80 flex items-center justify-between gap-2 flex-shrink-0 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
);
CardHeader.displayName = "CardHeader";

export const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ children, className = "", ...props }, ref) => (
    <h3
      ref={ref}
      className={`text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center gap-1.5 leading-tight ${className}`}
      {...props}
    >
      {children}
    </h3>
  )
);
CardTitle.displayName = "CardTitle";

export const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ children, className = "", ...props }, ref) => (
    <p
      ref={ref}
      className={`text-[10px] text-slate-400 leading-tight mt-0.5 ${className}`}
      {...props}
    >
      {children}
    </p>
  )
);
CardDescription.displayName = "CardDescription";

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ children, className = "", ...props }, ref) => (
    <div ref={ref} className={`p-3 text-slate-200 ${className}`} {...props}>
      {children}
    </div>
  )
);
CardContent.displayName = "CardContent";

export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ children, className = "", ...props }, ref) => (
    <div
      ref={ref}
      className={`px-3 py-2 border-t border-slate-800/80 flex items-center justify-between gap-2 flex-shrink-0 bg-slate-950/40 text-xs ${className}`}
      {...props}
    >
      {children}
    </div>
  )
);
CardFooter.displayName = "CardFooter";
