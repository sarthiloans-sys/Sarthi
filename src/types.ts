/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface CompanyFundamentals {
  marketCap: number; // in Crores
  bookValue: number; // in INR
  peRatio: number;
  pbRatio: number;
  eps: number;
  roe: number; // as percentage
  roce: number; // as percentage
  dividendYield: number; // as percentage
  debtToEquity: number;
}

export interface ShareholdingQuarter {
  quarter: string; // e.g., "Jun 25", "Sep 25", "Dec 25", "Mar 26"
  promoters: number;
  fii: number;
  dii: number;
  mutualFunds: number;
  public: number;
}

export interface FinancialPeriod {
  period: string; // e.g., "Q1 FY26" or "FY25"
  revenue: number; // in Crores
  netProfit: number; // in Crores
  operatingProfit: number; // in Crores
  debt: number; // in Crores
  cashFlow: number; // in Crores
}

export interface TechnicalIndicators {
  rsi: number;
  macd: {
    macdLine: number;
    signalLine: number;
    histogram: number;
  };
  movingAverages: {
    sma50: number;
    ema200: number;
  };
  volumeBreakout: boolean;
  support: number; // support level price
  resistance: number; // resistance level price
  trendStrength: "Bullish" | "Bearish" | "Neutral" | "High Momentum";
}

export interface HistoricalPrice {
  time: string; // "09:15", "10:00", etc. or Date string
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface StockData {
  symbol: string;
  name: string;
  sector: string;
  exchange: "NSE" | "BSE";
  price: number;
  change: number; // absolute change
  changePercent: number; // percentage change
  prevClose: number;
  volume: number;
  dayHigh: number;
  dayLow: number;
  yearHigh: number;
  yearLow: number;
  fundamentals: CompanyFundamentals;
  shareholding: ShareholdingQuarter[];
  quarterlyResults: FinancialPeriod[];
  annualResults: FinancialPeriod[];
  technicals: TechnicalIndicators;
  charts: {
    "1D": HistoricalPrice[];
    "1W": HistoricalPrice[];
    "1M": HistoricalPrice[];
    "1Y": HistoricalPrice[];
    "5Y": HistoricalPrice[];
  };
  about: string;
}

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  time: string;
  category: "General" | "Dividend" | "Corporate Announcement" | "Results" | "Corporate Action";
  relatedSymbols: string[];
}

export interface SectorMetric {
  name: string;
  stocksCount: number;
  changePercent: number;
  gainer: { symbol: string; changePercent: number };
  loser: { symbol: string; changePercent: number };
  marketCapPercent: number;
}

export interface AlertTrigger {
  id: string;
  symbol: string;
  type: "ABOVE" | "BELOW";
  targetPrice: number;
  isTriggered: boolean;
  createdAt: string;
}

export interface UserSession {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: "user" | "admin";
  createdAt: string;
}

export interface AdminConfigSettings {
  nseBseApiUrl: string;
  nseBseApiKey: string;
  customBroadcastAlert: string;
}

