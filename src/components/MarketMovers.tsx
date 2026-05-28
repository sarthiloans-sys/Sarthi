/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from "react";
import { StockData, SectorMetric } from "../types";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Layers, 
  ArrowUpRight, 
  ArrowDownRight, 
  BarChart3, 
  Activity, 
  Tv, 
  Flame 
} from "lucide-react";

interface MarketMoversProps {
  stocks: StockData[];
  sectors: SectorMetric[];
  onSelectStock: (symbol: string) => void;
  onNavigateToTab: (tab: "dashboard" | "terminal" | "options" | "watchlist" | "news" | "movers" | "profile") => void;
}

export default function MarketMovers({
  stocks,
  sectors,
  onSelectStock,
  onNavigateToTab
}: MarketMoversProps) {

  // Sort and select top gainers
  const topGainers = useMemo(() => {
    return [...stocks]
      .sort((a, b) => b.changePercent - a.changePercent)
      .slice(0, 4);
  }, [stocks]);

  // Sort and select top losers
  const topLosers = useMemo(() => {
    return [...stocks]
      .sort((a, b) => a.changePercent - b.changePercent)
      .slice(0, 4);
  }, [stocks]);

  // High volume breakouts (sorted by volume)
  const volumeLeaders = useMemo(() => {
    return [...stocks]
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 4);
  }, [stocks]);

  // High volatility / spread (Difference between High and Low relative to price)
  const highVolatilityStraddles = useMemo(() => {
    return [...stocks]
      .map(s => {
        const spread = s.dayHigh - s.dayLow;
        const spreadPercent = (spread / s.price) * 100;
        return { ...s, spread, spreadPercent };
      })
      .sort((a, b) => b.spreadPercent - a.spreadPercent)
      .slice(0, 4);
  }, [stocks]);

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      
      {/* Page Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs transition-colors">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-red-50 dark:bg-red-950/40 text-red-650 dark:text-red-400 border border-red-200/50 dark:border-red-900/30 px-2.5 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider">
                Movers Board
              </span>
              <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-900/30 px-2.5 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider">
                Live Scanner
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-display font-black text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
              <Flame className="h-6 w-6 text-orange-500 animate-pulse" /> Active Market Movers
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-4xl font-sans font-medium">
              Real-time procedural analysis of Indian stock indexes. Spot leading breakouts, extreme gainers, and sector-wise volume swings with direct educational terminal shortcuts.
            </p>
          </div>
        </div>
      </div>

      {/* Grid: Gainers & Losers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Top Gainers */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs transition-colors">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
                <TrendingUp className="h-4 w-4" />
              </div>
              <h2 className="font-display font-black text-sm text-slate-900 dark:text-white">Top Gainers (NSE/BSE)</h2>
            </div>
            <span className="text-[10px] font-mono bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded font-bold uppercase">
              Bullish Momentum
            </span>
          </div>

          <div className="space-y-3">
            {topGainers.map((st) => (
              <div
                key={st.symbol}
                onClick={() => {
                  onSelectStock(st.symbol);
                  onNavigateToTab("terminal");
                }}
                className="group flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950/40 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/10 border border-slate-150 dark:border-slate-800/80 hover:border-emerald-200 dark:hover:border-emerald-800/50 rounded-xl cursor-pointer transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-emerald-100/60 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs select-none">
                    ↑
                  </div>
                  <div>
                    <h3 className="font-mono font-black text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                      {st.symbol}
                      <span className="text-[9px] bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-sans px-1.5 py-0.5 rounded font-semibold">
                        {st.sector}
                      </span>
                    </h3>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-sans font-medium line-clamp-1 max-w-[150px] sm:max-w-[200px]">
                      {st.name}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 block">
                    ₹{st.price.toFixed(2)}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 rounded block mt-0.5 max-w-max ml-auto">
                    +{st.changePercent.toFixed(2)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Losers */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs transition-colors">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-100 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg">
                <TrendingDown className="h-4 w-4" />
              </div>
              <h2 className="font-display font-black text-sm text-slate-900 dark:text-white">Top Losers (NSE/BSE)</h2>
            </div>
            <span className="text-[10px] font-mono bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 px-2 py-0.5 rounded font-bold uppercase">
              Bearish Trend
            </span>
          </div>

          <div className="space-y-3">
            {topLosers.map((st) => (
              <div
                key={st.symbol}
                onClick={() => {
                  onSelectStock(st.symbol);
                  onNavigateToTab("terminal");
                }}
                className="group flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950/40 hover:bg-rose-50/30 dark:hover:bg-rose-950/10 border border-slate-150 dark:border-slate-800/80 hover:border-rose-200 dark:hover:border-rose-800/50 rounded-xl cursor-pointer transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-rose-100/60 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold text-xs select-none">
                    ↓
                  </div>
                  <div>
                    <h3 className="font-mono font-black text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                      {st.symbol}
                      <span className="text-[9px] bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-sans px-1.5 py-0.5 rounded font-semibold">
                        {st.sector}
                      </span>
                    </h3>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-sans font-medium line-clamp-1 max-w-[150px] sm:max-w-[200px]">
                      {st.name}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 block">
                    ₹{st.price.toFixed(2)}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.5 rounded block mt-0.5 max-w-max ml-auto">
                    {st.changePercent.toFixed(2)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Grid: Volume Leaders & Intraday Spreads */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Volume leaders */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs transition-colors">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                <BarChart3 className="h-4 w-4" />
              </div>
              <h2 className="font-display font-black text-sm text-slate-900 dark:text-white">Volume Breakouts (Liquidity)</h2>
            </div>
            <span className="text-[10px] font-mono bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded font-bold uppercase">
              High Participation
            </span>
          </div>

          <div className="space-y-3">
            {volumeLeaders.map((st) => (
              <div
                key={st.symbol}
                onClick={() => {
                  onSelectStock(st.symbol);
                  onNavigateToTab("terminal");
                }}
                className="group flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950/40 hover:bg-blue-50/30 dark:hover:bg-blue-950/10 border border-slate-150 dark:border-slate-800/80 hover:border-blue-200 dark:hover:border-blue-800/50 rounded-xl cursor-pointer transition-all duration-200"
              >
                <div>
                  <h3 className="font-mono font-black text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                    {st.symbol}
                    <span className="text-[9px] bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-sans px-1.5 py-0.5 rounded font-semibold">
                      {st.sector}
                    </span>
                  </h3>
                  <p className="text-[10px] text-slate-450 dark:text-slate-500 mt-1 font-mono">
                    Total Vol: {st.volume.toLocaleString()} shares
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 block">
                    ₹{st.price.toFixed(2)}
                  </span>
                  <span className={`text-[10px] font-mono font-bold block mt-0.5 ${st.changePercent >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                    {st.changePercent >= 0 ? "+" : ""}{st.changePercent.toFixed(2)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* High Volatility Range Straddles */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs transition-colors">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-purple-50 dark:bg-purple-950/50 border border-purple-100 dark:border-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
                <Activity className="h-4 w-4" />
              </div>
              <h2 className="font-display font-black text-sm text-slate-900 dark:text-white">Intraday Swings (High – Low)</h2>
            </div>
            <span className="text-[10px] font-mono bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 px-2 py-0.5 rounded font-bold uppercase">
              Option Sellers Watchlist
            </span>
          </div>

          <div className="space-y-3">
            {highVolatilityStraddles.map((st) => (
              <div
                key={st.symbol}
                onClick={() => {
                  onSelectStock(st.symbol);
                  onNavigateToTab("terminal");
                }}
                className="group flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950/40 hover:bg-purple-50/30 dark:hover:bg-purple-950/10 border border-slate-150 dark:border-slate-800/80 hover:border-purple-200 dark:hover:border-purple-800/50 rounded-xl cursor-pointer transition-all duration-200"
              >
                <div>
                  <h3 className="font-mono font-black text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                    {st.symbol}
                    <span className="text-[9px] bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-sans px-1.5 py-0.5 rounded font-semibold">
                      {st.sector}
                    </span>
                  </h3>
                  <p className="text-[10px] text-slate-450 dark:text-slate-500 mt-1 font-mono">
                    Day Spread: ₹{st.spread.toFixed(1)} ({st.spreadPercent.toFixed(2)}% Range)
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 block">
                    High: ₹{st.dayHigh.toFixed(1)}
                  </span>
                  <span className="text-[10px] font-mono text-slate-450 dark:text-slate-550 block mt-0.5">
                    Low: ₹{st.dayLow.toFixed(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Sector Hot-Cold Performance Grid */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs transition-colors">
        <h2 className="font-display font-black text-sm text-slate-900 dark:text-white flex items-center gap-2 mb-4">
          <Layers className="h-4 w-4 text-orange-500" /> Sector Allocation Performance Map
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {sectors.map((sec) => {
            const isPos = sec.changePercent >= 0;
            return (
              <div
                key={sec.name}
                className={`p-4 rounded-xl border flex flex-col justify-between h-[110px] transition-all ${
                  isPos
                    ? "bg-emerald-50/20 dark:bg-emerald-950/10 border-emerald-200/60 dark:border-emerald-950/40"
                    : "bg-rose-50/20 dark:bg-rose-950/10 border-rose-200/60 dark:border-rose-950/40"
                }`}
              >
                <div>
                  <h3 className="font-display font-extrabold text-xs text-slate-800 dark:text-slate-200">
                    {sec.name} Sector
                  </h3>
                  <span className="text-[9px] font-mono text-slate-400 font-medium">
                    {sec.stocksCount} Component Assets Included
                  </span>
                </div>

                <div className="flex justify-between items-end">
                  <div className="text-[10px] font-mono">
                    <span className="text-slate-400 font-bold block">Top:</span>
                    <button
                      type="button"
                      onClick={() => {
                        onSelectStock(sec.gainer.symbol);
                        onNavigateToTab("terminal");
                      }}
                      className="text-emerald-600 dark:text-emerald-400 hover:underline font-extrabold"
                    >
                      {sec.gainer.symbol}
                    </button>
                  </div>

                  <strong className={`font-mono text-sm ${isPos ? "text-emerald-600" : "text-rose-600"}`}>
                    {isPos ? "+" : ""}{sec.changePercent.toFixed(2)}%
                  </strong>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
