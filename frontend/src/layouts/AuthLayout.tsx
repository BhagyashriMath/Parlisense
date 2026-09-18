import React from "react";
import { Outlet } from "react-router-dom";

interface AuthLayoutProps {
  children?: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-[100dvh] w-full max-w-full bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-3 sm:p-4 selection:bg-amber-500 selection:text-black">
      {children || <Outlet />}
    </div>
  );
}

export default AuthLayout;
