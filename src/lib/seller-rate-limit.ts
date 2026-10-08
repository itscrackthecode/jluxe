const attempts = new Map<string, number[]>();

export function consumeSellerRateLimit(key: string, limit: number, windowMs: number, now = Date.now()) {
  if (attempts.size > 5000) {
    for (const [candidate, times] of attempts) {
      if (!times.some((time) => now - time < windowMs)) attempts.delete(candidate);
    }
  }
  const recent = (attempts.get(key) ?? []).filter((time) => now - time < windowMs);
  if (recent.length >= limit) {
    attempts.set(key, recent);
    return false;
  }
  recent.push(now);
  attempts.set(key, recent);
  return true;
}

export function sellerClientKey(request: Request) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';
}
