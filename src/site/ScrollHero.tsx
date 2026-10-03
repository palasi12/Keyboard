import { useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * The opening shot, scrubbed by scroll.
 *
 * 105 frames rendered in Blender (Cycles): the pad sits in the dark, two light
 * strips sweep the keycaps, the white underglow switches on, and the camera
 * orbits up to the hero angle. The sweep (frames 1–25) plays on its own when
 * the page opens; the rest is scrubbed by scroll, forwards and backwards.
 *
 * Frames are drawn onto a canvas "cover"-fitted to the right-hand side of the
 * viewport (the left belongs to the headline). The first frame loads first so
 * there is never a blank hero, then the rest stream in; until a frame has
 * arrived, the nearest loaded one stands in. With reduced motion the final
 * hero frame is shown and nothing scrubs.
 */

const COUNT = 105;
/** Frame 1 is pure black. On load the light sweep plays by itself up to here,
 *  so the first screen is never empty; scrolling takes it the rest of the way. */
const START = 24;
const INTRO_MS = 1700;
const src = (i: number) => `/media/intro/${String(i).padStart(3, '0')}.webp`;

export default function ScrollHero({ children }: { children: ReactNode }) {
  const wrap = useRef<HTMLDivElement | null>(null);
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const frames = useRef<(HTMLImageElement | null)[]>(Array(COUNT).fill(null));
  const current = useRef(START);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let cancelled = false;

    const load = (i: number) =>
      new Promise<void>((resolve) => {
        const img = new Image();
        img.decoding = 'async';
        img.onload = () => {
          if (!cancelled) frames.current[i] = img;
          resolve();
        };
        img.onerror = () => resolve();
        img.src = src(i + 1);
      });

    let introDone = reduce;
    const order = reduce
      ? [COUNT - 1]
      : [START, ...Array.from({ length: START }, (_, k) => k), COUNT - 1, ...Array.from({ length: COUNT - START - 2 }, (_, k) => START + 1 + k)];
    void (async () => {
      await load(order[0] ?? 0);
      if (cancelled) return;
      if (reduce) {
        setReady(true);
        draw(COUNT - 1);
        return;
      }
      // Pull in the sweep frames, then play them once.
      await Promise.all(order.slice(1, START + 1).map(load));
      if (cancelled) return;
      setReady(true);
      const t0 = performance.now();
      const tick = (now: number) => {
        if (cancelled || introDone) return;
        const t = Math.min(1, (now - t0) / INTRO_MS);
        const eased = 1 - Math.pow(1 - t, 3);
        draw(Math.round(eased * START));
        if (t < 1) requestAnimationFrame(tick);
        else {
          introDone = true;
          onScroll();
          draw(current.current);
        }
      };
      requestAnimationFrame(tick);
      // Stream the rest a few at a time so the network is never flooded.
      const rest = order.slice(START + 1);
      for (let k = 0; k < rest.length; k += 6) {
        await Promise.all(rest.slice(k, k + 6).map(load));
        if (cancelled) return;
        if (introDone) draw(current.current);
      }
    })();

    function nearest(i: number): HTMLImageElement | null {
      for (let d = 0; d < COUNT; d++) {
        const a = frames.current[i - d];
        if (a) return a;
        const b = frames.current[i + d];
        if (b) return b;
      }
      return null;
    }

    function draw(i: number) {
      const c = canvas.current;
      if (!c) return;
      const img = nearest(i);
      if (!img) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = c.clientWidth;
      const h = c.clientHeight;
      if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) {
        c.width = Math.round(w * dpr);
        c.height = Math.round(h * dpr);
      }
      const ctx = c.getContext('2d');
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, w, h);

      // Desktop: the shot lives in the right ~64% of the screen. Mobile: the top.
      const wide = w > 860;
      const boxX = wide ? w * 0.3 : 0;
      const boxW = wide ? w * 0.72 : w;
      const boxH = wide ? h : h * 0.68;
      const scale = Math.max(boxW / img.width, boxH / img.height);
      const dw = img.width * scale;
      const dh = img.height * scale;
      ctx.drawImage(img, boxX + (boxW - dw) / 2, (boxH - dh) / 2, dw, dh);
    }

    function onScroll() {
      const el = wrap.current;
      if (!el || reduce) return;
      const rect = el.getBoundingClientRect();
      const travel = el.offsetHeight - window.innerHeight;
      const p = Math.min(1, Math.max(0, -rect.top / (travel * 0.85)));
      const i = START + Math.round(p * (COUNT - 1 - START));
      if (p > 0.02) introDone = true; // the visitor scrolled: hand over to them
      if (!introDone) {
        current.current = i;
        return;
      }
      if (i !== current.current) {
        current.current = i;
        requestAnimationFrame(() => draw(i));
      }
    }

    const onResize = () => draw(current.current);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    onScroll();
    return () => {
      cancelled = true;
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <section className="hero" ref={wrap} aria-label="Taptile Dialect">
      <div className="hero-stick">
        <canvas ref={canvas} aria-hidden="true" style={{ opacity: ready ? 1 : 0, transition: 'opacity .8s' }} />
        <div className="hero-shade" />
        {children}
        <div className="hero-scroll" aria-hidden="true">SCROLL</div>
      </div>
    </section>
  );
}
