import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import Reveal from './Reveal';

/**
 * The dialect orb.
 *
 * Every shipped dialect as a lit keycap, placed on a sphere by Fibonacci
 * spiral. The spiral matters: a lat/long grid at this count bunches caps at the
 * poles and leaves a visible seam down one side, and twenty-one is too few to
 * hide either. The offset sampling (the `2i + 1`) keeps caps off the poles.
 *
 * Depth is faked with scale, opacity, saturation and a blur that grows with the
 * square of distance. None of those is convincing alone; moving together they
 * read as depth for a fraction of the cost of a real 3D transform.
 *
 * The sphere turns on its own until you point at a cap, which stops it and
 * pulls that dialect into the readout. The dial beside it sets the speed and
 * behaves like the encoders on the board — drag it round, or use the arrows.
 */

/** [name, icon file, category, cap face, wash tint, logo scale] */
type Dialect = readonly [string, string, string, string, string, string];

const WALL: readonly Dialect[] = [
  ['Premiere Pro', 'premiere.png', 'Editing', '#2d0f4d', 'radial-gradient(closest-side, rgba(153,102,255,.42), rgba(0,0,0,0))', '100%'],
  ['After Effects', 'aftereffects.png', 'Motion', '#00005b', 'radial-gradient(closest-side, rgba(153,102,255,.4), rgba(0,0,0,0))', '100%'],
  ['Photoshop', 'photoshop.png', 'Retouching', '#001e36', 'radial-gradient(closest-side, rgba(49,168,255,.4), rgba(0,0,0,0))', '100%'],
  ['Lightroom', 'lightroom.png', 'Photography', '#011b34', 'radial-gradient(closest-side, rgba(49,168,255,.4), rgba(0,0,0,0))', '100%'],
  ['Illustrator', 'illustrator.png', 'Vector', '#330000', 'radial-gradient(closest-side, rgba(255,154,0,.38), rgba(0,0,0,0))', '100%'],
  ['DaVinci Resolve', 'resolve.png', 'Grading', '#16212c', 'radial-gradient(closest-side, rgba(255,255,255,.1), rgba(0,0,0,0))', '116%'],
  ['Figma', 'figma.png', 'Interface', '#1e1e1e', 'radial-gradient(closest-side, rgba(162,89,255,.3), rgba(0,0,0,0))', '108%'],
  ['Blender', 'blender.png', '3D', '#f3f2f2', 'radial-gradient(closest-side, rgba(232,150,26,.16), rgba(0,0,0,0))', '100%'],
  ['Unity', 'unity.png', 'Game engine', '#f3f2f2', 'radial-gradient(closest-side, rgba(0,0,0,.06), rgba(0,0,0,0))', '100%'],
  ['AutoCAD', 'autocad.png', 'CAD', '#f3f2f2', 'radial-gradient(closest-side, rgba(200,16,63,.12), rgba(0,0,0,0))', '82%'],
  ['Fusion 360', 'fusion360.png', 'CAD', '#f3f2f2', 'radial-gradient(closest-side, rgba(255,102,0,.14), rgba(0,0,0,0))', '100%'],
  ['SketchUp', 'sketchup.png', 'CAD', '#f3f2f2', 'radial-gradient(closest-side, rgba(0,90,150,.12), rgba(0,0,0,0))', '100%'],
  ['VS Code', 'vscode.png', 'Code', '#f3f2f2', 'radial-gradient(closest-side, rgba(0,122,204,.14), rgba(0,0,0,0))', '100%'],
  ['Notion', 'notion.png', 'Notes', '#f3f2f2', 'radial-gradient(closest-side, rgba(0,0,0,.06), rgba(0,0,0,0))', '100%'],
  ['Slack', 'slack.png', 'Chat', '#f3f2f2', 'radial-gradient(closest-side, rgba(74,21,75,.1), rgba(0,0,0,0))', '100%'],
  ['Discord', 'discord.png', 'Chat', '#5865f2', 'radial-gradient(closest-side, rgba(255,255,255,.14), rgba(0,0,0,0))', '80%'],
  ['Zoom', 'zoom.png', 'Calls', '#0a51e1', 'radial-gradient(closest-side, rgba(255,255,255,.14), rgba(0,0,0,0))', '114%'],
  ['Teams', 'teams.png', 'Calls', '#f3f2f2', 'radial-gradient(closest-side, rgba(98,100,167,.14), rgba(0,0,0,0))', '100%'],
  ['Excel', 'excel-logo.png', 'Sheets', '#f3f2f2', 'radial-gradient(closest-side, rgba(16,124,65,.12), rgba(0,0,0,0))', '100%'],
  ['OBS', 'obs.png', 'Streaming', '#1c2b71', 'radial-gradient(closest-side, rgba(255,255,255,.12), rgba(0,0,0,0))', '104%'],
  ['Spotify', 'spotify.png', 'Music', '#0e0e0e', 'radial-gradient(closest-side, rgba(30,215,96,.26), rgba(0,0,0,0))', '88%'],
];

