/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState, useMemo } from "react";
import { StockData } from "../types";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import {
  Building,
  TrendingUp,
  TrendingDown,
  LineChart,
  Grid,
  Percent,
  Layers,
  Info,
  Activity,
  AlertTriangle,
  HelpCircle,
  Clock,
  Briefcase,
  ChevronRight,
  Gauge,
  Sparkles,
} from "lucide-react";

interface CompanyDetailsProps {
  stock: StockData;
}

export default function CompanyDetails({ stock }: CompanyDetailsProps) {
  const [financialTab, setFinancialTab] = useState<"quarterly" | "annual">("quarterly");
  const [holdingTab, setHoldingTab] = useState<"chart" | "sheet">("chart");

  const financialData = financialTab === "quarterly" ? stock.quarterlyResults : stock.annualResults;

  // ==========================================
  // TICKERTAPE PREMIUM FINANCIAL COMPUTATIONS
  // ==========================================

  // 1. Fair Value Estimation (using Graham formula and stock price skew)
  const fairValue = useMemo(() => {
    // Graham-style Valuation: Sqrt(22.5 * EPS * Book Value)
    const baseGraham = Math.sqrt(22.5 * Math.max(1, stock.fundamentals.eps) * Math.max(1, stock.fundamentals.bookValue));
    
    // Bounds check to keep Graham pricing realistic compared to spot
    if (isNaN(baseGraham) || baseGraham < 10) {
      return stock.price * 1.15; // fallback
    }

    // Blend Graham number and Spot price for educational research look
    const blendedVal = (baseGraham + stock.price * 1.12) / 2;
    return Math.round(blendedVal * 10) / 10;
  }, [stock.price, stock.fundamentals.eps, stock.fundamentals.bookValue]);

  // 2. Upside % computation
  const upsidePercent = useMemo(() => {
    const diff = fairValue - stock.price;
    return Math.round((diff / stock.price) * 100 * 10) / 10;
  }, [fairValue, stock.price]);

  // 3. Volatility Meter Beta value
  const beta = useMemo(() => {
    const sym = stock.symbol;
    if (sym === "TCS" || sym === "INFY") return 0.88;
    if (sym === "RELIANCE") return 1.05;
    if (sym === "SBI" || sym === "ICICIBANK" || sym === "HDFCBANK") return 1.25;
    return 1.12;
  }, [stock.symbol]);

  // 4. Returns & Performance Metrics
  const returnMetrics = useMemo(() => {
    const sym = stock.symbol;
    // Real-feeling historic performance indicators
    const lookup: Record<string, { ret1Y: number; cagr5Y: number; risk: number; industry: string }> = {
      TCS: { ret1Y: 16.4, cagr5Y: 13.8, risk: 22, industry: "IT Consulting & Software" },
      RELIANCE: { ret1Y: 22.8, cagr5Y: 17.4, risk: 36, industry: "Conglomerate & Petrochemicals" },
      INFY: { ret1Y: 12.5, cagr5Y: 11.2, risk: 28, industry: "IT Services & Solutions" },
      HDFCBANK: { ret1Y: 10.2, cagr5Y: 12.5, risk: 24, industry: "Commercial Private Banking" },
      SBI: { ret1Y: 26.5, cagr5Y: 19.8, risk: 45, industry: "Public Sector Banking" },
      BHARTIARTL: { ret1Y: 34.2, cagr5Y: 21.3, risk: 40, industry: "Telecommunications Brokerage" },
    };

    return lookup[sym] || { ret1Y: 18.5, cagr5Y: 14.2, risk: 35, industry: `${stock.sector} Services` };
  }, [stock.symbol, stock.sector]);

  // 5. Analyst Sentiment
  const sentiment = useMemo(() => {
    const sym = stock.symbol;
    const stats: Record<string, { bullish: number; neutral: number; bearish: number }> = {
      TCS: { bullish: 74, neutral: 18, bearish: 8 },
      RELIANCE: { bullish: 82, neutral: 12, bearish: 6 },
      INFY: { bullish: 60, neutral: 25, bearish: 15 },
      HDFCBANK: { bullish: 70, neutral: 22, bearish: 8 },
      SBI: { bullish: 68, neutral: 20, bearish: 12 },
    };
    return stats[sym] || { bullish: 72, neutral: 18, bearish: 10 };
  }, [stock.symbol]);

  // Volatility evaluation human tag
  const getVolatilityBadge = (b: number) => {
    if (b < 0.9) return { label: "Low Volatility", style: "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-450 border-emerald-200" };
    if (b <= 1.15) return { label: "Moderate Volatility", style: "text-indigo-700 bg-indigo-50 dark:bg-indigo-950/40 dark:text-indigo-455 border-indigo-200" };
    return { label: "High Volatility", style: "text-rose-700 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-450 border-rose-250" };
  };

  // Technical Rating color indicators
  const getTrendBadgeColor = (trend: "Bullish" | "Bearish" | "Neutral" | "High Momentum") => {
    switch (trend) {
      case "Bullish":
        return "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 font-bold shadow-xs";
      case "Bearish":
        return "bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900 font-bold shadow-xs";
      case "High Momentum":
        return "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900 font-bold shadow-xs";
      default:
        return "bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-650 dark:text-slate-350";
    }
  };

  const isPriceUp = stock.change >= 0;

  return (
    <div className="space-y-6">
      {/* SEBI WARNING COMPLIANCE BANNER */}
      <div className="bg-amber-50/90 dark:bg-amber-950/15 border border-amber-200 dark:border-amber-900/40 p-4 rounded-xl flex items-start gap-2.5 select-none text-[11px] leading-relaxed">
        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-amber-850 dark:text-amber-300 font-sans">
          <strong>Non-SEBI Compliance Protection:</strong> We do not issue recommendation advisories. All fair value calculations, upside metrics, risk scores, and performance levels are computed procedurally for financial literacy and educational sandbox demonstrations only.
        </div>
      </div>

      {/* 1. Header Overview & Live Price Panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs transition-colors">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
          <div className="space-y-1.5 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="p-1 px-2 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400">
                {stock.exchange} • {stock.symbol}
              </span>
              <span className="text-xs bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-400 font-semibold font-sans">
                {stock.sector} Segment
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-slate-950 dark:text-white flex items-center gap-2 leading-tight">
              <Building className="h-5.5 w-5.5 text-slate-400" /> {stock.name}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-4xl font-sans font-medium">
              {stock.about}
            </p>
          </div>

          {/* Real-time Ticker Box */}
          <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-4 rounded-2xl min-w-[240px] w-full md:w-auto flex flex-col justify-center text-right font-mono transition-colors">
            <span className="text-[9px] text-slate-405 dark:text-slate-500 font-black uppercase tracking-widest block mb-0.5">
              ⚡ Simulated Live Settle Price
            </span>
            <div className="flex items-baseline justify-end gap-1.5">
              <span className="text-2xl font-black text-slate-900 dark:text-white">₹{stock.price.toFixed(2)}</span>
            </div>
            <p className={`text-xs font-bold font-mono flex items-center justify-end gap-0.5 ${isPriceUp ? "text-emerald-500" : "text-rose-550"}`}>
              {isPriceUp ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
              {isPriceUp ? "+" : ""}
              {stock.change.toFixed(2)} ({isPriceUp ? "+" : ""}
              {stock.changePercent.toFixed(2)}%)
            </p>
            <div className="grid grid-cols-2 gap-x-2 border-t border-slate-150 dark:border-slate-800 mt-2.5 pt-2 text-[10px] text-slate-405 dark:text-slate-500 text-left">
              <div>
                <span>Day High:</span>
                <span className="text-slate-800 dark:text-slate-200 block font-bold">₹{stock.dayHigh.toFixed(1)}</span>
              </div>
              <div className="text-right">
                <span>Day Low:</span>
                <span className="text-slate-800 dark:text-slate-200 block font-bold">₹{stock.dayLow.toFixed(1)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 52 Week bounds */}
        <div className="mt-4 pt-3 border-t border-slate-150 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono text-slate-500 dark:text-slate-400 font-semibold select-none">
          <div>
            <span className="uppercase text-[9px] text-slate-400 tracking-wider block font-bold">52 Week High</span>
            <span className="text-slate-850 dark:text-slate-100 font-black">₹{stock.yearHigh.toFixed(2)}</span>
          </div>
          <div>
            <span className="uppercase text-[9px] text-slate-400 tracking-wider block font-bold">52 Week Low</span>
            <span className="text-slate-850 dark:text-slate-100 font-black">₹{stock.yearLow.toFixed(2)}</span>
          </div>
          <div>
            <span className="uppercase text-[9px] text-slate-400 tracking-wider block font-bold">Tick Shares Volume</span>
            <span className="text-slate-850 dark:text-slate-100 font-black">{stock.volume.toLocaleString()}</span>
          </div>
          <div>
            <span className="uppercase text-[9px] text-slate-400 tracking-wider block font-bold">Prev Settle S1 Close</span>
            <span className="text-slate-650 dark:text-slate-350 font-black">₹{stock.prevClose.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* ==========================================
          Premium Investing.com / Tickertape Panel
         ========================================== */}
      <div className="bg-gradient-to-br from-indigo-50/50 to-white dark:from-slate-950 dark:to-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs transition-colors space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-indigo-100/50 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-650 dark:text-indigo-400" />
            <h2 className="font-extrabold text-sm md:text-base text-slate-900 dark:text-white uppercase tracking-wider">
              Investing.com Premium Research Engine
            </h2>
          </div>
          <span className="text-[9.5px] bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 border border-indigo-200/20 px-2 py-0.5 rounded-lg font-bold font-mono">
            Analytical Projections
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 select-none font-mono">
          
          {/* Card A: Fair Value & Target pricing */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl space-y-3 shadow-xs">
            <span className="text-[10px] text-slate-450 dark:text-slate-500 font-black uppercase tracking-wider block border-b border-slate-100 dark:border-slate-800 pb-1 font-sans">
              Valuation Multipliers
            </span>
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <span className="text-xs text-slate-550 dark:text-slate-400 font-sans">Current Price:</span>
                <span className="font-bold text-slate-850 dark:text-slate-200">₹{stock.price.toFixed(1)}</span>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-xs text-slate-555 dark:text-slate-400 flex items-center gap-1 font-sans">
                  Fair Value Settle:
                  <HelpCircle className="h-3.5 w-3.5 text-slate-405 shrink-0" title="Calculated using Graham blended valuation multiplier formulas" />
                </span>
                <span className="font-black text-indigo-600 dark:text-indigo-400 text-sm">₹{fairValue.toFixed(1)}</span>
              </div>

              {/* Upside percentage indicator */}
              <div className="pt-2">
                <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-950/70 p-2.5 rounded-lg border border-slate-150 dark:border-slate-850">
                  <span className="text-[11px] text-slate-500 dark:text-slate-450 font-sans font-bold">Consensus Upside:</span>
                  <span className={`text-xs font-black p-0.5 px-2 rounded-md ${
                    upsidePercent >= 0 
                      ? "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-450" 
                      : "text-rose-700 bg-rose-50 dark:bg-rose-950/30 dark:text-rose-450"
                  }`}>
                    {upsidePercent >= 0 ? "▲ +" : "▼ "}{upsidePercent}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card B: Performance Records & Volatility */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl space-y-3.5 shadow-xs">
            <span className="text-[10px] text-slate-450 dark:text-slate-500 font-black uppercase tracking-wider block border-b border-slate-100 dark:border-slate-800 pb-1 font-sans">
              CAGR & Price Volatility
            </span>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400 font-sans">1 Year Return:</span>
                <span className="font-extrabold text-emerald-500">+{returnMetrics.ret1Y.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400 font-sans">5 Year Wealth CAGR:</span>
                <span className="font-extrabold text-slate-800 dark:text-slate-200">+{returnMetrics.cagr5Y.toFixed(1)}%</span>
              </div>
              
              <div className="pt-1 select-none">
                <div className={`p-1.5 px-2.5 rounded-lg border text-center font-sans text-[11px] font-bold ${getVolatilityBadge(beta).style}`}>
                  {getVolatilityBadge(beta).label} (Beta = {beta.toFixed(2)})
                </div>
              </div>
            </div>
          </div>

          {/* Card C: Risk Score & Analyst consensus */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl space-y-3 shadow-xs">
            <span className="text-[10px] text-slate-450 dark:text-slate-500 font-black uppercase tracking-wider block border-b border-slate-100 dark:border-slate-800 pb-1 font-sans">
              Analyst Sentiments & Risk Room
            </span>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-sans">Risk Rating Score:</span>
                <span className={`font-black uppercase tracking-wide px-1.5 py-0.5 rounded text-[10.5px] ${
                  returnMetrics.risk < 30
                    ? "text-emerald-600 dark:text-emerald-450 bg-emerald-50/70"
                    : "text-amber-600 dark:text-amber-450 bg-amber-50/70"
                }`}>
                  {returnMetrics.risk}/100 Risk
                </span>
              </div>

              {/* Stacked gauge bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10.5px] text-slate-500 dark:text-slate-400 font-sans font-semibold">
                  <span>Analyst Sentiment:</span>
                  <span className="font-bold text-emerald-555">Bullish ({sentiment.bullish}%)</span>
                </div>
                
                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex select-none">
                  <div className="h-full bg-emerald-500" style={{ width: `${sentiment.bullish}%` }} title={`Bullish: ${sentiment.bullish}%`} />
                  <div className="h-full bg-amber-550" style={{ width: `${sentiment.neutral}%` }} title={`Neutral: ${sentiment.neutral}%`} />
                  <div className="h-full bg-rose-500" style={{ width: `${sentiment.bearish}%` }} title={`Bearish: ${sentiment.bearish}%`} />
                </div>

                <div className="flex justify-between text-[8px] text-slate-450 font-semibold leading-none mt-1">
                  <span>Bullish: {sentiment.bullish}%</span>
                  <span>Neut: {sentiment.neutral}%</span>
                  <span>Bear: {sentiment.bearish}%</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        <div className="p-3 bg-white/70 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/50 rounded-xl text-[10.5px] text-slate-500 dark:text-slate-450 leading-relaxed font-sans mt-2">
          <strong>Scholastic Research Value:</strong> Evaluating Volatility Beta helps quantify price deviation compared to the national index. Consistent double-digit 5Y CAGRs display long-term franchise compounding strengths, while high risk scores mark high leverage exposure.
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 2. Company Fundamentals Grid */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs lg:col-span-2 transition-colors">
          <h2 className="font-bold text-base text-slate-900 dark:text-white border-b border-slate-150 dark:border-slate-800 pb-3 mb-4 flex items-center gap-2">
            <Grid className="h-4.5 w-4.5 text-indigo-650 dark:text-indigo-400" />
            <span>Valuation Fundamentals Indicators</span>
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: "Market Cap (Cr.)", value: `₹${stock.fundamentals.marketCap.toLocaleString()}`, note: "Total equity value" },
              { label: "Stock P/E Ratio", value: stock.fundamentals.peRatio.toFixed(1), note: "Price divided by earnings" },
              { label: "Book Value", value: `₹${stock.fundamentals.bookValue.toFixed(1)}`, note: "Net book worth per share" },
              { label: "Price-to-Book (P/B)", value: stock.fundamentals.pbRatio.toFixed(2), note: "Price to Book multiplier" },
              { label: "Earnings Per Share (EPS)", value: `₹${stock.fundamentals.eps.toFixed(1)}`, note: "Net profit per share share" },
              { label: "Return on Equity (ROE)", value: `${stock.fundamentals.roe.toFixed(1)}%`, note: "ROE profitability" },
              { label: "ROCE Return Indicator", value: `${stock.fundamentals.roce.toFixed(1)}%`, note: "Pre-tax return on capital" },
              { label: "Dividend Yield", value: `${stock.fundamentals.dividendYield.toFixed(2)}%`, note: "Yield cash relative to price" },
              { label: "Debt-to-Equity Ratio", value: stock.fundamentals.debtToEquity.toFixed(2), note: "Leverage debt over equity base" }
            ].map((f) => (
              <div key={f.label} className="bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 p-3 rounded-xl flex flex-col justify-between shadow-xs">
                <div>
                  <span className="text-[10px] text-slate-450 dark:text-slate-520 block font-mono font-black uppercase tracking-wider leading-tight">{f.label}</span>
                  <p className="text-xs md:text-sm font-extrabold text-slate-800 dark:text-white mt-1 font-mono">{f.value}</p>
                </div>
                <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-2 font-sans leading-relaxed">{f.note}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-2 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-150 dark:border-slate-850">
            <Briefcase className="h-4.5 w-4.5 text-indigo-500 shrink-0" />
            <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 leading-tight">
              <span className="font-bold text-slate-700 dark:text-slate-205">Simulated Industry Target Segment:</span> {returnMetrics.industry}
            </div>
          </div>
        </div>

        {/* 3. Technical Scorecard Panel */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs transition-colors">
          <h2 className="font-bold text-base text-slate-900 dark:text-white border-b border-slate-150 dark:border-slate-800 pb-3 mb-4 flex items-center gap-2">
            <LineChart className="h-4.5 w-4.5 text-indigo-650 dark:text-indigo-400" />
            <span>Technical Frameworks</span>
          </h2>

          <div className="space-y-4">
            {/* Trend Badge */}
            <div className="bg-slate-50 dark:bg-slate-950 p-3 border border-slate-150 dark:border-slate-850 rounded-xl flex justify-between items-center select-none">
              <span className="text-xs text-slate-600 dark:text-slate-400 font-bold font-sans">Calculated Market Trend:</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded font-mono ${getTrendBadgeColor(stock.technicals.trendStrength)}`}>
                {stock.technicals.trendStrength}
              </span>
            </div>

            {/* Price lines */}
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between p-2 border-b border-slate-100 dark:border-slate-850">
                <span className="text-slate-500 dark:text-slate-400">RSI Oscillator (14)</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{stock.technicals.rsi}</span>
              </div>
              <div className="flex justify-between p-2 border-b border-slate-100 dark:border-slate-850">
                <span className="text-slate-500 dark:text-slate-400">MACD Hist. Peak</span>
                <span className={`font-bold ${stock.technicals.macd.histogram >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                  {stock.technicals.macd.histogram >= 0 ? "+" : ""}{stock.technicals.macd.histogram.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between p-2 border-b border-slate-100 dark:border-slate-850">
                <span className="text-slate-500 dark:text-slate-400">50 SMA Overlap Settle</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">₹{stock.technicals.movingAverages.sma50.toFixed(1)}</span>
              </div>
              <div className="flex justify-between p-2 border-b border-slate-100 dark:border-slate-850">
                <span className="text-slate-500 dark:text-slate-400">200 EMA Support Line</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">₹{stock.technicals.movingAverages.ema200.toFixed(1)}</span>
              </div>
              <div className="flex justify-between p-2 border-b border-slate-100 dark:border-slate-850">
                <span className="text-slate-500 dark:text-slate-400">Volume Surge Breakout</span>
                <span className={`font-black ${stock.technicals.volumeBreakout ? "text-emerald-500" : "text-slate-400 dark:text-slate-500"}`}>
                  {stock.technicals.volumeBreakout ? "ACTIVE TRIGGER" : "NORMAL"}
                </span>
              </div>
              <div className="flex justify-between p-2">
                <span className="text-slate-500 dark:text-slate-400">Support / Resist Range</span>
                <span className="text-slate-700 dark:text-slate-300 font-bold">
                  ₹{stock.technicals.support.toFixed(0)} - ₹{stock.technicals.resistance.toFixed(0)}
                </span>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-3 rounded-xl text-[11px] text-slate-500 dark:text-slate-450 flex items-start gap-1.5 font-sans leading-relaxed">
              <Info className="h-4.5 w-4.5 text-indigo-500 shrink-0 mt-0.5" />
              <span>
                <strong>Momentum Guide:</strong> Relational levels depict current price patterns relative to SMA lines. High RSI (&gt;75) displays overbought indicators. Pivot supports present protective boundaries if underlying shifts descend.
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 4. Financial Statement Bar Charts */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col h-[420px] transition-colors">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-150 dark:border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Percent className="h-5 w-5 text-indigo-650 dark:text-indigo-400" />
              <h2 className="font-bold text-base text-slate-950 dark:text-white font-sans">Simulated Capital Statements Study</h2>
            </div>

            <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-1 rounded-md">
              <button
                type="button"
                onClick={() => setFinancialTab("quarterly")}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer leading-none ${
                  financialTab === "quarterly" ? "bg-white dark:bg-slate-850 text-indigo-650 dark:text-indigo-400 shadow-xs" : "text-slate-500 dark:text-slate-400"
                }`}
              >
                Quarterly
              </button>
              <button
                type="button"
                onClick={() => setFinancialTab("annual")}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer leading-none ${
                  financialTab === "annual" ? "bg-white dark:bg-slate-850 text-indigo-650 dark:text-indigo-400 shadow-xs" : "text-slate-500 dark:text-slate-400"
                }`}
              >
                Annual
              </button>
            </div>
          </div>

          <div className="flex-1 w-full min-h-[190px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={financialData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-slate-200 dark:stroke-slate-800" />
                <XAxis dataKey="period" stroke="#64748b" fontSize={10} fontFamily="JetBrains Mono" tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} fontFamily="JetBrains Mono" tickLine={false} tickFormatter={(v) => `₹{v}Cr`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(15, 23, 42, 0.95)",
                    borderColor: "#334155",
                    color: "#fff",
                    borderRadius: "12px",
                    fontSize: "11px",
                  }}
                  itemStyle={{ fontSize: "11px", fontFamily: "JetBrains Mono" }}
                  labelStyle={{ fontSize: "10px", fontWeight: "bold", color: "#94a3b8" }}
                />
                <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="revenue" name="Sales Revenue (Cr)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="netProfit" name="Net Profit (Cr)" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 border-t border-slate-100 dark:border-slate-800 pt-3 text-[10.5px] font-mono text-slate-505 dark:text-slate-400 text-center font-bold">
            <div>
              <span className="text-[9px] text-slate-400 block font-sans">Op. Profit (Latest)</span>
              <span className="font-extrabold text-slate-800 dark:text-slate-200">₹{financialData[financialData.length - 1].operatingProfit.toLocaleString()} Cr</span>
            </div>
            <div>
              <span className="text-[9px] text-slate-400 block font-sans">Borrow Debt Liability</span>
              <span className="font-extrabold text-slate-800 dark:text-slate-200">₹{financialData[financialData.length - 1].debt.toLocaleString()} Cr</span>
            </div>
            <div>
              <span className="text-[9px] text-slate-405 block font-sans">Operating Cash Flow</span>
              <span className="font-extrabold text-slate-800 dark:text-slate-200">₹{financialData[financialData.length - 1].cashFlow.toLocaleString()} Cr</span>
            </div>
          </div>
        </div>

        {/* 5. Shareholding Pattern Study */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col h-[420px] transition-colors">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-150 dark:border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-indigo-650 dark:text-indigo-400" />
              <h2 className="font-bold text-base text-slate-950 dark:text-white">Shareholding Patterns Study</h2>
            </div>

            <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-1 rounded-md">
              <button
                type="button"
                onClick={() => setHoldingTab("chart")}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer leading-none ${
                    holdingTab === "chart" ? "bg-white dark:bg-slate-850 text-indigo-650 dark:text-indigo-400 shadow-xs" : "text-slate-500 dark:text-slate-400"
                }`}
              >
                Visual Levels
              </button>
              <button
                type="button"
                onClick={() => setHoldingTab("sheet")}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer leading-none ${
                    holdingTab === "sheet" ? "bg-white dark:bg-slate-850 text-indigo-650 dark:text-indigo-400 shadow-xs" : "text-slate-500 dark:text-slate-400"
                }`}
              >
                Quarters
              </button>
            </div>
          </div>

          {holdingTab === "chart" ? (
            <div className="flex-1 flex flex-col justify-around py-3">
              {(() => {
                const latestHold = stock.shareholding[stock.shareholding.length - 1];
                return (
                  <div className="space-y-3.5 select-none font-mono text-xs">
                    <p className="text-[10px] text-slate-450 dark:text-slate-500 flex justify-between font-bold leading-none font-sans uppercase">
                      <span>Latest Statement Period:</span>
                      <strong className="text-slate-700 dark:text-slate-300">{latestHold.quarter}</strong>
                    </p>

                    {[
                      { label: "Promoter Holding", value: latestHold.promoters, color: "bg-amber-500" },
                      { label: "Foreign Institutional (FII)", value: latestHold.fii, color: "bg-cyan-500" },
                      { label: "Domestic Institutional (DII)", value: latestHold.dii, color: "bg-indigo-600" },
                      { label: "Mutual Funds Segments", value: latestHold.mutualFunds, color: "bg-purple-500" },
                      { label: "Public & Retail Segment", value: latestHold.public, color: "bg-rose-500" }
                    ].map((h) => (
                      <div key={h.label} className="space-y-1">
                        <div className="flex justify-between items-center text-slate-700 dark:text-slate-300 font-bold text-[11.5px] font-sans">
                          <span>{h.label}</span>
                          <span className="font-mono font-black">{h.value.toFixed(1)}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800 rounded-full overflow-hidden">
                          <div className={`h-full ${h.color} rounded-full`} style={{ width: `${h.value}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-500 dark:text-slate-400 font-mono border-collapse min-w-[340px]">
                <thead>
                  <tr className="border-b border-slate-201 dark:border-slate-800 text-slate-400">
                    <th className="py-2.5 font-bold text-slate-450">Class / Quarters</th>
                    {stock.shareholding.map((sh) => (
                      <th key={sh.quarter} className="py-2.5 text-right font-black text-slate-500">
                        {sh.quarter}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                  <tr>
                    <td className="py-2.5 font-bold text-slate-805 dark:text-slate-200 font-sans">Promoters Holding</td>
                    {stock.shareholding.map((sh) => (
                      <td key={sh.quarter} className="py-2.5 text-right text-amber-600 font-black">
                        {sh.promoters.toFixed(1)}%
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 font-bold text-slate-805 dark:text-slate-200 font-sans">FII Holding</td>
                    {stock.shareholding.map((sh) => (
                      <td key={sh.quarter} className="py-2.5 text-right text-cyan-600 font-black">
                        {sh.fii.toFixed(1)}%
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 font-bold text-slate-805 dark:text-slate-200 font-sans">DII Holding</td>
                    {stock.shareholding.map((sh) => (
                      <td key={sh.quarter} className="py-2.5 text-right text-indigo-600 dark:text-indigo-400 font-black">
                        {sh.dii.toFixed(1)}%
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 font-bold text-slate-805 dark:text-slate-200 font-sans">Mutual Funds</td>
                    {stock.shareholding.map((sh) => (
                      <td key={sh.quarter} className="py-2.5 text-right text-purple-600 font-black">
                        {sh.mutualFunds.toFixed(1)}%
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 font-bold text-slate-805 dark:text-slate-200 font-sans">Public/Retail</td>
                    {stock.shareholding.map((sh) => (
                      <td key={sh.quarter} className="py-2.5 text-right text-pink-600 font-black">
                        {sh.public.toFixed(1)}%
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          <p className="mt-3 text-[10px] text-slate-400 dark:text-slate-500 italic leading-relaxed">
            * Note: Equity allocation patterns display underlying stability checks of major commercial partners. Strong public patterns often represent volatile trading bands.
          </p>
        </div>
      </div>
    </div>
  );
}
