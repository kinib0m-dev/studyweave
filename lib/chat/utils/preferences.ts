"use client";

import { ChatPreferences } from "../validation/chat-schema";

const CHAT_PREFERENCES_KEY = "studyweave_chat_preferences";

const defaultPreferences: ChatPreferences = {
  antiHallucinationEnabled: true,
  showSourceTooltips: true,
  showFileUsagePercentage: true,
  minimumFileUsageWarning: 70,
};

export function getChatPreferences(): ChatPreferences {
  if (typeof window === "undefined") return defaultPreferences;

  try {
    const stored = localStorage.getItem(CHAT_PREFERENCES_KEY);
    if (stored) {
      return { ...defaultPreferences, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error("Error loading chat preferences:", error);
  }

  return defaultPreferences;
}

export function setChatPreferences(
  preferences: Partial<ChatPreferences>
): void {
  if (typeof window === "undefined") return;

  try {
    const current = getChatPreferences();
    const updated = { ...current, ...preferences };
    localStorage.setItem(CHAT_PREFERENCES_KEY, JSON.stringify(updated));

    // Dispatch custom event to notify components about preference changes
    window.dispatchEvent(
      new CustomEvent("chatPreferencesChanged", {
        detail: updated,
      })
    );
  } catch (error) {
    console.error("Error saving chat preferences:", error);
  }
}

export function toggleAntiHallucination(): boolean {
  const current = getChatPreferences();
  const newValue = !current.antiHallucinationEnabled;
  setChatPreferences({ antiHallucinationEnabled: newValue });
  return newValue;
}

export type { ChatPreferences };
