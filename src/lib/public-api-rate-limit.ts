import 'server-only';

import { createHmac } from 'node:crypto';
import { isIP } from 'node:net';

type RateLimitRow = { requestCount: number };
type RateLimitQuery = (
  text: string,
  values: unknown[],
) => Promise<{ rows: RateLimitRow[] }>;

export type PublicApiRateLimitDecision =
  | { status: 'allowed' }
  | { status: 'limited'; retryAfterSeconds: number }
  | { status: 'unavailable' };

type RateLimitOptions = {
  endpoint: string;
  clientIp: string;
  hmacSecret: string;
  limit: number;
  windowMs: number;
  now?: number;
};

const consumeQuery = `
  WITH stale_rows AS (
    SELECT ctid
    FROM public."PublicApiRateLimit"
    WHERE "expiresAt" <= NOW()
    ORDER BY "expiresAt"
    LIMIT 100
    FOR UPDATE SKIP LOCKED
  ), cleanup AS (
    DELETE FROM public."PublicApiRateLimit" AS rate_limit
    USING stale_rows
    WHERE rate_limit.ctid = stale_rows.ctid
    RETURNING 1
  )
  INSERT INTO public."PublicApiRateLimit" (
    "endpoint", "clientKey", "windowStart", "requestCount", "expiresAt"
  )
  VALUES ($1, $2, $3, 1, $4)
  ON CONFLICT ("endpoint", "clientKey", "windowStart")
  DO UPDATE SET "requestCount" = public."PublicApiRateLimit"."requestCount" + 1
  WHERE public."PublicApiRateLimit"."requestCount" < $5
  RETURNING "requestCount"
`;

function trustedClientIp(request: Request): string | null {
  // Vercel supplies this value and supports Cloudflare's Verified Proxy Lite
  // integration, which validates CF-Connecting-IP before preserving the visitor IP.
  const vercelForwardedFor = request.headers.get('x-vercel-forwarded-for');
  if (vercelForwardedFor && vercelForwardedFor.length <= 256) {
    const candidate = vercelForwardedFor.split(',').at(-1)?.trim();
    if (candidate && isIP(candidate)) return candidate.toLowerCase();
  }

  // Local development has no Vercel-injected header. The fallback is deliberately
  // disabled in production so a caller-supplied forwarding header cannot set a key.
  if (process.env.NODE_ENV !== 'production') {
    const localForwardedFor = request.headers.get('x-forwarded-for');
    if (localForwardedFor && localForwardedFor.length <= 256) {
      const candidate = localForwardedFor.split(',').at(-1)?.trim();
      if (candidate && isIP(candidate)) return candidate.toLowerCase();
    }
    return '127.0.0.1';
  }

  return null;
}

export async function consumeApiRateLimit(
  query: RateLimitQuery,
  options: RateLimitOptions,
): Promise<PublicApiRateLimitDecision> {
  const now = options.now ?? Date.now();
  const windowStartMs = Math.floor(now / options.windowMs) * options.windowMs;
  const windowEndMs = windowStartMs + options.windowMs;

  try {
    const clientKey = createHmac('sha256', options.hmacSecret)
      .update(options.clientIp, 'utf8')
      .digest('hex');
    const result = await query(consumeQuery, [
      options.endpoint,
      clientKey,
      new Date(windowStartMs),
      new Date(windowEndMs),
      options.limit,
    ]);

    if (result.rows.length > 0) return { status: 'allowed' };

    return {
      status: 'limited',
      retryAfterSeconds: Math.max(1, Math.ceil((windowEndMs - now) / 1000)),
    };
  } catch (error) {
    console.error('Public API rate-limit storage is unavailable.', {
      errorName: error instanceof Error ? error.name : 'UnknownError',
    });
    return { status: 'unavailable' };
  }
}

export async function checkPublicApiRateLimit(
  request: Request,
  options: Omit<RateLimitOptions, 'clientIp' | 'hmacSecret' | 'now'>,
): Promise<PublicApiRateLimitDecision> {
  const clientIp = trustedClientIp(request);
  if (!clientIp) {
    console.error('Public API rate-limit storage is unavailable.', {
      errorName: 'TrustedClientIpUnavailable',
    });
    return { status: 'unavailable' };
  }

  const hmacSecret = process.env.ADMIN_SESSION_SECRET;
  if (!hmacSecret || Buffer.byteLength(hmacSecret, 'utf8') < 32) {
    console.error('Public API rate-limit storage is unavailable.', {
      errorName: 'RateLimitSecretUnavailable',
    });
    return { status: 'unavailable' };
  }

  try {
    const { pool } = await import('@/lib/db/pool');
    return await consumeApiRateLimit(
      (text, values) => pool.query<RateLimitRow>(text, values),
      { ...options, clientIp, hmacSecret },
    );
  } catch (error) {
    console.error('Public API rate-limit storage is unavailable.', {
      errorName: error instanceof Error ? error.name : 'UnknownError',
    });
    return { status: 'unavailable' };
  }
}

export function publicApiRateLimitResponse(
  decision: PublicApiRateLimitDecision,
): Response | null {
  if (decision.status === 'allowed') return null;

  if (decision.status === 'limited') {
    return Response.json(
      { success: false, error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: { 'Retry-After': String(decision.retryAfterSeconds) },
      },
    );
  }

  return Response.json(
    { success: false, error: 'Request protection is temporarily unavailable. Please try again shortly.' },
    { status: 503 },
  );
}
