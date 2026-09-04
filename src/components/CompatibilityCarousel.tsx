/**
 * The compatibility carousel — the apps a Dialect ships a profile for.
 *
 * WORDMARKS ONLY, DELIBERATELY.
 *
 * Nominative fair use lets you name another company's product to say yours
 * works with it, but the test is narrow: use "the words but not the font or
 * symbol", and never imply sponsorship. A stylised logo fails that second
 * prong in a way a plain name does not.
 *
 * Several of these vendors also say so outright. Adobe: "Adobe does not allow
 * the use of its product icons by third parties in their products or related
 * materials of any kind, except through an Adobe partnership agreement" — that
 * is Premiere Pro, Photoshop, After Effects, Illustrator and Lightroom, five of
 * the nine names below. Even Blender, which is open source, keeps its logo out
 * of the GPL and asks for written permission before commercial use.
 *
 * So: `logo` stays optional and empty. If Taptile ever gets written permission
 * for a specific mark, drop the file in public/app-logos/ and set `logo` on
 * that entry — the layout already has the slot and the space for it. Do not
 * fill it in speculatively; an unlicensed logo on a storefront reads as a
 * partnership that does not exist.
 */

export interface CompatApp {
  name: string;
  /** Only set once written permission exists for that specific mark. */
  logo?: string;
}

export default function CompatibilityCarousel({
  apps,
  label = 'Profiles for',
}: {
  apps: CompatApp[];
  label?: string;
}) {
  // Duplicated once so the marquee can loop without a visible seam.
  const loop = [...apps, ...apps];

  return (
    <section className="overflow-hidden border-b border-hairline py-7" aria-label={`${label}: ${apps.map((a) => a.name).join(', ')}`}>
      <div className="mx-auto flex max-w-shell items-center gap-8 px-5">
        <p className="kicker shrink-0">
          <span className="dot-grad" />
          {label}
        </p>

        <div
          className="relative flex-1 overflow-hidden"
          style={{ maskImage: 'linear-gradient(90deg, transparent, #000 7%, #000 93%, transparent)' }}
        >
          <ul className="flex w-max animate-marquee items-center gap-14 hover:[animation-play-state:paused]">
            {loop.map((app, i) => (
              <li
                key={`${app.name}-${i}`}
                className="flex shrink-0 flex-col items-center gap-2.5 px-2"
                aria-hidden={i >= apps.length}
              >
                <span className="whitespace-nowrap text-sm text-neutral-400">{app.name}</span>
                {app.logo && (
                  <img
                    src={app.logo}
                    alt=""
                    aria-hidden="true"
                    className="h-6 w-auto select-none opacity-70"
                    draggable={false}
                  />
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Says what the names are without claiming a relationship that isn't there. */}
      <p className="mx-auto mt-5 max-w-shell px-5 text-[11px] leading-relaxed text-neutral-700">
        App names are the trademarks of their respective owners. Taptile is not affiliated with,
        endorsed by, or sponsored by any of them — the board simply ships a key layout for each.
      </p>
    </section>
  );
}
