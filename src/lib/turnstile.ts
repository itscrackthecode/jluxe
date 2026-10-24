import 'server-only';

const TURNSTILE_SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const TOKEN_MAX_LENGTH = 2048;

export type TurnstileResult = 'verified' | 'invalid' | 'unavailable';

type SiteverifyResponse = {
  success?: boolean;
  hostname?: string;
  action?: string;
  metadata?: { result_with_testing_key?: boolean };
  'error-codes'?: string[];
};

function getSecret() {
  return process.env.TURNSTILE_SECRET_KEY || null;
}

export async function verifyTurnstileToken(
  token: unknown,
  expectedAction: string,
  requestUrl: string,
  verify: typeof fetch = fetch,
): Promise<TurnstileResult> {
  if (typeof token !== 'string' || token.trim().length === 0 || token.length > TOKEN_MAX_LENGTH) return 'invalid';

  const secret = getSecret();
  if (!secret) return 'unavailable';

  let hostname: string;
  try {
    hostname = new URL(requestUrl).hostname.toLowerCase().replace(/\.$/, '');
  } catch {
    return 'invalid';
  }

  try {
    const response = await verify(TURNSTILE_SITEVERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token.trim() }),
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return 'unavailable';

    const result = await response.json() as SiteverifyResponse;
    if (!result.success) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Turnstile Siteverify rejected the token.', {
          hostname,
          expectedAction,
          errorCodes: result['error-codes'] ?? [],
        });
      }
      return result['error-codes']?.some((code) => ['internal-error', 'invalid-input-secret', 'missing-input-secret'].includes(code))
        ? 'unavailable'
        : 'invalid';
    }

    const isLocalTestEnvironment = process.env.NODE_ENV === 'development'
      && process.env.TURNSTILE_ALLOW_TEST_ACTION === 'true'
      && ['localhost', '127.0.0.1'].includes(hostname);

    const returnedHostname = result.hostname?.toLowerCase().replace(/\.$/, '');
    const isLocalTestKeyResponse = isLocalTestEnvironment && (
      result.action === 'test'
      || result.metadata?.result_with_testing_key === true
      || (returnedHostname === 'example.com' && result.action == null)
    );
    const hostnameMatches = returnedHostname === hostname || isLocalTestKeyResponse;
    const actionMatches = result.action === expectedAction || isLocalTestKeyResponse;
    if ((!hostnameMatches || !actionMatches) && process.env.NODE_ENV === 'development') {
      console.warn('Turnstile Siteverify response did not match the request.', {
        hostname,
        returnedHostname: returnedHostname ?? null,
        expectedAction,
        returnedAction: result.action ?? null,
        localTestActionEnabled: process.env.TURNSTILE_ALLOW_TEST_ACTION === 'true',
      });
    }

    return hostnameMatches && actionMatches ? 'verified' : 'invalid';
  } catch {
    return 'unavailable';
  }
}

export function turnstileResponse(result: Exclude<TurnstileResult, 'verified'>) {
  return Response.json(
    { success: false, error: result === 'invalid' ? 'Please complete the security check and try again.' : 'Request protection is temporarily unavailable. Please try again shortly.' },
    { status: result === 'invalid' ? 400 : 503, headers: { 'Cache-Control': 'no-store' } },
  );
}
