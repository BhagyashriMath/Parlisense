import React from "react";
import { useLoginViewModel } from "../viewmodel/useLoginViewModel";
import { LoginIntroAnimation } from "./components/LoginIntroAnimation";
import {
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  Sparkles,
  RefreshCw
} from "lucide-react";

/**
 * LoginPage View (Feature-Based MVM Architecture)
 * Pure presentation layout for Chamber Terminal authentication.
 */
export function LoginPage() {
  const vm = useLoginViewModel();

  if (vm.showIntro) {
    return (
      <LoginIntroAnimation
        onComplete={vm.dismissIntro}
        onSkip={vm.dismissIntro}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-black">
      {/* Top National Chamber Header */}
      <header className="bg-slate-900/80 border-b border-slate-800 px-3 sm:px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 border border-amber-500/40 p-1 flex items-center justify-center shadow-inner">
            <img
              src="/Parlisense.png"
              alt="ParliSense Logo"
              className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]"
            />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight text-slate-100">Parliament AI</h1>
            <p className="text-[11px] text-slate-400">
              Sansad Bhavan Chamber Network • Secure Terminal Login
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Replay Intro Animation Button */}
          <button
            id="replay-intro-btn"
            type="button"
            onClick={vm.replayIntro}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-amber-300 border border-slate-800 text-xs font-mono flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            title="Replay the Parliamentary AI introductory animation"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">Replay Intro</span>
          </button>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="flex-1 flex flex-col justify-center items-center p-4 sm:p-6">
        <div className="max-w-md w-full">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 backdrop-blur-md">
            {/* Header / Seal */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-slate-950 border-2 border-amber-400/40 flex items-center justify-center p-2 mx-auto shadow-xl mb-3">
                <img
                  src="/Parlisense.png"
                  alt="ParliSense Official Logo"
                  className="w-full h-full object-contain filter drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                />
              </div>
              <h2 className="text-xl font-black text-slate-100 tracking-tight">
                Chamber Terminal Sign In
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Enter your credentials and select your parliamentary role to authenticate this workstation.
              </p>
            </div>

            {/* Error Banner */}
            {vm.errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{vm.errorMessage}</span>
              </div>
            )}

            <form onSubmit={vm.handleSubmit} className="space-y-4">
              {/* 1. Role Selector */}
              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                  Select Role
                </label>
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => vm.handleRoleChange("speaker")}
                    className={`py-2 px-1 text-xs font-bold rounded-lg transition-all text-center ${
                      vm.role === "speaker"
                        ? "bg-amber-600 text-white shadow"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Speaker
                  </button>
                  <button
                    type="button"
                    onClick={() => vm.handleRoleChange("admin")}
                    className={`py-2 px-1 text-xs font-bold rounded-lg transition-all text-center ${
                      vm.role === "admin"
                        ? "bg-sky-600 text-white shadow"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => vm.handleRoleChange("member")}
                    className={`py-2 px-1 text-xs font-bold rounded-lg transition-all text-center ${
                      vm.role === "member"
                        ? "bg-emerald-600 text-white shadow"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Member
                  </button>
                </div>
              </div>

              {/* 2. Username/ID */}
              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
                  Username/ID
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="login-username-input"
                    name="usernameOrId"
                    aria-label="Username/ID"
                    type="text"
                    value={vm.usernameOrId}
                    onChange={(e) => vm.setUsernameOrId(e.target.value)}
                    placeholder={
                      vm.role === "member"
                        ? "Enter Member ID or Name (e.g. M001)"
                        : vm.role === "speaker"
                        ? "Enter Speaker ID or Name (e.g. SP001)"
                        : "Enter Admin Username/ID (e.g. ADM01)"
                    }
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl text-slate-100 text-sm placeholder-slate-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* 3. Password */}
              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="login-password-input"
                    type={vm.showPassword ? "text" : "password"}
                    value={vm.password}
                    onChange={(e) => vm.setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full pl-9 pr-10 py-2 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl text-slate-100 text-sm placeholder-slate-500 focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={vm.togglePasswordVisibility}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    {vm.showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  {vm.role === "admin"
                    ? "Admin authentication required (e.g. ADM01 / admin123)."
                    : "Password configured during parliamentary member registration."}
                </p>
              </div>

              {/* Submit Button */}
              <button
                id="login-submit-btn"
                type="submit"
                disabled={vm.isAuthenticating}
                className={`w-full py-2.5 px-4 rounded-xl text-white font-black text-sm shadow-lg flex items-center justify-center gap-2 transition-all active:scale-98 mt-2 cursor-pointer disabled:opacity-70 ${
                  vm.role === "speaker"
                    ? "bg-amber-600 hover:bg-amber-500 shadow-amber-600/20"
                    : vm.role === "admin"
                    ? "bg-sky-600 hover:bg-sky-500 shadow-sky-600/20"
                    : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20"
                }`}
              >
                {vm.isAuthenticating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>Verifying Chamber Clearance...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In as {vm.role.charAt(0).toUpperCase() + vm.role.slice(1)}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
