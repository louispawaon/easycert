export const GENERATE_ONBOARDING_STORAGE_KEY = "easycert_generate_onboarding_v1" as const;

export type GenerateOnboardingStatus = "done" | "skipped";

export function readGenerateOnboardingStatus(): GenerateOnboardingStatus | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(GENERATE_ONBOARDING_STORAGE_KEY);
    if (raw === "done" || raw === "skipped") return raw;
    return null;
  } catch {
    return null;
  }
}

export function writeGenerateOnboardingStatus(status: GenerateOnboardingStatus): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(GENERATE_ONBOARDING_STORAGE_KEY, status);
  } catch {
    /* ignore */
  }
}
