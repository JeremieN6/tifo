import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUserAccess, decrementQuota } from '@/lib/billing';
import { savePosterHistory } from '@/lib/poster-history';
import { put } from '@vercel/blob';
import OpenAI from 'openai';
import { captureServerEvent } from '@/lib/posthog-server';

const MAX_REFERENCE_IMAGES = 3;
const MAX_REFERENCE_IMAGE_BYTES = 5 * 1024 * 1024;

function toErrorMessage(value: unknown): string {
  if (value instanceof Error) return value.message;
  if (typeof value === 'string') return value;
  return 'unknown_error';
}

function classifyGenerationError(err: unknown, stage: string) {
  const message = toErrorMessage(err).toLowerCase();

  if (message.includes('openai_api_key') || message.includes('api key')) {
    return {
      status: 500,
      reason: 'missing_openai_api_key',
      userMessage: 'Service de generation temporairement indisponible (configuration OpenAI).',
    };
  }

  if (message.includes('blob_read_write_token')) {
    return {
      status: 500,
      reason: 'missing_blob_token',
      userMessage: 'Service de stockage temporairement indisponible. Reessayez plus tard.',
    };
  }

  if (message.includes('cannot use public access on a private store')) {
    return {
      status: 500,
      reason: 'blob_private_store_mismatch',
      userMessage: 'Stockage mal configure (store Blob prive). Contactez le support.',
    };
  }

  if (message.includes('rate limit') || message.includes('quota') || message.includes('insufficient_quota')) {
    return {
      status: 429,
      reason: 'openai_rate_limited',
      userMessage: 'Le service de generation est surcharge. Reessayez dans quelques instants.',
    };
  }

  if (message.includes('connection') || message.includes('database')) {
    return {
      status: 503,
      reason: 'database_unavailable',
      userMessage: 'Service temporairement indisponible. Reessayez dans quelques instants.',
    };
  }

  return {
    status: 500,
    reason: `server_error_${stage}`,
    userMessage: 'Erreur lors de la generation. Reessayez.',
  };
}

function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY ?? process.env.NANO_USER_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY manquante');
  }
  return new OpenAI({ apiKey });
}

function buildPrompt(data: {
  posterType: string;
  eventType: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  time: string;
  venue: string;
  style: string;
  colors: string;
  description: string;
}): string {
  const teamDescriptor = data.awayTeam
    ? `${data.homeTeam} vs ${data.awayTeam}`
    : data.homeTeam;
  const eventDescriptor = data.posterType === 'annonce'
    ? `Événement : ${data.eventType || 'annonce'}`
    : 'Événement : match';

  return `Tu es un designer graphique expert en affiches de football. Crée une affiche de match professionnelle et visuellement impactante.

Sujet : ${teamDescriptor}
${eventDescriptor}
Date : ${data.date} à ${data.time}
Lieu : ${data.venue}
Style : ${data.style}
Couleurs : ${data.colors}
Description : ${data.description}

L'affiche doit être au format portrait (2:3), avec une hiérarchie visuelle claire, la date et le lieu de l'événement. Si un seul club est fourni, mets-le au centre de la composition et évite d'inventer une seconde équipe. Style graphique : ${data.style}. Rendu professionnel, ambiance football passionate.`;
}

