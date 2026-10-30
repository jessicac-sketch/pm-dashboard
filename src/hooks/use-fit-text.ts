"use client";

import { useLayoutEffect, useRef } from "react";

/**
 * Shrinks a single line of text until it fits its own box: starts at `max` px
 * and steps down to `min`. Re-fits when the box is resized or the text changes.
 * Attach the returned ref to an element with `white-space: nowrap`.
 */
export const useFitText = <T extends HTMLElement,>(text: string, { max = 15, min = 8, step = 0.5 } = {}) => {
  const ref = useRef<T>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => {
      let size = max;
      el.style.fontSize = `${size}px`;
      while (size > min && el.scrollWidth > el.clientWidth) {
        size -= step;
        el.style.fontSize = `${size}px`;
      }
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(el.parentElement ?? el);
    return () => observer.disconnect();
  }, [text, max, min, step]);

  return ref;
};
