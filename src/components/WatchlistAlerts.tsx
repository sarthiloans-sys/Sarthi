/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { AlertTrigger, StockData } from "../types";
import { Star, Bell, Trash2, Plus, BellRing } from "lucide-react";

interface WatchlistAlertsProps {
  watchlist: string[];
  onToggleWatchlist: (symbol: string) => void;
  alerts: AlertTrigger[];
  onAddAlert: (symbol: string, type: "ABOVE" | "BELOW", targetPrice: number) => void;
  onRemoveAlert: (id: string) => void;
  stocks: StockData[];
  onSelectStock: (symbol: string) => void;
  currentStockSymbol: string;
}

export default function WatchlistAlerts({
  watchlist,
  onToggleWatchlist,
  alerts,
  onAddAlert,
  onRemoveAlert,
  stocks,
  onSelectStock,
  currentStockSymbol
}: WatchlistAlertsProps) {
  const [alertSymbol, setAlertSymbol] = useState(currentStockSymbol);
  const [alertType, setAlertType] = useState<"ABOVE" | "BELOW">("ABOVE");
  const [alertPrice, setAlertPrice] = useState<string>("");

  const watchlistStocks = stocks.filter((s) => watchlist.includes(s.symbol));
  const activeStock = stocks.find((s) => s.symbol === alertSymbol) || stocks[0];

  const handleCreateAlert = (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(alertPrice);
    if (isNaN(priceNum) || priceNum <= 0) return;
    onAddAlert(alertSymbol, alertType, priceNum);
    setAlertPrice("");
  };

  const handleSelectToSetAlert = (symbol: string) => {
    setAlertSymbol(symbol);
    const stock = stocks.find(s => s.symbol === symbol);
    if (stock) {
      setAlertPrice(Math.round(stock.price).toString());
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. Watchlist Section */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col h-[400px]">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-500 fill-amber-400" />
            <h2 className="font-display font-bold text-lg text-slate-900">My Watchlist</h2>
          </div>
          <span className="text-xs bg-slate-100 border border-slate-200 px-2 py-1 rounded text-slate-600 font-mono font-medium">
            {watchlist.length} Active Stocks
          </span>
        </div>

        {watchlistStocks.length === 0 ? (
          <div className="flex-1 flex flex-col justify-center items-center text-center p-6 text-slate-400 space-y-4">
            <Star className="h-10 w-10 text-slate-350 animate-pulse" />
            <div>
              <p className="text-sm font-semibold text-slate-700">Your Watchlist is Empty</p>
              <p className="text-xs text-slate-500 mt-1 max-w-[280px]">
                Pin stocks from the terminal list below to track active prices and study alerts.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {watchlistStocks.map((stock) => {
              const changeIsPositive = stock.change >= 0;
              return (
                <div
                  key={stock.symbol}
                  onClick={() => onSelectStock(stock.symbol)}
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer border transition-all ${
                    currentStockSymbol === stock.symbol
                      ? "bg-blue-50 border-blue-200 shadow-sm"
                      : "bg-slate-50 border-slate-200 hover:bg-slate-100/50 hover:border-slate-300"
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 font-sans">
                      <span className="font-display font-extrabold text-sm text-slate-900 tracking-wide font-mono">
                        {stock.symbol}
                      </span>
                      <span className="text-[10px] bg-slate-200 border border-slate-300/60 px-1.5 py-0.5 rounded text-slate-600 font-semibold font-sans">
                        {stock.sector}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 font-medium truncate max-w-[150px] block">
                      {stock.name}
                    </span>
                  </div>

                  <div className="text-right mr-3 font-mono">
                    <p className="text-sm font-bold text-slate-900">₹{stock.price.toFixed(2)}</p>
                    <p
                      className={`text-xs font-semibold flex items-center justify-end ${
                        changeIsPositive ? "text-emerald-600" : "text-rose-600"
                      }`}
                    >
                      {changeIsPositive ? "+" : ""}
                      {stock.changePercent.toFixed(2)}%
                    </p>
                  </div>

                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      title="Configure Alert"
                      onClick={() => handleSelectToSetAlert(stock.symbol)}
                      className="p-1 px-1.5 bg-white border border-slate-200 rounded hover:bg-slate-100 hover:text-blue-600 transition text-slate-500 hover:border-slate-300"
                    >
                      <Bell className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      title="Unwatch"
                      onClick={() => onToggleWatchlist(stock.symbol)}
                      className="p-1 px-1.5 bg-white border border-slate-200 rounded hover:bg-rose-50 hover:text-rose-600 transition text-slate-550 hover:border-slate-300"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Price Alert Module */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col h-[400px]">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <BellRing className="h-5 w-5 text-blue-600 animate-bounce" />
            <h2 className="font-display font-bold text-lg text-slate-900">Compliance & Alerts</h2>
          </div>
          <span className="text-[10px] bg-blue-50 text-blue-600 border border-blue-200 px-2 py-0.5 rounded uppercase tracking-wider font-semibold font-sans">
            Purely Educational
          </span>
        </div>

        {/* Create Alert Controls */}
        <form onSubmit={handleCreateAlert} className="grid grid-cols-1 gap-3 bg-slate-50 border border-slate-200 p-3 rounded-lg mb-4">
          <h3 className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wide font-mono">
            <Plus className="h-3 w-3 text-blue-600" /> Create Price Alert Indicator
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-slate-500 uppercase font-mono block mb-1 font-bold">Select Asset</label>
              <select
                value={alertSymbol}
                onChange={(e) => setAlertSymbol(e.target.value)}
                className="w-full bg-white border border-slate-200 text-xs rounded p-1.5 text-slate-800 outline-none focus:border-blue-500 font-mono font-medium"
              >
                {stocks.map((s) => (
                  <option key={s.symbol} value={s.symbol}>
                    {s.symbol}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-slate-500 uppercase font-mono block mb-1 font-bold">Direction Condition</label>
              <select
                value={alertType}
                onChange={(e) => setAlertType(e.target.value as "ABOVE" | "BELOW")}
                className="w-full bg-white border border-slate-200 text-xs rounded p-1.5 text-slate-800 outline-none focus:border-blue-500 font-mono font-medium"
              >
                <option value="ABOVE">Price Goes ABOVE (↗)</option>
                <option value="BELOW">Price Goes BELOW (↘)</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono font-bold">₹</span>
              <input
                type="number"
                required
                value={alertPrice}
                onChange={(e) => setAlertPrice(e.target.value)}
                placeholder={`Target Price (Current: ₹${activeStock.price.toFixed(0)})`}
                className="w-full bg-white border border-slate-200 text-xs rounded p-1.5 pl-6 text-slate-800 outline-none focus:border-blue-500 font-mono font-semibold"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-1.5 bg-blue-600 text-white font-bold text-xs rounded-lg hover:bg-blue-500 transition duration-150 flex items-center gap-1.5 whitespace-nowrap shadow-sm focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              Add Alert
            </button>
          </div>
        </form>

        {/* Alerts Monitoring Log */}
        <div className="flex-1 overflow-y-auto space-y-2">
          {alerts.length === 0 ? (
            <div className="text-center text-slate-400 text-xs py-10">
              <p>No active price indicators monitored.</p>
              <p className="text-[10px] text-slate-500 mt-1">Alerts help learn technical pricing thresholds.</p>
            </div>
          ) : (
            alerts.map((al) => {
              const asset = stocks.find((s) => s.symbol === al.symbol);
              const currentPrice = asset ? asset.price : 0;
              return (
                <div
                  key={al.id}
                  className={`flex items-center justify-between p-2.5 rounded-lg border transition-colors ${
                    al.isTriggered
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                      : "bg-slate-50 border-slate-200 text-slate-750"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        al.isTriggered ? "bg-emerald-500 animate-ping" : "bg-amber-400 animate-pulse"
                      }`}
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold font-mono text-xs text-slate-900">{al.symbol}</span>
                        <span className="text-[9px] bg-slate-200 border border-slate-300 px-1 rounded font-mono text-slate-600 font-bold">
                          {al.type === "ABOVE" ? `≥ ₹${al.targetPrice}` : `≤ ₹${al.targetPrice}`}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-mono">
                        Current: ₹{currentPrice.toFixed(2)} • {al.isTriggered ? "Triggered Alerts Logs" : "Awaiting Value Check"}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    title="Delete Alert Trigger"
                    onClick={() => onRemoveAlert(al.id)}
                    className="p-1 px-1.5 bg-white border border-slate-200 rounded hover:bg-rose-50 hover:text-rose-600 transition text-slate-400"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
