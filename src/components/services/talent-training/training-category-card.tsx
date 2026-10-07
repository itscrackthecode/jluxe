'use client';

import { useId, useState } from 'react';
import type { KeyboardEvent, PointerEvent } from 'react';

type TrainingItem = string | { field: string; examples: string };

export type TrainingCategory = {
  title: string;
  description: string;
  items: TrainingItem[];
};

function handleKeyDown(event: KeyboardEvent<HTMLElement>, toggle: () => void, close: () => void) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    toggle();
  } else if (event.key === 'Escape') {
    close();
  }
}

export default function TrainingCategoryCard({ category }: { category: TrainingCategory }) {
  const panelId = useId();
  const [isHovered, setIsHovered] = useState(false);
  const [isActivated, setIsActivated] = useState(false);
  const isOpen = isHovered || isActivated;

  const toggle = () => setIsActivated((current) => !current);
  const close = () => {
    setIsHovered(false);
    setIsActivated(false);
  };

  const handlePointerEnter = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType === 'mouse') setIsHovered(true);
  };
  const handlePointerLeave = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType === 'mouse') setIsHovered(false);
  };
  const handlePointerUp = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType === 'touch') toggle();
  };

  return (
    <article
      role="button"
      tabIndex={0}
      aria-expanded={isOpen}
      aria-controls={panelId}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onPointerUp={handlePointerUp}
      onKeyDown={(event) => handleKeyDown(event, toggle, close)}
      className="premium-card min-w-0 cursor-pointer border border-white/15 bg-white/[0.035] p-5 text-left text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--gold)] sm:p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="font-display text-xl leading-snug sm:text-2xl">{category.title}</h3>
          <p className="mt-2 text-sm leading-6 text-white/65">{category.description}</p>
        </div>
        <span aria-hidden="true" className="shrink-0 pt-1 text-sm text-[var(--gold)]">
          {isOpen ? '↶' : '↗'}
        </span>
      </div>

      <div
        id={panelId}
        aria-hidden={!isOpen}
        inert={!isOpen}
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="mt-4 border-t border-white/10 pt-4">
            {category.items.some((item) => typeof item !== 'string') ? (
              <ul className="grid gap-3 sm:grid-cols-2">
                {category.items.map((item) => {
                  if (typeof item === 'string') return null;

                  return (
                    <li key={item.field} className="min-w-0 border-l border-[var(--gold)]/55 pl-3">
                      <h4 className="text-[10px] font-semibold tracking-[0.16em] text-[var(--gold)]">{item.field}</h4>
                      <p className="mt-1 text-xs leading-5 text-white/75">{item.examples}</p>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {category.items.map((item) => (
                  typeof item === 'string' ? (
                    <li key={item} className="border border-white/15 bg-white/[0.04] px-2.5 py-1.5 text-xs leading-tight text-white/75">
                      {item}
                    </li>
                  ) : null
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <p className="mt-3 text-[10px] font-medium tracking-wide text-white/40">
        {isHovered && !isActivated ? 'Move away to close' : isOpen ? 'Tap or press Escape to close' : 'Hover or tap to explore'}
      </p>
    </article>
  );
}
