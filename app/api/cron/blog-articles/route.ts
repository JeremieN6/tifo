import { NextRequest, NextResponse } from 'next/server';
import {
  claimNextPendingBlogQueueItem,
  createBlogArticleFromQueue,
  createWeeklyPromptIfDue,
  generateBlogArticle,
  markBlogQueueItemDone,
  markBlogQueueItemError,
  syncBlogQueueFromSeedFile,
} from '@/lib/blog-automation';

export const runtime = 'nodejs';

function isAuthorized(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error('[cron/blog-articles] CRON_SECRET manquant.');
    return false;
  }

  const bearer = req.headers.get('authorization');
  if (bearer === `Bearer ${cronSecret}`) {
    return true;
  }

  const headerSecret = req.headers.get('x-cron-secret');
  return headerSecret === cronSecret;
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  }

  const summary: Record<string, unknown> = {
    seedParsed: 0,
    seedInserted: 0,
    weeklyPromptCreated: false,
    generated: false,
  };

  try {
    const seedSync = await syncBlogQueueFromSeedFile();
    summary.seedParsed = seedSync.parsed;
    summary.seedInserted = seedSync.inserted;
    summary.seedFile = seedSync.filePath;
  } catch (error) {
    console.error('[cron/blog-articles/seed-sync]', error);
    summary.seedSyncError = 'seed_file_unavailable';
  }

  let queueItem = await claimNextPendingBlogQueueItem();

  if (!queueItem) {
    try {
      const weeklyPrompt = await createWeeklyPromptIfDue();
      summary.weeklyPromptCreated = Boolean(weeklyPrompt);
      if (weeklyPrompt) {
        summary.weeklyPrompt = weeklyPrompt;
      }
    } catch (error) {
      console.error('[cron/blog-articles/weekly-prompt]', error);
      summary.weeklyPromptError = 'weekly_prompt_generation_failed';
    }

    queueItem = await claimNextPendingBlogQueueItem();
  }

  if (!queueItem) {
    return NextResponse.json({
      success: true,
      summary: {
        ...summary,
        message: 'Aucun article en attente.',
      },
    });
  }

  try {
    const article = await generateBlogArticle(queueItem.prompt, queueItem.topic);
    const created = await createBlogArticleFromQueue(queueItem, article);
    await markBlogQueueItemDone(queueItem.id);

    summary.generated = true;
    summary.queueId = queueItem.id;
    summary.slug = created.slug;
    summary.topic = queueItem.topic;

    return NextResponse.json({ success: true, summary });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue';
    await markBlogQueueItemError(queueItem.id, message);

    console.error('[cron/blog-articles/generate]', {
      queueId: queueItem.id,
      prompt: queueItem.prompt,
      error,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Echec de génération de l article.',
        summary: {
          ...summary,
          queueId: queueItem.id,
          reason: message,
        },
      },
      { status: 500 }
    );
  }
}
