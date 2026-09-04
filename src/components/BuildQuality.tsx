/**
 * The materials section — an exploded view of the board with its parts named.
 *
 * The diagram is generated from the Rev A9 geometry by tools/render/exploded.py
 * (board 64 x 91 mm, 19.05 mm key pitch, encoders at x ±9.525 / y +28), so the
 * layout is real even though the drawing is stylised. It is deliberately a
 * diagram rather than a photoreal render: the shell has not been printed yet,
 * and a photograph-looking picture of an unbuilt case would be a claim we
 * cannot back.
 *
 * Every line below is a confirmed spec. Nothing goes in this list on a
 * "probably" — it is the part of the page a buyer is most likely to hold us to.
 */

const LAYERS = [
  {
    n: '01',
    title: 'XDA keycaps',
    body: 'Uniform height, spherical dished tops. Comfortable to hit without looking, and the flat profile suits a nine-key grid.',
  },
  {
    n: '02',
    title: 'Aluminium dials',
    body: 'Two rotary encoders with machined aluminium caps. Detented, and they click in.',
  },
  {
    n: '03',
    title: '3D-printed cover',
    body: 'The shell the whole thing lives in, printed rather than moulded so the design can keep moving between runs.',
  },
  {
    n: '04',
    title: 'Custom PCB',
    body: 'Our own board, not a kit. RP2040, nine keys on direct GPIO with no matrix, and ten LEDs facing down through the base.',
  },
  {
    n: '05',
    title: 'Laser-cut acrylic base',
    body: 'The bottom plate is the diffuser. The underglow fires down into it, so the light reads as a glow under the board rather than ten dots.',
  },
];

export default function BuildQuality() {
  return (
    <section
      id="build"
      className="relative overflow-hidden border-t border-hairline"
      aria-labelledby="build-heading"
    >
      <div className="aurora-soft pointer-events-none absolute inset-0" aria-hidden="true" />

      <div className="relative z-[2] mx-auto grid max-w-shell items-center gap-14 px-5 py-[88px] lg:grid-cols-[1fr_1fr]">
        <div className="order-2 lg:order-1">
          <p className="kicker">
            <span className="dot-grad" />
            Built properly
          </p>

          <h2
            id="build-heading"
            className="mt-3.5 text-[clamp(26px,3.2vw,40px)] font-heading leading-[1.1] tracking-heading text-neutral-100"
          >
            Five parts,
            <br />
            <span className="serif text-[clamp(30px,3.9vw,50px)]">none of them filler.</span>
          </h2>

          <ol className="mt-8 space-y-6">
            {LAYERS.map((layer) => (
              <li key={layer.n} className="flex gap-4">
                <span className="text-grad mt-0.5 shrink-0 font-heading text-[13px] tabular-nums">
                  {layer.n}
                </span>
                <div className="min-w-0">
                  <h3 className="font-heading text-[15px] text-neutral-100">{layer.title}</h3>
                  <p className="mt-1 max-w-sm text-sm leading-relaxed text-neutral-500">
                    {layer.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="order-1 flex justify-center lg:order-2">
          <img
            src="/dialect-exploded.svg"
            alt="Exploded view of the Taptile Dialect: XDA keycaps and two aluminium dials on top, then the 3D-printed cover, the custom PCB with its ten underglow LEDs, and the laser-cut acrylic base underneath."
            width={525}
            height={597}
            className="w-full max-w-[380px] select-none lg:max-w-[460px]"
            draggable={false}
            loading="lazy"
          />
        </div>
      </div>
    </section>
  );
}