export async function POST(req: NextRequest) {
  let stage = 'init';
  let distinctIdForError = 'anonymous';

  try {
    stage = 'openai_client';
    const openai = getOpenAIClient();

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      throw new Error('BLOB_READ_WRITE_TOKEN manquante');
    }

    stage = 'session';
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      captureServerEvent({
        distinctId: 'anonymous',
        event: 'poster_generation_failed',
        properties: { reason: 'unauthenticated' },
      });
      return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 });
    }

    distinctIdForError = session.user.id;

    stage = 'access';
    const access = await getUserAccess(session.user.id);
    if (!access) {
      captureServerEvent({
        distinctId: session.user.id,
        event: 'poster_generation_failed',
        properties: { reason: 'access_not_found' },
      });
      return NextResponse.json({ error: 'Accès introuvable.' }, { status: 403 });
    }

    if (access.quota_remaining <= 0) {
      captureServerEvent({
        distinctId: session.user.id,
        event: 'poster_generation_failed',
        properties: { reason: 'quota_exhausted', plan: access.plan },
      });
      return NextResponse.json({ error: 'Quota épuisé. Passez au plan Pro pour continuer.' }, { status: 429 });
    }

    stage = 'parse_form';
    const formData = await req.formData();
    const homeTeam = formData.get('homeTeam') as string;
    const awayTeam = formData.get('awayTeam') as string;
    const posterType = formData.get('posterType') as string;
    const eventType = formData.get('eventType') as string;
    const date = formData.get('date') as string;
    const time = formData.get('time') as string;
    const venue = formData.get('venue') as string;
    const style = formData.get('style') as string;
    const colors = formData.get('colors') as string;
    const description = (formData.get('description') as string ?? '').slice(0, 1500);
    const multiReferenceFiles = formData
      .getAll('references')
      .filter((value): value is File => value instanceof File && value.size > 0);
    const legacyReference = formData.get('reference');
    const referenceFiles = multiReferenceFiles.length > 0
      ? multiReferenceFiles
      : legacyReference instanceof File && legacyReference.size > 0
        ? [legacyReference]
        : [];
    const isAnnouncement = posterType === 'annonce';
    const isTransferEvent = isAnnouncement && (eventType === 'recrutement' || eventType === 'transfert');

    if (!homeTeam) {
      captureServerEvent({
        distinctId: session.user.id,
        event: 'poster_generation_failed',
        properties: { reason: 'missing_home_team' },
      });
      return NextResponse.json({ error: 'Le premier club/équipe est requis.' }, { status: 400 });
    }
    if ((!isAnnouncement && !awayTeam) || (isTransferEvent && !awayTeam)) {
      captureServerEvent({
        distinctId: session.user.id,
        event: 'poster_generation_failed',
        properties: { reason: 'missing_away_team', poster_type: posterType, event_type: eventType },
      });
      return NextResponse.json({ error: 'Le second club/équipe est requis pour ce type d\'affiche.' }, { status: 400 });
    }

    const prompt = buildPrompt({ posterType, eventType, homeTeam, awayTeam, date, time, venue, style, colors, description });
    const settings = { posterType, eventType, homeTeam, awayTeam, date, time, venue, style, colors };

    let imageB64: string;

    if (referenceFiles.length > 0) {
      if (referenceFiles.length > MAX_REFERENCE_IMAGES) {
        return NextResponse.json({ error: `Trop d'images de référence (max ${MAX_REFERENCE_IMAGES}).` }, { status: 400 });
      }

      // Validation des images de référence
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      for (const referenceFile of referenceFiles) {
        if (!allowedTypes.includes(referenceFile.type)) {
          return NextResponse.json({ error: 'Format d\'image invalide (PNG, JPG ou WebP requis).' }, { status: 400 });
        }
        if (referenceFile.size > MAX_REFERENCE_IMAGE_BYTES) {
          return NextResponse.json({ error: 'Image trop volumineuse (max 5MB/image).' }, { status: 400 });
        }
      }

      const files = await Promise.all(
        referenceFiles.map(async (referenceFile) => {
          const bytes = await referenceFile.arrayBuffer();
          const buffer = Buffer.from(bytes);
          return new File([buffer], referenceFile.name, { type: referenceFile.type });
        }),
      );

      const extendedPrompt = `${prompt}\n\n${files.length > 1 ? 'Des images de référence sont fournies.' : 'Une image de référence est fournie.'} Inspire-toi de leur style graphique, leur palette de couleurs et leur composition. Ne reproduis PAS leur contenu (logos, visages, textes). Applique ce style à l'affiche de match demandée.`;

      stage = 'openai_image_edit';
      const response = await openai.images.edit({
        model: 'gpt-image-1',
        image: files,
        prompt: extendedPrompt,
        size: '1024x1536',
      });

      imageB64 = response.data?.[0]?.b64_json ?? '';
    } else {
      stage = 'openai_image_generate';
      const response = await openai.images.generate({
        model: 'gpt-image-1',
        prompt,
        size: '1024x1536',
      });

      imageB64 = response.data?.[0]?.b64_json ?? '';
    }

    if (!imageB64) {
      captureServerEvent({
        distinctId: session.user.id,
        event: 'poster_generation_failed',
        properties: { reason: 'empty_image_payload' },
      });
      return NextResponse.json({ error: 'Aucune image générée.' }, { status: 500 });
    }

    // Upload l'image vers Vercel Blob
    const buffer = Buffer.from(imageB64, 'base64');
    const filename = awayTeam
      ? `tifo-${homeTeam}-vs-${awayTeam}-${Date.now()}.png`
      : `tifo-${homeTeam}-${Date.now()}.png`;

    let imageUrl: string;
    try {
      stage = 'blob_upload';
      const blob = await put(filename, buffer, {
        access: 'public',
        contentType: 'image/png',
      });
      imageUrl = blob.url;
    } catch (uploadErr) {
      const uploadMessage = toErrorMessage(uploadErr).toLowerCase();

      // Compatibility fallback: some stores are private-only and reject public uploads.
      if (uploadMessage.includes('cannot use public access on a private store')) {
        stage = 'blob_upload_fallback_data_url';
        imageUrl = `data:image/png;base64,${imageB64}`;
      } else {
        throw uploadErr;
      }
    }

    // Décrémenter le quota et sauvegarder l'historique avec l'URL
    stage = 'persist_history_and_quota';
    await Promise.all([
      decrementQuota(session.user.id),
      savePosterHistory(session.user.id, prompt, imageUrl, settings),
    ]);

    captureServerEvent({
      distinctId: session.user.id,
      event: 'poster_generation_succeeded',
      properties: {
        plan: access.plan,
        poster_type: posterType,
        event_type: eventType || 'match',
        has_away_team: Boolean(awayTeam),
        reference_images_count: referenceFiles.length,
      },
    });

    return NextResponse.json({ success: true, image: imageUrl });
  } catch (err) {
    const classification = classifyGenerationError(err, stage);

    captureServerEvent({
      distinctId: distinctIdForError,
      event: 'poster_generation_failed',
      properties: {
        reason: classification.reason,
        stage,
        error_message: toErrorMessage(err).slice(0, 200),
      },
    });

    console.error('[generate-poster]', {
      stage,
      reason: classification.reason,
      message: toErrorMessage(err),
    });

    return NextResponse.json({ error: classification.userMessage }, { status: classification.status });
  }
}
