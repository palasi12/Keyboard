# The scroll turntable

The landing page carries a scroll-driven image sequence — the effect Apple uses
on product pages. It is **not** 3D in the browser. Every frame is pre-rendered;
scrolling picks which one to draw. That keeps a WebGL context off people's
phones and makes the whole thing a canvas `drawImage` per scroll tick.

The component is `src/components/ScrollTurntable.tsx`. It is wired up in
`src/pages/Landing.tsx` between the hero and the marquee.

## Where the frames go

```
public/render/dialect/000.webp
public/render/dialect/001.webp
...
public/render/dialect/071.webp
```

Zero-indexed, three digits, `.webp`. 72 frames is one full rotation.

**If frame `000.webp` is missing the whole section unmounts and the page reads
as though it were never there.** That is deliberate — the site stays clean until
there are real frames, and nobody ships a half-built hero.

`vercel.json` excludes `render/` from the SPA rewrite. Without that every frame
request would come back as `index.html`.

## Exporting from Blender

1. Model the Taptile Shell to the real Rev A9 geometry:
   - board **64 × 91 mm**, centre origin, **+y = rear**
   - keys: cols x = −19.05 / 0 / 19.05, rows y = 9.05 / −10 / −29.05
   - encoders: x = ±9.525, y = +28
   - USB-C on the rear edge
2. Parent everything to an empty at the origin. Keyframe that empty 0° → 360°
   over 72 frames, linear interpolation, so frame 72 lands exactly on frame 0
   and the loop is seamless.
3. Camera fixed, lights fixed. The object turns, not the camera — that is what
   makes it read as a turntable rather than a fly-around.
4. Render 900 × 675, transparent or on `#0b0a0a`, then convert:

```bash
for f in frames/*.png; do
  cwebp -q 78 -m 6 "$f" -o "public/render/dialect/$(basename "${f%.png}").webp"
done
```

Aim for roughly 25 KB a frame. Much past that and the preload is the slowest
thing on the page.

## Keeping it honest

Until the shell is modelled and measured, any case dimension in a render is a
guess. Nothing on the site quotes an enclosure size for exactly that reason —
`src/lib/catalog.ts` lists the board at 64 × 91 mm and stops there. When the
first shell comes off the printer, measure it, put the real numbers in the
catalogue, and re-render.
