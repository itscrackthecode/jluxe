export type JsonBodyReadResult =
  | { ok: true; value: unknown }
  | { ok: false; status: 400 | 413; error: 'Invalid JSON body.' | 'Request body is too large.' };

export async function readJsonBody(request: Request, maxBytes: number): Promise<JsonBodyReadResult> {
  const contentType = request.headers.get('content-type')?.split(';', 1)[0].trim().toLowerCase();
  if (contentType !== 'application/json') return { ok: false, status: 400, error: 'Invalid JSON body.' };

  const contentLength = request.headers.get('content-length');
  if (contentLength !== null) {
    if (!/^\d+$/.test(contentLength)) return { ok: false, status: 400, error: 'Invalid JSON body.' };
    if (Number(contentLength) > maxBytes) return { ok: false, status: 413, error: 'Request body is too large.' };
  }

  if (!request.body) return { ok: false, status: 400, error: 'Invalid JSON body.' };

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let byteLength = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      byteLength += value.byteLength;
      if (byteLength > maxBytes) {
        await reader.cancel();
        return { ok: false, status: 413, error: 'Request body is too large.' };
      }
      chunks.push(value);
    }

    const bytes = new Uint8Array(byteLength);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    return { ok: true, value: JSON.parse(text) as unknown };
  } catch {
    return { ok: false, status: 400, error: 'Invalid JSON body.' };
  } finally {
    reader.releaseLock();
  }
}
