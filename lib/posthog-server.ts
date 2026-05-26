import { PostHog } from 'posthog-node';

type ServerEventProperties = Record<string, string | number | boolean | null | undefined>;

let posthogServerClient: PostHog | null = null;

function getPostHogServerClient(): PostHog | null {
  const apiKey = process.env.POSTHOG_API_KEY ?? process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!apiKey) return null;

  if (!posthogServerClient) {
    posthogServerClient = new PostHog(apiKey, {
      host: process.env.POSTHOG_HOST ?? process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://eu.i.posthog.com',
    });
  }

  return posthogServerClient;
}

export function captureServerEvent(params: {
  distinctId: string;
  event: string;
  properties?: ServerEventProperties;
}) {
  const client = getPostHogServerClient();
  if (!client) return;

  try {
    client.capture({
      distinctId: params.distinctId,
      event: params.event,
      properties: params.properties,
    });
  } catch (err) {
    console.error('[posthog/server]', err);
  }
}
