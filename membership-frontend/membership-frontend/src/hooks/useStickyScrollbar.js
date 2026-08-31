import { createElement, useEffect, useRef } from "react";

export function useStickyScrollbar(deps = []) {
  const tableWrapRef = useRef(null);
  const mirrorRef = useRef(null);
  const mirrorInnerRef = useRef(null);
  const isSyncingRef = useRef(false);

  useEffect(() => {
    const wrap = tableWrapRef.current;
    const mirror = mirrorRef.current;
    const inner = mirrorInnerRef.current;
    if (!wrap || !mirror || !inner) return;

    const syncDimensions = () => {
      const rect = wrap.getBoundingClientRect();
      inner.style.width = wrap.scrollWidth + 'px';
      mirror.style.width = rect.width + 'px';
      mirror.style.left = rect.left + 'px';
    };

    const onTableScroll = () => {
      if (isSyncingRef.current) return;
      isSyncingRef.current = true;
      mirror.scrollLeft = wrap.scrollLeft;
      isSyncingRef.current = false;
    };

    const onMirrorScroll = () => {
      if (isSyncingRef.current) return;
      isSyncingRef.current = true;
      wrap.scrollLeft = mirror.scrollLeft;
      isSyncingRef.current = false;
    };

    // Sentinel sits at the bottom of the table wrapper.
    // When it drops below the viewport the native scrollbar is off-screen
    // and we need the mirror. When it's visible (or above), hide mirror.
    const sentinel = document.createElement('div');
    sentinel.style.cssText = 'height: 1px; pointer-events: none;';
    wrap.appendChild(sentinel);

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting && entry.boundingClientRect.top > 0) {
        // Sentinel is below the viewport — we're mid-table
        if (wrap.scrollWidth > wrap.clientWidth) {
          mirror.style.display = 'block';
          syncDimensions();
        }
      } else {
        mirror.style.display = 'none';
      }
    }, { threshold: 0 });

    observer.observe(sentinel);

    const resizeObserver = new ResizeObserver(() => {
      if (mirror.style.display !== 'none') syncDimensions();
    });
    resizeObserver.observe(wrap);

    wrap.addEventListener('scroll', onTableScroll);
    mirror.addEventListener('scroll', onMirrorScroll);

    return () => {
      observer.disconnect();
      resizeObserver.disconnect();
      sentinel.remove();
      wrap.removeEventListener('scroll', onTableScroll);
      mirror.removeEventListener('scroll', onMirrorScroll);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const mirrorScrollbar = createElement(
    'div',
    {
      ref: mirrorRef,
      style: {
        position: 'fixed',
        bottom: 0,
        left: 0,
        overflowX: 'auto',
        overflowY: 'hidden',
        height: '16px',
        zIndex: 1000,
        background: 'var(--card-bg)',
        borderTop: '1px solid var(--border-primary)',
        display: 'none',
      },
    },
    createElement('div', { ref: mirrorInnerRef, style: { height: '1px' } })
  );

  return { tableWrapRef, mirrorScrollbar };
}
