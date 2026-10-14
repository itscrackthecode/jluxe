import assert from 'node:assert/strict';
import test from 'node:test';
import { turnstileResponse, verifyTurnstileToken } from './turnstile';

const originalSecret = process.env.TURNSTILE_SECRET_KEY;
process.env.TURNSTILE_SECRET_KEY = 'test-secret';

function siteverify(body: unknown, status = 200): typeof fetch {
  return async (input, init) => {
    assert.equal(input, 'https://challenges.cloudflare.com/turnstile/v0/siteverify');
    assert.equal(init?.method, 'POST');
    assert.equal(init?.cache, 'no-store');
    const form = new URLSearchParams(String(init?.body));
    assert.equal(form.get('secret'), 'test-secret');
    assert.equal(form.get('response'), 'valid-token');
    return new Response(JSON.stringify(body), { status });
  };
}

test('accepts only a successful Siteverify response for the expected hostname and action', async () => {
  assert.equal(await verifyTurnstileToken(
    'valid-token', 'public_enquiry', 'https://www.thejluxe.com/api/enquiries',
    siteverify({ success: true, hostname: 'www.thejluxe.com', action: 'public_enquiry' }),
  ), 'verified');
});

test('rejects missing, malformed, failed, expired, duplicate, wrong-host, and wrong-action tokens', async () => {
  assert.equal(await verifyTurnstileToken('', 'public_enquiry', 'https://www.thejluxe.com'), 'invalid');
  assert.equal(await verifyTurnstileToken('x'.repeat(2049), 'public_enquiry', 'https://www.thejluxe.com'), 'invalid');
  assert.equal(await verifyTurnstileToken('valid-token', 'public_enquiry', 'https://www.thejluxe.com', siteverify({ success: false, 'error-codes': ['invalid-input-response'] })), 'invalid');
  for (const errorCode of ['timeout-or-duplicate']) {
    assert.equal(await verifyTurnstileToken('valid-token', 'public_enquiry', 'https://www.thejluxe.com', siteverify({ success: false, 'error-codes': [errorCode] })), 'invalid');
  }
  assert.equal(await verifyTurnstileToken('valid-token', 'public_enquiry', 'https://www.thejluxe.com', siteverify({ success: true, hostname: 'attacker.example', action: 'public_enquiry' })), 'invalid');
  assert.equal(await verifyTurnstileToken('valid-token', 'public_enquiry', 'https://www.thejluxe.com', siteverify({ success: true, hostname: 'www.thejluxe.com', action: 'seller_submission' })), 'invalid');
});

test('fails closed when Siteverify is unavailable or server configuration is missing', async () => {
  assert.equal(await verifyTurnstileToken('valid-token', 'public_enquiry', 'https://www.thejluxe.com', siteverify({}, 503)), 'unavailable');
  assert.equal(await verifyTurnstileToken('valid-token', 'public_enquiry', 'https://www.thejluxe.com', async () => { throw new Error('network failure'); }), 'unavailable');

  delete process.env.TURNSTILE_SECRET_KEY;
  try {
    assert.equal(await verifyTurnstileToken('valid-token', 'public_enquiry', 'https://www.thejluxe.com'), 'unavailable');
  } finally {
    if (originalSecret === undefined) delete process.env.TURNSTILE_SECRET_KEY;
    else process.env.TURNSTILE_SECRET_KEY = originalSecret;
  }
});

test('maps invalid tokens to 400 and verification outages to 503 without leaking data', async () => {
  const invalid = turnstileResponse('invalid');
  assert.equal(invalid.status, 400);
  assert.match(JSON.stringify(await invalid.json()), /security check/i);

  const unavailable = turnstileResponse('unavailable');
  assert.equal(unavailable.status, 503);
  assert.doesNotMatch(JSON.stringify(await unavailable.json()), /secret|token/i);
  assert.equal(unavailable.headers.get('Cache-Control'), 'no-store');
});
