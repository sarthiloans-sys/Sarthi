/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
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
  RefreshCw,
  LayoutGrid,
  Newspaper,
  Flame,
  Sun,
  Moon,
  Bell,
  Menu,
  X,
  Sparkles,
  Layers,
  ChevronRight,
  LogOut
} from "lucide-react";
import CompanyDetails from "./components/CompanyDetails";
import StockChartContainer from "./components/StockChartContainer";
import WatchlistAlerts from "./components/WatchlistAlerts";
import EducationalAI from "./components/EducationalAI";
import MarketOverview from "./components/MarketOverview";
import DisclaimerFooter from "./components/DisclaimerFooter";
import OptionChecker from "./components/OptionChecker";
import LoginModal from "./components/LoginModal";
import MarketMovers from "./components/MarketMovers";
import UserProfile from "./components/UserProfile";
import NotificationDrawer from "./components/NotificationDrawer";
import { isFirebaseReady } from "./lib/firebase";

export default function App() {
  // 1. Core Navigation & Layout State
  const [activeTab, setActiveTab] = useState<"dashboard" | "terminal" | "options" | "watchlist" | "news" | "movers" | "profile">("dashboard");
  const [isTabChanging, setIsTabChanging] = useState<boolean>(false);
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [notificationOpen, setNotificationOpen] = useState<boolean>(false);

  const handleTabChange = (tab: "dashboard" | "terminal" | "options" | "watchlist" | "news" | "movers" | "profile") => {
    setIsTabChanging(true);
    setActiveTab(tab);
    setMobileMenuOpen(false);
    setTimeout(() => {
      setIsTabChanging(false);
    }, 250);
  };

  // 2. Market State
  const [stocks, setStocks] = useState<StockData[]>(STOCKS_DATA);
  const [currentStockSymbol, setCurrentStockSymbol] = useState<string>("RELIANCE");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Real Market & Admin customization fields
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [customAdminNews, setCustomAdminNews] = useState<any[]>([]);
  const [broadcastAlert, setBroadcastAlert] = useState("Compliance safe sandbox: We are NOT SEBI Registered. No Buy, Sell, or Hold recommendations are issued. Live prices are simulated.");

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
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // 3. Dark Mode & API Initializations
  useEffect(() => {
    const savedTheme = localStorage.getItem("darkMode") === "true";
    setDarkMode(savedTheme);
    document.documentElement.classList.toggle("dark", savedTheme);

    // Fetch override configs
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

  const toggleDarkMode = () => {
    setDarkMode((prev) => {
      const next = !prev;
      localStorage.setItem("darkMode", String(next));
      document.documentElement.classList.toggle("dark", next);
      return next;
    });
  };

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

  // Synchronize watchlists/alerts
  useEffect(() => {
    localStorage.setItem("watchlist", JSON.stringify(watchlist));
  }, [watchlist]);

  useEffect(() => {
    localStorage.setItem("price_alerts", JSON.stringify(alerts));
  }, [alerts]);

  // 4. Real-time Live Price Stock flutuator Simulation (Every 4 seconds)
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
                  setUnreadCount((prev) => prev + 1);
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

  // 5. User Action Handlers
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
        const msg = `📢 [ADMIN BROADCAST] Published bulletin: "${item.title}"`;
        setRecentAlerts((logs) => [msg, ...logs.slice(0, 49)]);
        setUnreadCount((prev) => prev + 1);
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
        const msg = `🗑️ [ADMIN BROADCAST] Removed broadcast announcement of index ${id}`;
        setRecentAlerts((logs) => [msg, ...logs.slice(0, 49)]);
        setUnreadCount((prev) => prev + 1);
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

    const isAdding = !watchlist.includes(symbol);
    const msg = `${isAdding ? "📁 ADDED" : "🗑️ REMOVED"} ${symbol} ${isAdding ? "to" : "from"} custom Watchlist study.`;
    setRecentAlerts((logs) => [msg, ...logs.slice(0, 49)]);
    setUnreadCount((prev) => prev + 1);
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
    const msg = `🔔 SET price alert trigger on ${symbol} when price goes ${type} ₹${targetPrice}`;
    setRecentAlerts((logs) => [msg, ...logs.slice(0, 49)]);
    setUnreadCount((prev) => prev + 1);
  };

  const handleRemoveAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSelectStock = (symbol: string) => {
    setCurrentStockSymbol(symbol);
  };

  // Searching filter computation
  const filteredStocksRegistry = useMemo(() => {
    if (!searchQuery.trim()) return [];
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

  // Dynamically computed Indian benchmark indexes linked to active stock fluctuations
  const indicesList = useMemo(() => {
    const niftyEstimate = 22480 + stocks.reduce((acc, current) => acc + (current.change * 0.8), 0);
    const niftyChangePercent = stocks.reduce((acc, curr) => acc + curr.changePercent, 0) / stocks.length;

    return [
      { name: "NIFTY 50", value: niftyEstimate, change: niftyChangePercent },
      { name: "SENSEX", value: niftyEstimate * 3.31, change: niftyChangePercent },
      { name: "BANK NIFTY", value: 47820 + (niftyChangePercent * 150), change: niftyChangePercent * 1.05 },
      { name: "NIFTY IT", value: 35400 + (niftyChangePercent * 80), change: niftyChangePercent * 0.78 },
      { name: "NIFTY AUTO", value: 21305 + (niftyChangePercent * 60), change: niftyChangePercent * 1.15 },
      { name: "NIFTY INFRA", value: 8125 + (niftyChangePercent * 25), change: niftyChangePercent * 0.95 },
    ];
  }, [stocks]);

  // Sidebar navigation menu
  const menuItems: { id: "dashboard" | "terminal" | "options" | "watchlist" | "news" | "movers" | "profile"; label: string; icon: React.ComponentType<any>; badge?: number }[] = [
    { id: "dashboard", label: "Market Hub", icon: LayoutGrid },
    { id: "terminal", label: "Stock Study", icon: Monitor },
    { id: "options", label: "Option Chain", icon: Percent },
    { id: "movers", label: "Market Movers", icon: Flame },
    { id: "watchlist", label: "My Watchlist", icon: Star, badge: watchlist.length },
    { id: "news", label: "Financial News", icon: Newspaper },
    { id: "profile", label: "Supervisor Hub", icon: User },
  ];

  return (
    <div className="flex flex-col min-h-screen dark:bg-slate-950 overflow-x-hidden">
      {/* Ticker bar at absolute top */}
      <div className="bg-slate-900 text-slate-100 border-b border-slate-800 h-[32px] overflow-hidden flex items-center font-mono text-[10px] sm:text-[10.5px] select-none z-50">
        <div className="flex animate-marquee whitespace-nowrap py-1">
          {[...Array(2)].map((_, loopIdx) => (
            <div key={loopIdx} className="flex space-x-12 shrink-0 pr-12">
              {indicesList.map((ind) => {
                const isPositive = ind.change >= 0;
                return (
                  <div key={`${ind.name}-${loopIdx}`} className="flex items-center space-x-1.5 font-bold cursor-pointer" onClick={() => setActiveTab("dashboard")}>
                    <span className="text-slate-400 font-sans tracking-wide uppercase text-[9px] sm:text-[9.5px]">{ind.name}</span>
                    <span className="text-white">₹{ind.value.toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 1})}</span>
                    <span className={`text-[9.5px] flex items-center font-black ${isPositive ? "text-emerald-400" : "text-rose-450"}`}>
                      {isPositive ? "▲" : "▼"}{Math.abs(ind.change).toFixed(2)}%
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col lg:flex-row transition-colors duration-200">
      
      {/* 1. Sidebar Panel (Hidden on mobile, block on Desktop) */}
      <aside className="hidden lg:flex w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex-col justify-between sticky top-0 h-screen select-none z-40 transition-colors">
        
        {/* Sidebar branding details */}
        <div className="p-5 space-y-6">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-650 rounded-xl text-white font-extrabold flex items-center justify-center shadow-sm">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-display font-black text-sm tracking-tight text-slate-900 dark:text-white leading-none">
                FinSight Terminal
              </h1>
              <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-mono font-bold px-1.5 py-0.5 rounded mt-1.5 inline-block border border-slate-200 dark:border-slate-700 uppercase tracking-tight">
                Academic v2.6
              </span>
            </div>
          </div>

          {/* Active Stock quick widget */}
          <div className="p-3 bg-slate-50/60 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-850 rounded-xl space-y-1">
            <span className="text-[9px] text-slate-400 font-mono font-bold uppercase tracking-wider block">
              Active Stock Study:
            </span>
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="font-extrabold text-slate-850 dark:text-slate-100">
                {activeStock.symbol}
              </span>
              <strong className={`font-black ${activeStock.change >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-650 dark:text-rose-400"}`}>
                ₹{activeStock.price.toFixed(1)}
              </strong>
            </div>
            <div className="flex justify-between items-center text-[9.5px]">
              <span className="text-slate-400 truncate max-w-[100px]">{activeStock.sector}</span>
              <span className={`font-bold ${activeStock.change >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                {activeStock.changePercent >= 0 ? "+" : ""}{activeStock.changePercent.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Links menu list */}
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isSelected = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-extrabold transition-all group cursor-pointer border ${
                    isSelected
                      ? "bg-indigo-50/60 dark:bg-indigo-950/30 text-indigo-750 dark:text-indigo-400 border-indigo-200/50 dark:border-indigo-900/30"
                      : "bg-transparent text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-800 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-850/50"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`h-4 w-4 ${isSelected ? "text-indigo-650 dark:text-indigo-400" : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-350"}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="bg-indigo-100 dark:bg-indigo-950 text-indigo-750 dark:text-indigo-400 font-mono text-[9px] px-2 py-0.5 rounded-full border border-indigo-200/40 dark:border-indigo-900/30 font-bold">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer Controls */}
        <div className="p-4 border-t border-slate-150 dark:border-slate-800 space-y-3 bg-slate-50/50 dark:bg-slate-950/20">
          
          {/* User Session card or Login check */}
          {userSession ? (
            <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 p-2 rounded-xl text-xs">
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab("profile")}>
                <div className="h-7 w-7 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 border border-indigo-200/30 dark:border-indigo-900/30 flex items-center justify-center text-[10px] font-bold text-indigo-650 dark:text-indigo-400 select-none">
                  {userSession.displayName?.charAt(0) || "U"}
                </div>
                <div className="truncate max-w-[100px]">
                  <p className="font-extrabold text-slate-850 dark:text-white leading-none truncate">
                    {userSession.displayName}
                  </p>
                  <span className="text-[8px] text-slate-400 uppercase font-mono tracking-tight block mt-0.5 font-bold">
                    {userSession.role === "admin" ? "Supervisor" : "Student"}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setUserSession(null)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-red-500 rounded transition cursor-pointer"
                title="Log Out"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowLoginModal(true)}
              className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-50 text-white dark:text-slate-950 font-mono text-[10.5px] font-black py-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs border border-slate-900 dark:border-transparent"
            >
              <User className="h-3.5 w-3.5" /> Sign In
            </button>
          )}

          {/* Theme switcher */}
          <button
            onClick={toggleDarkMode}
            className="w-full flex items-center justify-between p-2 rounded-xl text-[11px] font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850 transition cursor-pointer"
          >
            <span className="flex items-center gap-2">
              {darkMode ? <Sun className="h-3.5 w-3.5 text-amber-500" /> : <Moon className="h-3.5 w-3.5 text-indigo-600" />}
              <span>{darkMode ? "Light Theme Mode" : "Dark Theme Mode"}</span>
            </span>
            <span className="text-[9px] font-mono font-bold bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-450 uppercase">
              {darkMode ? "Light" : "Dark"}
            </span>
          </button>

          <p className="text-[9px] text-slate-400 text-center font-mono select-none">
            FinSight Terminal © 2026
          </p>
        </div>
      </aside>

      {/* 2. Main Portal Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* A. Top Header Portal Panel */}
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-3.5 px-4 md:px-6 sticky top-0 z-35 shadow-xs transition-colors">
          <div className="flex items-center justify-between gap-4">
            
            {/* Left Header Brand Mobile Title */}
            <div className="flex items-center gap-2.5 lg:gap-0">
              {/* Hamburger Menu on Mobile */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-850 cursor-pointer transition"
              >
                <Menu className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-2.5 lg:hidden select-none">
                <div className="p-1.5 bg-indigo-650 rounded-lg text-white">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <span className="font-display font-black text-sm text-slate-950 dark:text-white tracking-tight">
                  FinSight
                </span>
              </div>
              
              {/* Desktop Header Description line */}
              <div className="hidden lg:block select-none">
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 font-mono font-extrabold px-2 py-0.5 rounded border border-indigo-200/50 dark:border-indigo-900/30 uppercase tracking-wider text-[9px]">
                    Academic Sandbox
                  </span>
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-medium font-sans">
                    Educational stock evaluation, option payoffs, and mathematical derivatives learning.
                  </span>
                </div>
              </div>
            </div>

            {/* Middle Search & Quick Navigation Actions */}
            <div className="flex items-center gap-3">
              
              {/* Global search input */}
              <div className="relative w-[180px] sm:w-[260px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Universal Stock Search..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs rounded-lg pl-9 pr-6 py-2 text-slate-850 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-550 outline-none focus:border-indigo-500 font-semibold transition"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-800 dark:hover:text-white font-bold select-none cursor-pointer"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Toggles shortcut helper on mobile/tablets */}
              <button
                onClick={toggleDarkMode}
                className="lg:hidden p-1.5 text-slate-500 dark:text-slate-400 rounded-lg hover:bg-slate-150 dark:hover:bg-slate-850 transition cursor-pointer"
                title="Toggle Theme"
              >
                {darkMode ? <Sun className="h-4.5 w-4.5 text-amber-500" /> : <Moon className="h-4.5 w-4.5 text-indigo-600" />}
              </button>

              {/* Notification Drawer Trigger Bell Alert */}
              <button
                onClick={() => {
                  setNotificationOpen(true);
                  setUnreadCount(0);
                }}
                className="relative p-1.5 text-slate-500 dark:text-slate-400 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-850 transition cursor-pointer"
                title="Simulation Logs Feed"
              >
                <Bell className="h-4.5 w-4.5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-rose-500 text-white font-mono font-bold text-[8px] rounded-full flex items-center justify-center animate-pulse select-none">
                    {unreadCount}
                  </span>
                )}
              </button>

            </div>

          </div>
        </header>

        {/* B. News / Announcement ticker ribbon */}
        <div className="bg-amber-50 dark:bg-amber-950/20 border-b border-amber-250/40 dark:border-amber-900/30 py-2 px-4 flex items-center select-none overflow-hidden relative shadow-xs transition-colors">
          <div className="max-w-7xl mx-auto w-full flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-500 animate-pulse flex-shrink-0" />
            <div className="flex-1 overflow-hidden relative h-5 flex items-center">
              <p className="text-[10px] md:text-[11px] text-amber-805 dark:text-amber-300 font-bold whitespace-nowrap font-mono animate-pulse uppercase leading-none">
                {broadcastAlert}
              </p>
            </div>
          </div>
        </div>

        {/* Global Stock search results drawer shelf */}
        {searchQuery.trim() && (
          <div className="max-w-7xl mx-auto w-full px-4 md:px-6 lg:px-8 mt-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-lg space-y-2 animate-fade-in transition-colors">
              <h3 className="text-xs text-slate-450 dark:text-slate-500 font-mono font-bold flex items-center gap-1.5 select-none">
                <Search className="h-3 w-3 text-indigo-500" /> SEARCH INDEX RESULTS ({filteredStocksRegistry.length})
              </h3>
              {filteredStocksRegistry.length === 0 ? (
                <p className="text-[11px] text-slate-405 dark:text-slate-500 italic select-none">No stock asset or industry sector matched the parameter query.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
                  {filteredStocksRegistry.map((st) => (
                    <div
                      key={st.symbol}
                      onClick={() => {
                        handleSelectStock(st.symbol);
                        setSearchQuery("");
                        setActiveTab("terminal");
                      }}
                      className="bg-slate-50 dark:bg-slate-950/40 hover:bg-slate-100 dark:hover:bg-slate-850 p-2.5 border border-slate-200 dark:border-slate-850 rounded-lg cursor-pointer flex justify-between items-center transition"
                    >
                      <div>
                        <span className="font-extrabold text-xs text-slate-900 dark:text-white font-mono">{st.symbol}</span>
                        <span className="text-[9px] text-slate-400 dark:text-slate-500 block truncate max-w-[80px] font-bold">{st.name}</span>
                      </div>
                      <span className={`text-[10px] font-mono font-black ${st.change >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600"}`}>
                        {st.changePercent >= 0 ? "+" : ""}{st.changePercent.toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* C. Primary Responsive Viewport Body */}
        <main className="max-w-[1400px] mx-auto w-full p-4 md:p-6 lg:p-8 flex-1 space-y-6 overflow-x-hidden min-h-[600px]">
          
          <AnimatePresence mode="wait">
            {isTabChanging ? (
              <motion.div
                key="skeleton"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="space-y-6 animate-pulse select-none"
              >
                {/* Simulated Header block */}
                <div className="flex justify-between items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl">
                  <div className="space-y-2 w-1/3">
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2"></div>
                    <div className="h-3 bg-slate-100 dark:bg-slate-850 rounded w-3/4"></div>
                  </div>
                  <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-20"></div>
                </div>

                {/* Simulated Grid block */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl h-80 space-y-4">
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/4"></div>
                    <div className="h-40 bg-slate-100 dark:bg-slate-850 rounded w-full animate-pulse"></div>
                    <div className="h-3 bg-slate-150 dark:bg-slate-850 rounded w-5/6"></div>
                  </div>
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl h-80 space-y-4">
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2"></div>
                    <div className="h-3 bg-slate-105 dark:bg-slate-850 rounded w-full"></div>
                    <div className="h-3 bg-slate-105 dark:bg-slate-850 rounded w-5/6"></div>
                    <div className="h-3 bg-slate-105 dark:bg-slate-850 rounded w-2/3"></div>
                    <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded w-full mt-4"></div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="space-y-6"
              >
                {/* Page 1: Dashboard (Market Hub) */}
                {activeTab === "dashboard" && (
                  <div className="space-y-6">
                    
                    {/* Horizontal indexes tracker */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex items-center justify-between shadow-xs select-none transition-colors">
                        <div className="space-y-0.5">
                          <span className="text-[9px] font-mono font-bold text-slate-400 dark:text-slate-500 uppercase block tracking-wider">
                            NIFTY 50 INDEX (SIMULATION OVERALLS)
                          </span>
                          <strong className="text-base font-mono font-black text-slate-900 dark:text-white tracking-tight">
                            ₹{(22480 + stocks.reduce((acc, current) => acc + (current.change * 0.8), 0)).toFixed(1)}
                          </strong>
                        </div>
                        <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 p-1 px-2 rounded-md">
                          ▲ +{(stocks.reduce((acc, curr) => acc + curr.changePercent, 0) / stocks.length).toFixed(2)}%
                        </span>
                      </div>

                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex items-center justify-between shadow-xs select-none transition-colors">
                        <div className="space-y-0.5">
                          <span className="text-[9px] font-mono font-bold text-slate-400 dark:text-slate-550 uppercase block tracking-wider">
                            SENSEX INDEX (SIMULATION OVERALLS)
                          </span>
                          <strong className="text-base font-mono font-black text-slate-900 dark:text-white tracking-tight">
                            ₹{(73925 + stocks.reduce((acc, current) => acc + (current.change * 2.65), 0)).toFixed(1)}
                          </strong>
                        </div>
                        <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 p-1 px-2 rounded-md">
                          ▲ +{(stocks.reduce((acc, curr) => acc + curr.changePercent, 0) / stocks.length + 0.05).toFixed(2)}%
                        </span>
                      </div>
                    </div>

                    <MarketOverview
                      sectors={SECTOR_DATA}
                      news={combinedNewsList}
                      stocks={stocks}
                      onSelectStock={(sym) => {
                        handleSelectStock(sym);
                        setActiveTab("terminal");
                      }}
                      recentAlerts={recentAlerts}
                    />
                  </div>
                )}

                {/* Page 2: Stock study & study detail layout */}
                {activeTab === "terminal" && (
                  <div className="space-y-6">
                    
                    {/* Horizontal Quick explore sliders block */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5 px-3.5 rounded-2xl shadow-xs flex items-center gap-1.5 overflow-x-auto scrollbar-none select-none transition-colors">
                      <span className="text-xs text-slate-400 dark:text-slate-500 font-mono font-black uppercase tracking-wider block mr-2 whitespace-nowrap">
                        EXPLORER TERMINAL:
                      </span>
                      {stocks.map((s) => {
                        const isPos = s.change >= 0;
                        const isSelected = s.symbol === currentStockSymbol;
                        return (
                          <button
                            key={s.symbol}
                            onClick={() => setCurrentStockSymbol(s.symbol)}
                            className={`p-2 px-3.5 text-xs rounded-xl font-mono font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 border ${
                              isSelected
                                ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/30 shadow-xs"
                                : "bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-850 hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                            }`}
                          >
                            <span className="font-extrabold">{s.symbol}</span>
                            <span className={`text-[10px] font-black ${isPos ? "text-emerald-600 dark:text-emerald-400" : "text-rose-650"}`}>
                              ₹{s.price.toFixed(0)} ({isPos ? "+" : ""}{s.changePercent.toFixed(1)}%)
                            </span>
                            
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleWatchlist(s.symbol);
                              }}
                              className="text-amber-500 hover:text-amber-600 transition ml-1 select-none font-bold text-[13px]"
                              title={watchlist.includes(s.symbol) ? "Remove study watch" : "Pin study watch"}
                            >
                              {watchlist.includes(s.symbol) ? "★" : "☆"}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Primary Chart & AI helper workspace split */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 md:p-5 shadow-xs transition-colors">
                        <StockChartContainer stock={activeStock} />
                      </div>
                      <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 md:p-5 shadow-xs transition-colors">
                        <EducationalAI stock={activeStock} />
                      </div>
                    </div>

                    {/* Corporate deep ratio analysis */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 md:p-6 shadow-xs transition-colors">
                      <CompanyDetails stock={activeStock} />
                    </div>

                  </div>
                )}

                {/* Page 3: Option Chains */}
                {activeTab === "options" && (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 md:p-6 shadow-xs transition-colors">
                    
                    {/* Embedded Stock Choice bar for option chains */}
                    <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-250 dark:border-slate-850">
                      <div>
                        <h2 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest leading-none">
                          Active Option Derivative Target Asset
                        </h2>
                        <strong className="text-lg font-mono font-black text-slate-900 dark:text-white mt-1 block">
                          {activeStock.symbol} Spot Price: ₹{activeStock.price.toFixed(2)}
                        </strong>
                      </div>
                      
                      <div className="flex items-center gap-2 select-none">
                        <span className="text-[11px] text-slate-400 font-bold font-mono">Switch Asset:</span>
                        <select
                          value={currentStockSymbol}
                          onChange={(e) => setCurrentStockSymbol(e.target.value)}
                          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-1.5 px-3 text-xs outline-none focus:border-indigo-500 font-bold transition"
                        >
                          {stocks.map(s => (
                            <option key={s.symbol} value={s.symbol}>{s.symbol} (₹{s.price.toFixed(0)})</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <OptionChecker stock={activeStock} />
                  </div>
                )}

                {/* Page 4: Movers Board */}
                {activeTab === "movers" && (
                  <MarketMovers
                    stocks={stocks}
                    sectors={SECTOR_DATA}
                    onSelectStock={handleSelectStock}
                    onNavigateToTab={(tab) => setActiveTab(tab)}
                  />
                )}

                {/* Page 5: Watchlist */}
                {activeTab === "watchlist" && (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 md:p-5 shadow-xs transition-colors">
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
                  </div>
                )}

                {/* Page 6: Unified News and announcement journals */}
                {activeTab === "news" && (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs transition-colors">
                    <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 mb-5 select-none">
                      <Newspaper className="h-5 w-5 text-indigo-550 dark:text-indigo-400" />
                      <div>
                        <h2 className="font-display font-black text-sm text-slate-950 dark:text-white uppercase tracking-wider">
                          Academic Financial News Journal
                        </h2>
                        <p className="text-[10px] text-slate-450 dark:text-slate-500 font-mono font-bold uppercase">
                          Faculty broadcasts & simulation editorial updates
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      
                      {/* Left Column: Big highlights list */}
                      <div className="lg:col-span-8 space-y-4">
                        {combinedNewsList.map((item, index) => {
                          const relatedStock = stocks.find(s => item.relatedSymbols?.includes(s.symbol));
                          return (
                            <div 
                              key={item.id || index}
                              className="bg-slate-50/60 dark:bg-slate-950/40 p-4 border border-slate-200/60 dark:border-slate-850 rounded-xl space-y-2 hover:border-slate-350 dark:hover:border-slate-755 transition"
                            >
                              <div className="flex justify-between items-start gap-4">
                                <span className="text-[9.5px] bg-indigo-50 dark:bg-indigo-950 text-indigo-750 dark:text-indigo-400 px-2.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider border border-indigo-150/40 dark:border-indigo-900/30">
                                  {item.category}
                                </span>
                                <span className="text-[10px] text-slate-400 dark:text-slate-550 font-semibold font-mono">
                                  {item.time} • Source: {item.source}
                                </span>
                              </div>

                              <h3 className="font-display font-bold text-sm text-slate-905 dark:text-slate-150 leading-snug">
                                {item.title}
                              </h3>

                              <p className="text-xs text-slate-450 dark:text-slate-400 leading-relaxed font-sans font-medium">
                                {item.summary}
                              </p>

                              {relatedStock && (
                                <div className="flex items-center gap-1.5 pt-2">
                                  <span className="text-[9.5px] text-slate-400 font-bold uppercase">Related asset study:</span>
                                  <button
                                    onClick={() => {
                                      handleSelectStock(relatedStock.symbol);
                                      setActiveTab("terminal");
                                    }}
                                    className="text-[10px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-mono px-2 py-0.5 rounded hover:border-indigo-500 font-bold transition flex items-center gap-1"
                                  >
                                    {relatedStock.symbol} (₹{relatedStock.price.toFixed(0)}) <ChevronRight className="h-3 w-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Right Column: Educational Guidelines panel */}
                      <div className="lg:col-span-4 space-y-4">
                        <div className="bg-indigo-50/40 dark:bg-indigo-950/10 border border-indigo-200/40 dark:border-indigo-900/20 rounded-2xl p-5 space-y-3">
                          <h4 className="font-display font-black text-xs text-indigo-750 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                            <Sparkles className="h-4 w-4 animate-bounce" /> Guidance counselor
                          </h4>
                          <p className="text-[11px] text-indigo-950 dark:text-indigo-300 leading-relaxed font-sans font-medium">
                            These simulated announcements are procedurally updated on active sessions to test how macro news cycles (earnings announcements, promoter blocks, block trades) influence implied volatilities and futures options premiums in derivatives options check spreadsheets.
                          </p>
                          <div className="p-3 bg-white dark:bg-slate-900 border border-indigo-100/40 rounded-xl text-[10.5px] text-indigo-650 dark:text-indigo-400 leading-normal font-mono font-bold select-none">
                            💡 Watch volatility levels for stock details like TCS and RELIANCE during corporate result news.
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                )}

                {/* Page 7: Profile and Lounge overlays */}
                {activeTab === "profile" && (
                  <UserProfile
                    userSession={userSession}
                    onLogout={() => setUserSession(null)}
                    onLoginTrigger={() => setShowLoginModal(true)}
                    recentAlerts={recentAlerts}
                    stocksCount={stocks.length}
                    watchlistCount={watchlist.length}
                    alertsCount={alerts.filter(a => a.isTriggered).length}
                    currentBroadcastAlert={broadcastAlert}
                    onUpdateBroadcast={(msg) => setBroadcastAlert(msg)}
                    onPublishNews={handlePublishAdminNews}
                    customNewsList={customAdminNews}
                    onDeleteNews={handleDeleteAdminNews}
                    isFirebaseActive={isFirebaseReady}
                    onForceAdminSandbox={() => {
                      const sandboxUser: UserSession = {
                        uid: "faculty_advisor_override",
                        email: "admin_mayur@finsight.edu",
                        displayName: "Dr. Mayur (Faculty Supervisor)",
                        role: "admin",
                        createdAt: new Date().toISOString()
                      };
                      setUserSession(sandboxUser);
                      const msg = "🔐 Secure authorization override granted: Faculty Supervisor active.";
                      setRecentAlerts((logs) => [msg, ...logs.slice(0, 49)]);
                      setUnreadCount((prev) => prev + 1);
                    }}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* D. Mobile Float Bottom Navigation Bar */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 p-2 px-3 flex justify-between items-center z-[45] shadow-lg transition-colors select-none">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isSelected = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`flex flex-col items-center justify-center p-1.5 px-2 rounded-lg cursor-pointer transition-all ${
                  isSelected
                    ? "text-indigo-650 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/30"
                    : "text-slate-400 dark:text-slate-500 hover:text-slate-750"
                }`}
                style={{ minWidth: "44px", minHeight: "44px" }}
              >
                <div className="relative">
                  <Icon className="h-4.5 w-4.5" />
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="absolute -top-1 -right-2 bg-indigo-600 text-white font-mono font-bold text-[8px] rounded-full h-3 w-3 flex items-center justify-center border border-white">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[9px] font-bold mt-1 tracking-tight leading-none">
                  {item.label.split(" ").pop()}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Adjust footer padding on mobile to not be hidden by floating navigation */}
        <div className="pb-16 lg:pb-0 transition-all">
          <DisclaimerFooter />
        </div>

      </div>

      {/* 3. Sliding Screen drawer overlay on tablets */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex select-none font-sans">
          {/* Backdrop overlay */}
          <div 
            onClick={() => setMobileMenuOpen(false)}
            className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-xs transition"
          />
          
          {/* Menu core block */}
          <div className="relative w-64 max-w-xs bg-white dark:bg-slate-900 h-full p-5 flex flex-col justify-between border-r border-slate-200 dark:border-slate-800 animate-slide-in transition-colors">
            <div className="space-y-5">
              <div className="flex justify-between items-center">
                <span className="font-display font-black text-sm text-slate-905 dark:text-white">Navigation</span>
                <button 
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-850 rounded"
                >
                  <X className="h-5 w-5 text-slate-450" />
                </button>
              </div>

              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 mb-2">
                <div className="p-1.5 bg-indigo-650 rounded text-white flex items-center justify-center">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-xs text-slate-900 dark:text-white">FinSight Terminal</h2>
                  <span className="text-[8.5px] font-mono text-slate-450 dark:text-slate-500 uppercase">Interactive sandbox</span>
                </div>
              </div>

              <nav className="space-y-1">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isSelected = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold border cursor-pointer transition ${
                        isSelected
                          ? "bg-indigo-50/60 dark:bg-indigo-950/30 text-indigo-750 dark:text-indigo-400 border-indigo-200/50 dark:border-indigo-900/30"
                          : "bg-transparent text-slate-550 dark:text-slate-450 border-transparent hover:bg-slate-50 dark:hover:bg-slate-850/50"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="h-4 w-4 text-slate-450" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="bg-indigo-120 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 font-mono text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={toggleDarkMode}
                className="w-full flex items-center justify-between p-2 rounded-xl text-[10px] font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850 transition"
              >
                <span className="flex items-center gap-2">
                  {darkMode ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4 text-indigo-650" />}
                  <span>{darkMode ? "Light Layout" : "Dark Layout"}</span>
                </span>
                <span className="text-[9px] font-mono text-slate-450 uppercase">{darkMode ? "Light" : "Dark"}</span>
              </button>

              <p className="text-[9px] font-mono text-slate-400 text-center">FINSIGHT-PORT v2.6</p>
            </div>
          </div>
        </div>
      )}

      {/* E. Sidebar notification slide-over logs drawer overlay */}
      <NotificationDrawer
        isOpen={notificationOpen}
        onClose={() => setNotificationOpen(false)}
        recentAlerts={recentAlerts}
        onClearAll={() => {
          setRecentAlerts([]);
          setUnreadCount(0);
        }}
        onSelectStock={handleSelectStock}
        onNavigateToTab={(tab) => setActiveTab(tab)}
      />

      {/* F. Sign in overlay Login Modal */}
      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          onLoginSuccess={(session) => {
            setUserSession(session);
            if (session) {
              const msg = `🔐 LOGGED IN as ${session.displayName} (${session.role === "admin" ? "Supervisor" : "Student"})`;
              setRecentAlerts((logs) => [msg, ...logs.slice(0, 49)]);
              setUnreadCount((prev) => prev + 1);
            }
          }}
          isFirebaseActive={isFirebaseReady}
        />
      )}

      </div>
    </div>
  );
}
