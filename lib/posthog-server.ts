import { PostHog } from 'posthog-node';

type ServerEventValue = string | number | boolean | null | undefined;
// `$set` (proprietes de la personne) est un objet ; les autres proprietes sont des valeurs simples.
type ServerEventProperties = Record<string, ServerEventValue | Record<string, ServerEventValue>>;

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

// Variante qui attend l'envoi effectif a PostHog. A reserver aux evenements rares et
// importants emis depuis une reponse courte (webhooks) : captureServerEvent met
// l'evenement en file d'attente et l'envoie plus tard, ce qui peut se perdre.
export async function captureServerEventImmediate(params: {
  distinctId: string;
  event: string;
  properties?: ServerEventProperties;
}) {
  const client = getPostHogServerClient();
  if (!client) {
    console.warn('[posthog/server] cle PostHog absente, evenement non envoye:', params.event);
    return;
  }

  try {
    await client.captureImmediate({
      distinctId: params.distinctId,
      event: params.event,
      properties: params.properties,
    });
  } catch (err) {
    console.error('[posthog/server]', params.event, err);
  }
}

