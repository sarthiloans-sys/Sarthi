/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from "react";
import { STOCKS_DATA, NEWS_DATA, SECTOR_DATA } from "./data/stocks";
import { StockData, AlertTrigger, UserSession } from "./types";
import { 
  Search, 
  TrendingUp, 
  Star, 
  Monitor, 
  ShieldAlert, 
  Activity, 
  Percent, 
  User, 
  ShieldCheck, 
  Settings, 
  Lock, 
  RefreshCw 
} from "lucide-react";
import CompanyDetails from "./components/CompanyDetails";
import StockChartContainer from "./components/StockChartContainer";
import WatchlistAlerts from "./components/WatchlistAlerts";
import EducationalAI from "./components/EducationalAI";
import MarketOverview from "./components/MarketOverview";
import DisclaimerFooter from "./components/DisclaimerFooter";
import OptionChecker from "./components/OptionChecker";
import AdminPanel from "./components/AdminPanel";
import LoginModal from "./components/LoginModal";
import { isFirebaseReady } from "./lib/firebase";

export default function App() {
  // 1. Core State Hooks
  const [stocks, setStocks] = useState<StockData[]>(STOCKS_DATA);
  const [currentStockSymbol, setCurrentStockSymbol] = useState<string>("RELIANCE");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"market" | "terminal" | "alerts" | "options" | "admin">("market");
  
  // Real Market & Admin customization fields
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [customAdminNews, setCustomAdminNews] = useState<any[]>([]);
  const [broadcastAlert, setBroadcastAlert] = useState("Compliance safe sandbox: We are NOT SEBI Registered. No Buy, Sell, or Hold recommendations are issued. Live prices are simulated.");

  // Fetch real market configuration overrides and custom news bulletins on mount
  useEffect(() => {
    fetch("/api/market-config")
      .then((r) => r.json())
      .then((data) => {
        if (data && data.customBroadcastAlert) {
          setBroadcastAlert(data.customBroadcastAlert);
        }
      })
      .catch((err) => console.warn("Failed fetching market server config:", err));

    fetch("/api/admin/news")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCustomAdminNews(data);
        }
      })
      .catch((err) => console.warn("Failed fetching admin news feed:", err));
  }, []);

  // Combine custom news with preloaded news
  const combinedNewsList = useMemo(() => {
    const formattedAdminNews = customAdminNews.map((n) => ({
      id: n.id,
      title: n.title,
      summary: n.summary,
      source: n.source,
      time: "Just Now",
      category: "Corporate Announcement" as any,
      relatedSymbols: [currentStockSymbol]
    }));
    return [...formattedAdminNews, ...NEWS_DATA];
  }, [customAdminNews, currentStockSymbol]);

  // Watchlist & Alerts synchronized via LocalStorage
  const [watchlist, setWatchlist] = useState<string[]>(() => {
    const saved = localStorage.getItem("watchlist");
    return saved ? JSON.parse(saved) : ["RELIANCE", "TCS", "HDFCBANK"];
  });

  const [alerts, setAlerts] = useState<AlertTrigger[]>(() => {
    const saved = localStorage.getItem("price_alerts");
    return saved ? JSON.parse(saved) : [
      { id: "pre_1", symbol: "TCS", type: "ABOVE", targetPrice: 3950, isTriggered: false, createdAt: new Date().toISOString() },
      { id: "pre_2", symbol: "TATAMOTORS", type: "ABOVE", targetPrice: 960, isTriggered: false, createdAt: new Date().toISOString() }
    ];
  });

  const [recentAlerts, setRecentAlerts] = useState<string[]>([]);

  // Synchronize localStorage effects
  useEffect(() => {
    localStorage.setItem("watchlist", JSON.stringify(watchlist));
  }, [watchlist]);

  useEffect(() => {
    localStorage.setItem("price_alerts", JSON.stringify(alerts));
  }, [alerts]);

  // 2. Real-time Live Price Stock flutuator Simulation (Every 4 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      setStocks((prevStocks) => {
        return prevStocks.map((stock) => {
          // Small micro-fluctuation factor (between -0.2% and +0.22%)
          const fluctuationPercent = (Math.random() - 0.48) * 0.004;
          const newPrice = Math.round(stock.price * (1 + fluctuationPercent) * 100) / 100;
          
          // Get baseline closing price
          const originalBase = STOCKS_DATA.find((s) => s.symbol === stock.symbol)?.price || stock.price;
          const change = newPrice - originalBase;
          const changePercent = (change / originalBase) * 100;

          const dayHigh = Math.max(stock.dayHigh, newPrice);
          const dayLow = Math.min(stock.dayLow, newPrice);

          // Check active user price alerts target triggers
          setAlerts((prevAlerts) => {
            const hasMatches = prevAlerts.some(
              (al) => al.symbol === stock.symbol && !al.isTriggered &&
              ((al.type === "ABOVE" && newPrice >= al.targetPrice) ||
               (al.type === "BELOW" && newPrice <= al.targetPrice))
            );

            if (!hasMatches) return prevAlerts;

            return prevAlerts.map((al) => {
              if (al.symbol === stock.symbol && !al.isTriggered) {
                const triggeredAbove = al.type === "ABOVE" && newPrice >= al.targetPrice;
                const triggeredBelow = al.type === "BELOW" && newPrice <= al.targetPrice;

                if (triggeredAbove || triggeredBelow) {
                  const logMessage = `🚨 [ALERT] ${stock.symbol} crossed target price of ₹${al.targetPrice} (Processed Tick: ₹${newPrice.toFixed(2)})`;
                  setRecentAlerts((logs) => [logMessage, ...logs.slice(0, 49)]);
                  return { ...al, isTriggered: true };
                }
              }
              return al;
            });
          });

          return {
            ...stock,
            price: newPrice,
            change,
            changePercent,
            dayHigh,
            dayLow
          };
        });
      });
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // 3. User Actions Handlers
  const handlePublishAdminNews = async (item: { title: string; summary: string; source: string; category: string }) => {
    try {
      const response = await fetch("/api/admin/news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item)
      });
      const data = await response.json();
      if (data.success && data.item) {
        setCustomAdminNews((prev) => [data.item, ...prev]);
        setRecentAlerts((logs) => [
          `📢 [ADMIN BROADCAST] Published headline: "${item.title}"`,
          ...logs.slice(0, 49)
        ]);
      }
    } catch (err) {
      console.error("News broadcast failed:", err);
    }
  };

  const handleDeleteAdminNews = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/news/${id}`, {
        method: "DELETE"
      });
      const data = await response.json();
      if (data.success) {
        setCustomAdminNews((prev) => prev.filter((item) => item.id !== id));
        setRecentAlerts((logs) => [
          `🗑️ [ADMIN BROADCAST] Removed broadcast announcement of index ${id}`,
          ...logs.slice(0, 49)
        ]);
      }
    } catch (err) {
      console.error("News action delete failed:", err);
    }
  };

  const handleToggleWatchlist = (symbol: string) => {
    setWatchlist((prev) => {
      if (prev.includes(symbol)) {
        return prev.filter((s) => s !== symbol);
      } else {
        return [...prev, symbol];
      }
    });

    // Notify user with elegant ticker log
    const isAdding = !watchlist.includes(symbol);
    setRecentAlerts((logs) => [
      `${isAdding ? "📁 ADDED" : "🗑️ REMOVED"} ${symbol} ${isAdding ? "to" : "from"} your custom Watchlist study.`,
      ...logs.slice(0, 49)
    ]);
  };

  const handleAddAlert = (symbol: string, type: "ABOVE" | "BELOW", targetPrice: number) => {
    const newAlert: AlertTrigger = {
      id: `alert_${Date.now()}`,
      symbol,
      type,
      targetPrice,
      isTriggered: false,
      createdAt: new Date().toISOString()
    };
    setAlerts((prev) => [newAlert, ...prev]);
    setRecentAlerts((logs) => [
      `🔔 SET price alert trigger on ${symbol} when price goes ${type} ₹${targetPrice}`,
      ...logs.slice(0, 49)
    ]);
  };

  const handleRemoveAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSelectStock = (symbol: string) => {
    setCurrentStockSymbol(symbol);
    setActiveTab("terminal"); // Auto change tab so they see fundamentals instantly
  };

  // 4. Searching Filter Computation
  const filteredStocksRegistry = useMemo(() => {
    if (!searchQuery.trim()) return stocks;
    const query = searchQuery.toLowerCase();
    return stocks.filter(
      (s) =>
        s.symbol.toLowerCase().includes(query) ||
        s.name.toLowerCase().includes(query) ||
        s.sector.toLowerCase().includes(query)
    );
  }, [stocks, searchQuery]);

  const activeStock = useMemo(() => {
    return stocks.find((s) => s.symbol === currentStockSymbol) || stocks[0];
  }, [stocks, currentStockSymbol]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between font-sans">
      
      {/* A. Top Navigation Header */}
      <header className="bg-white border-b border-slate-200 py-4 px-6 sticky top-0 z-50 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Logo & Headline */}
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl text-white font-extrabold flex items-center justify-center shadow-sm">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-black text-lg tracking-tight text-slate-900">
                  FinSight Market Scholar
                </span>
                <span className="text-[9px] bg-slate-100 text-slate-600 font-mono font-bold px-2 py-0.5 rounded uppercase border border-slate-200">
                  Academic v2.6
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wider font-mono font-bold">
                Educational Stock Analytics & Indicators Sandbox
              </p>
            </div>
          </div>

          {/* Quick Global Ticker Search Bar & Session Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-[260px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search assets (e.g., Reliance)..."
                className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg pl-9 pr-4 py-2 text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500 font-semibold"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-slate-800 font-bold"
                >
                  ×
                </button>
              )}
            </div>

            {/* Active User Session Action Hub */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {userSession ? (
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-1 pl-2.5 pr-2.5 rounded-lg shadow-inner text-xs">
                  <div className="flex items-center gap-1.5">
                    {userSession.role === "admin" ? (
                      <ShieldCheck className="h-4 w-4 text-amber-600" />
                    ) : (
                      <User className="h-4 w-4 text-blue-600" />
                    )}
                    <div>
                      <span className="font-extrabold text-slate-900 line-clamp-1 block max-w-[120px]">
                        {userSession.displayName}
                      </span>
                      <span className="text-[8px] text-slate-400 font-mono font-bold uppercase tracking-wider block -mt-0.5">
                        {userSession.role === "admin" ? "Supervisor" : "Student Scholar"}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setUserSession(null)}
                    className="text-[9px] hover:bg-slate-100 hover:text-red-650 border border-slate-200 px-2 py-1 rounded font-mono font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    Log Out
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="w-full sm:w-auto bg-slate-900 border border-slate-800 text-white hover:bg-slate-800 font-mono text-[11px] font-black px-4 py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <User className="h-3.5 w-3.5 text-blue-400 animate-pulse" />
                  Sign In
                </button>
              )}
            </div>
          </div>

        </div>
      </header>

      {/* B. Legal Caution Alert Ribbon */}
      <div className="bg-amber-50 border-b border-amber-200/50 py-2.5 px-6 flex items-center justify-center font-display text-amber-800 text-[11px] font-bold text-center leading-normal shadow-xs">
        <ShieldAlert className="h-4 w-4 mr-1.5 text-amber-600 animate-pulse flex-shrink-0" />
        <span>{broadcastAlert}</span>
      </div>

      {/* C. Primary Workspace Dashboard Pane */}
      <main className="max-w-7xl mx-auto w-full p-4 md:p-6 lg:p-8 flex-1 space-y-6">
        
        {/* Tab Controllers & Workspace Modes */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200 p-3 rounded-2xl shadow-xs">
          
          <div className="flex items-center space-x-1.5 bg-slate-50 p-1 border border-slate-200 rounded-xl w-full sm:w-auto">
            <button
              onClick={() => setActiveTab("market")}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === "market"
                  ? "bg-white text-blue-600 shadow-sm border border-slate-200/50"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Activity className="h-3.5 w-3.5" /> Market Hub & News
            </button>
            <button
              onClick={() => setActiveTab("terminal")}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === "terminal"
                  ? "bg-white text-blue-600 shadow-sm border border-slate-200/50"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Monitor className="h-3.5 w-3.5" /> Stock Details & Study
            </button>
            <button
              onClick={() => setActiveTab("options")}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === "options"
                  ? "bg-white text-blue-600 shadow-sm border border-slate-200/50"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Percent className="h-3.5 w-3.5" /> Options Chain & Checker
            </button>
            <button
              onClick={() => setActiveTab("alerts")}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === "alerts"
                  ? "bg-white text-blue-600 shadow-sm border border-slate-200/50"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Star className="h-3.5 w-3.5" /> My Watchlist ({watchlist.length})
            </button>
            <button
              onClick={() => setActiveTab("admin")}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === "admin"
                  ? "bg-white-550 bg-indigo-50/50 text-indigo-700 shadow-sm border border-indigo-200/40"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5 text-amber-500 animate-pulse" /> Supervisor Admin
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-500 self-stretch sm:self-auto justify-between bg-slate-50 border border-slate-200 p-1.5 px-3 rounded-xl shadow-inner">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-slate-400 font-extrabold uppercase tracking-wider text-[10px]">Active Stock Study:</span>
            </div>
            <strong className="text-slate-800 font-extrabold">{activeStock.symbol} (₹{activeStock.price.toFixed(1)})</strong>
          </div>
        </div>

        {/* Selected Registry Dropdowns (When searching query matches) */}
        {searchQuery.trim() && (
          <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-lg space-y-2 animate-fade-in">
            <h3 className="text-xs text-slate-500 font-mono font-bold flex items-center gap-1.5">
              <Search className="h-3 w-3 text-blue-600" /> Search results ({filteredStocksRegistry.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
              {filteredStocksRegistry.map((st) => (
                <div
                  key={st.symbol}
                  onClick={() => {
                    handleSelectStock(st.symbol);
                    setSearchQuery("");
                  }}
                  className="bg-slate-50 hover:bg-slate-100 p-2.5 border border-slate-200 hover:border-slate-300 rounded-lg cursor-pointer flex justify-between items-center transition"
                >
                  <div>
                    <span className="font-extrabold text-xs text-slate-900 font-mono">{st.symbol}</span>
                    <span className="text-[9px] text-slate-400 block truncate max-w-[80px] font-bold">{st.name}</span>
                  </div>
                  <span className={`text-[10px] font-black ${st.change >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                    {st.changePercent >= 0 ? "+" : ""}{st.changePercent.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab content switcher view */}
        <div className="space-y-6">
          {activeTab === "market" && (
            <MarketOverview
              sectors={SECTOR_DATA}
              news={combinedNewsList}
              stocks={stocks}
              onSelectStock={handleSelectStock}
              recentAlerts={recentAlerts}
            />
          )}

          {activeTab === "terminal" && (
            <div className="space-y-6">
              
              {/* Horizontal List Selector of Stocks */}
              <div className="bg-white border border-slate-200 p-2 px-3 rounded-xl shadow-xs flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                <span className="text-xs text-slate-400 font-mono font-black uppercase tracking-wider block mr-2 whitespace-nowrap">
                  Explore List:
                </span>
                {stocks.map((s) => {
                  const isPos = s.change >= 0;
                  const isSelected = s.symbol === currentStockSymbol;
                  return (
                    <button
                      key={s.symbol}
                      onClick={() => setCurrentStockSymbol(s.symbol)}
                      className={`p-2 px-3.5 text-xs rounded-lg font-bold font-mono transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 border ${
                        isSelected
                          ? "bg-blue-50 text-blue-600 border-blue-200 shadow-sm"
                          : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <span>{s.symbol}</span>
                      <span className={`text-[10px] font-bold ${isPos ? "text-emerald-600" : "text-rose-600"}`}>
                        {s.price.toFixed(0)} ({isPos ? "+" : ""}{s.changePercent.toFixed(1)}%)
                      </span>
                      
                      {/* Watch icon button indicator nested inline */}
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleWatchlist(s.symbol);
                        }}
                        className="text-amber-500 hover:text-amber-600 transition-all ml-1.5 select-none font-bold text-sm"
                        title={watchlist.includes(s.symbol) ? "Unfavorite Stock" : "Favorite Stock"}
                      >
                        {watchlist.includes(s.symbol) ? "★" : "☆"}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Terminal Workspace panels (Charts & AI side by side, detailed metrics below) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Visual study chart */}
                <div className="lg:col-span-8 font-sans">
                  <StockChartContainer stock={activeStock} />
                </div>

                {/* Gemini analyzer study tutor */}
                <div className="lg:col-span-4 font-sans">
                  <EducationalAI stock={activeStock} />
                </div>
              </div>

              {/* Complete Company deep dive metrics and ratios charts */}
              <CompanyDetails stock={activeStock} />
            </div>
          )}

          {activeTab === "options" && (
            <OptionChecker stock={activeStock} />
          )}

          {activeTab === "alerts" && (
            <WatchlistAlerts
              watchlist={watchlist}
              onToggleWatchlist={handleToggleWatchlist}
              alerts={alerts}
              onAddAlert={handleAddAlert}
              onRemoveAlert={handleRemoveAlert}
              stocks={stocks}
              onSelectStock={handleSelectStock}
              currentStockSymbol={currentStockSymbol}
            />
          )}

          {activeTab === "admin" && (
            userSession?.role === "admin" ? (
              <AdminPanel
                currentBroadcastAlert={broadcastAlert}
                onUpdateBroadcast={(msg) => setBroadcastAlert(msg)}
                onPublishNews={handlePublishAdminNews}
                customNewsList={customAdminNews}
                onDeleteNews={handleDeleteAdminNews}
                isFirebaseActive={isFirebaseReady}
              />
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-lg mx-auto text-center shadow-lg space-y-4 animate-fade-in">
                <div className="mx-auto h-16 w-16 bg-amber-50 rounded-full flex items-center justify-center border border-amber-200">
                  <Lock className="h-8 w-8 text-amber-600 animate-pulse" />
                </div>
                <h3 className="font-display font-black text-xl text-slate-900">Supervisor Board Locked</h3>
                <p className="text-slate-500 font-semibold text-xs leading-relaxed">
                  Real market API endpoints, global alerts, system configurations, and custom corporate announcement postings are restricted to verified faculty advisors or supervisors.
                </p>
                <div className="p-3.5 bg-indigo-550/10 border border-indigo-200/55 rounded-xl text-left text-xs text-indigo-800 leading-normal font-semibold">
                  💡 <strong>Sandbox Testing Override:</strong> You can instantly bypass this gate! Just click the override below to login as a Simulated Supervisor Admin and try out all configurations.
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const sandboxAdmin: UserSession = {
                      uid: "simulated_admin_uid",
                      email: "admin_mayur@finsight.edu",
                      displayName: "Dr. Mayur (Supervisor Admin)",
                      role: "admin",
                      createdAt: new Date().toISOString()
                    };
                    setUserSession(sandboxAdmin);
                    setRecentAlerts((logs) => [
                      "🔐 Bypassed supervisor board security gate using Sandbox mode overrides.",
                      ...logs.slice(0, 49)
                    ]);
                  }}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-mono text-xs font-black py-2.5 rounded-xl cursor-pointer flex items-center justify-center gap-1.5 transition shadow-sm"
                >
                  Bypass with simulated Admin session
                </button>
              </div>
            )
          )}
        </div>
      </main>

      {/* D. Bottom Compliance Warnings & Footer Block */}
      <DisclaimerFooter />

      {/* E. Login/Auth Overlay Container */}
      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          onLoginSuccess={(session) => {
            setUserSession(session);
            if (session) {
              setRecentAlerts((logs) => [
                `🔐 LOGGED IN as ${session.displayName} (${session.role === "admin" ? "Supervisor" : "Student"})`,
                ...logs.slice(0, 49)
              ]);
            }
          }}
          isFirebaseActive={isFirebaseReady}
        />
      )}
    </div>
  );
}
