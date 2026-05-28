/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { StockData } from "../types";
import { Bot, Send, Sparkles, BookOpen, Clock } from "lucide-react";

interface EducationalAIProps {
  stock: StockData;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  time: string;
}

export default function EducationalAI({ stock }: EducationalAIProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `Hello! I am your SEBI-Compliant Market Scholar Assistant. 

I can explain the educational context of **${stock.name} (${stock.symbol})** ratios or technicals for you. For example, we can clarify:
- Deciphering what an **RSI of ${stock.technicals.rsi}** signifies.
- Analyzing their **Debt to Equity of ${stock.fundamentals.debtToEquity}**.
- Calculating what the **P/E Ratio of ${stock.fundamentals.peRatio}** implies about relative valuation.

How can I support your financial learning adventure today? *(Note: I provide data breakdowns only and never issue Buy/Sell instructions).*`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const presetQueries = [
    { label: "Explain current RSI setup", text: `What does ${stock.symbol}'s Relative Strength Index (RSI) of ${stock.technicals.rsi} mean educationally?` },
    { label: "Deconstruct P/E and Valuation", text: `Explain what a P/E of ${stock.fundamentals.peRatio} and P/B of ${stock.fundamentals.pbRatio} tells us about ${stock.symbol}'s valuation.` },
    { label: "Analyze Debt to Equity", text: `How safe is ${stock.symbol}'s Debt to Equity ratio of ${stock.fundamentals.debtToEquity}? Explain the debt-equity concept.` },
    { label: "Interpret MACD signal", text: `Explain the educational meaning of the MACD values for ${stock.symbol}: Line ${stock.technicals.macd.macdLine}, Signal ${stock.technicals.macd.signalLine}.` }
  ];

  const handleSendMessage = async (queryText: string) => {
    if (!queryText.trim() || isLoading) return;

    const userMsg: Message = {
      role: "user",
      content: queryText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    setInputMessage("");

    // Package current metrics so Gemini has rich context to perform real math & academic deductions
    const stockContextMetrics = {
      price: stock.price,
      changePercent: stock.changePercent,
      rsi: stock.technicals.rsi,
      macd: stock.technicals.macd,
      trend: stock.technicals.trendStrength,
      peRatio: stock.fundamentals.peRatio,
      pbRatio: stock.fundamentals.pbRatio,
      debtToEquity: stock.fundamentals.debtToEquity,
      roe: stock.fundamentals.roe,
      roce: stock.fundamentals.roce,
      dividendYield: stock.fundamentals.dividendYield
    };

    try {
      const response = await fetch("/api/gemini/explain", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          stockSymbol: stock.symbol,
          stockName: stock.name,
          metrics: stockContextMetrics,
          query: queryText
        }),
      });

      const data = await response.json();
      
      if (response.ok && data.text) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.text,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      } else {
        throw new Error(data.error || "Failed to receive AI explanation.");
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `⚠️ **Academic Assistant Offline**
          
I was unable to contact the server-side analysis core. This could mean the \`GEMINI_API_KEY\` is unconfigured or invalid, or the dev server was started without secrets.

You can still review all static metrics, charts, and technical alerts interactively in the panels!`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col h-[520px]">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-blue-600" />
          <h2 className="font-display font-bold text-lg text-slate-900 flex items-center gap-2">
            <span>Gemini Market Scholar</span>
          </h2>
        </div>
        <span className="text-[10px] bg-blue-50 text-blue-600 border border-blue-200 px-2 py-0.5 rounded font-semibold uppercase tracking-wide flex items-center gap-1">
          <Sparkles className="h-2.5 w-2.5" /> AI Academic Tutor
        </span>
      </div>

      {/* Messages Body */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 mb-4 text-xs font-sans">
        {messages.map((m, index) => (
          <div
            key={index}
            className={`flex flex-col max-w-[85%] ${
              m.role === "user" ? "ml-auto items-end" : "mr-auto items-start"
            }`}
          >
            {/* Header timestamp */}
            <span className="text-[9px] text-slate-400 font-mono mb-1 flex items-center gap-1 px-1">
              {m.role === "assistant" ? <Bot className="h-2.5 w-2.5 text-blue-500" /> : null}
              {m.role === "user" ? "You" : "Market Tutor"} • <Clock className="h-2 w-2" /> {m.time}
            </span>

            {/* Content box */}
            <div
              className={`p-3 rounded-lg leading-relaxed whitespace-pre-line ${
                m.role === "user"
                  ? "bg-blue-600 text-white font-medium"
                  : "bg-slate-50 border border-slate-200 text-slate-700"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex flex-col max-w-[80%] mr-auto items-start">
            <span className="text-[9px] text-slate-400 font-mono mb-1">
              Tutor is researching...
            </span>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center space-x-2 text-slate-500">
              <span className="h-2 w-2 bg-blue-600 rounded-full animate-bounce" />
              <span className="h-2 w-2 bg-blue-600 rounded-full animate-bounce [animation-delay:0.2s]" />
              <span className="h-2 w-2 bg-blue-600 rounded-full animate-bounce [animation-delay:0.4s]" />
              <span className="text-[10px] font-mono text-slate-400">Deconstructing technical frameworks...</span>
            </div>
          </div>
        )}
      </div>

      {/* Preset Fast Queries */}
      <div className="grid grid-cols-2 gap-1.5 mb-3">
        {presetQueries.map((pq, idx) => (
          <button
            key={idx}
            type="button"
            disabled={isLoading}
            onClick={() => handleSendMessage(pq.text)}
            className="text-[10px] text-left p-1.5 px-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 text-slate-500 hover:text-slate-850 transition rounded-lg truncate cursor-pointer select-none font-medium"
          >
            💡 {pq.label}
          </button>
        ))}
      </div>

      {/* Input box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage(inputMessage);
        }}
        className="flex gap-2 items-center"
      >
        <div className="relative flex-1">
          <input
            type="text"
            disabled={isLoading}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={`Ask about ${stock.symbol}'s financials or indicators...`}
            className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg p-2.5 pr-8 text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-slate-200"
          />
          <BookOpen className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
        </div>
        <button
          type="submit"
          disabled={isLoading || !inputMessage.trim()}
          className="p-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition cursor-pointer disabled:opacity-40 disabled:hover:bg-blue-600"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </form>
    </div>
  );
}
