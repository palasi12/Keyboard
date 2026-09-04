import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Scroll-driven turntable.
 *
 * The Apple product-page effect: a pre-rendered image sequence scrubbed by
 * scroll position. Nothing is rendered in 3D at runtime — every frame was baked
 * in the render rig, so it costs a canvas draw per scroll tick instead of a
 * WebGL context on someone's phone.
 *
 * The section is `heightVh` tall; the viewport inside it is sticky. Scrolling
 * from the top of the section to the bottom walks frame 0 to frame n-1.
 *
 * Frames live at `${basePath}/000.webp` … and are numbered from zero, three
 * digits. If the first frame 404s the whole section unmounts, so the page is
 * clean until real frames exist — see docs/RENDER.md for the export recipe.
 */

export interface TurntableBeat {
  /** Where in the scroll this caption takes over, 0–1. */
  at: number;
  kicker: string;
  line: string;
}

export default function ScrollTurntable({
  basePath,
  frameCount,
  beats = [],
  heightVh = 320,
  alt,
}: {
  basePath: string;
  frameCount: number;
  beats?: TurntableBeat[];
  heightVh?: number;
  alt: string;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const framesRef = useRef<HTMLImageElement[]>([]);
  const drawnRef = useRef(-1);
  const rafRef = useRef<number>();

  const [available, setAvailable] = useState<boolean | null>(null);
  const [loaded, setLoaded] = useState(0);
  const [beat, setBeat] = useState(0);
  const [reduced, setReduced] = useState(false);

  const src = useCallback(
    (i: number) => `${basePath}/${String(i).padStart(3, '0')}.webp`,
    [basePath],
  );

  // Honour the OS "reduce motion" setting: no scrub, just a still.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setReduced(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  // Probe frame zero. No frames, no section.
  useEffect(() => {
    let cancelled = false;
    const probe = new Image();
    probe.onload = () => !cancelled && setAvailable(true);
    probe.onerror = () => !cancelled && setAvailable(false);
    probe.src = src(0);
    return () => {
      cancelled = true;
    };
  }, [src]);

  // Preload the sequence. Decoding on demand mid-scroll is what makes these
  // things stutter, so every frame is fetched and decoded up front.
  useEffect(() => {
    if (!available) return;
    let cancelled = false;
    const imgs: HTMLImageElement[] = [];
    let done = 0;

    const count = reduced ? 1 : frameCount;
    for (let i = 0; i < count; i++) {
      const img = new Image();
      img.decoding = 'async';
      img.onload = img.onerror = () => {
        if (cancelled) return;
        done += 1;
        setLoaded(done);
      };
      img.src = src(i);
      imgs.push(img);
    }
    framesRef.current = imgs;

    return () => {
      cancelled = true;
    };
  }, [available, frameCount, reduced, src]);

  const paint = useCallback((index: number) => {
    const canvas = canvasRef.current;
    const img = framesRef.current[index];
    if (!canvas || !img || !img.complete || !img.naturalWidth) return;
    if (drawnRef.current === index) return;
    drawnRef.current = index;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // contain, not cover — the product must never be cropped
    const scale = Math.min(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    ctx.drawImage(img, (canvas.width - dw) / 2, (canvas.height - dh) / 2, dw, dh);
  }, []);

  useEffect(() => {
    if (!available) return;

    const update = () => {
      rafRef.current = undefined;
      const el = sectionRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const travel = rect.height - window.innerHeight;
      const progress = travel <= 0 ? 0 : Math.min(1, Math.max(0, -rect.top / travel));

      const index = reduced ? 0 : Math.round(progress * (frameCount - 1));
      paint(index);

      if (beats.length) {
        let next = 0;
        for (let i = 0; i < beats.length; i++) {
          const b = beats[i];
          if (b && progress >= b.at) next = i;
        }
        setBeat(next);
      }
    };

    const onScroll = () => {
      if (rafRef.current === undefined) rafRef.current = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (rafRef.current !== undefined) cancelAnimationFrame(rafRef.current);
    };
  }, [available, beats, frameCount, paint, reduced]);

  // Repaint once frames finish arriving, in case the first paint had nothing.
  useEffect(() => {
    if (loaded > 0) {
      drawnRef.current = -1;
      paint(Math.max(0, drawnRef.current));
      const el = sectionRef.current;
      if (el) {
        const rect = el.getBoundingClientRect();
        const travel = rect.height - window.innerHeight;
        const progress = travel <= 0 ? 0 : Math.min(1, Math.max(0, -rect.top / travel));
        paint(reduced ? 0 : Math.round(progress * (frameCount - 1)));
      }
    }
  }, [loaded, frameCount, paint, reduced]);

  if (available === false) return null;

  const ready = loaded >= (reduced ? 1 : frameCount);
  const current = beats[beat];

  return (
    <section
      ref={sectionRef}
      className="relative border-t-2 border-divider"
      style={{ height: reduced ? undefined : `${heightVh}vh` }}
      aria-label={alt}
    >
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        <div className="mx-auto grid w-full max-w-shell items-center gap-8 px-5 lg:grid-cols-[.8fr_1.2fr]">
          {/* pinned copy, swapped at scroll beats */}
          <div className="order-2 lg:order-1">
            {current && (
              <div key={current.kicker}>
                <p className="text-[10px] uppercase tracking-[0.18em] text-neutral-600">
                  {current.kicker}
                </p>
                <p className="mt-3 max-w-sm text-2xl font-heading leading-[1.15] tracking-heading text-neutral-100 sm:text-3xl">
                  {current.line}
                </p>
              </div>
            )}

            {beats.length > 1 && (
              <div className="mt-7 flex gap-1.5" aria-hidden="true">
                {beats.map((b, i) => (
                  <span
                    key={b.at}
                    className="h-0.5 w-8 transition-colors"
                    style={{ background: i === beat ? '#f8f4f4' : 'rgba(255,255,255,.14)' }}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="relative order-1 lg:order-2">
            <canvas
              ref={canvasRef}
              role="img"
              aria-label={alt}
              className="h-[46vh] w-full lg:h-[74vh]"
            />
            {!ready && (
              <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center">
                <span className="text-[10px] uppercase tracking-[0.18em] text-neutral-700">
                  Loading render {Math.round((loaded / Math.max(1, reduced ? 1 : frameCount)) * 100)}%
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
