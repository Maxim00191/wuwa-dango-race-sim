import { type RefObject, useLayoutEffect, useRef } from "react";

const TRANSFORM_DURATION_MS = 420;

export function useListFlipAnimation<T extends HTMLElement>(
  orderedIdsKey: string
): RefObject<T | null> {
  const listRef = useRef<T | null>(null);
  const positionsRef = useRef(new Map<string, DOMRect>());

  useLayoutEffect(() => {
    const root = listRef.current;
    if (!root) {
      return;
    }
    const nodes = root.querySelectorAll<HTMLElement>("[data-flip-item]");
    nodes.forEach((element) => {
      const id = element.dataset.flipItem;
      if (!id) {
        return;
      }
      const nextBounds = element.getBoundingClientRect();
      const previousBounds = positionsRef.current.get(id);
      if (previousBounds) {
        const deltaX = previousBounds.left - nextBounds.left;
        const deltaY = previousBounds.top - nextBounds.top;
        if (Math.abs(deltaX) > 0.5 || Math.abs(deltaY) > 0.5) {
          element.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
          element.style.transition = "none";
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              element.style.transition = `transform ${TRANSFORM_DURATION_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`;
              element.style.transform = "translate(0, 0)";
              window.setTimeout(() => {
                element.style.removeProperty("transition");
                element.style.removeProperty("transform");
              }, TRANSFORM_DURATION_MS + 40);
            });
          });
        }
      }
      positionsRef.current.set(id, nextBounds);
    });
    const seen = new Set<string>();
    nodes.forEach((element) => {
      const id = element.dataset.flipItem;
      if (id) {
        seen.add(id);
      }
    });
    for (const key of [...positionsRef.current.keys()]) {
      if (!seen.has(key)) {
        positionsRef.current.delete(key);
      }
    }
  }, [orderedIdsKey]);

  return listRef;
}
