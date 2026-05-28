/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { SectorMetric, NewsItem, StockData } from "../types";
import { Newspaper, TrendingUp, TrendingDown, Layers, Activity, Filter, AlertCircle, ArrowUpRight } from "lucide-react";

interface MarketOverviewProps {
  sectors: SectorMetric[];
  news: NewsItem[];
  stocks: StockData[];
  onSelectStock: (symbol: string) => void;
  recentAlerts: string[];
}

export default function MarketOverview({
  sectors,
  news,
  stocks,
  onSelectStock,
  recentAlerts
}: MarketOverviewProps) {
  const [selectedCategory, setSelectedCategory] = useState<"All" | "Dividend" | "Corporate Announcement" | "Results" | "Corporate Action">("All");

  const filteredNews = news.filter((item) => {
    if (selectedCategory === "All") return true;
    return item.category === selectedCategory;
  });

  // Calculate Nifty / Sensex simulated benchmarks from active stocks prices
  const niftyEstimate = 22480 + stocks.reduce((acc, current) => acc + (current.change * 0.8), 0);
  const niftyChangePercent = stocks.reduce((acc, curr) => acc + curr.changePercent, 0) / stocks.length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* A. Sector-wise Performance Feed */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-blue-600" />
              <h2 className="font-display font-medium text-lg text-slate-900 font-extrabold">Sector Performance Index</h2>
            </div>
            <span className="text-xs text-slate-600 font-mono font-bold flex items-center gap-1.5 bg-slate-50 border border-slate-200 py-1 px-2.5 rounded-md shadow-inner">
              <Activity className="h-3.5 w-3.5 text-emerald-500 animate-pulse" /> Live Analysis
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {sectors.map((sec) => {
              const isPositive = sec.changePercent >= 0;
              return (
                <div
                  key={sec.name}
                  className="bg-slate-50 border border-slate-200 p-3.5 rounded-lg hover:border-slate-300 transition shadow-sm"
                >
                  <div className="flex justify-between items-start mb-2.5">
                    <div>
                      <h3 className="font-display font-bold text-sm text-slate-900 tracking-wide">{sec.name}</h3>
                      <p className="text-[10px] text-slate-400 font-mono">{sec.stocksCount} Component Assets</p>
                    </div>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-md font-mono ${
                        isPositive
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-250"
                          : "bg-rose-50 text-rose-700 border border-rose-250"
                      }`}
                    >
                      {isPositive ? "▲" : "▼"} {sec.changePercent.toFixed(2)}%
                    </span>
                  </div>

                  {/* Top Gainer and Loser in Sector */}
                  <div className="space-y-1.5 border-t border-slate-200 pt-2 text-[11px] font-mono">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-medium">Top Gainer:</span>
                      <button
                        type="button"
                        onClick={() => onSelectStock(sec.gainer.symbol)}
                        className="text-emerald-600 hover:underline font-black text-left cursor-pointer"
                      >
                        {sec.gainer.symbol} ({sec.gainer.changePercent >= 0 ? "+" : ""}{sec.gainer.changePercent.toFixed(1)}%)
                      </button>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-medium">Top Loser:</span>
                      <button
                        type="button"
                        onClick={() => onSelectStock(sec.loser.symbol)}
                        className="text-rose-600 hover:underline font-black text-left cursor-pointer"
                      >
                        {sec.loser.symbol} ({sec.loser.changePercent >= 0 ? "+" : ""}{sec.loser.changePercent.toFixed(1)}%)
                      </button>
                    </div>
                  </div>

                  {/* Market Cap Weights bar */}
                  <div className="mt-2.5">
                    <div className="flex justify-between text-[9px] text-slate-400 mb-1 font-mono font-bold">
                      <span>Index Weight</span>
                      <span>{sec.marketCapPercent}%</span>
                    </div>
                    <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-slate-500 rounded-full"
                        style={{ width: `${sec.marketCapPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Market Heatmap Visualization Block */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm transition-colors">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-4 select-none">
            <div className="flex items-center gap-2">
              <span className="p-1 px-2 text-indigo-50 bg-indigo-550/10 dark:bg-indigo-950 text-indigo-750 dark:text-indigo-400 font-mono font-bold text-[9px] rounded border border-indigo-200/25 uppercase">Constituents Heatmap</span>
              <h2 className="font-display font-black text-sm md:text-base text-slate-900 dark:text-white uppercase tracking-wider">Market Overview Heat Grid</h2>
            </div>
            <span className="text-[10px] text-slate-400 font-mono font-medium">Click block to study terminal</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
            {stocks.map((s) => {
              const chg = s.changePercent;
              // determine performance-based background colors
              let bgClass = "bg-slate-50 dark:bg-slate-950/40 text-slate-900 dark:text-slate-150";
              let borderClass = "border-slate-200 dark:border-slate-850 hover:border-indigo-500/50";
              let percentColor = "text-slate-500 dark:text-slate-400";
              
              if (chg >= 1.5) {
                bgClass = "bg-emerald-600 dark:bg-emerald-755 text-white";
                borderClass = "border-emerald-700 hover:border-emerald-400";
                percentColor = "text-emerald-100 font-black";
              } else if (chg > 0.0) {
                bgClass = "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-950 dark:text-emerald-450";
                borderClass = "border-emerald-200/55 dark:border-emerald-900/40 hover:border-emerald-400";
                percentColor = "text-emerald-750 dark:text-emerald-400";
              } else if (chg <= -1.5) {
                bgClass = "bg-rose-600 dark:bg-rose-755 text-white";
                borderClass = "border-rose-700 hover:border-rose-450";
                percentColor = "text-rose-100 font-black";
              } else if (chg < 0.0) {
                bgClass = "bg-rose-50 dark:bg-rose-950/30 text-rose-950 dark:text-rose-450";
                borderClass = "border-rose-250/55 dark:border-rose-900/40 hover:border-rose-450";
                percentColor = "text-rose-750 dark:text-rose-400";
              }

              return (
                <button
                  key={s.symbol}
                  onClick={() => onSelectStock(s.symbol)}
                  className={`p-3 rounded-lg border text-left transition duration-150 transform hover:-translate-y-0.5 whitespace-nowrap shadow-xs flex flex-col justify-between h-[80px] cursor-pointer ${bgClass} ${borderClass}`}
                >
                  <div className="flex justify-between items-start w-full gap-2">
                    <span className="font-mono font-extrabold text-xs tracking-wide">{s.symbol}</span>
                    <span className="text-[8.5px] font-mono opacity-80 leading-none bg-slate-100/50 dark:bg-slate-900/40 p-0.5 px-1 rounded uppercase">{s.sector.split(" ")[0]}</span>
                  </div>
                  <div className="w-full mt-2 flex justify-between items-baseline">
                    <span className="text-[10px] font-bold font-mono">₹{s.price.toFixed(0)}</span>
                    <span className={`text-[10px] font-bold font-mono leading-none ${percentColor}`}>
                      {chg >= 0 ? "+" : ""}{chg.toFixed(1)}%
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
          
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-[9.5px] text-slate-500 dark:text-slate-405 font-mono select-none border-t border-slate-100 dark:border-slate-800/80 pt-3 uppercase">
            <span className="font-bold flex items-center gap-1">Color Legend:</span>
            <div className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 bg-emerald-600 rounded-sm" />
              <span>Bullish (&ge; 1.5%)</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/50 rounded-sm" />
              <span>Mild Uptrend</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200/50 rounded-sm" />
              <span>Mild Downtrend</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 bg-rose-600 rounded-sm" />
              <span>Bearish (&le; -1.5%)</span>
            </div>
          </div>
        </div>

        {/* B. News Feed Section */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Newspaper className="h-5 w-5 text-blue-600" />
              <h2 className="font-display font-black text-lg text-slate-900">Regulatory Newsroom & Splits</h2>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-1 overflow-x-auto max-w-full pb-1 sm:pb-0 scrollbar-none">
              {(["All", "Corporate Announcement", "Dividend", "Results", "Corporate Action"] as const).map(
                (filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setSelectedCategory(filter)}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-md whitespace-nowrap transition cursor-pointer ${
                      selectedCategory === filter
                        ? "bg-blue-600 text-white border border-blue-500 shadow-sm"
                        : "text-slate-500 bg-slate-50 border border-slate-200 hover:text-slate-800 hover:bg-slate-100"
                    }`}
                  >
                    {filter === "All" ? "📰 All News" : filter}
                  </button>
                )
              )}
            </div>
          </div>

          <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
            {filteredNews.length === 0 ? (
              <div className="text-center text-slate-400 py-10 text-xs">
                No active announcements under this filter.
              </div>
            ) : (
              filteredNews.map((n) => (
                <div
                  key={n.id}
                  className="bg-slate-50 border border-slate-200 hover:border-slate-300 p-3.5 rounded-lg transition text-xs shadow-sm"
                >
                  <div className="flex justify-between items-center mb-1.5 font-mono text-[10px] font-bold">
                    <span className="text-blue-600 font-extrabold bg-blue-550/10 px-1.5 py-0.5 border border-blue-200/50 rounded uppercase">
                      {n.category}
                    </span>
                    <span className="text-slate-400">{n.time} • {n.source}</span>
                  </div>
                  <h3 className="font-display font-black text-slate-900 text-[13px] mb-1 leading-snug">
                    {n.title}
                  </h3>
                  <p className="text-slate-500 leading-relaxed font-sans mb-2 font-semibold">
                    {n.summary}
                  </p>
                  
                  {/* Related symbol link triggers */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] text-slate-400 font-mono font-bold">Impact Assets:</span>
                    {n.relatedSymbols.map((sym) => (
                      <button
                        key={sym}
                        type="button"
                        onClick={() => onSelectStock(sym)}
                        className="text-[10px] font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 py-0.5 px-2 rounded font-mono cursor-pointer flex items-center gap-0.5 transition shadow-xs"
                      >
                        {sym} <ArrowUpRight className="h-2 w-2 text-slate-400" />
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* C. Right Sidebar: Benchmark Indices & Live Trigger Feeds */}
      <div className="space-y-6">
        {/* Indices Indicators */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h2 className="font-display font-black text-base text-slate-900 border-b border-slate-200 pb-3 mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-600" />
            <span>Benchmark Indices</span>
          </h2>

          <div className="space-y-3">
            {/* Index 1 */}
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg flex justify-between items-center shadow-sm">
              <div>
                <h3 className="font-display font-bold text-sm text-slate-900">NIFTY 50</h3>
                <p className="text-[10px] text-slate-400 font-mono">National Stock Index</p>
              </div>
              <div className="text-right font-mono">
                <p className="text-sm font-black text-slate-900">₹{niftyEstimate.toFixed(2)}</p>
                <span
                  className={`text-xs font-bold ${
                    niftyChangePercent >= 0 ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {niftyChangePercent >= 0 ? "+" : ""}
                  {niftyChangePercent.toFixed(2)}%
                </span>
              </div>
            </div>

            {/* Index 2 */}
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg flex justify-between items-center shadow-sm">
              <div>
                <h3 className="font-display font-bold text-sm text-slate-900">SENSEX 30</h3>
                <p className="text-[10px] text-slate-400 font-mono">BSI Index Estimation</p>
              </div>
              <div className="text-right font-mono">
                <p className="text-sm font-black text-slate-900">₹{(niftyEstimate * 3.3).toFixed(2)}</p>
                <span
                  className={`text-xs font-bold ${
                    niftyChangePercent >= 0 ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {niftyChangePercent >= 0 ? "+" : ""}
                  {niftyChangePercent.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Indicator Signals / Alert Tracker */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col h-[340px]">
          <h2 className="font-display font-black text-base text-slate-900 border-b border-slate-200 pb-3 mb-4 flex items-center gap-2">
            <Activity className="h-4 w-4 text-rose-500 animate-pulse" />
            <span>Mock Trigger Log</span>
          </h2>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-[11px] font-mono">
            {recentAlerts.length === 0 ? (
              <div className="h-full flex flex-col justify-center items-center text-center p-4 text-slate-400">
                <AlertCircle className="h-7 w-7 text-slate-300 mb-2 animate-pulse" />
                <p>System is monitoring ticks.</p>
                <p className="text-[9px] mt-1 text-slate-400 uppercase tracking-widest leading-relaxed font-bold">
                  Breakouts & crossovers appear here
                </p>
              </div>
            ) : (
              recentAlerts.map((log, i) => (
                <div
                  key={i}
                  className="p-2.5 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-md text-slate-600 flex items-start gap-2 leading-relaxed shadow-xs"
                >
                  <span className="text-amber-500 font-bold">⚡</span>
                  <div className="flex-1">
                    <p className="text-slate-800 font-bold">{log}</p>
                    <span className="text-[9px] text-slate-400 block mt-0.5 font-bold">Automated Indicator Sweep Log</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
