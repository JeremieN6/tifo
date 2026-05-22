import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUserAccess, decrementQuota } from '@/lib/billing';
import { savePosterHistory } from '@/lib/poster-history';
import { put } from '@vercel/blob';
import OpenAI from 'openai';

const MAX_REFERENCE_IMAGES = 3;
const MAX_REFERENCE_IMAGE_BYTES = 5 * 1024 * 1024;

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
  try {
    const openai = getOpenAIClient();

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 });
    }

    const access = await getUserAccess(session.user.id);
    if (!access) {
      return NextResponse.json({ error: 'Accès introuvable.' }, { status: 403 });
    }

    if (access.quota_remaining <= 0) {
      return NextResponse.json({ error: 'Quota épuisé. Passez au plan Pro pour continuer.' }, { status: 429 });
    }

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
      return NextResponse.json({ error: 'Le premier club/équipe est requis.' }, { status: 400 });
    }
    if ((!isAnnouncement && !awayTeam) || (isTransferEvent && !awayTeam)) {
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

      const response = await openai.images.edit({
        model: 'gpt-image-1',
        image: files,
        prompt: extendedPrompt,
        size: '1024x1536',
      });

      imageB64 = response.data?.[0]?.b64_json ?? '';
    } else {
      const response = await openai.images.generate({
        model: 'gpt-image-1',
        prompt,
        size: '1024x1536',
        response_format: 'b64_json',
      });

      imageB64 = response.data?.[0]?.b64_json ?? '';
    }

    if (!imageB64) {
      return NextResponse.json({ error: 'Aucune image générée.' }, { status: 500 });
    }

    // Upload l'image vers Vercel Blob
    const buffer = Buffer.from(imageB64, 'base64');
    const filename = awayTeam
      ? `tifo-${homeTeam}-vs-${awayTeam}-${Date.now()}.png`
      : `tifo-${homeTeam}-${Date.now()}.png`;
    
    const blob = await put(filename, buffer, {
      access: 'public',
      contentType: 'image/png',
    });

    const imageUrl = blob.url;

    // Décrémenter le quota et sauvegarder l'historique avec l'URL
    await Promise.all([
      decrementQuota(session.user.id),
      savePosterHistory(session.user.id, prompt, imageUrl, settings),
    ]);

    return NextResponse.json({ success: true, image: imageUrl });
  } catch (err) {
    console.error('[generate-poster]', err);
    return NextResponse.json({ error: 'Erreur lors de la génération. Réessayez.' }, { status: 500 });
  }
}
