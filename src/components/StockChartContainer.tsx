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
    const ratio = height / Math.abs(open - close || 0.01);
    const wickHighY = y - (high - Math.max(open, close)) * ratio;
    const wickLowY = y + height + (Math.min(open, close) - low) * ratio;
    const wickX = x + width / 2;

    return (
      <g>
        {/* Shadow Wick (High-Low Line) */}
        <line
          x1={wickX}
          y1={wickHighY}
          x2={wickX}
          y2={wickLowY}
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

  const currentPrices = generatedChartData.map(d => d.close);
  const minPrice = Math.min(...currentPrices) * 0.98;
  const maxPrice = Math.max(...currentPrices) * 1.02;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col space-y-4">
      {/* Chart Settings Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 border border-blue-100 rounded-lg text-blue-600">
            <LineChart className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display font-bold text-lg text-slate-900 flex items-center gap-2">
              <span>{stock.symbol} Price Study</span>
            </h2>
            <p className="text-xs text-slate-500 font-mono">Interactive Educational Sandbox Chart</p>
          </div>
        </div>

        {/* Timeframe Toggles */}
        <div className="flex items-center space-x-1 p-1 bg-slate-100 border border-slate-200 rounded-lg">
          {(["1D", "1W", "1M", "1Y", "5Y"] as const).map((tf) => (
            <button
              key={tf}
              type="button"
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-all font-mono cursor-pointer ${
                timeframe === tf
                  ? "bg-blue-600 text-white font-extrabold shadow-sm"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/50"
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs">
        {/* Toggle Visual Styles */}
        <div className="flex items-center gap-2 border-r border-slate-200 pr-5">
          <span className="text-slate-500 font-medium font-mono">Chart Style:</span>
          <button
            type="button"
            onClick={() => setChartType("candle")}
            className={`p-1 px-2.5 rounded font-semibold font-sans text-[11px] cursor-pointer flex items-center gap-1 leading-none ${
              chartType === "candle"
                ? "bg-blue-100 border border-blue-200 text-blue-700 font-bold"
                : "text-slate-400 hover:text-slate-700"
            }`}
          >
            <BarChart3 className="h-3 w-3" /> Candles
          </button>
          <button
            type="button"
            onClick={() => setChartType("line")}
            className={`p-1 px-2.5 rounded font-semibold font-sans text-[11px] cursor-pointer flex items-center gap-1 leading-none ${
              chartType === "line"
                ? "bg-blue-100 border border-blue-200 text-blue-700 font-bold"
                : "text-slate-400 hover:text-slate-700"
            }`}
          >
            <TrendingUp className="h-3 w-3" /> Area Line
          </button>
        </div>

        {/* Toggle Indicator Overlays */}
        <div className="flex items-center gap-3">
          <span className="text-slate-500 font-medium font-mono flex items-center gap-1">
            <Settings className="h-3 w-3 text-slate-400" /> Lesson Overlays:
          </span>
          <label className="flex items-center gap-1.5 cursor-pointer select-none text-slate-700 font-medium">
            <input
              type="checkbox"
              checked={showSMA50}
              onChange={(e) => setShowSMA50(e.target.checked)}
              className="accent-blue-600 cursor-pointer h-3.5 w-3.5 rounded border-slate-300"
            />
            <span className="font-mono text-[11px] hover:text-slate-900">SMA (Fast)</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer select-none text-slate-700 font-medium">
            <input
              type="checkbox"
              checked={showEMA200}
              onChange={(e) => setShowEMA200(e.target.checked)}
              className="accent-purple-600 cursor-pointer h-3.5 w-3.5 rounded border-slate-300"
            />
            <span className="font-mono text-[11px] hover:text-slate-900">EMA (Slow)</span>
          </label>
        </div>
      </div>

      {/* Recharts Core Element */}
      <div className="w-full h-[320px] bg-slate-50/50 rounded-xl p-2 border border-slate-200/80">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={generatedChartData}
            margin={{ top: 15, right: 10, left: -25, bottom: 5 }}
          >
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
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
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data: HistoricalPrice = payload[0].payload;
                  const isChangePositive = data.close >= data.open;
                  return (
                    <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-md space-y-1.5 min-w-[150px] text-xs font-mono text-slate-800">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{data.time}</p>
                      <div className="border-t border-slate-100 my-1 pt-1 space-y-0.5 text-slate-600">
                        <p className="flex justify-between gap-4">
                          <span>Open:</span>
                          <span className="font-bold text-slate-900">₹{data.open.toFixed(2)}</span>
                        </p>
                        <p className="flex justify-between gap-4">
                          <span>Close:</span>
                          <span className={`font-bold ${isChangePositive ? "text-emerald-600" : "text-rose-600"}`}>
                            ₹{data.close.toFixed(2)}
                          </span>
                        </p>
                        <p className="flex justify-between gap-4">
                          <span>High:</span>
                          <span className="font-bold text-slate-800">₹{data.high.toFixed(2)}</span>
                        </p>
                        <p className="flex justify-between gap-4">
                          <span>Low:</span>
                          <span className="font-bold text-slate-500 font-medium">₹{data.low.toFixed(2)}</span>
                        </p>
                        <p className="flex justify-between gap-4 text-[11px] text-slate-450 border-t border-slate-100 mt-1 pt-1">
                          <span>Volume:</span>
                          <span className="font-semibold text-slate-700">{data.volume.toLocaleString()}</span>
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
                stroke="#2563eb"
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

      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs flex items-start gap-2.5 shadow-sm">
        <span className="px-1.5 py-0.5 bg-blue-50 border border-blue-200 text-blue-600 rounded font-bold font-mono text-[10px]">LESSON</span>
        <p className="text-slate-600 leading-relaxed font-sans">
          <strong>Candlestick charts</strong> help visualize market price action during intervals. 
          Green columns denote an uptrend (Close ≥ Open), while Rose columns show a downtrend (Close &lt; Open). 
          The top and bottom thin vertical lines (wicks) mark the absolute <strong>High</strong> and <strong>Low</strong> prices hit inside that session.  
          Use the SMA/EMA toggles above to notice how moving averages smooth out volatile trend lines.
        </p>
      </div>
    </div>
  );
}
