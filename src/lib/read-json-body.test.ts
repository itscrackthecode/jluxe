import assert from 'node:assert/strict';
import test from 'node:test';
import { readJsonBody } from './read-json-body';

test('reads bounded JSON requests and rejects a declared body that exceeds the limit', async () => {
  const valid = await readJsonBody(new Request('https://thejluxe.com/api/test', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"ok":true}',
  }), 128);
  assert.deepEqual(valid, { ok: true, value: { ok: true } });

  const tooLarge = await readJsonBody(new Request('https://thejluxe.com/api/test', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': '129' }, body: '{}',
  }), 128);
  assert.deepEqual(tooLarge, { ok: false, status: 413, error: 'Request body is too large.' });
});

test('enforces the limit while streaming and rejects invalid content type or malformed JSON', async () => {
  const tooLarge = await readJsonBody(new Request('https://thejluxe.com/api/test', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '12345',
  }), 4);
  assert.deepEqual(tooLarge, { ok: false, status: 413, error: 'Request body is too large.' });

  const wrongType = await readJsonBody(new Request('https://thejluxe.com/api/test', {
    method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: '{}',
  }), 128);
  assert.deepEqual(wrongType, { ok: false, status: 400, error: 'Invalid JSON body.' });

  const malformed = await readJsonBody(new Request('https://thejluxe.com/api/test', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{',
  }), 128);
  assert.deepEqual(malformed, { ok: false, status: 400, error: 'Invalid JSON body.' });
});
