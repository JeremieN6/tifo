import pool from './db';

export const SURVEY_CHANNELS = ['chatgpt', 'google', 'instagram', 'proche', 'autre'] as const;
export type SurveyChannel = (typeof SURVEY_CHANNELS)[number];

export type Attribution = {
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  referrerDomain: string | null;
  landingPath: string | null;
  deviceType: 'mobile' | 'desktop' | null;
};

function cleanText(value: unknown, max: number, pattern: RegExp): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim().slice(0, max);
  return trimmed && pattern.test(trimmed) ? trimmed : null;
}

// Les valeurs viennent du navigateur : on ne garde que des formes attendues et courtes.
export function sanitizeAttribution(raw: unknown): Attribution {
  const obj = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const device = obj.device_type === 'mobile' || obj.device_type === 'desktop' ? obj.device_type : null;

  return {
    utmSource: cleanText(obj.utm_source, 100, /^[\w.\-+ ]+$/),
    utmMedium: cleanText(obj.utm_medium, 100, /^[\w.\-+ ]+$/),
    utmCampaign: cleanText(obj.utm_campaign, 100, /^[\w.\-+ ]+$/),
    referrerDomain: cleanText(obj.referrer_domain, 255, /^[a-z0-9.\-]+$/i)?.toLowerCase() ?? null,
    landingPath: cleanText(obj.landing_path, 255, /^\/[\w\-./~%]*$/),
    deviceType: device,
  };
}

export function attributionSource(attribution: Attribution): string {
  return attribution.utmSource ?? attribution.referrerDomain ?? 'direct';
}

// Cree toujours la ligne : sa presence rend le compte eligible a la question d'acquisition
// (les comptes crees avant la mise en ligne n'en ont pas et ne sont donc jamais sollicites).
export async function saveAttribution(userId: string | number, raw: unknown): Promise<Attribution> {
  const attribution = sanitizeAttribution(raw);
  const hasSignal = Boolean(attribution.utmSource || attribution.referrerDomain);

  await pool.query(
    `INSERT INTO user_attribution
       (user_id, utm_source, utm_medium, utm_campaign, referrer_domain, landing_path, device_type, has_signal)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (user_id) DO NOTHING`,
    [
      userId,
      attribution.utmSource,
      attribution.utmMedium,
      attribution.utmCampaign,
      attribution.referrerDomain,
      attribution.landingPath,
      attribution.deviceType,
      hasSignal,
    ]
  );

  return attribution;
}

export async function isEligibleForSurvey(userId: string | number): Promise<boolean> {
  const result = await pool.query(
    `SELECT
       EXISTS (SELECT 1 FROM user_attribution WHERE user_id = $1) AS has_attribution,
       EXISTS (SELECT 1 FROM acquisition_survey WHERE user_id = $1) AS has_survey,
       EXISTS (SELECT 1 FROM users WHERE id = $1 AND is_admin = TRUE) AS is_admin`,
    [userId]
  );
  const row = result.rows[0];
  // Les admins (comptes de test du proprietaire) ne sont jamais sollicites : leurs reponses fausseraient les chiffres.
  return Boolean(row?.has_attribution) && !row?.has_survey && !row?.is_admin;
}

export type SurveyInput =
  | { status: 'dismissed' }
  | { status: 'answered'; channel: SurveyChannel; channelOther: string | null; queryText: string | null };

function cleanFreeText(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  // retire les caracteres de controle, garde les retours a la ligne
  const cleaned = value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, max);
  return cleaned || null;
}

export function parseSurveyInput(body: unknown): SurveyInput | null {
  const obj = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;

  if (obj.action === 'dismiss') return { status: 'dismissed' };

  if (obj.action === 'answer' && SURVEY_CHANNELS.includes(obj.channel as SurveyChannel)) {
    const channel = obj.channel as SurveyChannel;
    return {
      status: 'answered',
      channel,
      channelOther: channel === 'autre' ? cleanFreeText(obj.channelOther, 200) : null,
      queryText: cleanFreeText(obj.queryText, 600),
    };
  }

  return null;
}

// Retourne false si la reponse existait deja (une seule reponse par compte).
export async function saveSurvey(userId: string | number, input: SurveyInput): Promise<boolean> {
  const result =
    input.status === 'dismissed'
      ? await pool.query(
          `INSERT INTO acquisition_survey (user_id, status) VALUES ($1, 'dismissed')
           ON CONFLICT (user_id) DO NOTHING`,
          [userId]
        )
      : await pool.query(
          `INSERT INTO acquisition_survey (user_id, status, channel, channel_other, query_text)
           VALUES ($1, 'answered', $2, $3, $4)
           ON CONFLICT (user_id) DO NOTHING`,
          [userId, input.channel, input.channelOther, input.queryText]
        );

  return (result.rowCount ?? 0) > 0;
}
