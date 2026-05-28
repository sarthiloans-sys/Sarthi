/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState, useMemo } from "react";
import { StockData } from "../types";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
  Dot
} from "recharts";
import {
  TrendingUp,
  BookOpen,
  Sliders,
  DollarSign,
  HelpCircle,
  FileCheck,
  ChevronRight,
  Calculator,
  RefreshCw,
  Percent,
  CheckCircle,
  AlertTriangle
} from "lucide-react";

interface OptionCheckerProps {
  stock: StockData;
}

// ==========================================
// BLACK-SCHOLES PRICING MATHS & DISTRIBUTIONS
// ==========================================

function cumulativeNormal(x: number): number {
  const b1 =  0.319381530;
  const b2 = -0.356563782;
  const b3 =  1.781477937;
  const b4 = -1.821255978;
  const b5 =  1.330274429;
  const p  =  0.2316419;
  const c  =  0.39894228;
  
  if (x >= 0.0) {
    const t = 1.0 / (1.0 + p * x);
    return (1.0 - c * Math.exp(-x * x / 2.0) * t *
           (t *(t *(t *(t * b5 + b4) + b3) + b2) + b1));
  } else {
    const t = 1.0 / (1.0 - p * x);
    return (c * Math.exp(-x * x / 2.0) * t *
           (t *(t *(t *(t * b5 + b4) + b3) + b2) + b1));
  }
}

function normalDensity(x: number): number {
  return Math.exp(-x * x / 2.0) / Math.sqrt(2 * Math.PI);
}

export interface BSResult {
  callPrice: number;
  putPrice: number;
  callDelta: number;
  putDelta: number;
  gamma: number;
  vega: number;
  callTheta: number;
  putTheta: number;
}

export function calculateBlackScholes(
  s: number, // Spot price
  k: number, // Strike price
  tDays: number, // Time to expiry in days
  vPercent: number, // Volatility (percent) e.g. 24
  rPercent: number  // Interest rate (percent) e.g. 7
): BSResult {
  const t = Math.max(0.0001, tDays / 365);
  const v = Math.max(0.01, vPercent / 100);
  const r = rPercent / 100;

  const d1 = (Math.log(s / k) + (r + (v * v) / 2.0) * t) / (v * Math.sqrt(t));
  const d2 = d1 - v * Math.sqrt(t);

  const nd1 = cumulativeNormal(d1);
  const nd2 = cumulativeNormal(d2);
  const nnd1 = cumulativeNormal(-d1);
  const nnd2 = cumulativeNormal(-d2);

  const expRT = Math.exp(-r * t);

  const callPrice = s * nd1 - k * expRT * nd2;
  const putPrice = k * expRT * nnd2 - s * nnd1;

  // Greeks
  const callDelta = nd1;
  const putDelta = nd1 - 1;

  const pdfD1 = normalDensity(d1);
  const gamma = pdfD1 / (s * v * Math.sqrt(t));

  // Vega (price sensitivity to 1% change in volatility)
  const vega = (s * Math.sqrt(t) * pdfD1) / 100;

  // Theta (divided by 365 for daily option decay)
  const term1 = -(s * pdfD1 * v) / (2.0 * Math.sqrt(t));
  const term2_call = r * k * expRT * nd2;
  const callTheta = (term1 - term2_call) / 365;

  const term2_put = r * k * expRT * nnd2;
  const putTheta = (term1 + term2_put) / 365;

  return {
    callPrice: Math.max(0.5, callPrice),
    putPrice: Math.max(0.5, putPrice),
    callDelta,
    putDelta,
    gamma,
    vega,
    callTheta,
    putTheta
  };
}

// Custom mock volume/open-interest factor depending on closeness of strike to spot price
function getOptionVolume(strike: number, spot: number): { vol: number; oi: number } {
  const distanceFactor = Math.abs(strike - spot) / spot;
  if (distanceFactor > 0.15) {
    return { vol: Math.floor(100 + Math.random() * 400), oi: Math.floor(500 + Math.random() * 800) };
  } else if (distanceFactor > 0.05) {
    return { vol: Math.floor(1200 + Math.random() * 3000), oi: Math.floor(4000 + Math.random() * 6000) };
  } else {
    return { vol: Math.floor(8000 + Math.random() * 25000), oi: Math.floor(18000 + Math.random() * 32000) };
  }
}

