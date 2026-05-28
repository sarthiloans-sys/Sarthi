/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { StockData, NewsItem, SectorMetric, FinancialPeriod, ShareholdingQuarter, HistoricalPrice } from "../types";

// Helper to generate candlestick data procedurally with a specific trend and volatility
function generateHistoricalPrices(
  basePrice: number,
  pointsCount: number,
  trendFactor: number, // positive for uptrend, negative for downtrend
  volatility: number,
  timeframe: "1D" | "1W" | "1M" | "1Y" | "5Y"
): HistoricalPrice[] {
  const prices: HistoricalPrice[] = [];
  let currentPrice = basePrice * (1 - trendFactor * 0.4); // Start historical price back in time

  const now = new Date();
  
  for (let i = 0; i < pointsCount; i++) {
    const fraction = i / pointsCount;
    // Base trend + random walk
    const trend = trendFactor * basePrice * 0.4 * (1 / pointsCount);
    const noise = (Math.random() - 0.48) * volatility * currentPrice;
    
    const open = currentPrice;
    let close = currentPrice + trend + noise;
    
    // Boundary check
    if (close < 10) close = 10;
    
    const high = Math.max(open, close) + Math.random() * volatility * 0.5 * currentPrice;
    const low = Math.min(open, close) - Math.random() * volatility * 0.5 * currentPrice;
    const volume = Math.floor(100000 + Math.random() * 900000);
    
    let timeLabel = "";
    if (timeframe === "1D") {
      // 15 minute intervals starting from 9:15 AM
      const startMinutes = 9 * 60 + 15 + i * 15;
      const hours = Math.floor(startMinutes / 60);
      const minutes = startMinutes % 60;
      timeLabel = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
    } else if (timeframe === "1W") {
      // 5 trading days
      const d = new Date(now);
      d.setDate(now.getDate() - (5 - i));
      timeLabel = d.toLocaleDateString("en-US", { weekday: "short" });
    } else if (timeframe === "1M") {
      // 30 days
      const d = new Date(now);
      d.setDate(now.getDate() - (30 - i));
      timeLabel = d.toLocaleDateString("en-US", { day: "numeric", month: "short" });
    } else if (timeframe === "1Y") {
      // 12 months/periods
      const d = new Date(now);
      d.setMonth(now.getMonth() - (12 - i));
      timeLabel = d.toLocaleDateString("en-US", { month: "short" });
    } else {
      // 5 Year quarters
      const yearOffset = Math.floor(i / 4);
      const quarter = (i % 4) + 1;
      timeLabel = `Q${quarter} ${22 + yearOffset}`;
    }
    
    prices.push({
      time: timeLabel,
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
      volume
    });
    
    currentPrice = close;
  }
  
  return prices;
}

