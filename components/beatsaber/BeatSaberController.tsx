"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { usePlayer } from "@/lib/PlayerContext";
import BeatSaberModal from "./BeatSaberModal";

export default function BeatSaberController() {
  const { isBeatSaberOpen, closeBeatSaber } = usePlayer();
  const [mounted, setMounted] = useState(false);

  // Only render portal after client mount (avoids SSR mismatch)
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isBeatSaberOpen) return null;

  return createPortal(
    <BeatSaberModal isOpen={isBeatSaberOpen} onClose={closeBeatSaber} />,
    document.body
  );
}
