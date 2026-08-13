"use client";

import React, { createContext, useContext, useState } from "react";
import { CheckCircle2, Heart, Music, Info } from "lucide-react";

export interface ToastMessage {
  id: string;
  message: string;
  type?: "success" | "favorite" | "queue" | "info";
}

interface ToastContextType {
  showToast: (message: string, type?: ToastMessage["type"]) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (message: string, type: ToastMessage["type"] = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2500);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Notification Container */}
      <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center space-y-2 pointer-events-none w-full max-w-xs px-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="w-full bg-[#2D2D2D] text-white px-4 py-3 rounded-2xl shadow-2xl border border-white/10 flex items-center space-x-3 backdrop-blur-md animate-in slide-in-from-top duration-200 pointer-events-auto"
          >
            {toast.type === "favorite" && (
              <Heart className="w-4 h-4 fill-[#D7192F] text-[#D7192F] shrink-0" />
            )}
            {toast.type === "queue" && (
              <Music className="w-4 h-4 text-white shrink-0" />
            )}
            {toast.type === "success" && (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            {toast.type === "info" && (
              <Info className="w-4 h-4 text-sky-400 shrink-0" />
            )}
            <span className="text-xs font-semibold tracking-tight">
              {toast.message}
            </span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
