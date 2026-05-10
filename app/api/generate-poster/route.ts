import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUserAccess, decrementQuota } from '@/lib/billing';
import { savePosterHistory } from '@/lib/poster-history';
import { put } from '@vercel/blob';
import OpenAI from 'openai';

function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY ?? process.env.NANO_USER_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY manquante');
  }
  return new OpenAI({ apiKey });
}

function buildPrompt(data: {
  homeTeam: string;
  awayTeam: string;
  date: string;
  time: string;
  venue: string;
  style: string;
  colors: string;
  description: string;
}): string {
  return `Tu es un designer graphique expert en affiches de football. Crée une affiche de match professionnelle et visuellement impactante.

Match : ${data.homeTeam} vs ${data.awayTeam}
Date : ${data.date} à ${data.time}
Lieu : ${data.venue}
Style : ${data.style}
Couleurs : ${data.colors}
Description : ${data.description}

L'affiche doit être au format portrait (2:3), avec les noms des deux équipes bien visibles, la date et le lieu du match. Style graphique : ${data.style}. Rendu professionnel, ambiance football passionate.`;
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
    const date = formData.get('date') as string;
    const time = formData.get('time') as string;
    const venue = formData.get('venue') as string;
    const style = formData.get('style') as string;
    const colors = formData.get('colors') as string;
    const description = (formData.get('description') as string ?? '').slice(0, 1500);
    const referenceFile = formData.get('reference') as File | null;

    if (!homeTeam || !awayTeam) {
      return NextResponse.json({ error: 'Noms des équipes requis.' }, { status: 400 });
    }

    const prompt = buildPrompt({ homeTeam, awayTeam, date, time, venue, style, colors, description });
    const settings = { homeTeam, awayTeam, date, time, venue, style, colors };

    let imageB64: string;

    if (referenceFile && referenceFile.size > 0) {
      // Validation de l'image de référence
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(referenceFile.type)) {
        return NextResponse.json({ error: 'Format d\'image invalide (PNG, JPG ou WebP requis).' }, { status: 400 });
      }
      if (referenceFile.size > 5 * 1024 * 1024) {
        return NextResponse.json({ error: 'Image trop volumineuse (max 5MB).' }, { status: 400 });
      }

      const bytes = await referenceFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const file = new File([buffer], referenceFile.name, { type: referenceFile.type });

      const extendedPrompt = `${prompt}\n\nUne image de référence est fournie. Inspire-toi de son style graphique, sa palette de couleurs et sa composition. Ne reproduis PAS son contenu (logos, visages, textes). Applique ce style à l'affiche de match demandée.`;

      const response = await openai.images.edit({
        model: 'gpt-image-1',
        image: file,
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
    const filename = `tifo-${homeTeam}-vs-${awayTeam}-${Date.now()}.png`;
    
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
