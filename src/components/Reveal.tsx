import { useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Fades a section up the first time it scrolls into view.
 *
 * Once revealed it stays revealed — replaying the rise on the way back up
 * reads as a glitch rather than a flourish. Anything already on screen at
 * mount shows immediately, so nothing above the fold starts blank if the
 * observer is slow (or missing).
 */
export default function Reveal({
  children,
  className,
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || shown) return;

    const near = () => el.getBoundingClientRect().top < window.innerHeight * 0.92;

    if (!('IntersectionObserver' in window) || near()) {
      setShown(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) setShown(true);
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.08 },
    );
    observer.observe(el);

    // Belt and braces: some hosts scroll a wrapper rather than the window and
    // the observer never fires there, so the scroll handler checks too.
    const onScroll = () => {
      if (near()) setShown(true);
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', onScroll);
    };
  }, [shown]);

  return (
    <div
      ref={ref}
      id={id}
      className={className}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? 'none' : 'translateY(22px)',
        transition: 'opacity .8s cubic-bezier(.2,.8,.2,1), transform .8s cubic-bezier(.2,.8,.2,1)',
      }}
    >
      {children}
    </div>
  );
}
