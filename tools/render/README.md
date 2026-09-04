# Turntable render rig

Generates the frame sequence the landing page scrubs through. See
`../../docs/RENDER.md` for how the frames are consumed.

## Run it

```bash
cd tools/render
npm run setup      # deps + a local copy of three.min.js + chromium
npm run preview    # 4 frames, to check lighting and framing
npm run render     # all 72 frames into ./frames
```

Then convert to WebP and drop them in `public/render/dialect/`:

```bash
for f in frames/f*.png; do
  cwebp -q 78 -m 6 "$f" -o "../../public/render/dialect/$(basename "${f%.png}" | sed 's/^f//').webp"
done
```

## What is real and what is not

`scene.html` builds the board from the **Rev A9** brief — board 64 × 91 mm,
key grid at 19.05 mm pitch (cols −19.05 / 0 / 19.05, rows 9.05 / −10 / −29.05),
encoders at x ±9.525, y +28, USB-C on the rear edge. Those are measured.

The `CASE` block at the top — wall thickness, body height, corner radius — and
the keycap and knob dimensions are **assumptions**, because the Taptile Shell
is not modelled yet. They are single constants on purpose: change them, re-run,
and the render follows.

The moment there is a real `.blend` / `.step` / `.glb` of the shell, throw this
geometry away and render from that instead. The camera, lighting, underglow and
capture loop are all worth keeping.
