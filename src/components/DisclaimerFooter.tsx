/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { AlertTriangle } from "lucide-react";

export default function DisclaimerFooter() {
  return (
    <footer className="bg-slate-900 text-slate-404 py-6 px-6 mt-12 text-[11px] leading-relaxed text-center border-t border-slate-800">
      <div className="max-w-6xl mx-auto space-y-3">
        <div className="flex items-center justify-center gap-1.5 text-slate-200 font-display font-semibold uppercase tracking-wider text-xs">
          <AlertTriangle className="h-4 w-4 text-emerald-500" />
          <span>Mandatory Educational Compliance Declaration</span>
        </div>
        <p className="text-slate-404 max-w-4xl mx-auto block leading-normal">
          This application is purely for <strong>educational and informational purposes only</strong>. We are <strong>not a SEBI (Securities and Exchange Board of India) registered</strong> investment advisor, research analyst, or broker. Interventions, RSI/MACD indices, alerts, or charts generated within this workspace represent mathematics lessons for historical learning. They are <strong className="text-emerald-400">NOT recommendations to buy, sell, or hold actual securities.</strong> All stock values are simulated and mock-generated. Users must execute customized analysis with certified investment advisors before taking financial actions.
        </p>
        <div className="pt-3 border-t border-slate-800/60 flex flex-col sm:flex-row justify-between items-center text-[10px] text-slate-500">
          <p>© 2026 Educational Stock Market Analytics Terminal. All rights reserved.</p>
          <p className="mt-1 sm:mt-0">Academic Finsight Model v2.6 • Sandbox Mode Active</p>
        </div>
      </div>
    </footer>
  );
}
