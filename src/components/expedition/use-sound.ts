"use client";

import { useSyncExternalStore } from "react";
import { CAPTURE_AUDIO_EVENT, readCaptureAudio } from "@/lib/expedition/capture-audio";

function subscribe(onStoreChange: () => void): () => void {
  window.addEventListener(CAPTURE_AUDIO_EVENT, onStoreChange);
  return () => window.removeEventListener(CAPTURE_AUDIO_EVENT, onStoreChange);
}

export function useSoundEnabled(): boolean {
  return useSyncExternalStore(subscribe, readCaptureAudio, () => true);
}
