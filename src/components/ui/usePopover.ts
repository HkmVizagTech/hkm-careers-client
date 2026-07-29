'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

export interface PopoverPosition {
  top: number;
  left: number;
  width: number;
}

interface UsePopoverOptions {
  /** Popover width. 'trigger' matches the trigger's width; a number is a fixed px width. */
  width?: 'trigger' | number;
  /** Height used for the very first paint, before the real height can be measured. */
  estimatedHeight?: number;
  gap?: number;
  /** Minimum distance kept between the popover and the viewport edges. */
  margin?: number;
}

/**
 * Anchors a fixed-position popover to a trigger element.
 *
 * Rendering in a portal with `position: fixed` keeps the popover clear of any ancestor's
 * `overflow: hidden`. Placement runs in two passes: the first paint uses `estimatedHeight`,
 * then a layout effect measures the mounted popover and re-places it using the true height —
 * preferring below the trigger, then above, and finally clamping into the viewport. Because
 * the correction happens in `useLayoutEffect` it is applied before the browser paints.
 */
export function usePopover({
  width = 'trigger',
  estimatedHeight = 320,
  gap = 8,
  margin = 8,
}: UsePopoverOptions = {}) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<PopoverPosition | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  /** Places the popover using `height`, choosing below / above / clamped. */
  const place = useCallback(
    (height: number) => {
      const trigger = triggerRef.current;
      if (!trigger) return;

      const rect = trigger.getBoundingClientRect();
      const viewportW = window.innerWidth;
      const viewportH = window.innerHeight;
      const popWidth = width === 'trigger' ? rect.width : width;

      // Vertical: below if it fits, else above if it fits, else clamp into view.
      let top = rect.bottom + gap;
      if (top + height > viewportH - margin) {
        const above = rect.top - gap - height;
        top = above >= margin ? above : Math.max(margin, viewportH - margin - height);
      }

      // Horizontal: keep both edges inside the viewport.
      let left = rect.left;
      if (left + popWidth > viewportW - margin) left = viewportW - popWidth - margin;
      if (left < margin) left = margin;

      setPosition((prev) => {
        if (prev && prev.top === top && prev.left === left && prev.width === popWidth) {
          return prev; // No change — avoids a redundant render.
        }
        return { top, left, width: popWidth };
      });
    },
    [width, gap, margin],
  );

  // First pass: place with the estimate so the popover paints in roughly the right spot.
  useLayoutEffect(() => {
    if (open) place(estimatedHeight);
    else setPosition(null);
  }, [open, place, estimatedHeight]);

  // Second pass: re-place using the popover's real height, before paint.
  useLayoutEffect(() => {
    if (!open) return;
    const height = popoverRef.current?.offsetHeight;
    if (height) place(height);
  });

  const reposition = useCallback(() => {
    place(popoverRef.current?.offsetHeight || estimatedHeight);
  }, [place, estimatedHeight]);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(e: MouseEvent | TouchEvent) {
      const target = e.target as Node;
      if (!triggerRef.current?.contains(target) && !popoverRef.current?.contains(target)) {
        setOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', reposition);
    // `true` captures scrolls inside any scrollable ancestor, not just the window.
    window.addEventListener('scroll', reposition, true);

    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
    };
  }, [open, reposition]);

  return { open, setOpen, position, triggerRef, popoverRef };
}

/** Shared trigger styling so date pickers, selects, and plain inputs line up exactly. */
export const FIELD_TRIGGER_CLASS =
  'flex h-[50px] w-full items-center gap-2.5 rounded-xl border bg-white px-4 text-left text-sm shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-ocean/30';
