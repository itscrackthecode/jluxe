import assert from 'node:assert/strict';
import test from 'node:test';
import {
  consumeApiRateLimit,
  publicApiRateLimitResponse,
} from './public-api-rate-limit';

function makeCounterQuery() {
  const counters = new Map<string, number>();

  return async (_text: string, values: unknown[]) => {
    const [endpoint, clientKey, windowStart, , limit] = values;
    const key = `${endpoint}:${clientKey}:${(windowStart as Date).toISOString()}`;
    const count = counters.get(key) ?? 0;
    if (count >= Number(limit)) return { rows: [] };
    counters.set(key, count + 1);
    return { rows: [{ requestCount: count + 1 }] };
  };
}

test('allows requests up to the configured limit and returns a retryable 429 after it', async () => {
  const query = makeCounterQuery();
  const options = {
    endpoint: 'POST /api/enquiries',
    clientIp: '203.0.113.10',
    limit: 5,
    windowMs: 10 * 60 * 1000,
    now: 120_500,
  };

  for (let request = 0; request < 5; request += 1) {
    assert.deepEqual(await consumeApiRateLimit(query, options), { status: 'allowed' });
  }

  const decision = await consumeApiRateLimit(query, options);
  assert.deepEqual(decision, { status: 'limited', retryAfterSeconds: 480 });

  const response = publicApiRateLimitResponse(decision);
  assert.equal(response?.status, 429);
  assert.equal(response?.headers.get('Retry-After'), '480');
  assert.deepEqual(await response?.json(), {
    success: false,
    error: 'Too many requests. Please try again later.',
  });
});

test('returns a generic unavailable response without exposing database errors', async () => {
  const decision = await consumeApiRateLimit(
    async () => { throw new Error('sensitive database connection details'); },
    {
      endpoint: 'POST /api/properties/sell',
      clientIp: '203.0.113.10',
      limit: 5,
      windowMs: 10 * 60 * 1000,
      now: 120_500,
    },
  );

  const response = publicApiRateLimitResponse(decision);
  assert.equal(response?.status, 503);
  assert.deepEqual(await response?.json(), {
    success: false,
    error: 'Request protection is temporarily unavailable. Please try again shortly.',
  });
});
