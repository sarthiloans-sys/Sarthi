/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  User, 
  Lock, 
  ShieldCheck, 
  Chrome, 
  X, 
  GraduationCap, 
  Award,
  Globe,
  Activity,
  UserCheck
} from "lucide-react";
import { UserSession } from "../types";

interface LoginModalProps {
  onClose: () => void;
  onLoginSuccess: (session: UserSession | null) => void;
  isFirebaseActive: boolean;
}

export default function LoginModal({
  onClose,
  onLoginSuccess,
  isFirebaseActive
}: LoginModalProps) {
  const [selectedRole, setSelectedRole] = useState<"user" | "admin">("user");
  const [studentEmail, setStudentEmail] = useState("");
  const [studentName, setStudentName] = useState("");
  const [isSignActionInFlight, setIsSignActionInFlight] = useState(false);
  const [customError, setCustomError] = useState<string | null>(null);

  // Quick sandbox login to explore both student and admin roles
  const handleSandboxLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSignActionInFlight(true);
    setCustomError(null);

    // Dynamic educational profile session simulation
    setTimeout(() => {
      const sandboxUser: UserSession = {
        uid: `sandbox_${selectedRole}_${Date.now()}`,
        email: studentEmail.trim() || `${selectedRole}_scholar@finsight.edu`,
        displayName: studentName.trim() || (selectedRole === "admin" ? "Dr. Mayur (Supervisor)" : "Mayur Shambhanani"),
        role: selectedRole,
        createdAt: new Date().toISOString()
      };
      onLoginSuccess(sandboxUser);
      setIsSignActionInFlight(false);
      onClose();
    }, 450);
  };

  // Live programmtical Firebase auth triggers
  const handleGoogleLogin = async () => {
    setIsSignActionInFlight(true);
    setCustomError(null);
    try {
      // Import on-demand from our helper
      const { auth, googleProvider } = await import("../lib/firebase");
      const { signInWithPopup } = await import("firebase/auth");
      
      const result = await signInWithPopup(auth, googleProvider);
      if (result?.user) {
        // Build session object
        const firebaseUser: UserSession = {
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName || "Google Scholar",
          // Map user role dynamically. If user email is the registered admin (defaulting to the active developer Mayur), elevate them to admin immediately!
          role: result.user.email?.toLowerCase().includes("mayur") ? "admin" : "user",
          createdAt: new Date().toISOString()
        };
        onLoginSuccess(firebaseUser);
        onClose();
      }
    } catch (err: any) {
      console.error("Firebase auth pop-up cancelled or failed:", err);
      setCustomError("Sign-in pop-up was block or cancelled. Serving simulated quick sandbox login.");
    } finally {
      setIsSignActionInFlight(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
      <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl shadow-2xl relative overflow-hidden animate-fade-in flex flex-col">
        
        {/* Modal Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white text-center select-none relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition cursor-pointer"
            title="Dismiss login"
          >
            <X className="h-5 w-5" />
          </button>
          
          <div className="mx-auto h-12 w-12 bg-white/15 rounded-full flex items-center justify-center mb-3.5 shadow-inner">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <h2 className="font-display font-black text-lg tracking-tight">FinSight Academic Port</h2>
          <p className="text-[10px] text-blue-100 font-mono font-bold uppercase tracking-widest mt-1">
            Access secure terminals & supervisor admin boards
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {customError && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 text-[10px] leading-relaxed p-3 rounded-lg font-mono font-bold">
              ⚡ {customError}
            </div>
          )}

          {/* Role selector switches */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wide">
              Select Study Profile Role
            </label>
            <div className="grid grid-cols-2 gap-2 bg-slate-50 border border-slate-200 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setSelectedRole("user")}
                className={`py-2 text-xs font-extrabold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  selectedRole === "user"
                    ? "bg-white text-blue-600 shadow-sm border border-slate-200"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <User className="h-3.5 w-3.5" /> Student Scholar
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole("admin")}
                className={`py-2 text-xs font-extrabold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  selectedRole === "admin"
                    ? "bg-white text-amber-700 shadow-sm border border-slate-250"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <ShieldCheck className="h-3.5 w-3.5" /> Supervisor (Admin)
              </button>
            </div>
          </div>

          {/* Setup / simulated credentials form details */}
          <form onSubmit={handleSandboxLoginSubmit} className="space-y-3.5">
            <div>
              <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase mb-1">
                Display Scholar Name
              </label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder={selectedRole === "admin" ? "Dr. Mayur (Supervisor)" : "Mayur Shambhanani"}
                className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg p-2.5 outline-none focus:border-blue-500 font-semibold text-slate-800"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase mb-1">
                E-mail address
              </label>
              <input
                type="email"
                value={studentEmail}
                onChange={(e) => setStudentEmail(e.target.value)}
                placeholder={selectedRole === "admin" ? "admin_mayur@finsight.edu" : "mayurshambhanani71@gmail.com"}
                className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg p-2.5 outline-none focus:border-blue-500 font-semibold text-slate-800 font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={isSignActionInFlight}
              className="w-full bg-slate-900 border border-slate-800 text-white hover:bg-slate-800 font-mono text-xs font-black py-2.5 rounded-xl cursor-pointer flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <UserCheck className="h-4 w-4 text-emerald-400 animate-pulse" />
              {isSignActionInFlight ? "Initializing..." : `Enter ${selectedRole === "admin" ? "Admin Terminal" : "Student Terminal"}`}
            </button>
          </form>

          {/* Divider and Google Authentication Integration options */}
          <div className="relative border-t border-slate-200 my-4 text-center select-none">
            <span className="bg-white px-3 relative -top-2.5 text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest">
              Live OAuth Gateways
            </span>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isSignActionInFlight}
            className="w-full border border-slate-200 hover:bg-slate-50 font-sans text-xs font-bold py-2.5 rounded-xl cursor-pointer flex items-center justify-center gap-2 shadow-inner transition-all text-slate-650"
          >
            <Chrome className="h-4 w-4 text-red-500" />
            <span>Sign in via Google Authentication</span>
          </button>

          <p className="text-[10px] text-center text-slate-400 font-semibold italic max-w-xs mx-auto">
            {isFirebaseActive 
              ? "⚡ Google Sign-in will launch safe Pop-up dialogue to authorize credentials."
              : "🔐 Firebase is active in Local Simulation Mode. Enter name and email above for instant terminal overrides."
            }
          </p>

        </div>
      </div>
    </div>
  );
}
