"use client";

import { ReactNode, useState, useEffect } from "react";
import { ConvexProvider, ConvexReactClient } from "convex/react";

const fallbackConvexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || "https://dummy-convex-url.convex.cloud";

export default function ConvexClientProvider({ children }: { children: ReactNode }) {
  const [convex] = useState(() => new ConvexReactClient(fallbackConvexUrl));
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <>{children}</>;
  }

  // If no real Convex URL configured, return children without throwing network errors
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    return <>{children}</>;
  }

  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
