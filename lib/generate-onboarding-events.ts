/** Fired in the same tab when the mobile recommendation dialog is dismissed (sessionStorage set). */
export const MOBILE_GENERATE_RECOMMENDATION_DISMISSED_EVENT =
  "easycert-mobile-generate-recommendation-dismissed" as const;

export function dispatchMobileGenerateRecommendationDismissed(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(MOBILE_GENERATE_RECOMMENDATION_DISMISSED_EVENT));
}
