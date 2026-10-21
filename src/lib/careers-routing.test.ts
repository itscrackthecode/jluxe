import assert from 'node:assert/strict';
import test from 'node:test';
import { careersHostRewrite, careersInternalRewrite } from './careers-routing';

test('Careers hostname rewrites clean URLs into the isolated Careers route tree', () => {
  assert.equal(careersInternalRewrite('/'), '/careers');
  assert.equal(careersInternalRewrite('/jobs/telecaller'), '/careers/jobs/telecaller');
  assert.equal(careersInternalRewrite('/apply/digital-marketing-executive'), '/careers/apply/digital-marketing-executive');
  assert.equal(careersInternalRewrite('/application-received'), '/careers/application-received');
  assert.equal(careersInternalRewrite('/sitemap.xml'), '/careers/sitemap.xml');
  assert.equal(careersInternalRewrite('/robots.txt'), '/careers/robots.txt');
});

test('Next internals, APIs, asset URLs and existing Careers paths pass through', () => {
  for (const path of ['/_next/static/app.js', '/assets/logo.svg', '/api/careers/applications', '/careers', '/careers/jobs/telecaller', '/robots.txt']) {
    if (path === '/robots.txt') assert.equal(careersInternalRewrite(path), '/careers/robots.txt');
    else assert.equal(careersInternalRewrite(path), null);
  }
});

test('local and main hosts keep the main homepage and direct /careers routes unchanged', () => {
  for (const host of ['localhost:3000', '127.0.0.1:3000', 'www.thejluxe.com', 'thejluxe.com']) {
    assert.equal(careersHostRewrite(host, '/'), null, `${host} root should remain the main homepage`);
    assert.equal(careersHostRewrite(host, '/careers'), null, `${host} direct Careers route should pass through`);
  }
});

test('only the Careers hostname rewrites clean URLs to the Careers route tree', () => {
  assert.equal(careersHostRewrite('careers.thejluxe.com', '/'), '/careers');
  assert.equal(careersHostRewrite('careers.thejluxe.com:443', '/jobs/telecaller'), '/careers/jobs/telecaller');
});
