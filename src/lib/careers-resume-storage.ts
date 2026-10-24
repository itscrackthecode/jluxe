import 'server-only';

import { createHash, randomUUID } from 'node:crypto';

const resumeFolder = 'jluxe/careers/resumes';
const maxResumeBytes = 5 * 1024 * 1024;

function getCloudinaryCredentials() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) throw new Error('Private resume storage is not configured.');
  return { cloudName, apiKey, apiSecret };
}

function signApiParameters(parameters: Record<string, string>, apiSecret: string) {
  const serialized = Object.entries(parameters)
    .sort(([first], [second]) => first.localeCompare(second))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
  return createHash('sha1').update(`${serialized}${apiSecret}`, 'utf8').digest('hex');
}

export function validateResumePdf(bytes: Uint8Array) {
  const header = Buffer.from(bytes.subarray(0, 1024));
  const trailer = Buffer.from(bytes.subarray(Math.max(0, bytes.byteLength - 1024)));
  return bytes.byteLength > 0 && bytes.byteLength <= maxResumeBytes
    && header.includes(Buffer.from('%PDF-'))
    && trailer.includes(Buffer.from('%%EOF'));
}

export async function uploadPrivateCareerResume(bytes: Buffer) {
  if (!validateResumePdf(bytes)) throw new Error('Resume must be a valid PDF no larger than 5 MB.');
  const credentials = getCloudinaryCredentials();
  const publicId = `${resumeFolder}/${randomUUID()}.pdf`;
  const form = new FormData();
  form.set('file', new Blob([new Uint8Array(bytes)], { type: 'application/pdf' }), 'resume.pdf');
  form.set('api_key', credentials.apiKey);
  form.set('public_id', publicId);
  form.set('asset_folder', resumeFolder);
  form.set('type', 'authenticated');
  form.set('overwrite', 'false');

  const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(credentials.cloudName)}/raw/upload`, {
    method: 'POST',
    headers: { Authorization: `Basic ${Buffer.from(`${credentials.apiKey}:${credentials.apiSecret}`).toString('base64')}` },
    body: form,
    cache: 'no-store',
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error('Private resume upload failed.');
  const result = await response.json() as {
    public_id?: string; resource_type?: string; type?: string; format?: string;
    bytes?: number; version?: number; signature?: string;
  };
  const signatureInput = `public_id=${publicId}&version=${result.version}${credentials.apiSecret}`;
  const signatureMatches = ['sha1', 'sha256'].some((algorithm) => (
    result.signature === createHash(algorithm).update(signatureInput, 'utf8').digest('hex')
  ));
  const responseChecks = {
    publicIdMatches: result.public_id === publicId,
    resourceTypeIsRaw: result.resource_type === 'raw',
    deliveryTypeIsAuthenticated: result.type === 'authenticated',
    formatIsPdf: result.format === 'pdf',
    byteSizeMatches: result.bytes === bytes.byteLength,
    versionIsValid: Number.isInteger(result.version),
    signatureMatches: signatureMatches,
  };
  if (Object.values(responseChecks).some((matches) => !matches)) {
    console.error('Private career resume upload response failed validation.', responseChecks);
    if (result.public_id === publicId) await destroyPrivateCareerResume(publicId).catch(() => undefined);
    throw new Error('Private resume storage returned an invalid asset.');
  }
  return { storageKey: publicId, byteSize: bytes.byteLength };
}

export async function destroyPrivateCareerResume(storageKey: string) {
  if (!new RegExp(`^${resumeFolder}/[0-9a-f-]{36}\\.pdf$`, 'i').test(storageKey)) {
    throw new Error('Invalid private resume key.');
  }
  const { cloudName, apiKey, apiSecret } = getCloudinaryCredentials();
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const parameters = { public_id: storageKey, timestamp, type: 'authenticated' };
  const form = new FormData();
  for (const [key, value] of Object.entries(parameters)) form.set(key, value);
  form.set('api_key', apiKey);
  form.set('signature', signApiParameters(parameters, apiSecret));
  const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/raw/destroy`, {
    method: 'POST', body: form, cache: 'no-store', signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error('Private resume deletion failed.');
  const result = await response.json() as { result?: string };
  if (result.result !== 'ok' && result.result !== 'not found') throw new Error('Private resume deletion failed.');
}

export function createPrivateCareerResumeDownloadUrl(storageKey: string) {
  if (!new RegExp(`^${resumeFolder}/[0-9a-f-]{36}\\.pdf$`, 'i').test(storageKey)) {
    throw new Error('Invalid private resume key.');
  }
  const { cloudName, apiKey, apiSecret } = getCloudinaryCredentials();
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const expiresAt = (Number(timestamp) + 60).toString();
  const parameters = {
    attachment: 'true',
    expires_at: expiresAt,
    format: 'pdf',
    public_id: storageKey,
    timestamp,
    type: 'authenticated',
  };
  const query = new URLSearchParams({ ...parameters, api_key: apiKey, signature: signApiParameters(parameters, apiSecret) });
  return `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/raw/download?${query.toString()}`;
}
