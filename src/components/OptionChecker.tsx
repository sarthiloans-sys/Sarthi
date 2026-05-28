/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState, useMemo, useEffect } from "react";
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
} from "recharts";
import {
  TrendingUp,
  BookOpen,
  Sliders,
  Calculator,
  Percent,
  CheckCircle,
  AlertTriangle,
  ChevronDown,
  Info,
  Layers,
  ArrowRight,
  TrendingDown,
  Sparkles,
  Search,
} from "lucide-react";

interface OptionCheckerProps {
  stock: StockData;
}

// ==========================================
// BLACK-SCHOLES PRICING MATHS & DISTRIBUTIONS
// ==========================================

function cumulativeNormal(x: number): number {
  const b1 = 0.319381530;
  const b2 = -0.356563782;
  const b3 = 1.781477937;
  const b4 = -1.821255978;
  const b5 = 1.330274429;
  const p = 0.2316419;
  const c = 0.39894228;

  if (x >= 0.0) {
    const t = 1.0 / (1.0 + p * x);
    return (
      1.0 -
      c *
        Math.exp((-x * x) / 2.0) *
        t *
        (t * (t * (t * (t * b5 + b4) + b3) + b2) + b1)
    );
  } else {
    const t = 1.0 / (1.0 - p * x);
    return (
      c *
      Math.exp((-x * x) / 2.0) *
      t *
      (t * (t * (t * (t * b5 + b4) + b3) + b2) + b1)
    );
  }
}

function normalDensity(x: number): number {
  return Math.exp((-x * x) / 2.0) / Math.sqrt(2 * Math.PI);
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
  vPercent: number, // Volatility (percent)
  rPercent: number // Interest rate (percent)
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
    putTheta,
  };
}

// Expiration Dates definitions
interface ExpiryOption {
  label: string;
  days: number;
  isMonthly: boolean;
}

const EXPIRIES: ExpiryOption[] = [
  { label: "04-Jun-2026 (Weekly Expiry)", days: 7, isMonthly: false },
  { label: "11-Jun-2026 (Weekly Expiry)", days: 14, isMonthly: false },
  { label: "25-Jun-2026 (Monthly Expiry)", days: 28, isMonthly: true },
  { label: "30-Jul-2026 (Far Expiry)", days: 63, isMonthly: true },
];