// Generate full stock data structure for our list
export const STOCKS_DATA: StockData[] = [
  {
    symbol: "RELIANCE",
    name: "Reliance Industries Limited",
    sector: "Energy",
    exchange: "NSE",
    price: 2462.40,
    change: 32.15,
    changePercent: 1.32,
    prevClose: 2430.25,
    volume: 5824912,
    dayHigh: 2478.00,
    dayLow: 2426.10,
    yearHigh: 2755.00,
    yearLow: 2180.00,
    about: "Reliance Industries Limited is a multinational conglomerate headquartered in Mumbai, India. Its diverse businesses include energy, petrochemicals, natural gas, retail, telecommunications, mass media, and textiles.",
    fundamentals: {
      marketCap: 1665482,
      bookValue: 1125.40,
      peRatio: 24.50,
      pbRatio: 2.19,
      eps: 100.50,
      roe: 9.32,
      roce: 12.15,
      dividendYield: 0.41,
      debtToEquity: 0.38
    },
    shareholding: [
      { quarter: "Jun 25", promoters: 50.39, fii: 21.85, dii: 16.12, mutualFunds: 7.20, public: 11.64 },
      { quarter: "Sep 25", promoters: 50.39, fii: 21.72, dii: 16.30, mutualFunds: 7.24, public: 11.59 },
      { quarter: "Dec 25", promoters: 50.39, fii: 21.60, dii: 16.48, mutualFunds: 7.35, public: 11.53 },
      { quarter: "Mar 26", promoters: 50.39, fii: 21.90, dii: 16.35, mutualFunds: 7.42, public: 11.36 }
    ],
    quarterlyResults: [
      { period: "Q1 FY26", revenue: 231450, netProfit: 16840, operatingProfit: 38800, debt: 210000, cashFlow: 14500 },
      { period: "Q2 FY26", revenue: 235120, netProfit: 17210, operatingProfit: 39540, debt: 205000, cashFlow: 15200 },
      { period: "Q3 FY26", revenue: 242000, netProfit: 18040, operatingProfit: 41200, debt: 198000, cashFlow: 16100 },
      { period: "Q4 FY26", revenue: 248500, netProfit: 18950, operatingProfit: 42900, debt: 195000, cashFlow: 17600 }
    ],
    annualResults: [
      { period: "FY23", revenue: 877835, netProfit: 66702, operatingProfit: 142115, debt: 224000, cashFlow: 58900 },
      { period: "FY24", revenue: 914458, netProfit: 69624, operatingProfit: 154670, debt: 218000, cashFlow: 63200 },
      { period: "FY25", revenue: 955300, netProfit: 72400, operatingProfit: 162900, debt: 205000, cashFlow: 68100 },
      { period: "FY26", revenue: 981500, netProfit: 74900, operatingProfit: 171500, debt: 195000, cashFlow: 71500 }
    ],
    technicals: {
      rsi: 58.4,
      macd: { macdLine: 12.4, signalLine: 8.2, histogram: 4.2 },
      movingAverages: { sma50: 2410.50, ema200: 2380.10 },
      volumeBreakout: true,
      support: 2400.00,
      resistance: 2510.00,
      trendStrength: "Bullish"
    },
    charts: {
      "1D": generateHistoricalPrices(2462.40, 28, 0.015, 0.003, "1D"),
      "1W": generateHistoricalPrices(2462.40, 5, 0.02, 0.008, "1W"),
      "1M": generateHistoricalPrices(2462.40, 30, 0.031, 0.012, "1M"),
      "1Y": generateHistoricalPrices(2462.40, 12, 0.12, 0.025, "1Y"),
      "5Y": generateHistoricalPrices(2462.40, 20, 0.45, 0.06, "5Y")
    }
  },
  {
    symbol: "TCS",
    name: "Tata Consultancy Services Limited",
    sector: "IT",
    exchange: "NSE",
    price: 3885.50,
    change: -45.20,
    changePercent: -1.15,
    prevClose: 3930.70,
    volume: 1824550,
    dayHigh: 3950.00,
    dayLow: 3870.15,
    yearHigh: 4252.00,
    yearLow: 3150.00,
    about: "Tata Consultancy Services Limited is an Indian multinational information technology services and consulting company. It is a part of the Tata Group and operates in 150 locations across 46 countries.",
    fundamentals: {
      marketCap: 1421450,
      bookValue: 315.80,
      peRatio: 29.80,
      pbRatio: 12.30,
      eps: 130.40,
      roe: 46.50,
      roce: 58.90,
      dividendYield: 1.25,
      debtToEquity: 0.03
    },
    shareholding: [
      { quarter: "Jun 25", promoters: 72.41, fii: 12.35, dii: 9.80, mutualFunds: 3.40, public: 5.44 },
      { quarter: "Sep 25", promoters: 72.41, fii: 12.44, dii: 9.75, mutualFunds: 3.42, public: 5.40 },
      { quarter: "Dec 25", promoters: 72.41, fii: 12.20, dii: 9.90, mutualFunds: 3.55, public: 5.49 },
      { quarter: "Mar 26", promoters: 72.41, fii: 12.55, dii: 9.68, mutualFunds: 3.61, public: 5.36 }
    ],
    quarterlyResults: [
      { period: "Q1 FY26", revenue: 60500, netProfit: 11900, operatingProfit: 15100, debt: 2000, cashFlow: 10200 },
      { period: "Q2 FY26", revenue: 61800, netProfit: 12150, operatingProfit: 15450, debt: 1950, cashFlow: 10800 },
      { period: "Q3 FY26", revenue: 62400, netProfit: 12300, operatingProfit: 15600, debt: 1900, cashFlow: 11100 },
      { period: "Q4 FY26", revenue: 63500, netProfit: 12620, operatingProfit: 15950, debt: 1800, cashFlow: 12000 }
    ],
    annualResults: [
      { period: "FY23", revenue: 225458, netProfit: 42147, operatingProfit: 56150, debt: 2200, cashFlow: 38200 },
      { period: "FY24", revenue: 240890, netProfit: 46580, operatingProfit: 60800, debt: 2100, cashFlow: 41400 },
      { period: "FY25", revenue: 251500, netProfit: 48900, operatingProfit: 63500, debt: 1950, cashFlow: 44200 },
      { period: "FY26", revenue: 260200, netProfit: 51200, operatingProfit: 66200, debt: 1800, cashFlow: 47100 }
    ],
    technicals: {
      rsi: 42.1,
      macd: { macdLine: -15.2, signalLine: -5.4, histogram: -9.8 },
      movingAverages: { sma50: 3995.00, ema200: 3810.20 },
      volumeBreakout: false,
      support: 3850.00,
      resistance: 4050.00,
      trendStrength: "Bearish"
    },
    charts: {
      "1D": generateHistoricalPrices(3885.50, 28, -0.012, 0.004, "1D"),
      "1W": generateHistoricalPrices(3885.50, 5, -0.024, 0.007, "1W"),
      "1M": generateHistoricalPrices(3885.50, 30, -0.045, 0.015, "1M"),
      "1Y": generateHistoricalPrices(3885.50, 12, 0.10, 0.03, "1Y"),
      "5Y": generateHistoricalPrices(3885.50, 20, 0.72, 0.05, "5Y")
    }
  },
  {
    symbol: "HDFCBANK",
    name: "HDFC Bank Limited",
    sector: "Banking",
    exchange: "NSE",
    price: 1612.80,
    change: 14.50,
    changePercent: 0.91,
    prevClose: 1598.30,
    volume: 12480119,
    dayHigh: 1622.00,
    dayLow: 1595.00,
    yearHigh: 1798.00,
    yearLow: 1360.00,
    about: "HDFC Bank Limited is an Indian banking and financial services company headquartered in Mumbai. It is India's largest private sector bank by assets and the world's tenth-largest bank by market capitalization.",
    fundamentals: {
      marketCap: 1224850,
      bookValue: 580.40,
      peRatio: 18.20,
      pbRatio: 2.78,
      eps: 88.60,
      roe: 16.40,
      roce: 18.20,
      dividendYield: 1.18,
      debtToEquity: 1.25 // Standard higher debt to equity for banking deposits structure
    },
    shareholding: [
      { quarter: "Jun 25", promoters: 0, fii: 48.20, dii: 32.40, mutualFunds: 18.50, public: 19.40 },
      { quarter: "Sep 25", promoters: 0, fii: 47.95, dii: 32.80, mutualFunds: 18.90, public: 19.25 },
      { quarter: "Dec 25", promoters: 0, fii: 47.50, dii: 33.10, mutualFunds: 19.12, public: 19.40 },
      { quarter: "Mar 26", promoters: 0, fii: 48.05, dii: 32.90, mutualFunds: 19.34, public: 19.05 }
    ],
    quarterlyResults: [
      { period: "Q1 FY26", revenue: 42500, netProfit: 16200, operatingProfit: 21500, debt: 154000, cashFlow: 18900 },
      { period: "Q2 FY26", revenue: 43200, netProfit: 16800, operatingProfit: 22100, debt: 159000, cashFlow: 20100 },
      { period: "Q3 FY26", revenue: 44500, netProfit: 17350, operatingProfit: 22900, debt: 164000, cashFlow: 21400 },
      { period: "Q4 FY26", revenue: 45600, netProfit: 18100, operatingProfit: 23600, debt: 168000, cashFlow: 23000 }
    ],
    annualResults: [
      { period: "FY23", revenue: 161580, netProfit: 44100, operatingProfit: 71200, debt: 135000, cashFlow: 54100 },
      { period: "FY24", revenue: 172400, netProfit: 48200, operatingProfit: 76400, debt: 148000, cashFlow: 58300 },
      { period: "FY25", revenue: 181500, netProfit: 51900, operatingProfit: 81800, debt: 159000, cashFlow: 62400 },
      { period: "FY26", revenue: 192000, netProfit: 55400, operatingProfit: 86400, debt: 168000, cashFlow: 67100 }
    ],
    technicals: {
      rsi: 54.8,
      macd: { macdLine: 4.8, signalLine: 3.1, histogram: 1.7 },
      movingAverages: { sma50: 1585.00, ema200: 1520.40 },
      volumeBreakout: false,
      support: 1580.00,
      resistance: 1650.00,
      trendStrength: "Neutral"
    },
    charts: {
      "1D": generateHistoricalPrices(1612.80, 28, 0.008, 0.003, "1D"),
      "1W": generateHistoricalPrices(1612.80, 5, 0.012, 0.005, "1W"),
      "1M": generateHistoricalPrices(1612.80, 30, 0.024, 0.01, "1M"),
      "1Y": generateHistoricalPrices(1612.80, 12, 0.08, 0.02, "1Y"),
      "5Y": generateHistoricalPrices(1612.80, 20, 0.40, 0.04, "5Y")
    }
  },
  {
    symbol: "INFOSYS",
    name: "Infosys Limited",
    sector: "IT",
    exchange: "NSE",
    price: 1545.90,
    change: 22.80,
    changePercent: 1.50,
    prevClose: 1523.10,
    volume: 3840122,
    dayHigh: 1555.00,
    dayLow: 1515.20,
    yearHigh: 1762.00,
    yearLow: 1220.00,
    about: "Infosys Limited is an Indian multinational information technology company that provides business consulting, information technology and outsourcing services. The company was founded in Pune and is headquartered in Bangalore.",
    fundamentals: {
      marketCap: 641500,
      bookValue: 185.20,
      peRatio: 24.10,
      pbRatio: 8.35,
      eps: 64.15,
      roe: 31.80,
      roce: 40.50,
      dividendYield: 2.13,
      debtToEquity: 0.05
    },
    shareholding: [
      { quarter: "Jun 25", promoters: 14.90, fii: 33.40, dii: 35.80, mutualFunds: 18.20, public: 15.90 },
      { quarter: "Sep 25", promoters: 14.90, fii: 33.15, dii: 36.10, mutualFunds: 18.45, public: 15.85 },
      { quarter: "Dec 25", promoters: 14.90, fii: 32.85, dii: 36.40, mutualFunds: 18.90, public: 15.85 },
      { quarter: "Mar 26", promoters: 14.90, fii: 33.55, dii: 35.80, mutualFunds: 19.12, public: 15.75 }
    ],
    quarterlyResults: [
      { period: "Q1 FY26", revenue: 38200, netProfit: 6200, operatingProfit: 8100, debt: 1100, cashFlow: 5400 },
      { period: "Q2 FY26", revenue: 39100, netProfit: 6410, operatingProfit: 8350, debt: 1050, cashFlow: 5800 },
      { period: "Q3 FY26", revenue: 40400, netProfit: 6720, operatingProfit: 8680, debt: 1000, cashFlow: 6150 },
      { period: "Q4 FY26", revenue: 41200, netProfit: 6980, operatingProfit: 8900, debt: 950, cashFlow: 6605 }
    ],
    annualResults: [
      { period: "FY23", revenue: 146767, netProfit: 24108, operatingProfit: 32150, debt: 1200, cashFlow: 21800 },
      { period: "FY24", revenue: 153670, netProfit: 26230, operatingProfit: 34100, debt: 1100, cashFlow: 23200 },
      { period: "FY25", revenue: 161800, netProfit: 27950, operatingProfit: 36200, debt: 1050, cashFlow: 25400 },
      { period: "FY26", revenue: 169000, netProfit: 29800, operatingProfit: 38500, debt: 950, cashFlow: 27900 }
    ],
    technicals: {
      rsi: 61.2,
      macd: { macdLine: 8.4, signalLine: 5.2, histogram: 3.2 },
      movingAverages: { sma50: 1515.00, ema200: 1485.40 },
      volumeBreakout: true,
      support: 1490.00,
      resistance: 1580.00,
      trendStrength: "High Momentum"
    },
    charts: {
      "1D": generateHistoricalPrices(1545.90, 28, 0.014, 0.003, "1D"),
      "1W": generateHistoricalPrices(1545.90, 5, 0.02, 0.006, "1W"),
      "1M": generateHistoricalPrices(1545.90, 30, 0.042, 0.011, "1M"),
      "1Y": generateHistoricalPrices(1545.90, 12, 0.12, 0.022, "1Y"),
      "5Y": generateHistoricalPrices(1545.90, 20, 0.58, 0.045, "5Y")
    }
  },
  {
    symbol: "TATAMOTORS",
    name: "Tata Motors Limited",
    sector: "Auto",
    exchange: "NSE",
    price: 942.15,
    change: 18.65,
    changePercent: 2.02,
    prevClose: 923.50,
    volume: 8140455,
    dayHigh: 948.00,
    dayLow: 918.50,
    yearHigh: 1065.00,
    yearLow: 495.00,
    about: "Tata Motors Limited is an Indian multinational automotive manufacturing company, headquartered in Mumbai. It is a part of the Tata Group and produces passenger cars, trucks, vans, coaches, and buses.",
    fundamentals: {
      marketCap: 345240,
      bookValue: 145.20,
      peRatio: 16.50,
      pbRatio: 6.48,
      eps: 57.10,
      roe: 39.20,
      roce: 32.10,
      dividendYield: 0.64,
      debtToEquity: 0.85
    },
    shareholding: [
      { quarter: "Jun 25", promoters: 46.36, fii: 18.40, dii: 17.50, mutualFunds: 6.90, public: 17.74 },
      { quarter: "Sep 25", promoters: 46.36, fii: 18.25, dii: 17.80, mutualFunds: 7.15, public: 17.59 },
      { quarter: "Dec 25", promoters: 46.36, fii: 18.02, dii: 18.05, mutualFunds: 7.40, public: 17.57 },
      { quarter: "Mar 26", promoters: 46.36, fii: 18.50, dii: 17.90, mutualFunds: 7.55, public: 17.24 }
    ],
    quarterlyResults: [
      { period: "Q1 FY26", revenue: 105000, netProfit: 5400, operatingProfit: 14200, debt: 34000, cashFlow: 6800 },
      { period: "Q2 FY26", revenue: 108500, netProfit: 5650, operatingProfit: 14900, debt: 32000, cashFlow: 7200 },
      { period: "Q3 FY26", revenue: 112000, netProfit: 6020, operatingProfit: 15600, debt: 28000, cashFlow: 7650 },
      { period: "Q4 FY26", revenue: 115400, netProfit: 6310, operatingProfit: 16100, debt: 24500, cashFlow: 8200 }
    ],
    annualResults: [
      { period: "FY23", revenue: 345967, netProfit: 2414, operatingProfit: 31800, debt: 52000, cashFlow: 14500 },
      { period: "FY24", revenue: 421530, netProfit: 31100, operatingProfit: 58200, debt: 41000, cashFlow: 22100 },
      { period: "FY25", revenue: 442000, netProfit: 34500, operatingProfit: 62400, debt: 32000, cashFlow: 25800 },
      { period: "FY26", revenue: 460900, netProfit: 36800, operatingProfit: 66800, debt: 24500, cashFlow: 29400 }
    ],
    technicals: {
      rsi: 68.5,
      macd: { macdLine: 28.5, signalLine: 21.2, histogram: 7.3 },
      movingAverages: { sma50: 912.40, ema200: 840.15 },
      volumeBreakout: true,
      support: 910.00,
      resistance: 965.00,
      trendStrength: "Bullish"
    },
    charts: {
      "1D": generateHistoricalPrices(942.15, 28, 0.02, 0.005, "1D"),
      "1W": generateHistoricalPrices(942.15, 5, 0.035, 0.01, "1W"),
      "1M": generateHistoricalPrices(942.15, 30, 0.07, 0.02, "1M"),
      "1Y": generateHistoricalPrices(942.15, 12, 0.28, 0.04, "1Y"),
      "5Y": generateHistoricalPrices(942.15, 20, 1.15, 0.08, "5Y")
    }
  },
  {
    symbol: "ICICIBANK",
    name: "ICICI Bank Limited",
    sector: "Banking",
    exchange: "NSE",
    price: 1120.40,
    change: -8.10,
    changePercent: -0.72,
    prevClose: 1128.50,
    volume: 5124010,
    dayHigh: 1135.00,
    dayLow: 1118.00,
    yearHigh: 1198.00,
    yearLow: 890.00,
    about: "ICICI Bank Limited is an Indian multinational bank and financial services company headquartered in Bangalore. It offers a wide range of banking products and financial services for corporate and retail customers.",
    fundamentals: {
      marketCap: 785400,
      bookValue: 325.20,
      peRatio: 17.40,
      pbRatio: 3.44,
      eps: 64.38,
      roe: 18.50,
      roce: 19.80,
      dividendYield: 0.89,
      debtToEquity: 1.12
    },
    shareholding: [
      { quarter: "Jun 25", promoters: 0, fii: 44.50, dii: 45.20, mutualFunds: 28.40, public: 10.30 },
      { quarter: "Sep 25", promoters: 0, fii: 44.20, dii: 45.55, mutualFunds: 28.70, public: 10.25 },
      { quarter: "Dec 25", promoters: 0, fii: 43.90, dii: 45.90, mutualFunds: 29.10, public: 10.20 },
      { quarter: "Mar 26", promoters: 0, fii: 44.15, dii: 45.68, mutualFunds: 29.28, public: 10.17 }
    ],
    quarterlyResults: [
      { period: "Q1 FY26", revenue: 32000, netProfit: 10100, operatingProfit: 14500, debt: 98000, cashFlow: 11200 },
      { period: "Q2 FY26", revenue: 32900, netProfit: 10450, operatingProfit: 14900, debt: 102000, cashFlow: 11800 },
      { period: "Q3 FY26", revenue: 33800, netProfit: 10890, operatingProfit: 15400, debt: 105000, cashFlow: 12400 },
      { period: "Q4 FY26", revenue: 34900, netProfit: 11250, operatingProfit: 15950, debt: 108000, cashFlow: 13300 }
    ],
    annualResults: [
      { period: "FY23", revenue: 112500, netProfit: 31890, operatingProfit: 48200, debt: 89000, cashFlow: 35100 },
      { period: "FY24", revenue: 124800, netProfit: 36700, operatingProfit: 53500, debt: 98000, cashFlow: 39400 },
      { period: "FY25", revenue: 132600, netProfit: 40800, operatingProfit: 58900, debt: 105000, cashFlow: 42100 },
      { period: "FY26", revenue: 141200, netProfit: 44500, operatingProfit: 62400, debt: 108000, cashFlow: 45800 }
    ],
    technicals: {
      rsi: 48.2,
      macd: { macdLine: -1.2, signalLine: 0.5, histogram: -1.7 },
      movingAverages: { sma50: 1132.00, ema200: 1080.40 },
      volumeBreakout: false,
      support: 1110.00,
      resistance: 1150.00,
      trendStrength: "Neutral"
    },
    charts: {
      "1D": generateHistoricalPrices(1120.40, 28, -0.004, 0.003, "1D"),
      "1W": generateHistoricalPrices(1120.40, 5, -0.008, 0.006, "1W"),
      "1M": generateHistoricalPrices(1120.40, 30, -0.015, 0.012, "1M"),
      "1Y": generateHistoricalPrices(1120.40, 12, 0.12, 0.024, "1Y"),
      "5Y": generateHistoricalPrices(1120.40, 20, 0.52, 0.05, "5Y")
    }
  },
  {
    symbol: "SUNPHARMA",
    name: "Sun Pharmaceutical Industries Limited",
    sector: "Pharma",
    exchange: "NSE",
    price: 1425.60,
    change: 12.30,
    changePercent: 0.87,
    prevClose: 1413.30,
    volume: 1489020,
    dayHigh: 1432.00,
    dayLow: 1410.00,
    yearHigh: 1618.00,
    yearLow: 960.00,
    about: "Sun Pharmaceutical Industries Limited is an Indian multinational pharmaceutical company headquartered in Mumbai, Maharashtra, that manufactures and sells pharmaceutical formulations and active pharmaceutical ingredients.",
    fundamentals: {
      marketCap: 341500,
      bookValue: 275.40,
      peRatio: 36.50,
      pbRatio: 5.18,
      eps: 39.10,
      roe: 14.80,
      roce: 16.50,
      dividendYield: 0.70,
      debtToEquity: 0.02
    },
    shareholding: [
      { quarter: "Jun 25", promoters: 54.48, fii: 17.20, dii: 19.50, mutualFunds: 12.10, public: 8.82 },
      { quarter: "Sep 25", promoters: 54.48, fii: 17.15, dii: 19.70, mutualFunds: 12.34, public: 8.67 },
      { quarter: "Dec 25", promoters: 54.48, fii: 16.90, dii: 20.10, mutualFunds: 12.60, public: 8.52 },
      { quarter: "Mar 26", promoters: 54.48, fii: 17.35, dii: 19.80, mutualFunds: 12.45, public: 8.37 }
    ],
    quarterlyResults: [
      { period: "Q1 FY26", revenue: 11200, netProfit: 2300, operatingProfit: 3100, debt: 150, cashFlow: 1900 },
      { period: "Q2 FY26", revenue: 11500, netProfit: 2420, operatingProfit: 3200, debt: 140, cashFlow: 2050 },
      { period: "Q3 FY26", revenue: 11900, netProfit: 2560, operatingProfit: 3340, debt: 120, cashFlow: 2200 },
      { period: "Q4 FY26", revenue: 12200, netProfit: 2680, operatingProfit: 3450, debt: 110, cashFlow: 2350 }
    ],
    annualResults: [
      { period: "FY23", revenue: 43200, netProfit: 8470, operatingProfit: 11600, debt: 200, cashFlow: 7400 },
      { period: "FY24", revenue: 45800, netProfit: 9550, operatingProfit: 12800, debt: 180, cashFlow: 8200 },
      { period: "FY25", revenue: 48200, netProfit: 10400, operatingProfit: 13900, debt: 150, cashFlow: 8900 },
      { period: "FY26", revenue: 50400, netProfit: 11200, operatingProfit: 14800, debt: 110, cashFlow: 9600 }
    ],
    technicals: {
      rsi: 52.4,
      macd: { macdLine: 1.5, signalLine: 1.1, histogram: 0.4 },
      movingAverages: { sma50: 1412.50, ema200: 1360.20 },
      volumeBreakout: false,
      support: 1395.00,
      resistance: 1450.00,
      trendStrength: "Neutral"
    },
    charts: {
      "1D": generateHistoricalPrices(1425.60, 28, 0.005, 0.002, "1D"),
      "1W": generateHistoricalPrices(1425.60, 5, 0.01, 0.005, "1W"),
      "1M": generateHistoricalPrices(1425.60, 30, 0.02, 0.01, "1M"),
      "1Y": generateHistoricalPrices(1425.60, 12, 0.15, 0.02, "1Y"),
      "5Y": generateHistoricalPrices(1425.60, 20, 0.65, 0.04, "5Y")
    }
  },
  {
    symbol: "ITC",
    name: "ITC Limited",
    sector: "FMCG",
    exchange: "NSE",
    price: 432.15,
    change: 1.25,
    changePercent: 0.29,
    prevClose: 430.90,
    volume: 11245902,
    dayHigh: 435.00,
    dayLow: 429.50,
    yearHigh: 499.00,
    yearLow: 395.00,
    about: "ITC Limited is an Indian conglomerate company headquartered in Kolkata. ITC has a diversified presence across industries such as FMCG (Fast Moving Consumer Goods), hotels, software, packaging, paperboards, specialty papers, and agribusiness.",
    fundamentals: {
      marketCap: 538400,
      bookValue: 62.40,
      peRatio: 26.40,
      pbRatio: 6.92,
      eps: 16.35,
      roe: 27.80,
      roce: 36.10,
      dividendYield: 3.12,
      debtToEquity: 0.00
    },
    shareholding: [
      { quarter: "Jun 25", promoters: 0, fii: 43.15, dii: 41.50, mutualFunds: 9.80, public: 15.35 },
      { quarter: "Sep 25", promoters: 0, fii: 43.05, dii: 41.70, mutualFunds: 9.94, public: 15.25 },
      { quarter: "Dec 25", promoters: 0, fii: 42.80, dii: 42.10, mutualFunds: 10.12, public: 15.10 },
      { quarter: "Mar 26", promoters: 0, fii: 43.25, dii: 41.80, mutualFunds: 10.25, public: 14.95 }
    ],
    quarterlyResults: [
      { period: "Q1 FY26", revenue: 17500, netProfit: 4900, operatingProfit: 6200, debt: 0, cashFlow: 4400 },
      { period: "Q2 FY26", revenue: 18100, netProfit: 5080, operatingProfit: 6450, debt: 0, cashFlow: 4620 },
      { period: "Q3 FY26", revenue: 18900, netProfit: 5240, operatingProfit: 6710, debt: 0, cashFlow: 4850 },
      { period: "Q4 FY26", revenue: 19500, netProfit: 5490, operatingProfit: 6980, debt: 0, cashFlow: 5120 }
    ],
    annualResults: [
      { period: "FY23", revenue: 69400, netProfit: 18750, operatingProfit: 23900, debt: 0, cashFlow: 16400 },
      { period: "FY24", revenue: 71200, netProfit: 19400, operatingProfit: 24700, debt: 0, cashFlow: 17100 },
      { period: "FY25", revenue: 74500, netProfit: 20800, operatingProfit: 26300, debt: 0, cashFlow: 18500 },
      { period: "FY26", revenue: 77800, netProfit: 21900, operatingProfit: 28100, debt: 0, cashFlow: 19800 }
    ],
    technicals: {
      rsi: 44.5,
      macd: { macdLine: -0.4, signalLine: 0.1, histogram: -0.5 },
      movingAverages: { sma50: 435.50, ema200: 425.20 },
      volumeBreakout: false,
      support: 424.00,
      resistance: 442.00,
      trendStrength: "Neutral"
    },
    charts: {
      "1D": generateHistoricalPrices(432.15, 28, 0.002, 0.001, "1D"),
      "1W": generateHistoricalPrices(432.15, 5, 0.004, 0.002, "1W"),
      "1M": generateHistoricalPrices(432.15, 30, -0.008, 0.006, "1M"),
      "1Y": generateHistoricalPrices(432.15, 12, 0.05, 0.015, "1Y"),
      "5Y": generateHistoricalPrices(432.15, 20, 0.38, 0.035, "5Y")
    }
  },
  {
    symbol: "HINDUNILVR",
    name: "Hindustan Unilever Limited",
    sector: "FMCG",
    exchange: "NSE",
    price: 2345.80,
    change: -15.40,
    changePercent: -0.65,
    prevClose: 2361.20,
    volume: 1250100,
    dayHigh: 2372.00,
    dayLow: 2335.00,
    yearHigh: 2720.00,
    yearLow: 2170.00,
    about: "Hindustan Unilever Limited is a consumer goods company headquartered in Mumbai. It is a subsidiary of Unilever, a British company. Its products include foods, beverages, cleaning agents, personal care products, and water purifiers.",
    fundamentals: {
      marketCap: 551200,
      bookValue: 215.40,
      peRatio: 52.10,
      pbRatio: 10.88,
      eps: 45.02,
      roe: 20.80,
      roce: 26.50,
      dividendYield: 1.82,
      debtToEquity: 0.00
    },
    shareholding: [
      { quarter: "Jun 25", promoters: 61.90, fii: 13.90, dii: 12.80, mutualFunds: 4.80, public: 11.40 },
      { quarter: "Sep 25", promoters: 61.90, fii: 13.72, dii: 13.10, mutualFunds: 4.90, public: 11.28 },
      { quarter: "Dec 25", promoters: 61.90, fii: 13.44, dii: 13.35, mutualFunds: 5.12, public: 11.31 },
      { quarter: "Mar 26", promoters: 61.90, fii: 13.82, dii: 13.12, mutualFunds: 5.18, public: 11.16 }
    ],
    quarterlyResults: [
      { period: "Q1 FY26", revenue: 15200, netProfit: 2510, operatingProfit: 3510, debt: 0, cashFlow: 2200 },
      { period: "Q2 FY26", revenue: 15450, netProfit: 2590, operatingProfit: 3590, debt: 0, cashFlow: 2350 },
      { period: "Q3 FY26", revenue: 16100, netProfit: 2680, operatingProfit: 3720, debt: 0, cashFlow: 2480 },
      { period: "Q4 FY26", revenue: 16400, netProfit: 2790, operatingProfit: 3810, debt: 0, cashFlow: 2620 }
    ],
    annualResults: [
      { period: "FY23", revenue: 59144, netProfit: 10143, operatingProfit: 13600, debt: 0, cashFlow: 8900 },
      { period: "FY24", revenue: 61800, netProfit: 10240, operatingProfit: 14100, debt: 0, cashFlow: 9400 },
      { period: "FY25", revenue: 64500, netProfit: 10700, operatingProfit: 14850, debt: 0, cashFlow: 10100 },
      { period: "FY26", revenue: 66400, netProfit: 11150, operatingProfit: 15500, debt: 0, cashFlow: 10800 }
    ],
    technicals: {
      rsi: 39.8,
      macd: { macdLine: -12.4, signalLine: -8.1, histogram: -4.3 },
      movingAverages: { sma50: 2420.00, ema200: 2410.50 },
      volumeBreakout: false,
      support: 2300.00,
      resistance: 2420.00,
      trendStrength: "Bearish"
    },
    charts: {
      "1D": generateHistoricalPrices(2345.80, 28, -0.006, 0.002, "1D"),
      "1W": generateHistoricalPrices(2345.80, 5, -0.015, 0.004, "1W"),
      "1M": generateHistoricalPrices(2345.80, 30, -0.032, 0.01, "1M"),
      "1Y": generateHistoricalPrices(2345.80, 12, 0.05, 0.02, "1Y"),
      "5Y": generateHistoricalPrices(2345.80, 20, 0.28, 0.035, "5Y")
    }
  },
  {
    symbol: "LT",
    name: "Larsen & Toubro Limited",
    sector: "Energy", // Fits EPC Infrastructure and renewables/energy sector representation
    exchange: "NSE",
    price: 3392.10,
    change: 54.30,
    changePercent: 1.63,
    prevClose: 3337.80,
    volume: 1982455,
    dayHigh: 3410.00,
    dayLow: 3328.00,
    yearHigh: 3890.00,
    yearLow: 2150.00,
    about: "Larsen & Toubro Limited, commonly known as L&T, is an Indian multinational conglomerate company, with business interests in engineering, construction, manufacturing, technology, information technology and financial services.",
    fundamentals: {
      marketCap: 476480,
      bookValue: 712.50,
      peRatio: 35.50,
      pbRatio: 4.76,
      eps: 95.54,
      roe: 14.15,
      roce: 18.32,
      dividendYield: 0.85,
      debtToEquity: 0.72
    },
    shareholding: [
      { quarter: "Jun 25", promoters: 0, fii: 24.30, dii: 38.50, mutualFunds: 21.40, public: 37.20 },
      { quarter: "Sep 25", promoters: 0, fii: 24.05, dii: 38.80, mutualFunds: 21.82, public: 37.15 },
      { quarter: "Dec 25", promoters: 0, fii: 23.85, dii: 39.12, mutualFunds: 22.04, public: 37.03 },
      { quarter: "Mar 26", promoters: 0, fii: 24.55, dii: 38.68, mutualFunds: 22.25, public: 36.77 }
    ],
    quarterlyResults: [
      { period: "Q1 FY26", revenue: 48500, netProfit: 3100, operatingProfit: 5400, debt: 42000, cashFlow: 3800 },
      { period: "Q2 FY26", revenue: 49800, netProfit: 3250, operatingProfit: 5650, debt: 41000, cashFlow: 4120 },
      { period: "Q3 FY26", revenue: 51200, netProfit: 3450, operatingProfit: 5900, debt: 39500, cashFlow: 4450 },
      { period: "Q4 FY26", revenue: 53500, netProfit: 3780, operatingProfit: 6240, debt: 38000, cashFlow: 4940 }
    ],
    annualResults: [
      { period: "FY23", revenue: 183300, netProfit: 10471, operatingProfit: 20700, debt: 49000, cashFlow: 14100 },
      { period: "FY24", revenue: 204300, netProfit: 13054, operatingProfit: 23500, debt: 45000, cashFlow: 16800 },
      { period: "FY25", revenue: 218500, netProfit: 14200, operatingProfit: 25400, debt: 41000, cashFlow: 18900 },
      { period: "FY26", revenue: 231500, netProfit: 15200, operatingProfit: 27100, debt: 38000, cashFlow: 21200 }
    ],
    technicals: {
      rsi: 62.4,
      macd: { macdLine: 18.5, signalLine: 12.1, histogram: 6.4 },
      movingAverages: { sma50: 3315.00, ema200: 3080.15 },
      volumeBreakout: true,
      support: 3300.00,
      resistance: 3450.00,
      trendStrength: "Bullish"
    },
    charts: {
      "1D": generateHistoricalPrices(3392.10, 28, 0.016, 0.004, "1D"),
      "1W": generateHistoricalPrices(3392.10, 5, 0.022, 0.008, "1W"),
      "1M": generateHistoricalPrices(3392.10, 30, 0.048, 0.015, "1M"),
      "1Y": generateHistoricalPrices(3392.10, 12, 0.22, 0.03, "1Y"),
      "5Y": generateHistoricalPrices(3392.10, 20, 0.85, 0.055, "5Y")
    }
  }
];

