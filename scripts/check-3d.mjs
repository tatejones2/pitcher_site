import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto("http://localhost:5173/tunneling");
await page
  .getByRole("img", { name: "Interactive 3D pitcher and ball flight" })
  .waitFor();
await page.screenshot({ path: "docs/tunneling-3d.png", fullPage: true });
for (const camera of [
  "Behind pitcher",
  "Behind catcher",
  "Side angle",
  "Overview",
]) {
  await page.getByRole("button", { name: camera, exact: true }).click();
  assert.equal(
    await page
      .getByRole("button", { name: camera, exact: true })
      .getAttribute("aria-pressed"),
    "true",
  );
}
await page.getByRole("button", { name: "Reset flight", exact: true }).click();
assert.equal(
  await page.getByRole("slider", { name: "Flight position" }).inputValue(),
  "0",
);
await page.getByRole("button", { name: "Play flight", exact: true }).click();
await page.waitForFunction(
  () =>
    Number(
      document.querySelector('input[aria-label="Flight position"]').value,
    ) > 10,
);
await page.getByRole("button", { name: "Pause flight", exact: true }).click();
await page.getByRole("slider", { name: "Flight position" }).fill("100");
await page.getByRole("button", { name: "Side", exact: true }).click();
await page
  .getByRole("img", { name: "Reconstructed pitch flight paths" })
  .waitFor();
await page.getByRole("button", { name: "3D", exact: true }).click();
await page
  .getByRole("img", { name: "Interactive 3D pitcher and ball flight" })
  .waitFor();
await page.getByRole("checkbox", { name: "Individual pitches" }).check();
await page
  .getByRole("img", { name: "Interactive 3D pitcher and ball flight" })
  .waitFor();
await page.setViewportSize({ width: 390, height: 844 });
assert.equal(
  await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  true,
);
await page.waitForFunction(() => document.querySelector(".sidebar").getBoundingClientRect().right <= 0);
await page.screenshot({ path: "docs/tunneling-3d-mobile.png", fullPage: true, animations: "disabled" });
assert.equal(errors.length, 0, errors.join("\n"));
console.log(
  "PASS: WebGL scene, 4 camera presets, playback/pause/reset/scrub, 2D fallback switch, individual mode, mobile fit; no runtime errors.",
);
await browser.close();