export default function OptionChecker({ stock }: OptionCheckerProps) {
  // -------------------------------------------------------------
  // UNDERLYING CONFIG & CONTROLS STATIC OR ADJUSTABLE BY SCHOLAR
  // -------------------------------------------------------------
  const [daysToExpiry, setDaysToExpiry] = useState<number>(30);
  const [impliedVol, setImpliedVol] = useState<number>(24); // Implied Volatility
  const [interestRate, setInterestRate] = useState<number>(7.0); // 7.0% default Indian G-Sec Rate

  // Standalone Custom Sandbox Calculator Option
  const [sandboxSpot, setSandboxSpot] = useState<number>(1800);
  const [sandboxStrike, setSandboxStrike] = useState<number>(1800);
  const [sandboxVol, setSandboxVol] = useState<number>(25);
  const [sandboxRate, setSandboxRate] = useState<number>(7.0);
  const [sandboxDays, setSandboxDays] = useState<number>(30);

  // Position payoff simulator states
  const [tradeAction, setTradeAction] = useState<"BUY" | "SELL">("BUY");
  const [optionType, setOptionType] = useState<"CE" | "PE">("CE"); // CE = Call European, PE = Put European
  const [selectedStrikePrice, setSelectedStrikePrice] = useState<number>(0);
  const [customPremium, setCustomPremium] = useState<number>(0);
  const [lotSize, setLotSize] = useState<number>(250); // Typical Indian lot size (e.g. 250, 500 etc)
  const [numberOfLots, setNumberOfLots] = useState<number>(1);
  const [simulatedExpirySpot, setSimulatedExpirySpot] = useState<number>(0);

  // Set defaults when stock symbol updates
  React.useEffect(() => {
    // Generate standard strike around current spot price (rounded to nearest 50)
    const baseStrike = Math.round(stock.price / 50) * 50;
    setSelectedStrikePrice(baseStrike);
    setSimulatedExpirySpot(stock.price);

    // Initial theoretical premium
    const result = calculateBlackScholes(stock.price, baseStrike, daysToExpiry, impliedVol, interestRate);
    setCustomPremium(Math.round(result.callPrice * 10) / 10);
  }, [stock.symbol]);

  // Set selected parameters from options chain row clicks
  const selectContractFromChain = (strike: number, type: "CE" | "PE", premium: number) => {
    setSelectedStrikePrice(strike);
    setOptionType(type);
    setCustomPremium(Math.round(premium * 10) / 10);
    setSimulatedExpirySpot(stock.price);
  };

  // -------------------------------------------------------------
  // OPTIONS CHAIN GENERATOR (Strikes centered around asset price)
  // -------------------------------------------------------------
  const optionChain = useMemo(() => {
    const spot = stock.price;
    // Step size determined by stock's price range
    const step = spot > 3000 ? 100 : (spot > 800 ? 50 : 20);
    
    // Generate 7 strikes (3 below, 1 at the money, 3 above)
    const atmStrike = Math.round(spot / step) * step;
    const strikes: number[] = [];
    for (let i = -4; i <= 4; i++) {
      strikes.push(atmStrike + i * step);
    }

    return strikes.map((strike) => {
      // Calculate call and put variables utilizing our educational Black-Scholes module
      const bs = calculateBlackScholes(spot, strike, daysToExpiry, impliedVol, interestRate);
      const { vol: callVol, oi: callOi } = getOptionVolume(strike, spot);
      const { vol: putVol, oi: putOi } = getOptionVolume(strike, spot);

      return {
        strike,
        call: {
          premium: bs.callPrice,
          delta: bs.callDelta,
          volume: callVol,
          oi: callOi,
          intrinsic: Math.max(0, spot - strike),
          timeValue: Math.max(0, bs.callPrice - Math.max(0, spot - strike))
        },
        put: {
          premium: bs.putPrice,
          delta: bs.putDelta,
          volume: putVol,
          oi: putOi,
          intrinsic: Math.max(0, strike - spot),
          timeValue: Math.max(0, bs.putPrice - Math.max(0, strike - spot))
        },
        isATM: strike === atmStrike,
        isITMCall: spot > strike,
        isITMPut: spot < strike
      };
    });
  }, [stock.price, daysToExpiry, impliedVol, interestRate]);

  // Selected Option Greeks computation for position tracker
  const selectedBSCallee = useMemo(() => {
    if (!selectedStrikePrice) return null;
    return calculateBlackScholes(stock.price, selectedStrikePrice, daysToExpiry, impliedVol, interestRate);
  }, [stock.price, selectedStrikePrice, daysToExpiry, impliedVol, interestRate]);

  // -------------------------------------------------------------
  // POSITION PAYOFF CURVE GENERATION FOR RECHARTS
  // -------------------------------------------------------------
  const payoffData = useMemo(() => {
    if (!selectedStrikePrice || !customPremium) return [];
    
    const spot = stock.price;
    const rangeMin = spot * 0.75; // -25% range boundary
    const rangeMax = spot * 1.25; // +25% range boundary
    const pointsCount = 40;
    const step = (rangeMax - rangeMin) / pointsCount;

    const data = [];
    const totalMultiplier = lotSize * numberOfLots;

    for (let i = 0; i <= pointsCount; i++) {
      const expSpot = rangeMin + i * step;
      let profitLoss = 0;

      // Payoff equations at expiration:
      if (optionType === "CE") {
        const valueAtExpiry = Math.max(0, expSpot - selectedStrikePrice);
        if (tradeAction === "BUY") {
          profitLoss = (valueAtExpiry - customPremium) * totalMultiplier;
        } else {
          profitLoss = (customPremium - valueAtExpiry) * totalMultiplier;
        }
      } else {
        const valueAtExpiry = Math.max(0, selectedStrikePrice - expSpot);
        if (tradeAction === "BUY") {
          profitLoss = (valueAtExpiry - customPremium) * totalMultiplier;
        } else {
          profitLoss = (customPremium - valueAtExpiry) * totalMultiplier;
        }
      }

      data.push({
        expirySpot: Math.round(expSpot),
        profitLoss: Math.round(profitLoss),
        intrinsicVal: Math.max(0, optionType === "CE" ? expSpot - selectedStrikePrice : selectedStrikePrice - expSpot)
      });
    }
    return data;
  }, [selectedStrikePrice, customPremium, optionType, tradeAction, lotSize, numberOfLots, stock.price]);

  // Current selectedExpirySpot payoff details
  const currentPayoffResult = useMemo(() => {
    if (!selectedStrikePrice || !customPremium) return { pnl: 0, marginUsed: 0 };
    const totalMultiplier = lotSize * numberOfLots;
    const expSpot = simulatedExpirySpot;
    let profitLoss = 0;

    if (optionType === "CE") {
      const valueAtExpiry = Math.max(0, expSpot - selectedStrikePrice);
      if (tradeAction === "BUY") {
        profitLoss = (valueAtExpiry - customPremium) * totalMultiplier;
      } else {
        profitLoss = (customPremium - valueAtExpiry) * totalMultiplier;
      }
    } else {
      const valueAtExpiry = Math.max(0, selectedStrikePrice - expSpot);
      if (tradeAction === "BUY") {
        profitLoss = (valueAtExpiry - customPremium) * totalMultiplier;
      } else {
        profitLoss = (customPremium - valueAtExpiry) * totalMultiplier;
      }
    }

    // Educational margin check note (buying is capped, selling requires huge margin)
    const premiumCost = customPremium * totalMultiplier;
    const calculatedMarginRequirement = tradeAction === "SELL" ? (stock.price * totalMultiplier * 0.2) + premiumCost : premiumCost;

    return {
      pnl: profitLoss,
      marginUsed: calculatedMarginRequirement,
      isProfit: profitLoss >= 0,
      percentageReturn: tradeAction === "BUY" ? (profitLoss / premiumCost) * 100 : (profitLoss / calculatedMarginRequirement) * 100
    };
  }, [selectedStrikePrice, customPremium, optionType, tradeAction, lotSize, numberOfLots, simulatedExpirySpot, stock.price]);

  // Sandbox calculations
  const sandboxStats = useMemo(() => {
    return calculateBlackScholes(sandboxSpot, sandboxStrike, sandboxDays, sandboxVol, sandboxRate);
  }, [sandboxSpot, sandboxStrike, sandboxDays, sandboxVol, sandboxRate]);

  return (
    <div className="space-y-6">
      
      {/* 1. Header Overview Tab Title */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded font-mono font-bold lowercase">
                derivatives sandbox
              </span>
              <span className="text-[10px] bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-slate-600 font-semibold font-sans">
                Greeks calculator
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-display font-black text-slate-900 flex items-center gap-2">
              <Calculator className="h-5.5 w-5.5 text-blue-600" /> Options Chain & Option Checker
            </h1>
            <p className="text-xs text-slate-500 leading-relaxed max-w-4xl font-sans font-medium">
              Explore dynamic option contracts for <strong>{stock.name} ({stock.symbol})</strong>. Learn options pricing dynamics, premium sensitivity variables, and verify expiration payoff curves interactively.
            </p>
          </div>

          <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-[11px] text-amber-800 font-medium max-w-sm flex items-start gap-1.5 leading-relaxed">
            <AlertTriangle className="h-4.5 w-4.5 text-amber-600 flex-shrink-0 mt-0.5 leading-none" />
            <span>
              <strong>Regulatory SEBI Caution:</strong> Roughly 9 out of 10 individual retail derivatives traders incur net losses. Expiration risk of options is high. This analyzer is strictly for educational, math-checking purposes.
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Column: Volatility & Underlyings Sensitivity Sliders (1 Column) */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 lg:col-span-1">
          <h2 className="font-display font-extrabold text-sm text-slate-900 flex items-center gap-1.5 border-b border-slate-200 pb-2">
            <Sliders className="h-4 w-4 text-blue-600" />
            <span>Parametric Tuning</span>
          </h2>

          {/* Core Settings */}
          <div className="space-y-3 font-mono">
            
            {/* Days to expiry slider */}
            <div>
              <div className="flex justify-between text-xs mb-1 font-bold">
                <span className="text-slate-500">Time to Expiry:</span>
                <span className="text-blue-600">{daysToExpiry} d</span>
              </div>
              <input
                type="range"
                min={1}
                max={90}
                value={daysToExpiry}
                onChange={(e) => setDaysToExpiry(parseInt(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer h-1.5 bg-slate-100 rounded-lg appearance-none"
              />
              <span className="text-[9px] text-slate-400 font-sans block mt-1">
                Shorter periods trigger extreme time decay (Theta)
              </span>
            </div>

            {/* Implied Volatility Slider */}
            <div>
              <div className="flex justify-between text-xs mb-1 font-bold">
                <span className="text-slate-500">Implied Volatility (IV):</span>
                <span className="text-blue-600">{impliedVol}%</span>
              </div>
              <input
                type="range"
                min={5}
                max={80}
                value={impliedVol}
                onChange={(e) => setImpliedVol(parseInt(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer h-1.5 bg-slate-100 rounded-lg appearance-none"
              />
              <span className="text-[9px] text-slate-400 font-sans block mt-1">
                Higher IV boosts option pricing premiums theoretically
              </span>
            </div>

            {/* Risk Free Interest Rate */}
            <div>
              <div className="flex justify-between text-xs mb-1 font-bold">
                <span className="text-slate-500">Risk-Free Rate:</span>
                <span className="text-blue-600">{interestRate}%</span>
              </div>
              <input
                type="range"
                step={0.5}
                min={2.0}
                max={15.0}
                value={interestRate}
                onChange={(e) => setInterestRate(parseFloat(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer h-1.5 bg-slate-100 rounded-lg appearance-none"
              />
              <span className="text-[9px] text-slate-400 font-sans block mt-1">
                Typical G-Sec rate (usually 6.5% - 7.5% in India)
              </span>
            </div>
            
            <div className="border-t border-slate-150 pt-3">
              <span className="text-[10px] text-slate-500 font-sans block font-bold uppercase mb-1">
                Spot Spot Price:
              </span>
              <p className="font-extrabold text-slate-900 text-lg">₹{stock.price.toFixed(2)}</p>
              <span className="text-[10px] text-slate-400 font-sans block leading-relaxed mt-0.5">
                The simulated stock price feeds into the model. Real-time shifts fluctuate option pricing instantly.
              </span>
            </div>
          </div>
        </div>

        {/* Right Columns: Interactive Options Chain Sheet (3 Columns) */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm lg:col-span-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <span className="font-display font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                <BookOpen className="h-4 w-4 text-blue-600" />
                <span>Simulated Options Chain Details</span>
              </span>
              <span className="text-xs bg-slate-150 border border-slate-250 font-mono px-2 py-0.5 rounded text-slate-600 font-semibold">
                Expiry: {daysToExpiry} Days
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-slate-100/80 text-slate-550 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider">
                    <th className="p-2 py-2.5 text-center font-extrabold text-blue-800" colSpan={4}>CALLS (CE)</th>
                    <th className="p-2 py-2.5 text-center bg-slate-200 text-slate-800 border-x border-slate-300 font-black">STRIKE</th>
                    <th className="p-2 py-2.5 text-center font-extrabold text-rose-800" colSpan={4}>PUTS (PE)</th>
                  </tr>
                  <tr className="border-b border-slate-150 text-[9px] text-slate-450 text-center font-bold">
                    <th className="p-1.5 py-2">Delta</th>
                    <th className="p-1.5 py-2">OI (contracts)</th>
                    <th className="p-1.5 py-2">Volume</th>
                    <th className="p-1.5 py-2 bg-blue-50/50 text-blue-700 font-extrabold">Call Premium</th>
                    <th className="p-1.5 py-2 bg-slate-150/80 border-x border-slate-350 select-none">Strike Price</th>
                    <th className="p-1.5 py-2 bg-rose-50/50 text-rose-700 font-extrabold">Put Premium</th>
                    <th className="p-1.5 py-2">Volume</th>
                    <th className="p-1.5 py-2">OI (contracts)</th>
                    <th className="p-1.5 py-2">Delta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-center text-[11px] font-medium">
                  {optionChain.map((row) => {
                    const isSelectedCall = selectedStrikePrice === row.strike && optionType === "CE";
                    const isSelectedPut = selectedStrikePrice === row.strike && optionType === "PE";

                    return (
                      <tr 
                        key={row.strike} 
                        className={`hover:bg-slate-50/40 transition duration-150 ${
                          row.isATM ? "bg-amber-50/20 font-semibold" : ""
                        }`}
                      >
                        {/* Call Delta */}
                        <td className="p-2 text-slate-450">{row.call.delta.toFixed(2)}</td>
                        {/* Call OI */}
                        <td className="p-2 text-slate-400">{row.call.oi.toLocaleString()}</td>
                        {/* Call Volume */}
                        <td className="p-2 text-slate-400">{row.call.volume.toLocaleString()}</td>
                        
                        {/* Call Premium button */}
                        <td 
                          onClick={() => selectContractFromChain(row.strike, "CE", row.call.premium)}
                          className={`p-2 cursor-pointer font-bold transition hover:bg-blue-100 ${
                            row.isITMCall ? "bg-amber-50/30 text-blue-600" : "text-blue-500/80"
                          } ${isSelectedCall ? "bg-blue-600 text-white font-extrabold hover:bg-blue-600 rounded-sm" : ""}`}
                        >
                          ₹{row.call.premium.toFixed(1)}
                        </td>

                        {/* Middle Strike Price display */}
                        <td className={`p-2 bg-slate-100/60 font-black border-x border-slate-200/80 text-slate-900 text-xs ${row.isATM ? "text-amber-700 bg-amber-50/70 border-x-amber-200" : ""}`}>
                          ₹{row.strike}
                          {row.isATM && <span className="block text-[8px] tracking-normal font-sans uppercase font-bold text-amber-600">ATM</span>}
                        </td>

                        {/* Put Premium button */}
                        <td 
                          onClick={() => selectContractFromChain(row.strike, "PE", row.put.premium)}
                          className={`p-2 cursor-pointer font-bold transition hover:bg-rose-100 ${
                            row.isITMPut ? "bg-amber-50/30 text-rose-600" : "text-rose-500/80"
                          } ${isSelectedPut ? "bg-rose-600 text-white font-extrabold hover:bg-rose-600 rounded-sm" : ""}`}
                        >
                          ₹{row.put.premium.toFixed(1)}
                        </td>

                        {/* Put Volume */}
                        <td className="p-2 text-slate-400">{row.put.volume.toLocaleString()}</td>
                        {/* Put OI */}
                        <td className="p-2 text-slate-400">{row.put.oi.toLocaleString()}</td>
                        {/* Put Delta */}
                        <td className="p-2 text-slate-450">{row.put.delta.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="mt-4 pt-3.5 border-t border-slate-100 text-[10.5px] text-slate-500 leading-relaxed font-sans max-w-2xl flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse mt-0.5 flex-shrink-0" />
            <span>
              <strong>Tip:</strong> Call or Put buttons highlight with yellow background for <strong>In-The-Money (ITM)</strong> state contracts. Click any individual numeric Call or Put premium cell in the table above to configure and load that contract into the risk/payoff analyzer tool below.
            </span>
          </div>
        </div>
      </div>

      {/* 2. Interactive Payoff Risk Checker Area */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Payoff form fields tuner */}
        <div className="lg:col-span-4 space-y-4">
          <div className="border-b border-slate-150 pb-2">
            <h2 className="font-display font-black text-sm text-slate-900 flex items-center gap-1.5">
              <Sliders className="h-4 w-4 text-blue-600" /> Option Position Simulator Setup
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5 font-sans font-medium">Build buy or write setups and recalculate the profit limits</p>
          </div>

          <div className="space-y-3.5 text-xs font-mono">
            {/* Action selector */}
            <div>
              <label className="text-[10px] text-slate-400 block mb-1 uppercase font-bold">Simulated Transaction</label>
              <div className="grid grid-cols-2 gap-2 bg-slate-100 border border-slate-250 p-1.5 rounded-lg font-bold">
                <button
                  type="button"
                  onClick={() => setTradeAction("BUY")}
                  className={`py-1.5 px-3 rounded-md transition duration-150 font-sans cursor-pointer ${
                    tradeAction === "BUY" ? "bg-blue-600 text-white shadow-sm" : "text-slate-500"
                  }`}
                >
                  Buy Option (Long)
                </button>
                <button
                  type="button"
                  onClick={() => setTradeAction("SELL")}
                  className={`py-1.5 px-3 rounded-md transition duration-150 font-sans cursor-pointer ${
                    tradeAction === "SELL" ? "bg-rose-600 text-white shadow-sm" : "text-slate-500"
                  }`}
                >
                  Sell Option (Short/Write)
                </button>
              </div>
            </div>

            {/* Option type / Strike check */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1 uppercase font-bold">Contract Type</label>
                <select
                  value={optionType}
                  onChange={(e) => setOptionType(e.target.value as "CE" | "PE")}
                  className="w-full bg-slate-50 border border-slate-200 rounded-md p-2 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500"
                >
                  <option value="CE">Call Option (CE)</option>
                  <option value="PE">Put Option (PE)</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1 uppercase font-bold">Strike Selection</label>
                <input
                  type="number"
                  value={selectedStrikePrice}
                  onChange={(e) => setSelectedStrikePrice(Math.round(parseFloat(e.target.value) || 0))}
                  placeholder="Strike level"
                  className="w-full bg-slate-50 border border-slate-200 rounded-md p-2 text-xs text-slate-800 outline-none focus:border-blue-500 font-bold"
                />
              </div>
            </div>

            {/* Premium cost / Lot customisation */}
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-1">
                <label className="text-[10px] text-slate-400 block mb-1 uppercase font-bold">Lot Size</label>
                <input
                  type="number"
                  value={lotSize}
                  onChange={(e) => setLotSize(parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-md p-2 text-xs text-slate-800 outline-none focus:border-blue-500 font-bold"
                />
              </div>
              <div className="col-span-1">
                <label className="text-[10px] text-slate-400 block mb-1 uppercase font-bold">Lots Count</label>
                <input
                  type="number"
                  value={numberOfLots}
                  onChange={(e) => setNumberOfLots(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-md p-2 text-xs text-slate-800 outline-none focus:border-blue-500 font-bold"
                />
              </div>
              <div className="col-span-1">
                <label className="text-[10px] text-slate-400 block mb-1 uppercase font-bold">Premium (₹)</label>
                <input
                  type="number"
                  step="0.5"
                  value={customPremium}
                  onChange={(e) => setCustomPremium(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-md p-2 text-xs text-slate-800 outline-none focus:border-blue-500 font-bold"
                />
              </div>
            </div>

            <div className="bg-slate-100 p-3.5 border border-slate-200 rounded-xl space-y-1.5">
              <span className="text-[10px] text-slate-500 font-sans block font-bold leading-tight">POSITION EXPOSURE CALCULATION</span>
              <div className="flex justify-between items-center text-xs mt-1">
                <span className="text-slate-500">Total Contract Qty:</span>
                <span className="text-slate-800 font-extrabold font-mono">{(lotSize * numberOfLots).toLocaleString()} shares</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Total Premium Cost:</span>
                <span className="text-slate-900 font-black font-mono">₹{(customPremium * lotSize * numberOfLots).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Capital At Rick / Margin:</span>
                <span className="text-blue-700 font-black font-mono">₹{currentPayoffResult.marginUsed.toFixed(0)}</span>
              </div>
            </div>

            {/* Dynamic Interactive Slider for simulating target pricing on expiration date */}
            <div className="pt-2 border-t border-slate-150">
              <div className="flex justify-between text-xs mb-1 font-bold font-sans">
                <span className="text-slate-600 flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5 text-blue-500" /> Expiry Sport Price Target:</span>
                <span className="text-blue-700 font-mono font-black">₹{simulatedExpirySpot.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min={Math.round(stock.price * 0.75)}
                max={Math.round(stock.price * 1.25)}
                value={simulatedExpirySpot}
                onChange={(e) => setSimulatedExpirySpot(parseInt(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-100 rounded-lg appearance-none mt-1"
              />
              <div className="flex justify-between text-[9px] text-slate-400 mt-1">
                <span>-25% (₹{(stock.price * 0.75).toFixed(0)})</span>
                <span>Current Spot (₹{stock.price.toFixed(0)})</span>
                <span>+25% (₹{(stock.price * 1.25).toFixed(0)})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payoff Visual Line chart (8 Columns) */}
        <div className="lg:col-span-8 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-150 pb-2.5">
              <div>
                <h3 className="font-display font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-emerald-600" /> Payoff Expiry Curve Check
                </h3>
                <p className="text-[11px] text-slate-400 font-sans font-medium">Visualization of theoretical options profit limits on the final contract expiration date</p>
              </div>

              {/* Dynamic P&L Badge */}
              <div className={`p-2 px-3.5 border rounded-lg flex flex-col justify-center items-end text-right font-mono min-w-[170px] ${
                currentPayoffResult.isProfit 
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
                  : "bg-rose-50 text-rose-800 border-rose-250"
              }`}>
                <span className="text-[9px] text-slate-500 leading-none block font-sans font-bold uppercase mb-1">POSITIONS EXPIRED PNL</span>
                <strong className="text-sm font-black tracking-wide leading-none block">
                  {currentPayoffResult.isProfit ? "+" : ""}₹{currentPayoffResult.pnl.toLocaleString()}
                </strong>
                <span className="text-[9px] font-bold block mt-1 leading-none uppercase">
                  ({currentPayoffResult.isProfit ? "+" : ""}{currentPayoffResult.percentageReturn.toFixed(1)}% Return)
                </span>
              </div>
            </div>

            {/* Recharts Option Payne diagram */}
            <div className="w-full h-[220px] text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={payoffData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                  <XAxis 
                    dataKey="expirySpot" 
                    stroke="#64748b" 
                    fontSize={10} 
                    fontFamily="JetBrains Mono" 
                    tickLine={false} 
                    label={{ value: "Asset Settlement Price (₹)", position: "insideBottom", offset: -2, fontSize: 10, fill: "#64748b", fontFamily: "sans-serif", fontWeight: "bold" }}
                  />
                  <YAxis 
                    stroke="#64748b" 
                    fontSize={10} 
                    fontFamily="JetBrains Mono" 
                    tickLine={false} 
                    tickFormatter={(v) => `₹${v}`}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#ffffff", borderColor: "#cbd5e1" }}
                    itemStyle={{ fontSize: 11, fontFamily: "JetBrains Mono" }}
                    labelStyle={{ fontSize: 10, fontWeight: "bold", fontFamily: "JetBrains Mono" }}
                  />
                  <ReferenceLine y={0} stroke="#475569" strokeWidth={1} strokeDasharray="3 3" />
                  <ReferenceLine x={Math.round(selectedStrikePrice)} stroke="#3b82f6" strokeWidth={1} strokeDasharray="2 2" label={{ value: `Strike: ₹${selectedStrikePrice}`, position: "top", fill: "#3b82f6", fontSize: 9, fontFamily: "JetBrains Mono", fontWeight: "bold" }} />
                  <ReferenceLine x={Math.round(simulatedExpirySpot)} stroke="#10b981" strokeWidth={1.5} label={{ value: `Slider Spot: ₹${simulatedExpirySpot}`, position: "bottom", fill: "#10b981", fontSize: 9, fontFamily: "JetBrains Mono", fontWeight: "bold" }} />
                  
                  <Line 
                    type="monotone" 
                    dataKey="profitLoss" 
                    name="P&L Expiry (₹)" 
                    stroke={optionType === "CE" ? "#3b82f6" : "#f43f5e"} 
                    strokeWidth={2.5} 
                    dot={false}
                    activeDot={{ r: 6 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Theoretical position stats & options breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3.5 border-t border-slate-150 text-[11px] font-mono text-slate-550 leading-relaxed font-semibold">
            <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg">
              <span className="text-[10px] text-slate-450 block font-bold leading-tight font-sans">Underlying Spot Price</span>
              <span className="text-slate-800 font-black block">₹{stock.price.toFixed(2)}</span>
            </div>
            
            <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg">
              <span className="text-[10px] text-slate-450 block font-bold leading-tight font-sans">Breakeven level</span>
              <span className="text-slate-800 font-black block">
                ₹{optionType === "CE" 
                  ? (selectedStrikePrice + customPremium).toFixed(0) 
                  : (selectedStrikePrice - customPremium).toFixed(0)}
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg">
              <span className="text-[10px] text-slate-450 block font-bold leading-tight font-sans">Maximum Profit</span>
              <span className={`font-black block ${tradeAction === "BUY" && optionType === "CE" ? "text-blue-600 font-extrabold" : "text-emerald-700"}`}>
                {tradeAction === "BUY" 
                  ? (optionType === "CE" ? "UNLIMITED ↗" : `₹${(selectedStrikePrice - customPremium) * lotSize * numberOfLots}`)
                  : `₹${(customPremium * lotSize * numberOfLots).toLocaleString()}`}
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg">
              <span className="text-[10px] text-slate-450 block font-bold leading-tight font-sans">Maximum Loss Risk</span>
              <span className="color-rose-700 text-rose-600 font-black block">
                {tradeAction === "BUY" 
                  ? `₹${(customPremium * lotSize * numberOfLots).toLocaleString()}` 
                  : "UNLIMITED ⚠️"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Dynamic Theoretical Greeks Deconstruction Table & Math Reference */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Detail definitions of Greeks (2 columns) */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm lg:col-span-2 space-y-4">
          <h2 className="font-display font-extrabold text-sm text-slate-900 flex items-center gap-1.5 border-b border-slate-200 pb-2">
            <BookOpen className="h-4 w-4 text-blue-600" />
            <span>Options Greeks Study Dashboard</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
            {/* Delta */}
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg flex items-start gap-2.5 shadow-sm">
              <span className="p-1.5 bg-blue-50 text-blue-600 border border-blue-200 font-mono font-extrabold rounded text-[11px] leading-none shrink-0">Δ DELTA</span>
              <div>
                <div className="flex justify-between items-center font-mono font-bold text-slate-800 mb-0.5">
                  <span>Delta Sensitivity Level</span>
                  <span>{selectedBSCallee ? (optionType === "CE" ? selectedBSCallee.callDelta.toFixed(3) : selectedBSCallee.putDelta.toFixed(3)) : "0.00"}</span>
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed font-sans mt-1">
                  Traces the premium change per ₹1 shift of spot. A call has delta of 0 to 1, while puts range from -1 to 0. Serve as options directional probabilities.
                </p>
              </div>
            </div>

            {/* Gamma */}
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg flex items-start gap-2.5 shadow-sm">
              <span className="p-1.5 bg-indigo-50 text-indigo-600 border border-indigo-200 font-mono font-extrabold rounded text-[11px] leading-none shrink-0">Γ GAMMA</span>
              <div>
                <div className="flex justify-between items-center font-mono font-bold text-slate-800 mb-0.5">
                  <span>Delta Rate of Change</span>
                  <span>{selectedBSCallee ? selectedBSCallee.gamma.toFixed(5) : "0.00"}</span>
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed font-sans mt-1">
                  Tracks Delta's acceleration rate per ₹1 shift in the stock price. Peak levels centered around At-the-Money strikes! Gamma induces high-volatility leverage.
                </p>
              </div>
            </div>

            {/* Theta */}
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg flex items-start gap-2.5 shadow-sm">
              <span className="p-1.5 bg-teal-50 text-teal-600 border border-teal-200 font-mono font-extrabold rounded text-[11px] leading-none shrink-0">Θ THETA</span>
              <div>
                <div className="flex justify-between items-center font-mono font-bold text-slate-800 mb-0.5">
                  <span>Daily Time-Decay Decay</span>
                  <span>₹{selectedBSCallee ? (optionType === "CE" ? selectedBSCallee.callTheta.toFixed(2) : selectedBSCallee.putTheta.toFixed(2)) : "0.00"} / day</span>
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed font-sans mt-1">
                  Theoretical contract price decay per day, all parameters held equal. Capped at 100% loss upon contract expiry, making option buyers naturally long against time.
                </p>
              </div>
            </div>

            {/* Vega */}
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg flex items-start gap-2.5 shadow-sm">
              <span className="p-1.5 bg-purple-50 text-purple-600 border border-purple-200 font-mono font-extrabold rounded text-[11px] leading-none shrink-0">ν VEGA</span>
              <div>
                <div className="flex justify-between items-center font-mono font-bold text-slate-800 mb-0.5">
                  <span>Volatility Sensitivity</span>
                  <span>₹{selectedBSCallee ? selectedBSCallee.vega.toFixed(2) : "0.00"} per 1% IV</span>
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed font-sans mt-1">
                  Premium shift size per 1% rise or fall in Implied Volatility (IV). Essential for identifying when high implied options are overpriced and prone to collapse.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Callout Sandbox Model theoretical calculator (1 column) */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div className="space-y-3 font-mono text-[11px]">
            <h2 className="font-display font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-2 font-sans">
              <Calculator className="h-4 w-4 text-indigo-600 animate-spin" />
              <span>Free-Model BS Calculator</span>
            </h2>

            <div className="grid grid-cols-2 gap-2 mt-2">
              <div>
                <label className="text-[9px] text-slate-400 block mb-0.5 font-sans font-extrabold">SPOT ($ / ₹)</label>
                <input
                  type="number"
                  value={sandboxSpot}
                  onChange={(e) => setSandboxSpot(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded p-1 font-bold text-xs"
                />
              </div>
              <div>
                <label className="text-[9px] text-slate-400 block mb-0.5 font-sans font-extrabold">STRIKE (K)</label>
                <input
                  type="number"
                  value={sandboxStrike}
                  onChange={(e) => setSandboxStrike(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded p-1 font-bold text-xs"
                />
              </div>
              <div>
                <label className="text-[9px] text-slate-400 block mb-0.5 font-sans font-extrabold">VOLATILITY (%)</label>
                <input
                  type="number"
                  value={sandboxVol}
                  onChange={(e) => setSandboxVol(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded p-1 font-bold text-xs"
                />
              </div>
              <div>
                <label className="text-[9px] text-slate-400 block mb-0.5 font-sans font-extrabold">DAYS (T)</label>
                <input
                  type="number"
                  value={sandboxDays}
                  onChange={(e) => setSandboxDays(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded p-1 font-bold text-xs"
                />
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-2 rounded-lg grid grid-cols-2 gap-1 px-3 mt-3">
              <div className="border-r border-slate-200/80 pr-2">
                <span className="text-[9px] text-blue-600 font-serif font-black uppercase tracking-wide">Call Price</span>
                <p className="text-xs font-bold text-slate-800">₹{sandboxStats.callPrice.toFixed(2)}</p>
                <span className="text-[8px] text-slate-450 block font-sans">Delta: {sandboxStats.callDelta.toFixed(2)}</span>
                <span className="text-[8px] text-slate-450 block font-sans">Theta: {sandboxStats.callTheta.toFixed(2)}</span>
              </div>
              <div className="pl-2">
                <span className="text-[9px] text-rose-600 font-serif font-black uppercase tracking-wide font-bold">Put Price</span>
                <p className="text-xs font-bold text-slate-800">₹{sandboxStats.putPrice.toFixed(2)}</p>
                <span className="text-[8px] text-slate-450 block font-sans">Delta: {sandboxStats.putDelta.toFixed(2)}</span>
                <span className="text-[8px] text-slate-450 block font-sans">Theta: {sandboxStats.putTheta.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 font-medium font-sans leading-tight mt-2 flex items-start gap-1">
            <CheckCircle className="h-3 w-3 text-indigo-500 mt-0.5 flex-shrink-0" />
            <span>Allows scholars to evaluate contracts theoretically without loading any real or mock parameters.</span>
          </div>
        </div>

      </div>
    </div>
  );
}
