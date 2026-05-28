/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  User, 
  ShieldCheck, 
  Activity, 
  Wallet, 
  GraduationCap, 
  Settings, 
  Lock, 
  RefreshCw, 
  Signpost, 
  LogOut, 
  Users, 
  FileLock2, 
  Award,
  ChevronRight
} from "lucide-react";
import { UserSession } from "../types";
import AdminPanel from "./AdminPanel";

interface UserProfileProps {
  userSession: UserSession | null;
  onLogout: () => void;
  onLoginTrigger: () => void;
  recentAlerts: string[];
  stocksCount: number;
  watchlistCount: number;
  alertsCount: number;
  currentBroadcastAlert: string;
  onUpdateBroadcast: (alert: string) => void;
  onPublishNews: (newsItem: { title: string; summary: string; source: string; category: string }) => void;
  customNewsList: any[];
  onDeleteNews: (id: string) => void;
  isFirebaseActive: boolean;
  onForceAdminSandbox: () => void;
}

export default function UserProfile({
  userSession,
  onLogout,
  onLoginTrigger,
  recentAlerts,
  stocksCount,
  watchlistCount,
  alertsCount,
  currentBroadcastAlert,
  onUpdateBroadcast,
  onPublishNews,
  customNewsList,
  onDeleteNews,
  isFirebaseActive,
  onForceAdminSandbox
}: UserProfileProps) {

  // Dynamic calculations for academic portfolio
  const virtualCash = 1000000; // ₹10 Lakhs Virtual Capital
  const portfolioHoldingsValue = watchlistCount * 78240; 
  const overallReturnPercent = watchlistCount > 0 ? (watchlistCount * 1.6) : 0;
  const lessonsCompleted = alertsCount + 2;

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      
      {/* 1. Scholar Details Card & Profile Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Card: Academic Identity & Credentials */}
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-md border border-indigo-950 flex flex-col justify-between relative overflow-hidden h-[240px]">
          {/* Subtle logo overlay */}
          <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 text-white/5 select-none pointer-events-none">
            <GraduationCap className="h-56 w-56" />
          </div>

          <div className="space-y-4 select-none relative z-10">
            <div className="flex justify-between items-start">
              <span className="text-[9px] bg-indigo-500/30 text-indigo-200 border border-indigo-550/40 px-2.5 py-1 rounded-md font-mono font-bold uppercase tracking-wider">
                Authorized Scholar Account
              </span>
              <span className="text-[10px] text-indigo-300 font-mono font-bold uppercase">
                ID: FINSIGHT-2026
              </span>
            </div>

            <div className="flex items-center gap-4">
              <div className="h-14 w-14 bg-indigo-550/30 rounded-2xl border border-indigo-400/30 flex items-center justify-center text-white text-xl font-bold shadow-inner">
                {userSession ? (userSession.displayName?.charAt(0) || "S") : "G"}
              </div>
              <div>
                <h2 className="font-display font-black text-lg tracking-tight">
                  {userSession ? userSession.displayName : "Guest Scholar"}
                </h2>
                <p className="text-xs text-indigo-200/90 font-semibold truncate max-w-[200px]">
                  {userSession ? userSession.email : "simulated_sandbox@finsight.edu"}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  {userSession?.role === "admin" ? (
                    <span className="text-[8px] bg-amber-500/20 text-amber-300 border border-amber-550/20 py-0.5 px-2 rounded-full font-mono font-bold uppercase tracking-wider">
                      ★ Supervisor
                    </span>
                  ) : (
                    <span className="text-[8px] bg-blue-500/20 text-blue-300 border border-blue-550/20 py-0.5 px-2 rounded-full font-mono font-bold uppercase tracking-wider">
                      Student Scholar
                    </span>
                  )}
                  <span className="text-[8px] bg-slate-500/20 text-slate-300 border border-slate-550/20 py-0.5 px-2 rounded-full font-mono font-medium lowercase">
                    demo session
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-white/10 pt-3 relative z-10 text-xs">
            {userSession ? (
              <button
                onClick={onLogout}
                className="text-amber-400 hover:text-amber-300 transition duration-150 font-bold font-mono tracking-tight cursor-pointer flex items-center gap-1 leading-none"
              >
                <LogOut className="h-4 w-4" /> Disconnect Terminal
              </button>
            ) : (
              <button
                onClick={onLoginTrigger}
                className="bg-blue-600 hover:bg-blue-500 text-white font-mono font-extrabold text-[11px] hover:scale-105 transition-all py-1.5 px-4 rounded-xl cursor-pointer shadow-sm flex items-center gap-1.5 leading-none"
              >
                <User className="h-3.5 w-3.5" /> Sign In Live Terminal
              </button>
            )}
            <span className="text-[10px] text-white/50 font-mono">FINSIGHT-PORT v2.6</span>
          </div>
        </div>

        {/* Right Columns: Portfolio Valuation Limits Info (2 Columns on Large screen) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs lg:col-span-2 flex flex-col justify-between transition-colors h-[240px]">
          <div>
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5 mb-4 select-none">
              <Wallet className="h-4.5 w-4.5 text-blue-600" />
              <h2 className="font-display font-black text-sm text-slate-900 dark:text-white">Academic Performance Ledger</h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 dark:text-slate-550 block font-bold leading-none uppercase tracking-wide">
                  Virtual Cash limit
                </span>
                <strong className="text-sm font-mono font-black text-slate-900 dark:text-white block mt-1">
                  ₹{virtualCash.toLocaleString()}
                </strong>
                <span className="text-[8.5px] text-slate-400 block leading-none">
                  Interest free demo capital
                </span>
              </div>

              <div className="space-y-1 border-l border-slate-100 dark:border-slate-800 pl-4">
                <span className="text-[10px] text-slate-400 dark:text-slate-550 block font-bold leading-none uppercase tracking-wide">
                  Asset holdings values
                </span>
                <strong className="text-sm font-mono font-black text-slate-900 dark:text-white block mt-1">
                  ₹{portfolioHoldingsValue.toLocaleString()}
                </strong>
                <span className="text-[8.5px] text-slate-400 block leading-none">
                  Pins weight ({watchlistCount} stocks)
                </span>
              </div>

              <div className="space-y-1 border-l border-slate-100 dark:border-slate-800 pl-4">
                <span className="text-[10px] text-slate-400 dark:text-slate-550 block font-bold leading-none uppercase tracking-wide">
                  Unrealized Return
                </span>
                <strong className="text-sm font-mono font-black text-emerald-600 dark:text-emerald-400 block mt-1">
                  +{overallReturnPercent.toFixed(2)}%
                </strong>
                <span className="text-[8.5px] text-slate-400 block leading-none">
                  Calculated dynamically
                </span>
              </div>

              <div className="space-y-1 border-l border-slate-100 dark:border-slate-800 pl-4">
                <span className="text-[10px] text-slate-400 dark:text-slate-550 block font-bold leading-none uppercase tracking-wide">
                  Math units completed
                </span>
                <strong className="text-sm font-mono font-black text-indigo-650 dark:text-indigo-400 block mt-1">
                  {lessonsCompleted} Labs
                </strong>
                <span className="text-[8.5px] text-slate-400 block leading-none">
                  Active alert indicators
                </span>
              </div>

            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-150 dark:border-slate-800/80 mt-4 text-[10.5px] text-slate-550 dark:text-slate-450 leading-relaxed font-sans select-none flex items-center gap-1.5">
            <span className="px-1.5 py-0.5 bg-blue-50 dark:bg-blue-950/50 border border-blue-200/50 dark:border-blue-900/30 text-blue-600 dark:text-blue-400 rounded-md font-bold font-mono text-[9px]">LEDGER</span>
            <span>
              Virtual cash positions calculate from stocks favorited on your custom Watchlist. Favoring more blue-chip stocks allows simulated overall returns to expand.
            </span>
          </div>
        </div>

      </div>

      {/* 2. Operations audit logs & Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Console: Alerts/Triggers Audit Logs */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs transition-colors h-[320px] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5 mb-3 select-none">
              <span className="font-display font-black text-xs text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="h-4 w-4 text-rose-500" /> Terminal Activity Log
              </span>
              <span className="text-[9px] bg-slate-100 dark:bg-slate-850 px-2 py-0.5 border border-slate-200 dark:border-slate-750 font-mono rounded text-slate-400 font-bold uppercase">
                {recentAlerts.length} Ticks
              </span>
            </div>

            {recentAlerts.length === 0 ? (
              <div className="h-[200px] flex flex-col items-center justify-center text-center p-4 text-slate-400 space-y-2 select-none">
                <Activity className="h-8 w-8 text-slate-300 animate-pulse" />
                <p className="text-[11px] font-semibold text-slate-600">No session events yet</p>
                <p className="text-[9.5px] text-slate-400">Trigger price warnings or toggle your favorite stocks list to log ticks here.</p>
              </div>
            ) : (
              <div className="overflow-y-auto space-y-1.5 h-[200px] pr-1 scrollbar-none">
                {recentAlerts.map((log, idx) => (
                  <div 
                    key={idx} 
                    className="p-2 border border-slate-100 dark:border-slate-850/80 bg-slate-50 dark:bg-slate-950/40 rounded-lg text-[10px] font-mono text-slate-600 dark:text-slate-400 leading-relaxed overflow-hidden text-ellipsis whitespace-nowrap"
                    title={log}
                  >
                    {log}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="text-[9.5px] italic text-slate-400 select-none border-t border-slate-100 dark:border-slate-800 pt-2 font-medium">
            ⚡ Operations log clears automatically when browser session closes.
          </div>
        </div>

        {/* Right Section: Embedded Supervisor panel config or Security lock block (2 Columns) */}
        <div className="lg:col-span-2">
          {userSession?.role === "admin" ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs transition-colors">
              <h2 className="font-display font-black text-sm text-slate-950 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                <ShieldCheck className="h-5 w-5 text-amber-500 animate-pulse" /> Faculty Supervisor Configuration Board
              </h2>
              <AdminPanel
                currentBroadcastAlert={currentBroadcastAlert}
                onUpdateBroadcast={onUpdateBroadcast}
                onPublishNews={onPublishNews}
                customNewsList={customNewsList}
                onDeleteNews={onDeleteNews}
                isFirebaseActive={isFirebaseActive}
              />
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col justify-center items-center text-center space-y-4 h-[320px] transition-colors">
              <div className="mx-auto h-14 w-14 bg-amber-50 dark:bg-amber-950/20 rounded-full flex items-center justify-center border border-amber-200 dark:border-amber-900/30">
                <Lock className="h-7 w-7 text-amber-600 dark:text-amber-500 animate-pulse" />
              </div>
              <div>
                <h3 className="font-display font-black text-base text-slate-900 dark:text-white">Supervisor Console Restricted</h3>
                <p className="text-slate-400 dark:text-slate-500 font-semibold text-xs leading-relaxed max-w-sm mt-1 mx-auto">
                  Live database parameters editing, customized crawling API configurations, and custom corporate announcement bulletins posting are locked for unauthenticated scholars.
                </p>
              </div>
              <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/50 dark:border-indigo-900/20 rounded-xl text-left text-[11px] text-indigo-700 dark:text-indigo-430 leading-normal font-medium max-w-md">
                💡 <strong>Sandbox Supervisor Bypass:</strong> Click the button below to grant yourself instant supervisor admin authorization overrides.
              </div>
              <button
                type="button"
                onClick={onForceAdminSandbox}
                className="w-full max-w-xs bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-50 font-mono text-xs font-black py-2.5 rounded-xl cursor-pointer flex items-center justify-center gap-1.5 transition shadow-sm border border-slate-850 dark:border-slate-200"
              >
                Simulate Supervisor Override Access
              </button>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
