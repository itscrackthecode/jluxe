'use client';

export type UploadedCloudinaryImage = {
  publicId: string;
  version: number;
  signature: string;
  secureUrl: string;
  format: 'jpg' | 'jpeg' | 'png' | 'webp' | 'avif';
  bytes: number;
  width: number;
  height: number;
  resourceType: 'image';
};

export const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
export const MAX_IMAGE_COUNT = 8;
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
export type AdminImagePurpose = 'website' | 'properties' | 'portfolio';

export function validateImageFile(file: File) {
  if (!IMAGE_TYPES.includes(file.type)) return 'Choose a JPG, PNG, WebP, or AVIF image.';
  if (file.size > MAX_IMAGE_SIZE) return 'Each image must be 10 MB or smaller.';
  return null;
}

export async function uploadImage(file: File, signerPath: string, purpose?: AdminImagePurpose): Promise<UploadedCloudinaryImage> {
  const issue = validateImageFile(file);
  if (issue) throw new Error(issue);
  const signedResponse = await fetch(signerPath, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ intent: 'sign', ...(purpose ? { purpose } : {}) }),
  });
  const signed = await signedResponse.json();
  if (!signedResponse.ok || !signed.success) throw new Error(signed.error ?? 'Unable to prepare image upload.');

  const form = new FormData();
  form.set('file', file);
  form.set('api_key', signed.apiKey);
  form.set('timestamp', String(signed.timestamp));
  form.set('upload_preset', signed.uploadPreset);
  form.set('signature', signed.signature);
  if (signed.assetFolder) form.set('asset_folder', signed.assetFolder);
  const response = await fetch(`https://api.cloudinary.com/v1_1/${signed.cloudName}/image/upload`, { method: 'POST', body: form });
  const uploaded = await response.json();
  if (!response.ok) throw new Error('Cloudinary rejected this image upload.');
  if (!uploaded || uploaded.resource_type !== 'image' || typeof uploaded.public_id !== 'string'
    || !Number.isInteger(uploaded.version) || !/^[a-f0-9]{40}$/i.test(uploaded.signature ?? '')
    || typeof uploaded.secure_url !== 'string' || !['jpg', 'jpeg', 'png', 'webp', 'avif'].includes(uploaded.format)
    || !Number.isInteger(uploaded.bytes) || !Number.isInteger(uploaded.width) || !Number.isInteger(uploaded.height)
    || uploaded.bytes > MAX_IMAGE_SIZE) {
    throw new Error('The uploaded image does not meet the accepted format or size limits.');
  }
  return {
    publicId: uploaded.public_id,
    version: uploaded.version,
    signature: uploaded.signature,
    secureUrl: uploaded.secure_url,
    format: uploaded.format,
    bytes: uploaded.bytes,
    width: uploaded.width,
    height: uploaded.height,
    resourceType: 'image',
  };
}

export async function uploadAdminImage(file: File, purpose: AdminImagePurpose = 'website') {
  const image = await uploadImage(file, '/admin/api/media', purpose);
  const response = await fetch('/admin/api/media', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ intent: 'complete', ...image }),
  });
  const result = await response.json();
  if (!response.ok || !result.success) throw new Error(result.error ?? 'Unable to save uploaded media.');
  return result.data as { id: string; storageKey: string; mimeType: string; deliveryUrl?: string | null; width: number; height: number };
}
