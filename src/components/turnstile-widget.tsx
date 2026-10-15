'use client';

import Script from 'next/script';
import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react';

type TurnstileRenderOptions = {
  sitekey: string;
  action: string;
  execution: 'execute';
  appearance: 'interaction-only';
  callback: (token: string) => void;
  'error-callback': () => void;
  'expired-callback': () => void;
};

type TurnstileApi = {
  render: (container: HTMLElement, options: TurnstileRenderOptions) => string;
  execute: (widgetId: string) => void;
  reset: (widgetId: string) => void;
};

declare global {
  interface Window { turnstile?: TurnstileApi }
}

export type TurnstileWidgetHandle = { getToken: () => Promise<string> };

function getSiteKey() {
  return process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || null;
}

const TurnstileWidget = forwardRef<TurnstileWidgetHandle, { action: string }>(function TurnstileWidget({ action }, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const pendingRef = useRef<{ resolve: (token: string) => void; reject: (error: Error) => void } | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'unavailable'>('loading');
  const siteKey = getSiteKey();

  const failPending = useCallback(() => {
    const pending = pendingRef.current;
    pendingRef.current = null;
    pending?.reject(new Error('Security check could not be completed. Please try again.'));
  }, []);

  const initialize = useCallback(() => {
    const api = window.turnstile;
    const container = containerRef.current;
    if (!api || !container || !siteKey) {
      setStatus('unavailable');
      return;
    }
    if (widgetIdRef.current) return;

    try {
      widgetIdRef.current = api.render(container, {
        sitekey: siteKey,
        action,
        execution: 'execute',
        appearance: 'interaction-only',
        callback: (token) => {
          const pending = pendingRef.current;
          pendingRef.current = null;
          if (pending) pending.resolve(token);
        },
        'error-callback': failPending,
        'expired-callback': failPending,
      });
      setStatus('ready');
    } catch {
      setStatus('unavailable');
      failPending();
    }
  }, [action, failPending, siteKey]);

  useImperativeHandle(ref, () => ({
    getToken: () => new Promise<string>((resolve, reject) => {
      const api = window.turnstile;
      const widgetId = widgetIdRef.current;
      if (!api || !widgetId || pendingRef.current) {
        reject(new Error('Security check is still loading. Please try again.'));
        return;
      }
      pendingRef.current = { resolve, reject };
      try {
        api.reset(widgetId);
        api.execute(widgetId);
      } catch {
        pendingRef.current = null;
        reject(new Error('Security check could not be completed. Please try again.'));
      }
    }),
  }), []);

  return (
    <div className="space-y-1" aria-live="polite">
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onReady={initialize}
        onError={() => { setStatus('unavailable'); failPending(); }}
      />
      <div ref={containerRef} className="min-h-0" />
      <p className="sr-only">This form uses Cloudflare Turnstile spam protection.</p>
      {status === 'unavailable' && <p role="status" className="text-sm text-red-700">Security verification is unavailable. Please refresh the page and try again.</p>}
    </div>
  );
});

export default TurnstileWidget;
