'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

function isMobileViewport() {
  return window.matchMedia('(max-width: 767px)').matches;
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function revealAll() {
  document.querySelectorAll('[data-reveal]').forEach((element) => {
    element.classList.add('is-revealed');
  });
}

export default function MobileReveal() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('js-mobile-reveal');

    if (prefersReducedMotion() || !isMobileViewport()) {
      revealAll();
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.14, rootMargin: '0px 0px -6% 0px' },
    );

    const observePending = () => {
      document.querySelectorAll<HTMLElement>('[data-reveal]:not(.is-revealed)').forEach((element) => {
        observer.observe(element);
      });
    };

    observePending();
    const mutations = new MutationObserver(observePending);
    mutations.observe(document.body, { childList: true, subtree: true });

    const onChange = () => {
      if (prefersReducedMotion() || !isMobileViewport()) {
        revealAll();
      }
    };

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const viewportQuery = window.matchMedia('(max-width: 767px)');
    motionQuery.addEventListener('change', onChange);
    viewportQuery.addEventListener('change', onChange);

    return () => {
      observer.disconnect();
      mutations.disconnect();
      motionQuery.removeEventListener('change', onChange);
      viewportQuery.removeEventListener('change', onChange);
    };
  }, [pathname]);

  return null;
}