// Realistic News Seed Data
export const NEWS_DATA: NewsItem[] = [
  {
    id: "news_1",
    title: "Reliance Extends Green Energy Inroads, Secures New Solar Grid Contract",
    summary: "Reliance Industries has won a commercial bid to deploy 5GW solar grid infrastructure under the new government tender scheme, expanding its clean energy project portfolio.",
    source: "Financial Bulletin",
    time: "2 hours ago",
    category: "Corporate Announcement",
    relatedSymbols: ["RELIANCE"]
  },
  {
    id: "news_2",
    title: "TCS Secures $1.5 Billion Cloud Digital Transformation Deal with UK Retail Leader",
    summary: "Tata Consultancy Services announced a multi-year partnership with one of the UK's leading retail brands for hybrid cloud engineering and artificial intelligence optimization.",
    source: "Newswire IT",
    time: "4 hours ago",
    category: "Corporate Announcement",
    relatedSymbols: ["TCS"]
  },
  {
    id: "news_3",
    title: "HDFC Bank Announces Quarterly Board Review for Interim Dividend Option",
    summary: "The Board of Directors of HDFC Bank is scheduled to meet next month to evaluate financial metrics and deliberate on an interim dividend payment for FY26.",
    source: "National Stock Desk",
    time: "1 day ago",
    category: "Dividend",
    relatedSymbols: ["HDFCBANK"]
  },
  {
    id: "news_4",
    title: "IT Sector Sentiment Muted Amid Soft Enterprise Discretionary IT Spend Concerns",
    summary: "Leading tech firms Infosys and TCS trade mixed as analysts highlight localized high-frequency client metrics pointing to selective IT project deferrals in Europe.",
    source: "Macroeconomic Review",
    time: "1 day ago",
    category: "General",
    relatedSymbols: ["TCS", "INFOSYS"]
  },
  {
    id: "news_5",
    title: "Tata Motors Commercial Vehicle Unit Secures Mammoth Fleet Order from State Transport",
    summary: "Tata Motors Automotive divisions won the state tender to deliver 2,500 fuel-cell and electric urban buses for regional transit upgrades, bolstering order book visibilities.",
    source: "Automotive World",
    time: "2 days ago",
    category: "Corporate Announcement",
    relatedSymbols: ["TATAMOTORS"]
  },
  {
    id: "news_6",
    title: "Sun Pharma Obtains US FDA Custom Compliance Approval for Key Formulation Facility",
    summary: "Sun Pharmaceutical Industries Limited reported US FDA clearance status with zero major observations for its primary formulations plant, clearing export channels.",
    source: "Pharma Chronicle",
    time: "2 days ago",
    category: "Results",
    relatedSymbols: ["SUNPHARMA"]
  },
  {
    id: "news_7",
    title: "ITC Extends Agri-Sourcing Footprint to Boost FMCG Ingredient Margin Resilience",
    summary: "ITC Limited announced localized e-Choupal platform expansions for millet and grain sourcing, reducing supply chain friction and hedging raw material input costs.",
    source: "FMCG Tracker",
    time: "3 days ago",
    category: "Corporate Action",
    relatedSymbols: ["ITC"]
  },
  {
    id: "news_8",
    title: "L&T Infrastructure Business Awarded High-Speed Rail Corridor Bid worth 8,500 Crores",
    summary: "The construction arm of Larsen & Toubro got a major engineering mandate to construct the southern section of the suburban bullet train network projects.",
    source: "Infrastructure Live",
    time: "3 days ago",
    category: "Corporate Announcement",
    relatedSymbols: ["LT"]
  }
];

