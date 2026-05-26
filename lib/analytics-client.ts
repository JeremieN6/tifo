'use client';

import posthog from 'posthog-js';

type AnalyticsProperties = Record<string, string | number | boolean | null | undefined>;

export function captureClientEvent(eventName: string, properties?: AnalyticsProperties) {
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
  posthog.capture(eventName, properties);
}

export function resetClientAnalytics() {
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
  posthog.reset();
}
