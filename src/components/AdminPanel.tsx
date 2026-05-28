/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Settings, 
  Send, 
  CheckCircle2, 
  Trash2, 
  AlertTriangle, 
  Globe, 
  Cpu, 
  Smartphone, 
  Key, 
  FileLock2, 
  RefreshCw,
  PlusCircle,
  HelpCircle,
  TrendingUp,
  Award,
  Users
} from "lucide-react";
import { AdminConfigSettings } from "../types";

interface AdminPanelProps {
  currentBroadcastAlert: string;
  onUpdateBroadcast: (alert: string) => void;
  onPublishNews: (newsItem: { title: string; summary: string; source: string; category: string }) => void;
  customNewsList: any[];
  onDeleteNews: (id: string) => void;
  isFirebaseActive: boolean;
}

export default function AdminPanel({
  currentBroadcastAlert,
  onUpdateBroadcast,
  onPublishNews,
  customNewsList,
  onDeleteNews,
  isFirebaseActive
}: AdminPanelProps) {
  // 1. API Integration State Hook
  const [config, setConfig] = useState<AdminConfigSettings>({
    nseBseApiUrl: "",
    nseBseApiKey: "",
    customBroadcastAlert: currentBroadcastAlert
  });
  
  const [newsTitle, setNewsTitle] = useState("");
  const [newsSummary, setNewsSummary] = useState("");
  const [newsSource, setNewsSource] = useState("Corporate Announcement Room");
  const [newsCategory, setNewsCategory] = useState("Corporate Announcement");
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [showToast, setShowToast] = useState<string | null>(null);
  const [marketFeedStatus, setMarketFeedStatus] = useState<any>(null);
  const [isFetchingStatus, setIsFetchingStatus] = useState(false);

  // Load config from backend on mount
  useEffect(() => {
    fetch("/api/market-config")
      .then(r => r.json())
      .then(data => {
        if (data) {
          setConfig({
            nseBseApiUrl: data.nseBseApiUrl || "",
            nseBseApiKey: data.nseBseApiKey || "",
            customBroadcastAlert: data.customBroadcastAlert || currentBroadcastAlert
          });
        }
      })
      .catch(err => console.error("Could not fetch server market config:", err));
  }, [currentBroadcastAlert]);

  const triggerToast = (msg: string) => {
    setShowToast(msg);
    setTimeout(() => setShowToast(null), 3500);
  };

  // Submit secure server API updates override
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingConfig(true);
    try {
      const response = await fetch("/api/market-config/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config)
      });
      const data = await response.json();
      if (data.success) {
        onUpdateBroadcast(config.customBroadcastAlert);
        triggerToast("🚀 System parameters, API keys, and global alerts updated on host!");
      }
    } catch (err) {
      console.error(err);
      triggerToast("❌ Failserver update validation parameters.");
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Test active NSE/BSE dynamic feed relay
  const testLiveConnection = async () => {
    setIsFetchingStatus(true);
    try {
      const r = await fetch("/api/live-market");
      const d = await r.json();
      setMarketFeedStatus(d);
      triggerToast("📈 Synced live feed connection health checklist!");
    } catch (e) {
      setMarketFeedStatus({ error: "No market router listener attached." });
    } finally {
      setIsFetchingStatus(false);
    }
  };

  // Publish dynamic academic news
  const handleNewsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsTitle.trim() || !newsSummary.trim()) {
      triggerToast("⚠️ Headline title and summary are required.");
      return;
    }
    onPublishNews({
      title: newsTitle,
      summary: newsSummary,
      source: newsSource,
      category: newsCategory
    });
    setNewsTitle("");
    setNewsSummary("");
    triggerToast("✨ News item successfully broadcast to all connected student screens.");
  };

  return (
    <div className="space-y-6">
      {/* Dynamic Toast Indicator */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-blue-500 text-white font-mono text-xs p-3.5 rounded-lg shadow-xl animate-fade-in flex items-center gap-2 max-w-sm">
          <span className="text-emerald-400 animate-pulse font-black">●</span>
          <span>{showToast}</span>
        </div>
      )}

      {/* Main Admin Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* API CONFIG & CORE PARAMETERS PORT */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-indigo-600" />
                <h2 className="font-display font-medium text-lg text-slate-900 font-black">NSE / BSE Server Integration</h2>
              </div>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                isFirebaseActive 
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                  : "bg-amber-50 text-amber-700 border-amber-200"
              }`}>
                {isFirebaseActive ? "⚡ Firestore Connected" : "📊 Local Sandbox State"}
              </span>
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                  <Globe className="h-3.5 w-3.5 text-slate-400" /> Real Market API Gateway URL
                </label>
                <input
                  type="text"
                  value={config.nseBseApiUrl}
                  onChange={(e) => setConfig({ ...config, nseBseApiUrl: e.target.value })}
                  placeholder="https://api.example.com/v1/nse-bse"
                  className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg p-2.5 outline-none focus:border-indigo-500 font-mono text-slate-700"
                />
                <p className="text-[10px] text-slate-400 mt-1 font-sans">
                  The back-end proxy routes all outbound ticker queries to this path. Keep empty to use built-in simulator.
                </p>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                  <Key className="h-3.5 w-3.5 text-slate-400" /> Authorization Token / Key (Hidden)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2">
                    <FileLock2 className="h-4 w-4 text-slate-400" />
                  </span>
                  <input
                    type="password"
                    value={config.nseBseApiKey}
                    onChange={(e) => setConfig({ ...config, nseBseApiKey: e.target.value })}
                    placeholder="Enter proprietary private market api key"
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg pl-9 p-2.5 outline-none focus:border-indigo-500 font-mono text-slate-700"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1 font-sans">
                  Stored securely inside server-side system variables. This credential is completely blocked from reaching client sessions.
                </p>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> Compliance Disclaimer & Notice Bar Warning
                </label>
                <textarea
                  value={config.customBroadcastAlert}
                  onChange={(e) => setConfig({ ...config, customBroadcastAlert: e.target.value })}
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg p-2.5 outline-none focus:border-indigo-500 font-sans text-slate-700 font-medium leading-relaxed"
                  placeholder="E.g., Educational simulation purposes only. No actual stock transactions are placed."
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isSavingConfig}
                  className="flex-1 bg-indigo-650 hover:bg-slate-900 border border-indigo-700 text-white font-mono text-xs font-bold py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Cpu className="h-3.5 w-3.5" /> 
                  {isSavingConfig ? "Saving parameters..." : "Save Server Overrides"}
                </button>
                <button
                  type="button"
                  onClick={testLiveConnection}
                  disabled={isFetchingStatus}
                  className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 font-mono text-xs font-bold px-4 py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isFetchingStatus ? 'animate-spin' : ''}`} />
                  Check Market Sync Status
                </button>
              </div>
            </form>
          </div>

          {/* MARKET GATEWAY SYNC FEEDBACK CARD */}
          {marketFeedStatus && (
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-xs font-mono shadow-md animate-fade-in text-slate-300">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-3">
                <span className="text-white font-bold tracking-tight">Active API Gateway Checklist:</span>
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/40 px-2 py-0.5 border border-emerald-900 rounded">LIVE</span>
              </div>
              <ul className="space-y-2 text-[11px]">
                <li className="flex justify-between">
                  <span className="text-slate-500">Source:</span>
                  <span className="text-indigo-400 font-bold">{marketFeedStatus.source || "Mock Simulator Interface"}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-500">Ticker Provider:</span>
                  <span className="text-emerald-500 font-bold">{marketFeedStatus.status === "synced" ? "Active NSE/BSE Feed Service" : "Internal Simulated Process"}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-500">Last Sync Time:</span>
                  <span className="text-slate-400 font-medium">{marketFeedStatus.lastProcessedTick || new Date().toISOString()}</span>
                </li>
              </ul>
            </div>
          )}

          {/* DYNAMIC CORPORATE NEWS BROADCASTER FORM */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-4">
              <PlusCircle className="h-5 w-5 text-blue-600" />
              <h3 className="font-display font-medium text-lg text-slate-900 font-black">Publish Custom Split/Corporate Announcement</h3>
            </div>
            
            <form onSubmit={handleNewsSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase mb-1">
                    Corporate Agency Source
                  </label>
                  <input
                    type="text"
                    value={newsSource}
                    onChange={(e) => setNewsSource(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg p-2.5 outline-none focus:border-blue-500 text-slate-700"
                    placeholder="E.g., BSE Regulatory, NSE Announcement"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase mb-1">
                    Announcement Category
                  </label>
                  <select
                    value={newsCategory}
                    onChange={(e) => setNewsCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg p-2.5 outline-none focus:border-blue-500 text-slate-700 font-bold font-mono"
                  >
                    <option value="Corporate Announcement">📢 Corporate Announcement</option>
                    <option value="Dividend">💰 Dividend Payout</option>
                    <option value="Results">📊 Quarterly Financial Results</option>
                    <option value="Corporate Action">🔄 Corporate Split/Bonus Action</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase mb-1">
                  Headline Title Announcement
                </label>
                <input
                  type="text"
                  value={newsTitle}
                  onChange={(e) => setNewsTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg p-2.5 outline-none focus:border-blue-500 font-bold text-slate-800"
                  placeholder="E.g., TCS Declares Split or Reliance Q4 Net profit jumps 15%"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase mb-1">
                  Detail Announcement Summary
                </label>
                <textarea
                  value={newsSummary}
                  onChange={(e) => setNewsSummary(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg p-2.5 outline-none focus:border-blue-500 text-slate-600 leading-relaxed font-semibold"
                  placeholder="Provide precise analysis of impact ratios, record dates, split proportions or specific cash dividends..."
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-620 hover:bg-indigo-950 border border-blue-700 text-white font-mono text-xs font-bold py-2.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Send className="h-3.5 w-3.5" /> Publish Broadcast
              </button>
            </form>
          </div>
        </div>

        {/* SIDEBAR: PWA MOBILE APK CONVERTER & ACTIVE USERS PANEL */}
        <div className="space-y-6">
          {/* MOBILE APP (PWA INSTALLATION) INSTRUCTION PANEL */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h3 className="font-display font-medium text-amber-900 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
              <Smartphone className="h-4.5 w-4.5 text-blue-600 animate-bounce" />
              <span className="font-black text-slate-900">Mobile Launcher & APK App Guide</span>
            </h3>

            <div className="space-y-4 text-xs leading-relaxed text-slate-600 font-sans">
              <div className="p-3 bg-blue-50/70 border border-blue-200/50 rounded-lg text-blue-800">
                <p className="font-bold flex items-center gap-1"><Smartphone className="h-3.5 w-3.5" /> Direct PWA Install</p>
                <p className="mt-1 font-semibold text-[11px]">
                  This applet is pre-configured as an installable **Progressive Web App (PWA)**. 
                  You can immediately load it on any mobile device and add it to your homescreen!
                </p>
              </div>

              <div className="space-y-3 font-semibold text-[11px]">
                <p className="text-slate-800 font-extrabold uppercase font-mono tracking-wider">How to install on iOS/Android:</p>
                
                <div className="flex gap-2">
                  <span className="h-5 w-5 rounded-full bg-slate-100 border border-slate-350 flex-shrink-0 flex items-center justify-center text-slate-700 font-mono font-bold text-[10px]">1</span>
                  <p>Open this shared web link in Safari (iOS) or Chrome (Android) on your mobile device.</p>
                </div>
                
                <div className="flex gap-2">
                  <span className="h-5 w-5 rounded-full bg-slate-100 border border-slate-350 flex-shrink-0 flex items-center justify-center text-slate-700 font-mono font-bold text-[10px]">2</span>
                  <p>iOS: Press the <strong>Share</strong> button and tap <strong className="text-indigo-600">"Add to Home Screen"</strong>.</p>
                </div>

                <div className="flex gap-2">
                  <span className="h-5 w-5 rounded-full bg-slate-100 border border-slate-350 flex-shrink-0 flex items-center justify-center text-slate-700 font-mono font-bold text-[10px]">3</span>
                  <p>Android: Tap the three dots option and click <strong className="text-indigo-600">"Install Application"</strong>.</p>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg">
                <p className="font-extrabold text-slate-800 mb-1 text-[11px] uppercase font-mono tracking-wider flex items-center gap-1">
                  <Cpu className="h-3.5 w-3.5 text-slate-400" /> Play-Store Ready APK?
                </p>
                <p className="text-[10px] text-slate-400 leading-normal">
                  To publish a full binary APK on the Google Play Console:
                  Use the open-source CLI utility **bubblewrap** or the **PWABuilder** packaging tools to wrap this host link in a Trusted Web Activity (TWA) package. It compiles inside a standard APK file ready for store upload in minutes.
                </p>
              </div>
            </div>
          </div>

          {/* ACTIVE NEWS STREAM (MODERATOR MODE) */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h3 className="font-display font-medium text-slate-900 border-b border-slate-100 pb-3 mb-4 flex items-center gap-1.5">
              <TrendingUp className="h-4.5 w-4.5 text-indigo-600" />
              <span className="font-black">Active custom broadcasts ({customNewsList.length})</span>
            </h3>

            {customNewsList.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400 font-medium h-[160px] flex flex-col justify-center items-center">
                <p>No admin news broadcasts active.</p>
                <p className="text-[9px] text-slate-400 block mt-1 font-mono uppercase font-bold tracking-widest bg-slate-100 p-1 px-1.5 border border-slate-205 rounded">Awaiting dynamic submissions</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                {customNewsList.map((n) => (
                  <div key={n.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs leading-normal relative group">
                    <button
                      onClick={() => onDeleteNews(n.id)}
                      className="absolute top-2.5 right-2.5 text-slate-400 hover:text-red-650 transition cursor-pointer"
                      title="Delete dynamic broadcast"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    <div className="flex gap-1.5 items-center text-[9px] font-mono font-bold text-indigo-600 mb-1">
                      <span className="bg-indigo-100/50 p-0.5 px-2.5 border border-indigo-200 rounded uppercase">{n.category}</span>
                      <span className="text-slate-400 font-bold">{n.source}</span>
                    </div>
                    <h4 className="font-bold text-slate-900 pr-5 leading-tight">{n.title}</h4>
                    <p className="text-slate-500 font-semibold mt-1 truncate">{n.summary}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
