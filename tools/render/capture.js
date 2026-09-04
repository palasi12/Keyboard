const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const only = process.argv[2] === '--preview';
  const outDir = path.join(__dirname, 'frames');
  fs.mkdirSync(outDir, { recursive: true });

  const b = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium',
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
  });
  const p = await b.newPage({ viewport: { width: 900, height: 675 } });
  const errs = [];
  p.on('pageerror', (e) => errs.push(String(e).slice(0, 300)));
  p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 300)); });

  await p.goto('file://' + path.join(__dirname, 'scene.html'));
  await p.waitForFunction(() => window.__ready === true, { timeout: 60000 }).catch(() => {});
  if (errs.length) console.log('ERRORS:\n' + errs.join('\n'));

  const total = await p.evaluate(() => window.__frames);
  const canvas = await p.$('canvas');

  const list = only ? [0, 9, 18, 27] : Array.from({ length: total }, (_, i) => i);
  const t0 = Date.now();
  for (const i of list) {
    await p.evaluate((n) => window.__setFrame(n), i);
    const name = only
      ? `preview-${String(i).padStart(3, '0')}.png`
      : `f${String(i).padStart(3, '0')}.png`;
    await canvas.screenshot({ path: path.join(outDir, name) });
  }
  console.log(`rendered ${list.length} frames in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  await b.close();
})();