export default function OptionChecker({ stock }: OptionCheckerProps) {
  // -------------------------------------------------------------
  // STATES & TRIGGERS
  // -------------------------------------------------------------
  const [selectedExpiryIdx, setSelectedExpiryIdx] = useState<number>(2); // 25-Jun-2026 default
  const [impliedVol, setImpliedVol] = useState<number>(22); // Base IV percent
  const [interestRate, setInterestRate] = useState<number>(7.0); // Risk-free G-Sec rate
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const daysToExpiry = EXPIRIES[selectedExpiryIdx].days;

  // Position setup
  const [tradeAction, setTradeAction] = useState<"BUY" | "SELL">("BUY");
  const [optionType, setOptionType] = useState<"CE" | "PE">("CE");
  const [selectedStrikePrice, setSelectedStrikePrice] = useState<number>(0);
  const [customPremium, setCustomPremium] = useState<number>(50);
  const [lotSize, setLotSize] = useState<number>(500); // Typical Indian lot size
  const [numberOfLots, setNumberOfLots] = useState<number>(1);
  const [simulatedExpirySpot, setSimulatedExpirySpot] = useState<number>(0);

  // Free sandbox state
  const [sandboxSpot, setSandboxSpot] = useState<number>(500);
  const [sandboxStrike, setSandboxStrike] = useState<number>(500);
  const [sandboxVol, setSandboxVol] = useState<number>(24);
  const [sandboxRate, setSandboxRate] = useState<number>(7.0);
  const [sandboxDays, setSandboxDays] = useState<number>(28);

  // Trigger loading skeleton on stock / expiry change
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 450);
    return () => clearTimeout(timer);
  }, [stock.symbol, selectedExpiryIdx]);

  // Set default strikes on stock changes
  useEffect(() => {
    const defaultStrike = Math.round(stock.price / 50) * 50;
    setSelectedStrikePrice(defaultStrike);
    setSimulatedExpirySpot(stock.price);

    const initialBS = calculateBlackScholes(
      stock.price,
      defaultStrike,
      daysToExpiry,
      impliedVol,
      interestRate
    );
    setCustomPremium(Math.round((optionType === "CE" ? initialBS.callPrice : initialBS.putPrice) * 10) / 10);
    
    // Sync sandbox too
    setSandboxSpot(Math.round(stock.price));
    setSandboxStrike(defaultStrike);
  }, [stock.symbol]);

  // Handle row click connection
  const handleSelectContract = (strike: number, type: "CE" | "PE", premium: number) => {
    setSelectedStrikePrice(strike);
    setOptionType(type);
    setCustomPremium(Math.round(premium * 10) / 10);
    setSimulatedExpirySpot(stock.price);
  };

  // -------------------------------------------------------------
  // PARAMETRIC OPTION CHAIN GENERATION WITH SKEW
  // -------------------------------------------------------------
  const optionChain = useMemo(() => {
    const spot = stock.price;
    // Step size determined by stock price
    const step = spot > 3000 ? 100 : spot > 1200 ? 50 : spot > 500 ? 20 : 10;
    const atmStrike = Math.round(spot / step) * step;

    const strikesList: number[] = [];
    for (let i = -5; i <= 5; i++) {
      strikesList.push(atmStrike + i * step);
    }

    let totalCallOI = 0;
    let totalPutOI = 0;

    const items = strikesList.map((strike, idx) => {
      // Skew formula: Implied volatility smile (higher at OTM/ITM tails)
      const pctDistance = Math.abs(strike - spot) / spot;
      const strikeIV = impliedVol * (1.0 + pctDistance * 0.8);

      const bs = calculateBlackScholes(
        spot,
        strike,
        daysToExpiry,
        strikeIV,
        interestRate
      );

      // Procedural OI and Volume relative to closeness to ATM
      // At-the-money strike has maximum volume and OI
      const distFromATM = Math.abs(idx - 5); // 5 is center index
      const baseCallOI = Math.max(1200, Math.round(24000 / (distFromATM * 1.5 + 1)));
      const basePutOI = Math.max(900, Math.round(19500 / (distFromATM * 1.4 + 1)));
      const baseCallVol = Math.max(3000, Math.round(145000 / (distFromATM * 1.8 + 1)));
      const basePutVol = Math.max(2500, Math.round(112000 / (distFromATM * 1.7 + 1)));

      // Add a tiny random shake for premium execution look
      const callOIShake = Math.round(baseCallOI * (1.0 + (Math.sin(strike + 1) * 0.15)));
      const putOIShake = Math.round(basePutOI * (1.0 + (Math.cos(strike + 2) * 0.15)));
      const callVolShake = Math.round(baseCallVol * (1.1 + (Math.sin(strike * 2) * 0.2)));
      const putVolShake = Math.round(basePutVol * (0.9 + (Math.cos(strike * 3) * 0.2)));

      totalCallOI += callOIShake;
      totalPutOI += putOIShake;

      // Strike-by-strike PCR (Put Call Ratio of OI status)
      const strikePCR = callOIShake > 0 ? putOIShake / callOIShake : 1.0;

      return {
        strike,
        call: {
          oi: callOIShake,
          volume: callVolShake,
          iv: strikeIV,
          premium: bs.callPrice,
          delta: bs.callDelta,
        },
        put: {
          oi: putOIShake,
          volume: putVolShake,
          iv: strikeIV,
          premium: bs.putPrice,
          delta: bs.putDelta,
        },
        isATM: strike === atmStrike,
        isITMCall: spot > strike,
        isITMPut: spot < strike,
        strikePCR,
      };
    });

    const overallPCR = totalCallOI > 0 ? totalPutOI / totalCallOI : 1.0;

    return {
      rows: items,
      overallPCR,
      totalCallOI,
      totalPutOI,
    };
  }, [stock.price, daysToExpiry, impliedVol, interestRate]);

  // Selected Option Greeks computation for indicators
  const activeGreeks = useMemo(() => {
    if (!selectedStrikePrice) return null;
    return calculateBlackScholes(
      stock.price,
      selectedStrikePrice,
      daysToExpiry,
      impliedVol,
      interestRate
    );
  }, [stock.price, selectedStrikePrice, daysToExpiry, impliedVol, interestRate]);

  // -------------------------------------------------------------
  // PAYOFF SIMULATION DESIGN PATHS
  // -------------------------------------------------------------
  const payoffData = useMemo(() => {
    if (!selectedStrikePrice || !customPremium) return [];

    const spot = stock.price;
    const rangeMin = spot * 0.75; // -25% Range boundaries
    const rangeMax = spot * 1.25; // +25% Range boundaries
    const pointsCount = 45;
    const step = (rangeMax - rangeMin) / pointsCount;

    const data = [];
    const totalShares = lotSize * numberOfLots;

    for (let i = 0; i <= pointsCount; i++) {
      const expSpot = rangeMin + i * step;
      let profitLoss = 0;

      // Mathematical profit formula on final expiration date
      if (optionType === "CE") {
        const optionValueAtExpiry = Math.max(0, expSpot - selectedStrikePrice);
        if (tradeAction === "BUY") {
          profitLoss = (optionValueAtExpiry - customPremium) * totalShares;
        } else {
          profitLoss = (customPremium - optionValueAtExpiry) * totalShares;
        }
      } else {
        const optionValueAtExpiry = Math.max(0, selectedStrikePrice - expSpot);
        if (tradeAction === "BUY") {
          profitLoss = (optionValueAtExpiry - customPremium) * totalShares;
        } else {
          profitLoss = (customPremium - optionValueAtExpiry) * totalShares;
        }
      }

      data.push({
        expirySpot: Math.round(expSpot),
        profitLoss: Math.round(profitLoss),
      });
    }

    return data;
  }, [
    selectedStrikePrice,
    customPremium,
    optionType,
    tradeAction,
    lotSize,
    numberOfLots,
    stock.price,
  ]);

  // Dynamic state outputs at current slider settlement targets
  const simOutputs = useMemo(() => {
    const totalShares = lotSize * numberOfLots;
    const expSpot = simulatedExpirySpot || stock.price;
    let pnl = 0;

    if (optionType === "CE") {
      const optionValueAtExpiry = Math.max(0, expSpot - selectedStrikePrice);
      if (tradeAction === "BUY") {
        pnl = (optionValueAtExpiry - customPremium) * totalShares;
      } else {
        pnl = (customPremium - optionValueAtExpiry) * totalShares;
      }
    } else {
      const optionValueAtExpiry = Math.max(0, selectedStrikePrice - expSpot);
      if (tradeAction === "BUY") {
        pnl = (optionValueAtExpiry - customPremium) * totalShares;
      } else {
        pnl = (customPremium - optionValueAtExpiry) * totalShares;
      }
    }

    const premiumCost = customPremium * totalShares;
    const marginEstimate =
      tradeAction === "SELL"
        ? stock.price * totalShares * 0.22 + premiumCost
        : premiumCost;

    return {
      pnl,
      marginUsed: marginEstimate,
      isProfit: pnl >= 0,
      percentageReturn:
        tradeAction === "BUY"
          ? (pnl / premiumCost) * 100
          : (pnl / marginEstimate) * 100,
      breakeven:
        optionType === "CE"
          ? selectedStrikePrice + customPremium
          : selectedStrikePrice - customPremium,
    };
  }, [
    selectedStrikePrice,
    customPremium,
    optionType,
    tradeAction,
    lotSize,
    numberOfLots,
    simulatedExpirySpot,
    stock.price,
  ]);

  // Sandbox output helper
  const sandboxStats = useMemo(() => {
    return calculateBlackScholes(
      sandboxSpot,
      sandboxStrike,
      sandboxDays,
      sandboxVol,
      sandboxRate
    );
  }, [sandboxSpot, sandboxStrike, sandboxDays, sandboxVol, sandboxRate]);

  return (
    <div className="space-y-6">
      {/* SEBI WARNING BANNER (GLOBALLY UNREGISTERED COMPLIANCE HEADER) */}
      <div className="bg-rose-50/90 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 p-4 rounded-xl flex items-start gap-3 select-none">
        <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-xs font-black uppercase text-rose-800 dark:text-rose-400 font-sans tracking-widest flex items-center gap-1.5 font-mono">
            ⚠️ NON-SEBI REGISTERED COMPLIANCE NOTICE
          </h4>
          <p className="text-[11px] text-rose-750 dark:text-rose-300/90 font-sans leading-relaxed">
            FinSight Stock Market Sandbox is an <strong>educational tool</strong> only. We are <strong>NOT registered with SEBI</strong>. We do not provide buy, sell, hold, or trading advisory options. Derivatives trading is highly risky. All options chains, pricing sheets, volatility smiles, and payoff curves are generated via the theoretical Black-Scholes-Merton model for educational analytics only.
          </p>
        </div>
      </div>

      {/* Main control board layout */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs transition-colors">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1.5 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-900/50 px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
                Derivatives Lab
              </span>
              <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/40 dark:border-emerald-900/40 px-2 py-0.5 rounded font-bold font-mono">
                BS-Merton Simulator
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Calculator className="h-5.5 w-5.5 text-indigo-650 dark:text-indigo-400" />
              <span>Options Chain Scholar Workspace</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-4xl font-sans font-medium">
              Interact with theoretical derivatives chains for <strong>{stock.name} ({stock.symbol})</strong>. Shift implied volatility, select settlement expiries, and observe real-time premium pricing skews instantly.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            {/* Expiry Selector Dropdown */}
            <div className="flex flex-col gap-1">
              <label className="text-[9.5px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                Select Expiration
              </label>
              <div className="relative">
                <select
                  value={selectedExpiryIdx}
                  onChange={(e) => setSelectedExpiryIdx(parseInt(e.target.value))}
                  className="appearance-none bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 pr-10 text-xs text-slate-800 dark:text-slate-200 font-bold outline-none focus:border-indigo-500 font-mono transition duration-200 shadow-xs cursor-pointer w-full min-w-[210px]"
                >
                  {EXPIRIES.map((opt, idx) => (
                    <option key={opt.label} value={idx}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Tuning Sliders */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-5 transition-colors">
          <h2 className="font-semibold text-xs text-slate-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2">
            <Sliders className="h-4 w-4 text-indigo-650 dark:text-indigo-400" />
            <span>Parametric Tuning</span>
          </h2>

          <div className="space-y-4 font-mono select-none">
            {/* IV slider */}
            <div>
              <div className="flex justify-between text-xs mb-1 font-bold">
                <span className="text-slate-500 dark:text-slate-400">Atm Implied Vol (IV):</span>
                <span className="text-indigo-650 dark:text-indigo-400 font-extrabold">{impliedVol}%</span>
              </div>
              <input
                type="range"
                min={8}
                max={60}
                value={impliedVol}
                onChange={(e) => setImpliedVol(parseInt(e.target.value))}
                className="w-full accent-indigo-600 dark:accent-indigo-500 cursor-pointer h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none"
              />
              <span className="text-[9px] text-slate-400 dark:text-slate-500 font-sans block mt-1">
                Reflects market fear. Boosts all contracts premiums.
              </span>
            </div>

            {/* Interest Rate G-Sec slider */}
            <div>
              <div className="flex justify-between text-xs mb-1 font-bold">
                <span className="text-slate-500 dark:text-slate-400">Risk-Free Interest:</span>
                <span className="text-indigo-650 dark:text-indigo-400 font-extrabold">{interestRate}%</span>
              </div>
              <input
                type="range"
                min={3.0}
                max={12.0}
                step={0.5}
                value={interestRate}
                onChange={(e) => setInterestRate(parseFloat(e.target.value))}
                className="w-full accent-indigo-600 dark:accent-indigo-500 cursor-pointer h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none"
              />
              <span className="text-[9px] text-slate-400 dark:text-slate-500 font-sans block mt-1">
                Sovereign treasury rate. Supports Call demand values.
              </span>
            </div>

            <div className="border-t border-slate-150 dark:border-slate-800 pt-4 space-y-2.5 font-sans">
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">
                  Underlying Spot Price
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-mono font-black text-slate-900 dark:text-white">
                    ₹{stock.price.toFixed(2)}
                  </span>
                  <span
                    className={`text-[10px] font-mono font-bold ${
                      stock.change >= 0 ? "text-emerald-500" : "text-rose-550"
                    }`}
                  >
                    {stock.change >= 0 ? "▲" : "▼"} {Math.abs(stock.changePercent).toFixed(2)}%
                  </span>
                </div>
              </div>

              {/* Put-Call Ratio OI Summary Badge */}
              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 p-3 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[9px] text-slate-450 dark:text-slate-500 uppercase tracking-widest font-bold block">
                    TOTAL PUT-CALL RATIO
                  </span>
                  <span className="font-mono text-sm font-black text-slate-850 dark:text-slate-200">
                    PCR = {optionChain.overallPCR.toFixed(3)}
                  </span>
                </div>
                <div
                  className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase font-mono ${
                    optionChain.overallPCR > 1.05
                      ? "bg-emerald-55/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                      : optionChain.overallPCR < 0.9
                      ? "bg-rose-55/15 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                      : "bg-slate-100 dark:bg-slate-850 text-slate-500 dark:text-slate-400 border border-slate-200/50"
                  }`}
                >
                  {optionChain.overallPCR > 1.05 ? "Bullish Signal" : optionChain.overallPCR < 0.9 ? "Bearish Signal" : "Neutral PCR"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Option Chain Grid Section (3 Columns) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs lg:col-span-3 transition-colors flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-150 dark:border-slate-800 pb-3 mb-4 select-none">
              <span className="font-semibold text-xs text-slate-450 uppercase tracking-widest flex items-center gap-2">
                <Layers className="h-4 w-4 text-indigo-650 dark:text-indigo-400" />
                <span>Option Derivatives Sheet</span>
              </span>
              <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-400 dark:text-slate-550 font-mono">
                <span>Call OI: {optionChain.totalCallOI.toLocaleString()}</span>
                <span>•</span>
                <span>Put OI: {optionChain.totalPutOI.toLocaleString()}</span>
              </div>
            </div>

            {/* SKELETON LOADER VS ACTUAL CONTENT */}
            {isLoading ? (
              <div className="space-y-2.5 py-4 animate-pulse">
                {/* Simulated Table Header */}
                <div className="grid grid-cols-11 h-9 bg-slate-100 dark:bg-slate-950 rounded-lg"></div>
                {/* 7 simulated rows */}
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="grid grid-cols-11 h-8 bg-slate-50 dark:bg-slate-950/40 rounded border border-slate-100 dark:border-slate-900"></div>
                ))}
              </div>
            ) : optionChain.rows.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <BookOpen className="h-10 w-10 mx-auto text-slate-300 animate-bounce mb-3" />
                <p className="text-xs font-mono">No simulation contracts loaded.</p>
              </div>
            ) : (
              <div className="overflow-x-auto select-none rounded-xl border border-slate-150 dark:border-slate-850">
                <table className="w-full text-left text-xs font-mono border-collapse min-w-[750px]">
                  <thead>
                    <tr className="bg-indigo-50/50 dark:bg-indigo-950/45 text-indigo-900 dark:text-indigo-300 border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold uppercase tracking-wider text-center">
                      <th className="p-2 py-3" colSpan={5}>CALLS (CE)</th>
                      <th className="p-2 py-3 bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-350 font-black border-x border-slate-200 dark:border-slate-800">STRIKE</th>
                      <th className="p-2 py-3" colSpan={5}>PUTS (PE)</th>
                    </tr>
                    <tr className="border-b border-slate-150 dark:border-slate-850 text-[9px] text-slate-400 dark:text-slate-500 text-center font-bold">
                      <th className="p-1 px-1.5 font-sans">Delta</th>
                      <th className="p-1 px-1.5">OI (Cntr)</th>
                      <th className="p-1 px-1.5">Volume</th>
                      <th className="p-1 px-1.5">IV %</th>
                      <th className="p-1 px-1.5 bg-indigo-50/20 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 font-extrabold">Call Premium</th>
                      <th className="p-1 px-2.5 bg-slate-100 dark:bg-slate-950 border-x border-slate-200 dark:border-slate-800 font-black text-slate-705 dark:text-slate-300 text-[10.5px]">Strike Price</th>
                      <th className="p-1 px-1.5 bg-rose-50/20 dark:bg-rose-950/20 text-rose-700 dark:text-rose-450 font-extrabold">Put Premium</th>
                      <th className="p-1 px-1.5">IV %</th>
                      <th className="p-1 px-1.5">Volume</th>
                      <th className="p-1 px-1.5">OI (Cntr)</th>
                      <th className="p-1 px-1.5 font-sans">Delta</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-center text-[10.5px]">
                    {optionChain.rows.map((row) => {
                      const isSelectedCall = selectedStrikePrice === row.strike && optionType === "CE";
                      const isSelectedPut = selectedStrikePrice === row.strike && optionType === "PE";

                      return (
                        <tr
                          key={row.strike}
                          className={`hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition-colors uppercase ${
                            row.isATM ? "bg-amber-50/15 dark:bg-amber-950/10 font-bold" : ""
                          }`}
                        >
                          {/* Call Delta */}
                          <td className="p-1.5 text-slate-450 dark:text-slate-500 font-sans">
                            {row.call.delta.toFixed(2)}
                          </td>
                          {/* Call OI */}
                          <td className="p-1.5 text-slate-500 dark:text-slate-400">
                            {row.call.oi.toLocaleString()}
                          </td>
                          {/* Call Volume */}
                          <td className="p-1.5 text-slate-400 dark:text-slate-500">
                            {row.call.volume.toLocaleString()}
                          </td>
                          {/* Call IV */}
                          <td className="p-1.5 text-slate-500 dark:text-slate-500">
                            {row.call.iv.toFixed(1)}%
                          </td>

                          {/* Call Premium cell with color highlighting for ITM */}
                          <td
                            onClick={() => handleSelectContract(row.strike, "CE", row.call.premium)}
                            className={`p-1.5 px-2 cursor-pointer font-extrabold transition-all border border-transparent ${
                              row.isITMCall
                                ? "bg-amber-50/30 dark:bg-amber-950/15 text-blue-600 dark:text-blue-400 hover:bg-blue-100/40"
                                : "text-blue-500/80 hover:bg-blue-50"
                            } ${
                              isSelectedCall
                                ? "bg-blue-600 dark:bg-blue-600 text-white dark:text-white font-black rounded-lg scale-[0.98] border-blue-700"
                                : ""
                            }`}
                          >
                            ₹{row.call.premium.toFixed(1)}
                          </td>

                          {/* Strike display in center */}
                          <td
                            className={`p-1.5 bg-slate-50 dark:bg-slate-950 font-black border-x border-slate-205 dark:border-slate-805 text-slate-900 dark:text-slate-100 font-mono text-xs ${
                              row.isATM ? "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 border-x-amber-200 dark:border-x-amber-900" : ""
                            }`}
                          >
                            ₹{row.strike}
                            {row.isATM && (
                              <span className="block text-[8px] font-sans text-amber-600 dark:text-amber-400 tracking-normal leading-none font-bold">
                                ATM
                              </span>
                            )}
                          </td>

                          {/* Put Premium cell with ITM highlighting */}
                          <td
                            onClick={() => handleSelectContract(row.strike, "PE", row.put.premium)}
                            className={`p-1.5 px-2 cursor-pointer font-extrabold transition-all border border-transparent ${
                              row.isITMPut
                                ? "bg-amber-50/25 dark:bg-amber-950/15 text-rose-600 dark:text-rose-400 hover:bg-rose-100/40"
                                : "text-rose-500/80 hover:bg-rose-50"
                            } ${
                              isSelectedPut
                                ? "bg-rose-600 dark:bg-rose-600 text-white dark:text-white font-black rounded-lg scale-[0.98] border-rose-700"
                                : ""
                            }`}
                          >
                            ₹{row.put.premium.toFixed(1)}
                          </td>

                          {/* Put IV */}
                          <td className="p-1.5 text-slate-500 dark:text-slate-500">
                            {row.put.iv.toFixed(1)}%
                          </td>
                          {/* Put Volume */}
                          <td className="p-1.5 text-slate-400 dark:text-slate-550">
                            {row.put.volume.toLocaleString()}
                          </td>
                          {/* Put OI */}
                          <td className="p-1.5 text-slate-500 dark:text-slate-400">
                            {row.put.oi.toLocaleString()}
                          </td>
                          {/* Put Delta */}
                          <td className="p-1.5 text-slate-450 dark:text-slate-500 font-sans">
                            {row.put.delta.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[10.5px] text-slate-450 dark:text-slate-450 leading-relaxed font-sans max-w-2xl flex items-start gap-1.5">
            <Info className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
            <span>
              <strong>Strike Legend:</strong> At-The-Money (ATM) strikes locate center yellow. Calls represent European Call Options (CE); Puts represent European Put Options (PE). Yellow bands mark <strong>In-The-Money (ITM)</strong> contracts. Click any individual premium cell to launch payoff equations below.
            </span>
          </div>
        </div>
      </div>

      {/* 2. Payne Payoff Simulator Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs grid grid-cols-1 lg:grid-cols-12 gap-6 transition-colors">
        
        {/* Setup card left */}
        <div className="lg:col-span-4 space-y-4">
          <div className="border-b border-slate-150 dark:border-slate-800 pb-2.5">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
              <Sparkles className="h-4.5 w-4.5 text-indigo-600 dark:text-indigo-400" />
              <span>Payoff Simulator Tuner</span>
            </h3>
            <p className="text-[10.5px] text-slate-450 mt-0.5 font-medium font-sans">
              Alter position types or sizes and observe final expiration payout charts.
            </p>
          </div>

          <div className="space-y-3.5 text-xs font-mono">
            {/* Transaction Type selectors */}
            <div>
              <label className="text-[9.5px] text-slate-400 dark:text-slate-500 block mb-1 uppercase font-bold">
                Position Strategy Action
              </label>
              <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-950 p-1 border border-slate-200/60 dark:border-slate-800 rounded-xl font-bold">
                <button
                  type="button"
                  onClick={() => setTradeAction("BUY")}
                  className={`py-1.5 px-3 rounded-lg text-center transition font-sans text-xs cursor-pointer ${
                    tradeAction === "BUY"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-500 dark:text-slate-405 hover:text-slate-805"
                  }`}
                >
                  Buy Contract (Long)
                </button>
                <button
                  type="button"
                  onClick={() => setTradeAction("SELL")}
                  className={`py-1.5 px-3 rounded-lg text-center transition font-sans text-xs cursor-pointer ${
                    tradeAction === "SELL"
                      ? "bg-rose-650 text-white shadow-xs"
                      : "text-slate-500 dark:text-slate-405 hover:text-slate-805"
                  }`}
                >
                  Sell / Write (Short)
                </button>
              </div>
            </div>

            {/* Contract Type CE/PE */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[9.5px] text-slate-400 dark:text-slate-500 block mb-1 uppercase font-bold">
                  Contract Select
                </label>
                <select
                  value={optionType}
                  onChange={(e) => setOptionType(e.target.value as "CE" | "PE")}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500 font-sans cursor-pointer"
                >
                  <option value="CE">Call Option (CE)</option>
                  <option value="PE">Put Option (PE)</option>
                </select>
              </div>
              <div>
                <label className="text-[9.5px] text-slate-400 dark:text-slate-500 block mb-1 uppercase font-bold">
                  Strike Level (₹)
                </label>
                <input
                  type="number"
                  value={selectedStrikePrice}
                  onChange={(e) => setSelectedStrikePrice(Math.round(parseFloat(e.target.value) || 0))}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2 text-xs font-bold text-slate-805 dark:text-white outline-none focus:border-indigo-505"
                />
              </div>
            </div>

            {/* Lot Tuner */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[9px] text-slate-400 block mb-1 uppercase font-black">Lot Size</label>
                <input
                  type="number"
                  value={lotSize}
                  onChange={(e) => setLotSize(parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-1.5 text-center text-xs font-bold text-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="text-[9px] text-slate-400 block mb-1 uppercase font-black">Lots Count</label>
                <input
                  type="number"
                  value={numberOfLots}
                  onChange={(e) => setNumberOfLots(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-1.5 text-center text-xs font-bold text-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="text-[9px] text-slate-400 block mb-1 uppercase font-black">Premium Price</label>
                <input
                  type="number"
                  step="0.5"
                  value={customPremium}
                  onChange={(e) => setCustomPremium(parseFloat(e.target.value) || 0.5)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-1.5 text-center text-xs font-bold text-slate-800 dark:text-white font-mono"
                />
              </div>
            </div>

            {/* Position Summary Indicators Cards */}
            <div className="bg-slate-50 dark:bg-slate-950 p-3.5 border border-slate-150 dark:border-slate-850 rounded-2xl space-y-2">
              <span className="text-[9px] text-slate-450 dark:text-slate-500 uppercase font-black tracking-widest block border-b border-slate-200/50 dark:border-slate-800 pb-1">
                POSITION SUMMARY METRICS
              </span>
              <div className="flex justify-between items-center text-[11px] font-mono">
                <span className="text-slate-500 dark:text-slate-400">Total Contract Qty:</span>
                <span className="text-slate-800 dark:text-slate-200 font-extrabold font-mono">
                  {(lotSize * numberOfLots).toLocaleString()} shares
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px] font-mono">
                <span className="text-slate-500 dark:text-slate-400">Total Premium Cash:</span>
                <span className="text-slate-900 dark:text-white font-black text-xs font-mono">
                  ₹{(customPremium * lotSize * numberOfLots).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px] font-mono">
                <span className="text-slate-500 dark:text-slate-400">Theoretical Margin Require:</span>
                <span className="text-indigo-650 dark:text-indigo-400 font-black font-mono">
                  ₹{simOutputs.marginUsed.toFixed(0)}
                </span>
              </div>
            </div>

            {/* EXPIRE SETTLEMENT PRICE INTERACTIVE TARGET SLIDER */}
            <div className="pt-2 border-t border-slate-150 dark:border-slate-800">
              <div className="flex justify-between text-xs mb-1 font-bold font-sans">
                <span className="text-slate-505 dark:text-slate-400 flex items-center gap-1">
                  Settlement Price Target:
                </span>
                <span className="text-indigo-650 dark:text-indigo-400 font-mono font-black text-sm">
                  ₹{simulatedExpirySpot.toFixed(1)}
                </span>
              </div>
              <input
                type="range"
                min={Math.round(stock.price * 0.75)}
                max={Math.round(stock.price * 1.25)}
                value={simulatedExpirySpot}
                onChange={(e) => setSimulatedExpirySpot(parseInt(e.target.value))}
                className="w-full accent-indigo-600 dark:accent-indigo-500 cursor-pointer h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none mt-1"
              />
              <div className="flex justify-between text-[9px] text-slate-400 dark:text-slate-500 mt-1 font-sans">
                <span>-25% (₹{(stock.price * 0.75).toFixed(0)})</span>
                <span className="font-bold text-slate-700">Spot (₹{stock.price.toFixed(0)})</span>
                <span>+25% (₹{(stock.price * 1.25).toFixed(0)})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Real-time Payoff Interactive Chart */}
        <div className="lg:col-span-8 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-150 dark:border-slate-800 pb-2.5">
              <div>
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                  <TrendingUp className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-450" />
                  <span>Theoretical Payoff Expiry Curve Chart</span>
                </h4>
                <p className="text-[11px] text-slate-450 dark:text-slate-500 font-sans">
                  Visualization of trade profits limitations at the final expiration date.
                </p>
              </div>

              {/* Dynamic PNL Box */}
              <div
                className={`p-2 px-4 border rounded-2xl flex flex-col items-center justify-center font-mono min-w-[190px] text-center ${
                  simOutputs.isProfit
                    ? "bg-emerald-50/70 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 border-emerald-250 dark:border-emerald-900/30"
                    : "bg-rose-50/70 dark:bg-rose-950/20 text-rose-850 dark:text-rose-400 border-rose-250 dark:border-rose-900/30"
                }`}
              >
                <span className="text-[8.5px] text-slate-450 dark:text-slate-400 tracking-wider font-bold block uppercase mb-0.5">
                  SIMULATED SETTLEMENT P&L
                </span>
                <strong className="text-base font-black tracking-wide leading-none block font-mono">
                  {simOutputs.isProfit ? "+" : ""}₹{simOutputs.pnl.toLocaleString()}
                </strong>
                <span className="text-[9px] font-bold block mt-1 leading-none uppercase">
                  ({simOutputs.isProfit ? "PROFIT" : "LOSS"} • {simOutputs.isProfit ? "+" : ""}
                  {simOutputs.percentageReturn.toFixed(1)}%)
                </span>
              </div>
            </div>

            {/* Recharts chart container with dark mode support */}
            <div className="w-full h-[230px] text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={payoffData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-slate-200 dark:stroke-slate-800" />
                  <XAxis
                    dataKey="expirySpot"
                    stroke="#64748b"
                    fontSize={10}
                    fontFamily="JetBrains Mono"
                    tickLine={false}
                    label={{
                      value: "Expiry Target Price (₹)",
                      position: "insideBottom",
                      offset: -2,
                      fontSize: 10,
                      fill: "#64748b",
                      fontFamily: "sans-serif",
                      fontWeight: "bold",
                    }}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={10}
                    fontFamily="JetBrains Mono"
                    tickLine={false}
                    tickFormatter={(v) => `₹${v}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(15, 23, 42, 0.95)",
                      borderColor: "#334155",
                      color: "#fff",
                      borderRadius: "12px",
                      fontSize: "11px",
                      fontFamily: "JetBrains Mono",
                    }}
                    itemStyle={{ color: "#38bdf8" }}
                    labelStyle={{ color: "#94a3b8", fontWeight: "bold" }}
                  />
                  {/* Zero P&L reference */}
                  <ReferenceLine y={0} stroke="#64748b" strokeWidth={1} strokeDasharray="3 3" />
                  {/* Strike reference line */}
                  <ReferenceLine
                    x={Math.round(selectedStrikePrice)}
                    stroke="#4f46e5"
                    strokeWidth={1.5}
                    strokeDasharray="2 2"
                    label={{
                      value: `Strike: ₹${selectedStrikePrice}`,
                      position: "top",
                      fill: "#4f46e5",
                      fontSize: 9.5,
                      fontWeight: "bold",
                      fontFamily: "JetBrains Mono",
                    }}
                  />
                  {/* Active target handle settlement indicator */}
                  <ReferenceLine
                    x={Math.round(simulatedExpirySpot)}
                    stroke="#10b981"
                    strokeWidth={1.5}
                    label={{
                      value: `Target: ₹${simulatedExpirySpot}`,
                      position: "bottom",
                      fill: "#10b981",
                      fontSize: 9.5,
                      fontWeight: "bold",
                      fontFamily: "JetBrains Mono",
                    }}
                  />

                  <Line
                    type="monotone"
                    dataKey="profitLoss"
                    name="Profit / Loss (₹)"
                    stroke={optionType === "CE" ? "#3b82f6" : "#f43f5e"}
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick analysis cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] font-mono font-bold select-none text-slate-500 dark:text-slate-400">
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 p-2.5 rounded-xl">
              <span className="text-[9.5px] text-slate-400 block font-sans">Position Breakeven</span>
              <strong className="text-slate-850 dark:text-slate-200 block text-xs">
                ₹{simOutputs.breakeven.toFixed(1)}
              </strong>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 p-2.5 rounded-xl">
              <span className="text-[9.5px] text-slate-400 block font-sans">Underlying Spot Match</span>
              <strong className="text-slate-850 dark:text-slate-200 block text-xs">
                ₹{stock.price.toFixed(1)}
              </strong>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 p-2.5 rounded-xl">
              <span className="text-[9.5px] text-slate-400 block font-sans">Theoretical Max Profit</span>
              <strong className="text-emerald-600 dark:text-emerald-450 block text-xs">
                {tradeAction === "BUY"
                  ? optionType === "CE"
                    ? "UNLIMITED ↗"
                    : `₹${((selectedStrikePrice - customPremium) * lotSize * numberOfLots).toLocaleString()}`
                  : `₹${(customPremium * lotSize * numberOfLots).toLocaleString()}`}
              </strong>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 p-2.5 rounded-xl">
              <span className="text-[9.5px] text-slate-400 block font-sans">Theoretical Max Risk</span>
              <strong className="text-rose-600 dark:text-rose-455 block text-xs">
                {tradeAction === "BUY"
                  ? `₹${(customPremium * lotSize * numberOfLots).toLocaleString()}`
                  : "UNLIMITED ⚠️"}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* 3. High Fidelity Option Greeks Dashboard */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs transition-colors space-y-4">
        <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5 border-b border-indigo-100/30 dark:border-slate-800 pb-2.5">
          <BookOpen className="h-4.5 w-4.5 text-indigo-650 dark:text-indigo-400 animate-pulse" />
          <span>Derivatives Option Greeks Analytics Dashboard (Interactive)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
          {/* Delta */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl space-y-2">
            <div className="flex justify-between items-center">
              <span className="p-1 px-2 bg-indigo-50/80 dark:bg-indigo-950 text-indigo-750 dark:text-indigo-400 border border-indigo-200/40 dark:border-indigo-900/40 rounded font-bold text-[10px]">
                Δ DELTA
              </span>
              <span className="text-slate-800 dark:text-white font-extrabold text-sm">
                {activeGreeks
                  ? (optionType === "CE" ? activeGreeks.callDelta : activeGreeks.putDelta).toFixed(3)
                  : "0.000"}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed font-sans mt-1">
              Measures contract price shift per ₹1 share tick. Serves as simulated directional success probability.
            </p>
          </div>

          {/* Theta */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl space-y-2">
            <div className="flex justify-between items-center">
              <span className="p-1 px-2 bg-rose-50/80 dark:bg-rose-950 text-rose-750 dark:text-rose-450 border border-rose-200/40 dark:border-rose-900/40 rounded font-bold text-[10px]">
                Θ THETA
              </span>
              <span className="text-rose-600 dark:text-rose-450 font-extrabold text-xs">
                ₹{activeGreeks
                  ? (optionType === "CE" ? activeGreeks.callTheta : activeGreeks.putTheta).toFixed(2)
                  : "-0.00"}/day
              </span>
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed font-sans mt-1">
              Traces premium erosion rate per 24-hour cycle. Buyers pay theta, writers collect decay.
            </p>
          </div>

          {/* Gamma */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl space-y-2">
            <div className="flex justify-between items-center">
              <span className="p-1 px-2 bg-teal-50/80 dark:bg-teal-950 text-teal-750 dark:text-teal-400 border border-teal-200/40 dark:border-teal-900/40 rounded font-bold text-[10px]">
                Γ GAMMA
              </span>
              <span className="text-slate-800 dark:text-white font-extrabold text-sm">
                {activeGreeks ? activeGreeks.gamma.toFixed(5) : "0.00000"}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed font-sans mt-1">
              Traces rate of delta shifting per ₹1 move. Pinpoints exponential explosion speeds near expiration.
            </p>
          </div>

          {/* Vega */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl space-y-2">
            <div className="flex justify-between items-center">
              <span className="p-1 px-2 bg-purple-50/80 dark:bg-purple-950 text-purple-750 dark:text-purple-400 border border-purple-200/40 dark:border-purple-900/40 rounded font-bold text-[10px]">
                ν VEGA
              </span>
              <span className="text-slate-850 dark:text-white font-extrabold text-sm">
                ₹{activeGreeks ? activeGreeks.vega.toFixed(2) : "0.00"}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed font-sans mt-1">
              Measures premium sensitivity change per 1% Shift in active Implied Volatility (IV) dynamics.
            </p>
          </div>
        </div>
      </div>

      {/* Free Style Model Sandbox Simulator Calculator */}
      <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs transition-colors grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-4 space-y-2">
          <h4 className="font-extrabold text-xs text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-1.5 font-mono">
            <Sliders className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            <span>Black-Scholes Custom Sandbox</span>
          </h4>
          <p className="text-[11px] text-slate-450 dark:text-slate-500 font-sans leading-relaxed">
            A purely mathematical playground. Type any stock price, strike, volatility, and interest rates independently from the active market feed contracts list to solve.
          </p>
        </div>

        <div className="lg:col-span-8 space-y-3.5">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs font-mono">
            <div>
              <label className="text-[9px] text-slate-400 block mb-0.5 font-bold uppercase">Spot Price</label>
              <input
                type="number"
                value={sandboxSpot}
                onChange={(e) => setSandboxSpot(parseFloat(e.target.value) || 0)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl p-2 font-bold text-xs font-mono text-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="text-[9px] text-slate-400 block mb-0.5 font-bold uppercase">Strike Price</label>
              <input
                type="number"
                value={sandboxStrike}
                onChange={(e) => setSandboxStrike(parseFloat(e.target.value) || 0)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl p-2 font-bold text-xs font-mono text-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="text-[9px] text-slate-400 block mb-0.5 font-bold uppercase">Vol %</label>
              <input
                type="number"
                value={sandboxVol}
                onChange={(e) => setSandboxVol(parseFloat(e.target.value) || 0)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl p-2 font-bold text-xs font-mono text-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="text-[9px] text-slate-400 block mb-0.5 font-bold uppercase">Days Left</label>
              <input
                type="number"
                value={sandboxDays}
                onChange={(e) => setSandboxDays(parseFloat(e.target.value) || 0)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl p-2 font-bold text-xs font-mono text-slate-800 dark:text-white"
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="text-[9px] text-slate-400 block mb-0.5 font-bold uppercase">Interest (r)</label>
              <input
                type="number"
                value={sandboxRate}
                onChange={(e) => setSandboxRate(parseFloat(e.target.value) || 0)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl p-2 font-bold text-xs font-mono text-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded-2xl grid grid-cols-2 gap-4 font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
            <div className="border-r border-slate-150 dark:border-slate-850 pr-4">
              <span className="text-[10px] text-blue-600 dark:text-blue-450 block font-extrabold uppercase tracking-wide">
                Call Pricing (CE)
              </span>
              <p className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                ₹{sandboxStats.callPrice.toFixed(2)}
              </p>
              <div className="flex gap-2 text-[9px] text-slate-450 mt-1">
                <span>Delta: {sandboxStats.callDelta.toFixed(2)}</span>
                <span>Theta: {sandboxStats.callTheta.toFixed(2)}</span>
              </div>
            </div>
            <div className="pl-4">
              <span className="text-[10px] text-rose-600 dark:text-rose-450 block font-extrabold uppercase tracking-wide">
                Put Pricing (PE)
              </span>
              <p className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                ₹{sandboxStats.putPrice.toFixed(2)}
              </p>
              <div className="flex gap-2 text-[9px] text-slate-450 mt-1">
                <span>Delta: {sandboxStats.putDelta.toFixed(2)}</span>
                <span>Theta: {sandboxStats.putTheta.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
