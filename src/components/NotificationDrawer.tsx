/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { 
  Bell, 
  X, 
  Trash2, 
  AlertCircle, 
  CheckCircle2, 
  Megaphone, 
  ChevronRight, 
  Info 
} from "lucide-react";

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  recentAlerts: string[];
  onClearAll: () => void;
  onSelectStock: (symbol: string) => void;
  onNavigateToTab: (tab: "dashboard" | "terminal" | "options" | "watchlist" | "news" | "movers" | "profile") => void;
}

export default function NotificationDrawer({
  isOpen,
  onClose,
  recentAlerts,
  onClearAll,
  onSelectStock,
  onNavigateToTab
}: NotificationDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden font-sans">
      
      {/* Backdrop overlay */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-xs transition-opacity"
      />

      {/* Drawer Container */}
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-slate-900 shadow-2xl flex flex-col justify-between border-l border-slate-200 dark:border-slate-800 transition-all transform duration-300">
          
          {/* Header */}
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between select-none">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Bell className="h-5 w-5 text-indigo-650 dark:text-indigo-400" />
                {recentAlerts.length > 0 && (
                  <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-rose-500 animate-ping" />
                )}
              </div>
              <div>
                <h2 className="font-display font-black text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                  Academic Alerts Feed
                </h2>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono font-bold uppercase">
                  SIMULATION AUDIT TRACE
                </p>
              </div>
            </div>

            <button 
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content Scroll Grid */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            
            {/* Action Bar for clearing logs */}
            {recentAlerts.length > 0 && (
              <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-950 p-2.5 px-3 rounded-xl border border-slate-150 dark:border-slate-800/80">
                <span className="text-[10.5px] text-slate-500 dark:text-slate-400 font-semibold">
                  Showing latest {recentAlerts.length} activities
                </span>
                <button
                  onClick={onClearAll}
                  className="text-[10px] font-mono font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="h-3 w-3" /> Clear Audit Logs
                </button>
              </div>
            )}

            {/* List of Notification Entries */}
            {recentAlerts.length === 0 ? (
              <div className="h-[300px] flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-3 select-none">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-full border border-slate-200/50 dark:border-slate-750">
                  <Bell className="h-8 w-8 text-slate-350 dark:text-slate-600 animate-pulse" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-705 dark:text-slate-300">All Quiet on the Terminal</p>
                  <p className="text-[10.5px] text-slate-450 dark:text-slate-500 max-w-[245px] mt-1 mx-auto leading-relaxed">
                    Custom price limit warnings, supervisor bulletins, and watchlist favorites tracking activities will populate live logs here.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentAlerts.map((alert, index) => {
                  // Classifying notification styles
                  const isLimitAlert = alert.includes("[ALERT]");
                  const isAdminBroadcast = alert.includes("[ADMIN");
                  const isSessionLog = alert.includes("🔐") || alert.includes("📁") || alert.includes("🗑️");

                  // Extracting symbol if possible
                  let suggestedSymbol = "";
                  if (isLimitAlert) {
                    const sections = alert.split(" ");
                    if (sections.length > 2) suggestedSymbol = sections[2];
                  }

                  return (
                    <div
                      key={index}
                      className={`p-3.5 rounded-xl border text-[11px] leading-relaxed transition-all flex gap-3 ${
                        isLimitAlert 
                          ? "bg-rose-50/30 dark:bg-rose-950/10 border-rose-200/50 dark:border-rose-950/20 text-rose-950 dark:text-rose-205"
                          : isAdminBroadcast
                          ? "bg-amber-50/30 dark:bg-amber-950/10 border-amber-200/50 dark:border-amber-950/20 text-amber-950 dark:text-amber-205"
                          : "bg-slate-50/60 dark:bg-slate-950/50 border-slate-150 dark:border-slate-800/80 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {/* Left icon wrapper */}
                      <div className="flex-shrink-0 mt-0.5">
                        {isLimitAlert ? (
                          <AlertCircle className="h-4 w-4 text-rose-500" />
                        ) : isAdminBroadcast ? (
                          <Megaphone className="h-4 w-4 text-amber-500" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-indigo-500" />
                        )}
                      </div>

                      {/* Right message wrapper */}
                      <div className="flex-1 space-y-1">
                        <p className="font-medium font-sans">
                          {alert}
                        </p>
                        
                        {/* Interactive trigger if stock symbol is detected */}
                        {suggestedSymbol && (
                          <button
                            onClick={() => {
                              onSelectStock(suggestedSymbol);
                              onNavigateToTab("terminal");
                              onClose();
                            }}
                            className="text-[9.5px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                          >
                            Jump to {suggestedSymbol} Study <ChevronRight className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>

          {/* Footer compliance */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/30 select-none text-center">
            <p className="text-[9px] text-slate-400 dark:text-slate-550 leading-normal flex items-center justify-center gap-1">
              <Info className="h-3 w-3 text-indigo-500" /> LIVE SANDBOX CLASSIFICATION AUDITING ACTIVE
            </p>
          </div>

        </div>
      </div>

    </div>
  );
}
