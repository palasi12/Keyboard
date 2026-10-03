import { useEffect, useRef, useState } from 'react';
import Seo from '../components/Seo';
import ScrollHero from '../site/ScrollHero';
import { Reveal } from '../site/chrome';
import { WaitlistForm } from '../site/Waitlist';

/**
 * Landing page. It is a waitlist page, so it is three screens and nothing else:
 *
 *   1. the board, revealed by the Blender intro as you scroll
 *   2. the underglow, cycling through real colour renders
 *   3. the signup
 *
 * Copy rules (checked by scripts/check-copy.sh): the 13 LEDs are underglow
 * only and the keys stay dark; MX-compatible; designed and assembled in New
 * Zealand; no price or ship date.
 */

const COLOURS = [
  { id: 'white', name: 'White', hex: '#FFFFFF' },
  { id: 'red', name: 'Red', hex: '#FF2A2A' },
  { id: 'amber', name: 'Amber', hex: '#FF8A00' },
  { id: 'green', name: 'Green', hex: '#20E070' },
  { id: 'cyan', name: 'Cyan', hex: '#00D5FF' },
  { id: 'blue', name: 'Blue', hex: '#3B5BFF' },
] as const;

const SPECS: [string, string][] = [
  ['Keys', '9, hot-swap MX-compatible'],
  ['Knobs', '2'],
  ['Underglow', '13 RGB LEDs'],
  ['Connection', 'USB-C'],
];

function HeroCopy() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setOn(true), 120);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className={`hero-copy rv ${on ? 'in' : ''}`}>
      <h1>
        Taptile Dialect
        <span className="sub">Nine keys.</span>
        <span className="sub">Two knobs.</span>
      </h1>
      <p className="lede">A macro pad for the shortcuts you use all day.</p>
    </div>
  );
}

function Underglow() {
  const [idx, setIdx] = useState(0);
  const [auto, setAuto] = useState(true);
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(([entry]) => setVisible(Boolean(entry?.isIntersecting)), { threshold: 0.35 });
    io.observe(node);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!auto || !visible) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % COLOURS.length), 2400);
    return () => clearInterval(t);
  }, [auto, visible]);

  const colour = COLOURS[idx] ?? COLOURS[0];
  return (
    <section className="sec" id="underglow" ref={ref}>
      <div className="shell glow-wrap">
        <Reveal>
          <h2>
            The keys stay dark.
            <span className="sub">The desk lights up.</span>
          </h2>
          <p className="lede">13 LEDs on the underside. White out of the box, any colour after that.</p>
          <div className="swatches" role="radiogroup" aria-label="Underglow colour">
            {COLOURS.map((c, i) => (
              <button
                key={c.id}
                type="button"
                role="radio"
                aria-checked={i === idx}
                aria-label={c.name}
                className={`swatch ${i === idx ? 'on' : ''}`}
                style={{ background: c.hex }}
                onClick={() => {
                  setAuto(false);
                  setIdx(i);
                }}
              />
            ))}
          </div>
          <dl className="specs">
            {SPECS.map(([k, v]) => (
              <div className="spec" key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </Reveal>

        <Reveal className="glow-stage" delay={1}>
          <div className="glow-floor" style={{ background: colour.hex }} aria-hidden="true" />
          {COLOURS.map((c, i) => (
            <img
              key={c.id}
              src={`/media/glow/${c.id}.webp`}
              alt={i === idx ? `The Dialect with ${c.name.toLowerCase()} underglow` : ''}
              className={i === idx ? 'on' : ''}
              loading="lazy"
            />
          ))}
        </Reveal>
      </div>
    </section>
  );
}

function Signup() {
  return (
    <section className="sec cta" id="waitlist">
      <div className="shell">
        <Reveal>
          <h2>
            Get one first.
          </h2>
          <p className="lede">One email when the first batch is ready to order. That is it.</p>
          <WaitlistForm place="waitlist" note={false} />
          <div className="promises">
            <span>No payment now</span>
            <span>Unsubscribe in one click</span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export default function Landing() {
  return (
    <>
      <Seo
        title="Taptile Dialect — join the waitlist"
        description="Taptile Dialect: nine keys, two knobs and underglow. Designed and assembled in New Zealand. Join the waitlist for the first batch."
        path="/"
        image="/og.jpg"
      />
      <ScrollHero>
        <HeroCopy />
      </ScrollHero>
      <Underglow />
      <Signup />
    </>
  );
}