const ICONS = '/app-icons/';

const GOLDEN = Math.PI * (3 - Math.sqrt(5));
const POSITIONS = WALL.map((_, i) => {
  const y = 1 - (2 * i + 1) / WALL.length;
  return {
    yaw: (i * GOLDEN) % (Math.PI * 2),
    pitch: Math.asin(Math.max(-1, Math.min(1, y))),
  };
});

/** Radians per second at 1x. */
const RATE = 0.055;
/** A fixed lean, so the poles are not dead centre. */
const TILT = 0.2;
const SPEED_MIN = 0.25;
const SPEED_MAX = 4;

const clampSpeed = (value: number) => Math.min(SPEED_MAX, Math.max(SPEED_MIN, value));

/** The dial's travel, -135 to 135 degrees, mapped logarithmically onto the range. */
const speedToTurn = (speed: number) => -135 + 270 * (Math.log2(speed / SPEED_MIN) / 4);

export default function Dialects() {
  const stage = useRef<HTMLDivElement>(null);

  const [angle, setAngle] = useState(0.6);
  const [radius, setRadius] = useState(200);
  const [speed, setSpeed] = useState(1);
  const [picked, setPicked] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);

  // The spin loop runs once for the life of the component, so it reads these
  // through refs rather than closing over a render that has already gone.
  const pickedRef = useRef(picked);
  const speedRef = useRef(speed);
  useEffect(() => {
    pickedRef.current = picked;
  }, [picked]);
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  // The sphere has to fit its band at any width, caps included.
  const measure = useCallback(() => {
    const el = stage.current;
    if (!el) return;
    const box = el.getBoundingClientRect();
    const next = Math.max(120, Math.min(box.width, box.height) / 2 - 34);
    setRadius((current) => (Math.abs(next - current) > 1 ? next : current));
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [measure]);

  useEffect(() => {
    // A sphere that never stops turning is the thing "reduce motion" is about.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let last = 0;
    let frame = 0;

    const step = (now: number) => {
      frame = requestAnimationFrame(step);
      if (now - last < 24) return;
      const elapsed = last ? (now - last) / 1000 : 0;
      last = now;
      // Pointing at a cap holds the sphere still so the label can be read.
      if (pickedRef.current !== null) return;
      setAngle((current) => current + elapsed * RATE * Math.PI * speedRef.current);
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, []);

  /* -------------------------------- the dial ------------------------------- */

  const drag = useRef({ x: 0, y: 0, from: 0, speed: 1 });

  function onDialDown(event: PointerEvent<HTMLSpanElement>) {
    const knob = event.currentTarget;
    knob.setPointerCapture?.(event.pointerId);
    const box = knob.getBoundingClientRect();
    const x = box.left + box.width / 2;
    const y = box.top + box.height / 2;
    drag.current = { x, y, from: Math.atan2(event.clientY - y, event.clientX - x), speed };
    setDragging(true);
  }

  function onDialMove(event: PointerEvent<HTMLSpanElement>) {
    if (!dragging) return;
    const { x, y, from, speed: started } = drag.current;
    let turned = Math.atan2(event.clientY - y, event.clientX - x) - from;
    while (turned > Math.PI) turned -= Math.PI * 2;
    while (turned < -Math.PI) turned += Math.PI * 2;
    // Logarithmic, so a given turn feels the same at both ends of the range.
    const t = Math.log2(started / SPEED_MIN) / 4 + turned / (Math.PI * 1.5);
    setSpeed(clampSpeed(SPEED_MIN * Math.pow(2, 4 * Math.min(1, Math.max(0, t)))));
  }

  function onDialKey(event: KeyboardEvent<HTMLSpanElement>) {
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
      event.preventDefault();
      setSpeed((current) => clampSpeed(current * 1.25));
    }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
      event.preventDefault();
      setSpeed((current) => clampSpeed(current / 1.25));
    }
  }

  /* ------------------------------- projection ------------------------------ */

  const points = POSITIONS.map((position, i) => {
    const yaw = position.yaw + angle;
    const cos = Math.cos(position.pitch);
    const flat = radius * Math.sin(position.pitch);
    const deep = radius * cos * Math.cos(yaw);
    return {
      i,
      x: radius * cos * Math.sin(yaw),
      y: flat * Math.cos(TILT) - deep * Math.sin(TILT),
      z: flat * Math.sin(TILT) + deep * Math.cos(TILT),
    };
  });

  let front = 0;
  for (const point of points) if (point.z > points[front]!.z) front = point.i;
  const active = picked ?? front;

  const current = WALL[active]!;
  const speedLabel = `${speed.toFixed(speed < 1 ? 2 : 1).replace(/0$/, '')}x`;

  return (
    <section
      id="dialects"
      className="relative scroll-mt-[70px] overflow-hidden py-28"
      style={{
        // Long ramps at both ends. The panel tone is only a few points off the
        // ground colour, so a short ramp reads as a band rather than a blend.
        background: 'linear-gradient(180deg, #0b0a0a 0%, #131111 24%, #131111 76%, #0b0a0a 100%)',
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px]"
        style={{
          background:
            'linear-gradient(180deg, rgba(139,107,255,0), rgba(139,107,255,.11) 46%, rgba(19,17,17,0))',
        }}
      />

      <Reveal className="relative mx-auto grid max-w-shell items-center gap-8 px-5 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:gap-14">
        <div>
          <h2 className="text-[clamp(30px,3.2vw,42px)] leading-[1.08] text-neutral-100">
            Nine keys, two dials,
            <br />
            <span className="serif text-[clamp(36px,4vw,54px)]">relabelled per app.</span>
          </h2>
          <p className="mt-5 max-w-[400px] text-[15.5px] leading-[1.62] text-neutral-400">
            Twenty-one dialects ship on the board, each one remapping the keys and dials to the app
            you are already in. Point at a cap to stop the orb and read it.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3.5 border-t border-white/10 pt-5">
            <span className="dot-grad" style={{ boxShadow: '0 0 14px rgba(139,107,255,.85)' }} />
            <span
              aria-live="polite"
              className="serif whitespace-nowrap text-[30px] leading-[1.05] text-neutral-100"
            >
              {current[0]}
            </span>
            <span className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
              {current[2]}
            </span>
          </div>

          <div className="mt-5 flex items-center gap-[18px]">
            <span
              tabIndex={0}
              role="slider"
              aria-label="Orb speed"
              aria-valuemin={SPEED_MIN}
              aria-valuemax={SPEED_MAX}
              aria-valuenow={Number(speed.toFixed(2))}
              aria-valuetext={speedLabel}
              onPointerDown={onDialDown}
              onPointerMove={onDialMove}
              onPointerUp={() => setDragging(false)}
              onPointerCancel={() => setDragging(false)}
              onKeyDown={onDialKey}
              className="relative h-12 w-12 shrink-0 rounded-full"
              style={{
                touchAction: 'none',
                cursor: dragging ? 'grabbing' : 'grab',
                background:
                  'conic-gradient(from 200deg, #3fa0ff, #8b6bff 45%, #e96bd8 72%, rgba(255,255,255,.08) 73%)',
                boxShadow: '0 6px 18px rgba(0,0,0,.55)',
              }}
            >
              <span
                className="absolute inset-[5px] rounded-full"
                style={{
                  background: 'linear-gradient(180deg,#2b2827,#1b1918)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,.09)',
                }}
              />
              <span
                aria-hidden="true"
                className="absolute inset-[5px] rounded-full"
                style={{ transform: `rotate(${speedToTurn(speed).toFixed(1)}deg)` }}
              >
                <span className="absolute left-1/2 top-1.5 -ml-px h-[11px] w-0.5 rounded-[2px] bg-neutral-100" />
              </span>
            </span>

            <span className="flex flex-col gap-[3px]">
              <span className="text-[9.5px] uppercase tracking-[0.16em] text-neutral-700">
                Spin — drag the dial
              </span>
              <span className="font-mono text-[13px] text-neutral-200">{speedLabel}</span>
            </span>

            <span className="ml-auto font-mono text-[10.5px] uppercase tracking-[0.14em] text-neutral-700">
              {WALL.length} included
            </span>
          </div>
        </div>

        <div className="relative h-[min(560px,70vw)] lg:h-[min(560px,54vw)]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-[12%] inset-y-[16%] rounded-full blur-[76px]"
            style={{
              background:
                'radial-gradient(closest-side at 34% 32%, rgba(63,160,255,.46), rgba(63,160,255,0) 72%), radial-gradient(closest-side at 68% 70%, rgba(233,107,216,.4), rgba(233,107,216,0) 72%)',
            }}
          />

          <div ref={stage} className="absolute inset-0">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                width: `${Math.round(radius * 2.3)}px`,
                height: `${Math.round(radius * 2.3)}px`,
                background:
                  'radial-gradient(closest-side, rgba(139,107,255,.13), rgba(139,107,255,.03) 58%, rgba(0,0,0,0) 76%)',
              }}
            />

            {points.map((point) => {
              const [name, file, , face, wash, size] = WALL[point.i]!;
              const depth = (point.z + radius) / (2 * radius); // 0 far ... 1 near
              const far = 1 - depth;
              const on = point.i === active;
              const scale = (0.62 + 0.44 * depth) * (on ? 1.14 : 1);
              const lean = ((point.x / radius) * (point.z < 0 ? -26 : 26)).toFixed(1);

              return (
                <button
                  key={name}
                  type="button"
                  aria-label={name}
                  onMouseEnter={() => setPicked(point.i)}
                  onMouseLeave={() => setPicked(null)}
                  onFocus={() => setPicked(point.i)}
                  onBlur={() => setPicked(null)}
                  className="absolute left-1/2 top-1/2 -ml-[31px] -mt-[31px] h-[62px] w-[62px]
                             overflow-hidden rounded-[15px] border-0 p-0 transition-shadow duration-300"
                  style={{
                    backgroundColor: face,
                    willChange: 'transform',
                    transform: `translate3d(${point.x.toFixed(1)}px,${point.y.toFixed(1)}px,0) scale(${scale.toFixed(3)}) rotateY(${lean}deg)`,
                    zIndex: 100 + Math.round(point.z),
                    opacity: Number((0.62 + 0.38 * depth).toFixed(3)),
                    filter: on
                      ? 'saturate(1.05) brightness(1.06)'
                      : `saturate(${(0.62 + 0.3 * depth).toFixed(2)}) brightness(${(0.82 + 0.18 * depth).toFixed(2)}) blur(${(far * far * 0.9).toFixed(2)}px)`,
                    boxShadow: on
                      ? '0 0 0 1px rgba(198,150,255,.75), 0 20px 42px rgba(0,0,0,.6), 0 0 36px rgba(139,107,255,.5)'
                      : '0 10px 24px rgba(0,0,0,.5)',
                  }}
                >
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 transition-opacity duration-300"
                    style={{ background: wash, opacity: on ? 0.58 : 0.26 }}
                  />
                  <span
                    className="absolute inset-0 bg-center bg-no-repeat"
                    style={{ backgroundImage: `url("${ICONS}${file}")`, backgroundSize: size }}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
