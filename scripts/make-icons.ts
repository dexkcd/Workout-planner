/**
 * Renders the app icon to PNG with the pre-installed Chromium.
 * Run once: npm run icons
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const OUT = path.join(process.cwd(), "public/icons");

function svg(size: number, pad: number, bg: string): string {
  const r = Math.round(size * 0.22);
  const inner = size - pad * 2;
  const fontSize = Math.round(inner * 0.62);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${bg}"/>
  <rect x="${pad}" y="${pad}" width="${inner}" height="${inner}" rx="${r}" fill="#0E1218"/>
  <text x="50%" y="52%" dominant-baseline="central" text-anchor="middle" font-family="Space Grotesk Variable, Space Grotesk, system-ui, sans-serif" font-weight="700" font-size="${fontSize}" fill="#7CC4FF">F</text>
</svg>`;
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const fontCss = path.join(process.cwd(), "node_modules/@fontsource-variable/space-grotesk/index.css");
  const browser = await chromium.launch();
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  const jobs: Array<{ file: string; size: number; pad: number; bg: string }> = [
    { file: "icon-192.png", size: 192, pad: 0, bg: "#0E1218" },
    { file: "icon-512.png", size: 512, pad: 0, bg: "#0E1218" },
    { file: "apple-touch-icon.png", size: 180, pad: 0, bg: "#0E1218" },
    // Maskable: keep the mark inside the 80% safe zone on a solid background.
    { file: "maskable-512.png", size: 512, pad: 64, bg: "#0E1218" },
  ];
  for (const job of jobs) {
    await page.setViewportSize({ width: job.size, height: job.size });
    await page.setContent(
      `<!doctype html><html><head><link rel="stylesheet" href="file://${fontCss}"><style>html,body{margin:0;background:${job.bg}}svg{display:block}</style></head><body>${svg(job.size, job.pad, job.bg)}</body></html>`,
      { waitUntil: "load" },
    );
    await page.evaluate(() => document.fonts.ready);
    const png = await page.screenshot({ clip: { x: 0, y: 0, width: job.size, height: job.size }, omitBackground: false });
    writeFileSync(path.join(OUT, job.file), png);
    console.log("wrote", job.file);
  }
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
