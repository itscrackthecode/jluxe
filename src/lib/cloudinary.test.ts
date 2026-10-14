import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';
import { createCloudinaryUploadSignature, createSellerCloudinaryUploadSignature } from './cloudinary';

const originalEnvironment = {
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  CLOUDINARY_UPLOAD_PRESET: process.env.CLOUDINARY_UPLOAD_PRESET,
};

process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
process.env.CLOUDINARY_API_KEY = 'test-api-key';
process.env.CLOUDINARY_API_SECRET = 'test-api-secret';
process.env.CLOUDINARY_UPLOAD_PRESET = 'test-preset';

function assertOneShotSignature(result: { publicId: string; overwrite: boolean; assetFolder: string; allowedFormats: string; signature: string }, folder: string) {
  assert.match(result.publicId, /^[a-f0-9]{32}$/);
  assert.equal(result.overwrite, false);
  assert.equal(result.assetFolder, folder);
  assert.equal(result.allowedFormats, 'avif,jpg,jpeg,png,webp');
  const expected = createHash('sha1')
    .update(`allowed_formats=${result.allowedFormats}&asset_folder=${folder}&overwrite=false&public_id=${result.publicId}&timestamp=1234567890&upload_preset=test-presettest-api-secret`)
    .digest('hex');
  assert.equal(result.signature, expected);
}

test('admin upload signatures bind the folder, unique public ID, timestamp, preset, and no-overwrite flag', () => {
  assertOneShotSignature(createCloudinaryUploadSignature(1234567890, 'jluxe/properties'), 'jluxe/properties');
});

test('seller upload signatures remain restricted to the seller folder and cannot overwrite', () => {
  assertOneShotSignature(createSellerCloudinaryUploadSignature(1234567890), 'jluxe/seller-submissions');
});

test.after(() => {
  for (const [key, value] of Object.entries(originalEnvironment)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});
