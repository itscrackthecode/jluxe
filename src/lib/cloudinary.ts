import 'server-only';
import { createHash, timingSafeEqual } from 'node:crypto';

function cloudName() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  if (!cloudName) throw new Error('Cloudinary is not configured.');
  return cloudName;
}

function config() {
  const name = cloudName();
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;
  if (!apiKey || !apiSecret || !uploadPreset) throw new Error('Cloudinary is not configured.');
  return { cloudName: name, apiKey, apiSecret, uploadPreset };
}

function digest(value: string) {
  return createHash('sha1').update(value).digest('hex');
}

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export type AdminCloudinaryAssetFolder = 'jluxe/website' | 'jluxe/properties' | 'jluxe/portfolio';

export function createCloudinaryUploadSignature(timestamp: number, assetFolder: AdminCloudinaryAssetFolder = 'jluxe/website') {
  const values = config();
  const signature = digest(`asset_folder=${assetFolder}&timestamp=${timestamp}&upload_preset=${values.uploadPreset}${values.apiSecret}`);
  return { cloudName: values.cloudName, apiKey: values.apiKey, uploadPreset: values.uploadPreset, assetFolder, signature };
}

export function createSellerCloudinaryUploadSignature(timestamp: number) {
  const values = config();
  const assetFolder = 'jluxe/seller-submissions';
  const signature = digest(`asset_folder=${assetFolder}&timestamp=${timestamp}&upload_preset=${values.uploadPreset}${values.apiSecret}`);
  return { cloudName: values.cloudName, apiKey: values.apiKey, uploadPreset: values.uploadPreset, assetFolder, signature };
}

export function verifySellerCloudinaryUpload(publicId: string, version: number, signature: string, secureUrl: string) {
  const { cloudName: name } = config();
  try {
    const url = new URL(secureUrl);
    return url.protocol === 'https:' && url.hostname === 'res.cloudinary.com'
      && url.pathname.startsWith(`/${name}/image/upload/`)
      && verifyCloudinaryUpload(publicId, version, signature);
  } catch {
    return false;
  }
}

export function verifyCloudinaryUpload(publicId: string, version: number, signature: string) {
  const { apiSecret } = config();
  return safeEqual(digest(`public_id=${publicId}&version=${version}${apiSecret}`), signature);
}

export function cloudinaryDeliveryUrl(publicId: string, width?: number) {
  const name = cloudName();
  const transform = width ? `c_limit,w_${width}/` : '';
  return `https://res.cloudinary.com/${name}/image/upload/${transform}f_auto,q_auto/${publicId}`;
}

export async function destroyCloudinaryImage(publicId: string) {
  const { cloudName, apiKey, apiSecret } = config();
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = digest(`public_id=${publicId}&timestamp=${timestamp}${apiSecret}`);
  const body = new FormData();
  body.set('public_id', publicId);
  body.set('timestamp', String(timestamp));
  body.set('api_key', apiKey);
  body.set('signature', signature);
  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, { method: 'POST', body });
  if (!response.ok) throw new Error('Cloudinary deletion failed.');
  const result = await response.json() as { result?: string };
  if (result.result !== 'ok' && result.result !== 'not found') throw new Error('Cloudinary deletion failed.');
}

export async function getCloudinaryImageDetails(publicId: string) {
  const { cloudName: name, apiKey, apiSecret } = config();
  const response = await fetch(`https://api.cloudinary.com/v1_1/${name}/resources/image/upload/${publicId.split('/').map(encodeURIComponent).join('/')}`, {
    headers: { Authorization: `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')}` },
    cache: 'no-store',
  });
  if (!response.ok) throw new Error('Cloudinary image verification failed.');
  return await response.json() as { public_id: string; resource_type: string; format: string; bytes: number; width: number; height: number; asset_folder?: string };
}
