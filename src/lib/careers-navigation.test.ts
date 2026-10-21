import assert from 'node:assert/strict';
import test from 'node:test';
import { careersBasePath, careersHref } from './careers-navigation';

test('Careers links are rooted on the careers host and work under the preview route prefix', () => {
  assert.equal(careersBasePath('careers.thejluxe.com'), '');
  assert.equal(careersBasePath('careers.thejluxe.com:3000'), '');
  assert.equal(careersBasePath('jluxe-preview.vercel.app'), '/careers');
  assert.equal(careersHref('', '/jobs/telecaller'), '/jobs/telecaller');
  assert.equal(careersHref('/careers', '/jobs/telecaller'), '/careers/jobs/telecaller');
  assert.equal(careersHref('', '/'), '/');
  assert.equal(careersHref('/careers', '/'), '/careers');
});
