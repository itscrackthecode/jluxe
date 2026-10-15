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

export async function uploadImage(file: File, signerPath: string, purpose?: AdminImagePurpose, turnstileToken?: string): Promise<UploadedCloudinaryImage> {
  const issue = validateImageFile(file);
  if (issue) throw new Error(issue);
  const signedResponse = await fetch(signerPath, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ intent: 'sign', ...(purpose ? { purpose } : {}), ...(turnstileToken ? { turnstileToken } : {}) }),
  });
  const signed = await signedResponse.json();
  if (!signedResponse.ok || !signed.success) throw new Error(signed.error ?? 'Unable to prepare image upload.');

  const form = new FormData();
  form.set('file', file);
  form.set('api_key', signed.apiKey);
  form.set('timestamp', String(signed.timestamp));
  form.set('upload_preset', signed.uploadPreset);
  form.set('public_id', signed.publicId);
  form.set('overwrite', String(signed.overwrite));
  form.set('allowed_formats', signed.allowedFormats);
  form.set('signature', signed.signature);
  if (signed.assetFolder) form.set('asset_folder', signed.assetFolder);
  const response = await fetch(`https://api.cloudinary.com/v1_1/${signed.cloudName}/image/upload`, { method: 'POST', body: form });
  const uploaded = await response.json();
  if (!response.ok) throw new Error('Cloudinary rejected this image upload.');
  if (!uploaded || uploaded.resource_type !== 'image' || typeof uploaded.public_id !== 'string' || uploaded.public_id !== signed.publicId
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
    body: JSON.stringify({ intent: 'complete', purpose, ...image }),
  });
  const result = await response.json();
  if (!response.ok || !result.success) throw new Error(result.error ?? 'Unable to save uploaded media.');
  return result.data as { id: string; storageKey: string; mimeType: string; deliveryUrl?: string | null; width: number; height: number };
}

export type PropertyDocumentKind = 'FLOOR_PLAN' | 'BROCHURE' | 'PRICE_DOCUMENT';
export const MAX_PROPERTY_DOCUMENT_SIZE = 25 * 1024 * 1024;

export async function uploadAdminPropertyDocument(file: File, propertyId: string, kind: PropertyDocumentKind) {
  if (file.type !== 'application/pdf') throw new Error('Choose a PDF document.');
  if (file.size <= 0 || file.size > MAX_PROPERTY_DOCUMENT_SIZE) throw new Error('Each PDF must be 25 MB or smaller.');
  const signer = await fetch(`/admin/api/properties/${propertyId}/documents`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ intent: 'sign' }),
  });
  const signed = await signer.json();
  if (!signer.ok || !signed.success) throw new Error(signed.error ?? 'Unable to prepare document upload.');
  const form = new FormData();
  form.set('file', file); form.set('api_key', signed.apiKey); form.set('timestamp', String(signed.timestamp));
  form.set('upload_preset', signed.uploadPreset); form.set('public_id', signed.publicId);
  form.set('overwrite', String(signed.overwrite)); form.set('allowed_formats', signed.allowedFormats);
  form.set('asset_folder', signed.assetFolder); form.set('signature', signed.signature);
  const uploadedResponse = await fetch(`https://api.cloudinary.com/v1_1/${signed.cloudName}/raw/upload`, { method: 'POST', body: form });
  const uploaded = await uploadedResponse.json();
  if (!uploadedResponse.ok || uploaded?.resource_type !== 'raw' || uploaded?.format !== 'pdf'
    || uploaded?.public_id !== signed.publicId || typeof uploaded?.secure_url !== 'string'
    || !Number.isSafeInteger(uploaded?.bytes) || uploaded.bytes <= 0 || uploaded.bytes > MAX_PROPERTY_DOCUMENT_SIZE
    || !Number.isInteger(uploaded?.version) || !/^[a-f0-9]{40}$/i.test(uploaded?.signature ?? '')) {
    throw new Error('The uploaded PDF does not meet the accepted format or size limits.');
  }
  const savedResponse = await fetch(`/admin/api/properties/${propertyId}/documents`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ intent: 'complete', kind, title: file.name.replace(/\.pdf$/i, '').slice(0, 255), publicId: uploaded.public_id, version: uploaded.version, signature: uploaded.signature, secureUrl: uploaded.secure_url, bytes: uploaded.bytes }),
  });
  const saved = await savedResponse.json();
  if (!savedResponse.ok || !saved.success) throw new Error(saved.error ?? 'Unable to save the document.');
  return saved.data as { id: string; title: string; kind: PropertyDocumentKind; url: string };
}
