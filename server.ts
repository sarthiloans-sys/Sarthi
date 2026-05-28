/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Set up server-side JSON parsing
app.use(express.json());

// Initialize Gemini Client safely server-side
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;

if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
  try {
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  } catch (err) {
    console.error("Failed to initialize GoogleGenAI client:", err);
  }
}

// REST APIs
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Gemini educational explanation proxy API
app.post("/api/gemini/explain", async (req, res) => {
  const { stockName, stockSymbol, metrics, query } = req.body;

  if (!aiClient) {
    return res.status(503).json({
      error: "AI service is not initialized. Please verify your GEMINI_API_KEY is configured in Settings > Secrets.",
    });
  }

  try {
    const defaultInstruction = `You are a compliance-friendly Stock Market Academic and Technical Analyst.
CRITICAL MANDATES (LEGAL COMPLIANCE):
1. Under NO circumstances should you give direct investment advice such as "Buy", "Sell", "Strong Buy", or "Hold".
2. Under NO circumstances should you promise profits, give target prices, or advise portfolio weights.
3. You must explain technical indicators (like RSI, MACD, MA) and financial fundamentals (like PE Ratio, debt-to-equity, etc.) from a purely educational standpoint.
4. You must include a brief visible legal disclaimer note at the very end of your response, e.g.: "This explanation is for educational purposes only and does not constitute investment advice."
5. Speak objectively, professional, and clear. Maintain a high-trust academic research tone.`;

    let contentPrompt = "";
    if (stockName && stockSymbol) {
      contentPrompt = `Explain the educational significance of the stock "${stockName}" (${stockSymbol}) with the following metrics:
${JSON.stringify(metrics, null, 2)}
User Query or Interest: "${query || 'Provide an educational analysis of the fundamentals and technical setups.'}"
Analyze what these specific numbers imply academically about trend strength, momentum, financial safety and valuation multiples, without giving buy/sell guidance.`;
    } else {
      contentPrompt = query || "Explain what Relative Strength Index (RSI) is and how traders use it educationally.";
    }

    const response = await aiClient.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contentPrompt,
      config: {
        systemInstruction: defaultInstruction,
        temperature: 0.7,
      },
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini assistant proxy error:", error);
    res.status(500).json({ error: error?.message || "An error occurred with the AI Explanation Agent." });
  }
});

// In-memory fallback states for sandbox configurations when database is booting
let globalAdminConfig = {
  nseBseApiUrl: process.env.NSE_BSE_API_URL || "",
  nseBseApiKey: process.env.NSE_BSE_API_KEY ? "••••••••••••••••••••" : "",
  customBroadcastAlert: "Compliance safe sandbox: We are NOT SEBI Registered. No Buy, Sell, or Hold recommendations are issued. Live prices are simulated."
};

interface AdminNewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  category: string;
  createdAt: string;
}

let customNewsItems: AdminNewsItem[] = [];

// GET config
app.get("/api/market-config", (req, res) => {
  res.json(globalAdminConfig);
});

// POST update config
app.post("/api/market-config/update", (req, res) => {
  const { nseBseApiUrl, nseBseApiKey, customBroadcastAlert } = req.body;
  if (nseBseApiUrl !== undefined) globalAdminConfig.nseBseApiUrl = nseBseApiUrl;
  if (nseBseApiKey !== undefined && nseBseApiKey !== "••••••••••••••••••••") {
    globalAdminConfig.nseBseApiKey = nseBseApiKey ? "••••••••••••••••••••" : "";
    process.env.NSE_BSE_API_KEY = nseBseApiKey;
  }
  if (customBroadcastAlert !== undefined) globalAdminConfig.customBroadcastAlert = customBroadcastAlert;
  res.json({ success: true, config: globalAdminConfig });
});

// GET custom news posted by Admin
app.get("/api/admin/news", (req, res) => {
  res.json(customNewsItems);
});

// POST edit/add custom news
app.post("/api/admin/news", (req, res) => {
  const { title, summary, source, category } = req.body;
  if (!title || !summary) {
    return res.status(400).json({ error: "Headline title and summary are required." });
  }
  const newItem: AdminNewsItem = {
    id: `admin_news_${Date.now()}`,
    title,
    summary,
    source: source || "Admin Editorial Newsroom",
    category: category || "General",
    createdAt: new Date().toISOString()
  };
  customNewsItems.unshift(newItem);
  res.json({ success: true, item: newItem });
});

// DELETE individual custom news item
app.delete("/api/admin/news/:id", (req, res) => {
  const { id } = req.params;
  customNewsItems = customNewsItems.filter((item) => item.id !== id);
  res.json({ success: true, id });
});

// GET proxy live tickers
app.get("/api/live-market", async (req, res) => {
  const isUsingRealApi = !!(globalAdminConfig.nseBseApiUrl && process.env.NSE_BSE_API_KEY);
  
  if (isUsingRealApi) {
    try {
      // Act as a real API integration relay! Let's hit the target NSE/BSE endpoint with credentials hidden safely!
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000); // 4sec failfast timeout

      const response = await fetch(`${globalAdminConfig.nseBseApiUrl}/tickers`, {
        headers: {
          "Authorization": `Bearer ${process.env.NSE_BSE_API_KEY}`,
          "X-Api-Key": process.env.NSE_BSE_API_KEY || "",
          "Content-Type": "application/json"
        },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const liveTickData = await response.json();
        return res.json({
          source: "Real LIVE Market API Integration Proxy",
          data: liveTickData,
          status: "synced"
        });
      } else {
        throw new Error(`External API responded with code: ${response.status}`);
      }
    } catch (err: any) {
      console.warn("Real Market API contact failed, serving high-fidelity simulation fallback:", err?.message);
    }
  }

  // Gracefully degrade to our live mathematical simulator
  res.json({
    source: "High-Fidelity Offline Educational Feed",
    status: "simulated",
    lastProcessedTick: new Date().toISOString()
  });
});

// Serve assets and connect Vite middleware
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Vite runs in Middleware Mode for development.");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Serving static assets from /dist in Production Mode.");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Financial Terminal Server running on http://0.0.0.0:${PORT}`);
  });
}

setupVite().catch((err) => {
  console.error("Failed to start server and connect Vite:", err);
  process.exit(1);
});