// Industrial Sector Performance metrics
export const SECTOR_DATA: SectorMetric[] = [
  {
    name: "Banking",
    stocksCount: 2,
    changePercent: 0.12,
    gainer: { symbol: "HDFCBANK", changePercent: 0.91 },
    loser: { symbol: "ICICIBANK", changePercent: -0.72 },
    marketCapPercent: 28.5
  },
  {
    name: "IT",
    stocksCount: 2,
    changePercent: 0.18,
    gainer: { symbol: "INFOSYS", changePercent: 1.50 },
    loser: { symbol: "TCS", changePercent: -1.15 },
    marketCapPercent: 22.4
  },
  {
    name: "Pharma",
    stocksCount: 1,
    changePercent: 0.87,
    gainer: { symbol: "SUNPHARMA", changePercent: 0.87 },
    loser: { symbol: "SUNPHARMA", changePercent: 0.87 },
    marketCapPercent: 7.2
  },
  {
    name: "Auto",
    stocksCount: 1,
    changePercent: 2.02,
    gainer: { symbol: "TATAMOTORS", changePercent: 2.02 },
    loser: { symbol: "TATAMOTORS", changePercent: 2.02 },
    marketCapPercent: 9.1
  },
  {
    name: "FMCG",
    stocksCount: 2,
    changePercent: -0.18,
    gainer: { symbol: "ITC", changePercent: 0.29 },
    loser: { symbol: "HINDUNILVR", changePercent: -0.65 },
    marketCapPercent: 18.5
  },
  {
    name: "Energy",
    stocksCount: 2,
    changePercent: 1.48,
    gainer: { symbol: "LT", changePercent: 1.63 },
    loser: { symbol: "RELIANCE", changePercent: 1.32 },
    marketCapPercent: 14.3
  }
];
