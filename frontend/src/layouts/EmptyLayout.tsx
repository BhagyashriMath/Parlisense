import React from "react";
import { Outlet } from "react-router-dom";

interface EmptyLayoutProps {
  children?: React.ReactNode;
}

export function EmptyLayout({ children }: EmptyLayoutProps) {
  return (
    <div className="min-h-[100dvh] w-full max-w-full bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-black">
      {children || <Outlet />}
    </div>
  );
}

export default EmptyLayout;
