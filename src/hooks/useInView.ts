import { useState, useEffect, useRef } from 'react';

export function useInView<T extends HTMLElement = HTMLDivElement>(options?: object) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true);
      }
    }, { threshold: 0.1, ...(options as object) });

    observer.observe(el);
    return () => observer.disconnect();
  }, [options]);

  return { ref, inView };
}