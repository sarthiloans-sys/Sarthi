/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { HistoricalPrice, StockData } from "../types";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from "recharts";
import { Settings, TrendingUp, BarChart3, LineChart } from "lucide-react";

interface StockChartContainerProps {
  stock: StockData;
}

export default function StockChartContainer({ stock }: StockChartContainerProps) {
  const [timeframe, setTimeframe] = useState<"1D" | "1W" | "1M" | "1Y" | "5Y">("1M");
  const [chartType, setChartType] = useState<"candle" | "line">("candle");
  const [showSMA50, setShowSMA50] = useState(true);
  const [showEMA200, setShowEMA200] = useState(false);

  const priceData: HistoricalPrice[] = useMemo(() => {
    return stock.charts[timeframe] || stock.charts["1M"];
  }, [stock, timeframe]);

  // Procedurally generate technical moving averages over the selected dataset for real educational feedback
  const generatedChartData = useMemo(() => {
    const data = [...priceData];
    
    // Calculate simple moving average (SMA - period 5)
    for (let i = 0; i < data.length; i++) {
      const period = Math.min(5, i + 1);
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += data[i - j].close;
      }
      (data[i] as any).sma50 = Math.round((sum / period) * 100) / 100;
      
      // Calculate exponential moving average (EMA - smoothing)
      if (i === 0) {
        (data[i] as any).ema200 = data[i].close;
      } else {
        const k = 2 / (5 + 1); // 5-period smoothing
        const prevEma = (data[i - 1] as any).ema200 || data[i - 1].close;
        (data[i] as any).ema200 = Math.round((data[i].close * k + prevEma * (1 - k)) * 100) / 100;
      }
    }
    
    return data;
  }, [priceData]);

  // Dynamic Candlestick drawing shape in SVG
  const CandlestickBar = (props: any) => {
    const { fill, x, y, width, height, open, close, high, low } = props;
    const isUptrend = close >= open;
    const barFill = isUptrend ? "#10b981" : "#f43f5e"; // Emerald-500 vs Rose-500
    
    // Scale wicks relative to bar coordinates
    const ratio = height / Math.max(0.01, Math.abs(open - close || 0.01));
    const wickHighY = y - (high - Math.max(open, close)) * ratio;
    const wickLowY = y + height + (Math.min(open, close) - low) * ratio;
    const wickX = x + width / 2;

    return (
      <g>
        {/* Shadow Wick (High-Low Line) */}
        <line
          x1={wickX}
          y1={Math.min(wickHighY, y)}
          x2={wickX}
          y2={Math.max(wickLowY, y + height)}
          stroke={barFill}
          strokeWidth={1.5}
        />
        {/* Real Body (Open-Close Rect) */}
        <rect
          x={x}
          y={y}
          width={width}
          height={Math.max(3, height)} // Keep minimally visible even if open == close
          fill={barFill}
          stroke={barFill}
          strokeWidth={1}
          rx={1}
        />
      </g>
    );
  };

  const VolumeBar = (props: any) => {
    const { x, y, width, height, payload } = props;
    if (!payload) return null;
    const isUptrend = payload.close >= payload.open;
    const barFill = isUptrend ? "rgba(16, 185, 129, 0.2)" : "rgba(244, 63, 94, 0.2)";
    return (
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={barFill}
        rx={1}
      />
    );
  };

  const currentPrices = generatedChartData.map(d => d.close);
  const minPrice = Math.min(...currentPrices) * 0.98;
  const maxPrice = Math.max(...currentPrices) * 1.02;

  const maxVolume = useMemo(() => {
    return Math.max(...generatedChartData.map(d => d.volume || 1));
  }, [generatedChartData]);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 md:p-5 shadow-sm flex flex-col space-y-4 transition-colors">
      {/* Chart Settings Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 dark:bg-indigo-950/40 border border-blue-100 dark:border-indigo-900/40 rounded-lg text-blue-650 dark:text-indigo-400">
            <LineChart className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <h2 className="font-display font-bold text-base md:text-lg text-slate-900 dark:text-white flex items-center gap-2">
              <span>{stock.symbol} Premium Study Chart</span>
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">Real-time fluctuations • Powered by Black-Scholes Sandbox</p>
          </div>
        </div>

        {/* Timeframe Toggles */}
        <div className="flex items-center space-x-1 p-1 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg">
          {(["1D", "1W", "1M", "1Y", "5Y"] as const).map((tf) => (
            <button
              key={tf}
              type="button"
              onClick={() => setTimeframe(tf)}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all font-mono cursor-pointer ${
                timeframe === tf
                  ? "bg-indigo-650 dark:bg-indigo-550 text-white font-extrabold shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-xs">
        {/* Toggle Visual Styles */}
        <div className="flex items-center gap-2 border-r border-slate-200 dark:border-slate-800 pr-5">
          <span className="text-slate-500 dark:text-slate-400 font-medium font-mono text-[11px]">Chart Style:</span>
          <button
            type="button"
            onClick={() => setChartType("candle")}
            className={`p-1 px-2.5 rounded font-semibold font-sans text-[11px] cursor-pointer flex items-center gap-1 leading-none transition-all ${
              chartType === "candle"
                ? "bg-indigo-100 dark:bg-indigo-950 text-indigo-750 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-900/40 font-bold"
                : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            <BarChart3 className="h-3 w-3" /> Candles
          </button>
          <button
            type="button"
            onClick={() => setChartType("line")}
            className={`p-1 px-2.5 rounded font-semibold font-sans text-[11px] cursor-pointer flex items-center gap-1 leading-none transition-all ${
              chartType === "line"
                ? "bg-indigo-100 dark:bg-indigo-950 text-indigo-750 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-900/40 font-bold"
                : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            <TrendingUp className="h-3 w-3" /> Area Line
          </button>
        </div>

        {/* Toggle Indicator Overlays */}
        <div className="flex items-center gap-3">
          <span className="text-slate-500 dark:text-slate-400 font-medium font-mono text-[11px] flex items-center gap-1">
            <Settings className="h-3 w-3 text-slate-400" /> Overlays:
          </span>
          <label className="flex items-center gap-1.5 cursor-pointer select-none text-slate-700 dark:text-slate-300 font-medium">
            <input
              type="checkbox"
              checked={showSMA50}
              onChange={(e) => setShowSMA50(e.target.checked)}
              className="accent-indigo-600 cursor-pointer h-3.5 w-3.5 rounded border-slate-300"
            />
            <span className="font-mono text-[11px] hover:text-slate-900 dark:hover:text-white">SMA (Fast)</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer select-none text-slate-700 dark:text-slate-300 font-medium">
            <input
              type="checkbox"
              checked={showEMA200}
              onChange={(e) => setShowEMA200(e.target.checked)}
              className="accent-purple-600 cursor-pointer h-3.5 w-3.5 rounded border-slate-300"
            />
            <span className="font-mono text-[11px] hover:text-slate-900 dark:hover:text-white">EMA (Slow)</span>
          </label>
        </div>
      </div>

      {/* Recharts Core Element */}
      <div className="w-full h-[320px] bg-slate-50/30 dark:bg-slate-950/40 rounded-xl p-1 md:p-2 border border-slate-200/60 dark:border-slate-800">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={generatedChartData}
            margin={{ top: 15, right: 5, left: -25, bottom: 5 }}
          >
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--color-slate-200, #e2e8f0)" strokeOpacity={0.4} strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="time"
              stroke="#64748b"
              fontSize={10}
              fontFamily="JetBrains Mono"
              tickLine={false}
              dy={10}
            />
            <YAxis
              stroke="#64748b"
              fontSize={10}
              fontFamily="JetBrains Mono"
              domain={[Math.round(minPrice), Math.round(maxPrice)]}
              tickLine={false}
              tickFormatter={(v) => `₹${v}`}
              dx={-5}
            />
            <YAxis
              yAxisId="volume"
              orientation="right"
              display="none"
              domain={[0, maxVolume * 3.5]}
              tickLine={false}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data: HistoricalPrice = payload[0].payload;
                  const isChangePositive = data.close >= data.open;
                  return (
                    <div className="bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-lg p-3 shadow-md space-y-1.5 min-w-[150px] text-xs font-mono text-slate-800 dark:text-slate-100 transition-colors">
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">{data.time}</p>
                      <div className="border-t border-slate-100 dark:border-slate-800 my-1 pt-1 space-y-0.5 text-slate-600 dark:text-slate-300">
                        <p className="flex justify-between gap-4">
                          <span>Open:</span>
                          <span className="font-bold text-slate-900 dark:text-white">₹{data.open.toFixed(2)}</span>
                        </p>
                        <p className="flex justify-between gap-4">
                          <span>Close:</span>
                          <span className={`font-bold ${isChangePositive ? "text-emerald-500" : "text-rose-500"}`}>
                            ₹{data.close.toFixed(2)}
                          </span>
                        </p>
                        <p className="flex justify-between gap-4">
                          <span>High:</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200 font-medium">₹{data.high.toFixed(2)}</span>
                        </p>
                        <p className="flex justify-between gap-4">
                          <span>Low:</span>
                          <span className="font-bold text-slate-500 dark:text-slate-400 font-medium">₹{data.low.toFixed(2)}</span>
                        </p>
                        <p className="flex justify-between gap-4 text-[11px] text-slate-450 dark:text-slate-500 border-t border-slate-100 dark:border-slate-800 mt-1 pt-1">
                          <span>Volume:</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-200">{data.volume.toLocaleString()}</span>
                        </p>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            
            {/* Visual plot selector types */}
            {chartType === "line" ? (
              <Area
                type="monotone"
                dataKey="close"
                name="Close Price"
                stroke="#4f46e5"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorPrice)"
                dot={timeframe === "1W" || timeframe === "1D" ? { r: 3, strokeWidth: 1 } : false}
              />
            ) : (
              <Bar
                dataKey="close"
                name="Candlestick"
                shape={<CandlestickBar />}
              />
            )}

            {/* Volume indicator as secondary overlay (TradingView style) */}
            <Bar
              yAxisId="volume"
              dataKey="volume"
              name="Volume"
              shape={<VolumeBar />}
            />

            {/* Indicator Overlays (Fast SMA) */}
            {showSMA50 && (
              <Line
                type="monotone"
                dataKey="sma50"
                name="Fast MA (5p)"
                stroke="#d97706"
                strokeWidth={1.5}
                dot={false}
                strokeDasharray="4 2"
              />
            )}

            {/* Indicator Overlays (Slow EMA) */}
            {showEMA200 && (
              <Line
                type="monotone"
                dataKey="ema200"
                name="Slow EMA (Smoothed)"
                stroke="#8b5cf6"
                strokeWidth={1.5}
                dot={false}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs flex items-start gap-2.5 shadow-sm">
        <span className="px-1.5 py-0.5 bg-blue-50 dark:bg-indigo-950/50 border border-blue-200 dark:border-indigo-900/50 text-blue-600 dark:text-indigo-400 rounded font-bold font-mono text-[10px]">STUDY</span>
        <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
          <strong>Interactive Candlestick-Volume charting</strong> replicates standard trading terminals. 
          The floating volume block at the bottom of the canvas helps confirm trends: high volume candles often indicate key support/resistance breakers.
          Use <strong>SMA (Fast)</strong> or <strong>EMA (Slow)</strong> overlays to learn how institutional systems filter daily noise into smooth trend pathways.
        </p>
      </div>
    </div>
  );
}
