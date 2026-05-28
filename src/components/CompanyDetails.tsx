/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
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
  LineChart,
  Grid,
  Percent,
  Layers,
  TrendingDown,
  Info
} from "lucide-react";

interface CompanyDetailsProps {
  stock: StockData;
}

export default function CompanyDetails({ stock }: CompanyDetailsProps) {
  const [financialTab, setFinancialTab] = useState<"quarterly" | "annual">("quarterly");
  const [holdingTab, setHoldingTab] = useState<"chart" | "sheet">("chart");

  const financialData = financialTab === "quarterly" ? stock.quarterlyResults : stock.annualResults;

  // Technical Rating color indicators
  const getTrendBadgeColor = (trend: "Bullish" | "Bearish" | "Neutral" | "High Momentum") => {
    switch (trend) {
      case "Bullish":
        return "bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold shadow-sm";
      case "Bearish":
        return "bg-rose-50 text-rose-700 border border-rose-200 font-bold shadow-sm";
      case "High Momentum":
        return "bg-blue-50 text-blue-700 border border-blue-200 font-bold shadow-sm";
      default:
        return "bg-slate-100 border border-slate-200 text-slate-600";
    }
  };

  const isPriceUp = stock.change >= 0;

  return (
    <div className="space-y-6">
      {/* 1. Header Overview & Live Price Panel */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1 px-2 bg-slate-100 border border-slate-200 rounded font-mono font-bold text-xs text-blue-600">
                {stock.exchange} • {stock.symbol}
              </span>
              <span className="text-xs bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-slate-600 font-semibold font-sans">
                {stock.sector} Segment
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-display font-black text-slate-900 flex items-center gap-1.5 leading-snug">
              <Building className="h-5 w-5 text-slate-500" /> {stock.name}
            </h1>
            <p className="text-xs text-slate-500 leading-relaxed max-w-4xl font-sans mt-1">
              {stock.about}
            </p>
          </div>

          {/* Real-time Ticker Box */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl min-w-[220px] self-stretch md:self-auto flex flex-col justify-center text-right font-mono">
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
              ⚡ LIVE INTEGRATED PRICE
            </span>
            <div className="flex items-baseline justify-end gap-1.5">
              <span className="text-2xl font-extrabold text-slate-900">₹{stock.price.toFixed(2)}</span>
            </div>
            <p className={`text-xs font-bold flex items-center justify-end gap-0.5 ${isPriceUp ? "text-emerald-600" : "text-rose-600"}`}>
              {isPriceUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {isPriceUp ? "+" : ""}
              {stock.change.toFixed(2)} ({isPriceUp ? "+" : ""}
              {stock.changePercent.toFixed(2)}%)
            </p>
            <div className="grid grid-cols-2 gap-x-2 border-t border-slate-200 mt-2.5 pt-2 text-[10px] text-slate-450 text-left">
              <div>
                <span>Day High:</span>
                <span className="text-slate-800 block font-bold">₹{stock.dayHigh.toFixed(1)}</span>
              </div>
              <div className="text-right">
                <span>Day Low:</span>
                <span className="text-slate-800 block font-bold">₹{stock.dayLow.toFixed(1)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 52 Week boundaries */}
        <div className="mt-4 pt-3 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono text-slate-500 font-medium">
          <div>
            <span className="uppercase text-[9px] text-slate-400 tracking-wider block">52 Week High</span>
            <span className="text-slate-800 font-black">₹{stock.yearHigh.toFixed(2)}</span>
          </div>
          <div>
            <span className="uppercase text-[9px] text-slate-400 tracking-wider block">52 Week Low</span>
            <span className="text-slate-800 font-black">₹{stock.yearLow.toFixed(2)}</span>
          </div>
          <div>
            <span className="uppercase text-[9px] text-slate-400 tracking-wider block">Volume (Ticks)</span>
            <span className="text-slate-800 font-black">{stock.volume.toLocaleString()}</span>
          </div>
          <div>
            <span className="uppercase text-[9px] text-slate-400 tracking-wider block">Prev. Settle Close</span>
            <span className="text-slate-600 font-black">₹{stock.prevClose.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 2. Company Fundamentals */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm lg:col-span-2">
          <h2 className="font-display font-bold text-base text-slate-900 border-b border-slate-200 pb-3 mb-4 flex items-center gap-2">
            <Grid className="h-4 w-4 text-blue-600" />
            <span>Fundamentals Indicators</span>
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: "Market Cap (Cr.)", value: `₹${stock.fundamentals.marketCap.toLocaleString()}`, note: "Total market value of equity" },
              { label: "Stock P/E Ratio", value: stock.fundamentals.peRatio.toFixed(1), note: "Price divided by earnings per share" },
              { label: "Book Value", value: `₹${stock.fundamentals.bookValue.toFixed(1)}`, note: "Net historical asset value per share" },
              { label: "Price-to-Book (P/B)", value: stock.fundamentals.pbRatio.toFixed(2), note: "Ratio of stock price to book value" },
              { label: "Earnings Per Share (EPS)", value: `₹${stock.fundamentals.eps.toFixed(1)}`, note: "Net annualized profit per share" },
              { label: "Return on Equity (ROE)", value: `${stock.fundamentals.roe.toFixed(1)}%`, note: "Profit returned on shareholders equity" },
              { label: "ROCE", value: `${stock.fundamentals.roce.toFixed(1)}%`, note: "Pre-tax return on capital utilized" },
              { label: "Dividend Yield", value: `${stock.fundamentals.dividendYield.toFixed(2)}%`, note: "Dividend paid annually relative to price" },
              { label: "Debt-to-Equity Ratio", value: stock.fundamentals.debtToEquity.toFixed(2), note: "Total debt liability over equity base" }
            ].map((f) => (
              <div key={f.label} className="bg-slate-50 border border-slate-200 p-3 rounded-lg flex flex-col justify-between shadow-sm">
                <div>
                  <span className="text-[10px] text-slate-500 block font-mono font-bold leading-tight">{f.label}</span>
                  <p className="text-sm font-extrabold text-slate-800 mt-0.5 font-mono">{f.value}</p>
                </div>
                <span className="text-[9px] text-slate-400 mt-1.5 font-sans leading-none">{f.note}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Technical Scorecard Panel */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h2 className="font-display font-bold text-base text-slate-900 border-b border-slate-200 pb-3 mb-4 flex items-center gap-2">
            <LineChart className="h-4 w-4 text-blue-600" />
            <span>Technical Frameworks</span>
          </h2>

          <div className="space-y-4">
            {/* Compass Rating */}
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg flex justify-between items-center">
              <span className="text-xs text-slate-600 font-bold font-sans">Trend Strength Matrix:</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded font-mono ${getTrendBadgeColor(stock.technicals.trendStrength)}`}>
                {stock.technicals.trendStrength}
              </span>
            </div>

            {/* Individual signals */}
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between p-2 border-b border-slate-100">
                <span className="text-slate-500">RSI Indicator (14)</span>
                <span className="font-bold text-slate-800">{stock.technicals.rsi}</span>
              </div>
              <div className="flex justify-between p-2 border-b border-slate-100">
                <span className="text-slate-500">MACD Histogram</span>
                <span className={`font-bold ${stock.technicals.macd.histogram >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
                  {stock.technicals.macd.histogram >= 0 ? "+" : ""}{stock.technicals.macd.histogram.toFixed(1)}
                </span>
              </div>
              <div className="flex justify-between p-2 border-b border-slate-100">
                <span className="text-slate-500">50 SMA Overlap</span>
                <span className="font-bold text-slate-800">₹{stock.technicals.movingAverages.sma50.toFixed(1)}</span>
              </div>
              <div className="flex justify-between p-2 border-b border-slate-100">
                <span className="text-slate-500">200 EMA Overlap</span>
                <span className="font-bold text-slate-800">₹{stock.technicals.movingAverages.ema200.toFixed(1)}</span>
              </div>
              <div className="flex justify-between p-2 border-b border-slate-100">
                <span className="text-slate-500">Volume Breakout</span>
                <span className={`font-bold ${stock.technicals.volumeBreakout ? "text-emerald-600 font-black" : "text-slate-400"}`}>
                  {stock.technicals.volumeBreakout ? "DETECTION" : "NORMAL"}
                </span>
              </div>
              <div className="flex justify-between p-2">
                <span className="text-slate-500">Pivot S1 / R1 Limit</span>
                <span className="text-slate-700 font-medium">₹{stock.technicals.support.toFixed(0)} - ₹{stock.technicals.resistance.toFixed(0)}</span>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-2.5 rounded text-[11px] text-slate-500 flex items-start gap-1.5 font-sans leading-relaxed">
              <Info className="h-4.5 w-4.5 text-blue-500 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Educational note</strong>: Indicators act as mechanical mathematical sweeps. RSI &gt; 70 points to historical overbought bands. RSI &lt; 30 represents oversold setups. Moving averages serve as supports/resistances. They represent momentum calculations only – they are NOT buy or sell limits.
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 4. Financial Statements & Revenue/Profit Chart */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col h-[420px]">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Percent className="h-5 w-5 text-blue-600" />
              <h2 className="font-display font-bold text-lg text-slate-900">Financial Statements Study</h2>
            </div>

            <div className="flex items-center space-x-1 bg-slate-100 border border-slate-200 p-1 rounded-md">
              <button
                type="button"
                onClick={() => setFinancialTab("quarterly")}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer leading-none ${
                  financialTab === "quarterly" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Quarterly
              </button>
              <button
                type="button"
                onClick={() => setFinancialTab("annual")}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer leading-none ${
                  financialTab === "annual" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Annual
              </button>
            </div>
          </div>

          {/* Combined Recharts Bar chart (Sales vs Profits) */}
          <div className="flex-1 w-full min-h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={financialData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="period" stroke="#64748b" fontSize={10} fontFamily="JetBrains Mono" tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} fontFamily="JetBrains Mono" tickLine={false} tickFormatter={(v) => `₹${v}Cr`} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#ffffff", borderColor: "#cbd5e1" }}
                  itemStyle={{ fontSize: 11, fontFamily: "JetBrains Mono", color: "#334155" }}
                  labelStyle={{ fontSize: 10, fontWeight: "bold", fontFamily: "JetBrains Mono", color: "#0f172a" }}
                />
                <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="revenue" name="Sales Revenue (Cr)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="netProfit" name="Net Profit (Cr)" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 border-t border-slate-200 pt-3 text-[10px] font-mono text-slate-500 text-center font-semibold">
            <div>
              <span className="text-[9px] text-slate-400 block">Op. Profit (Latest)</span>
              <span className="font-extrabold text-slate-800">₹{financialData[financialData.length - 1].operatingProfit.toLocaleString()} Cr</span>
            </div>
            <div>
              <span className="text-[9px] text-slate-400 block">Total Borrow Debt</span>
              <span className="font-extrabold text-slate-800">₹{financialData[financialData.length - 1].debt.toLocaleString()} Cr</span>
            </div>
            <div>
              <span className="text-[9px] text-slate-400 block">Op. Cash Flow (Cr)</span>
              <span className="font-extrabold text-slate-800">₹{financialData[financialData.length - 1].cashFlow.toLocaleString()} Cr</span>
            </div>
          </div>
        </div>

        {/* 5. Shareholding Pattern Indicator */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col h-[420px]">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-blue-600" />
              <h2 className="font-display font-bold text-lg text-slate-900">Shareholding Patterns Study</h2>
            </div>

            <div className="flex items-center space-x-1 bg-slate-100 border border-slate-200 p-1 rounded-md">
              <button
                type="button"
                onClick={() => setHoldingTab("chart")}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer leading-none ${
                    holdingTab === "chart" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Visual Levels
              </button>
              <button
                type="button"
                onClick={() => setHoldingTab("sheet")}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer leading-none ${
                    holdingTab === "sheet" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Quarters
              </button>
            </div>
          </div>

          {holdingTab === "chart" ? (
            <div className="flex-1 flex flex-col justify-around py-2">
              {(() => {
                const latestHold = stock.shareholding[stock.shareholding.length - 1];
                return (
                  <div className="space-y-3">
                    <p className="text-[10px] text-slate-400 font-mono flex justify-between font-bold">
                      <span>Holding Level Quarter Period:</span>
                      <strong className="text-slate-700">{latestHold.quarter}</strong>
                    </p>

                    {[
                      { label: "Promoter Holding", value: latestHold.promoters, color: "bg-amber-500" },
                      { label: "Foreign Institutional (FII)", value: latestHold.fii, color: "bg-cyan-500" },
                      { label: "Domestic Institutional (DII)", value: latestHold.dii, color: "bg-blue-600" },
                      { label: "Mutual Funds Segments", value: latestHold.mutualFunds, color: "bg-purple-500" },
                      { label: "Public & Retail Segment", value: latestHold.public, color: "bg-pink-500" }
                    ].map((h) => (
                      <div key={h.label} className="space-y-1 text-xs">
                        <div className="flex justify-between items-center text-slate-700 font-semibold">
                          <span>{h.label}</span>
                          <span className="font-mono font-bold">{h.value.toFixed(1)}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 border border-slate-200/50 rounded-full overflow-hidden">
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
              <table className="w-full text-left text-xs text-slate-500 font-mono border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400">
                    <th className="py-2.5 font-bold">Class / Quarters</th>
                    {stock.shareholding.map((sh) => (
                      <th key={sh.quarter} className="py-2.5 text-right font-bold text-slate-500">
                        {sh.quarter}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-2.5 font-bold text-slate-800">Promoters Holding</td>
                    {stock.shareholding.map((sh) => (
                      <td key={sh.quarter} className="py-2.5 text-right text-amber-600 font-extrabold">
                        {sh.promoters.toFixed(1)}%
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 font-bold text-slate-800">FII Holding</td>
                    {stock.shareholding.map((sh) => (
                      <td key={sh.quarter} className="py-2.5 text-right text-cyan-600 font-extrabold">
                        {sh.fii.toFixed(1)}%
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 font-bold text-slate-800">DII Holding</td>
                    {stock.shareholding.map((sh) => (
                      <td key={sh.quarter} className="py-2.5 text-right text-blue-600 font-extrabold">
                        {sh.dii.toFixed(1)}%
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 font-bold text-slate-800">Mutual Funds</td>
                    {stock.shareholding.map((sh) => (
                      <td key={sh.quarter} className="py-2.5 text-right text-purple-600 font-extrabold">
                        {sh.mutualFunds.toFixed(1)}%
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 font-bold text-slate-800">Public/Retail</td>
                    {stock.shareholding.map((sh) => (
                      <td key={sh.quarter} className="py-2.5 text-right text-pink-600 font-extrabold">
                        {sh.public.toFixed(1)}%
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          <p className="mt-3 text-[10px] text-slate-400 italic leading-relaxed">
            * Note: Shareholding shifts illustrate underlying institution commitments over multiple corporate quarters. Promoter consistency usually indicates strong owner confidence.
          </p>
        </div>
      </div>
    </div>
  );
}
