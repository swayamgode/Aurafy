"use client";

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center px-6 text-center">
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#D7192F] to-[#8B0000] flex items-center justify-center mb-6 shadow-lg">
        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-[#111111] mb-2">You&apos;re Offline</h1>
      <p className="text-[#5F6368] text-sm max-w-xs leading-relaxed">
        No internet connection. Connect to the internet to search and stream music on Hue.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="mt-8 px-6 py-3 rounded-full bg-[#D7192F] text-white font-semibold text-sm hover:bg-[#B5151A] active:scale-95 transition-all"
      >
        Try Again
      </button>
    </div>
  );
}
