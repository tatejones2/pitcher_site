import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 1440, height: 1080 },
  deviceScaleFactor: 1,
});
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto("http://localhost:5173");
await page.getByRole("heading", { name: "Know your arsenal." }).waitFor();
await page.screenshot({ path: "docs/dashboard-desktop.png", fullPage: true });
await page.getByRole("button", { name: "Slider 12", exact: true }).click();
assert.match(
  await page.locator(".pitcher-profile p").innerText(),
  /12 pitches/,
);
await page.getByRole("button", { name: /AVG. FASTBALL VELOCITY/ }).click();
await page.getByRole("dialog", { name: "Velocity", exact: true }).waitFor();
await page.keyboard.press("Escape");
await page.getByRole("button", { name: "All pitches 48", exact: true }).click();
for (const name of [
  "Arsenal",
  "Movement",
  "Release",
  "Tunneling",
  "Location",
  "Spin",
  "Sessions",
  "Learn",
]) {
  await page
    .locator("nav")
    .getByRole("link", { name, exact: name !== "Tunneling" })
    .click();
  await page.waitForURL(`**/${name.toLowerCase()}`);
  assert.equal(await page.locator("h1").count(), 1);
  if (name === "Tunneling") {
    await page.getByRole("button", { name: "Top", exact: true }).click();
    await page.getByText("TOP VIEW", { exact: true }).waitFor();
    await page.getByRole("slider", { name: "Flight position" }).fill("90");
    await page.screenshot({
      path: "docs/tunneling-desktop.png",
      fullPage: true,
    });
  }
}
await page.getByRole("button", { name: "Import data", exact: true }).click();
await page
  .locator("input[type=file]")
  .setInputFiles({
    name: "sample.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(
      "Pitcher,TaggedPitchType,RelSpeed,Date,InducedVertBreak,HorzBreak\nJordan,Slider,85,2026-09-14,3,-9\nCasey,Fastball,92,2026-09-14,18,8",
    ),
  });
await page.getByRole("button", { name: "Import 2 pitches" }).waitFor();
await page.getByRole("checkbox").check();
await page.getByRole("button", { name: "Import 2 pitches" }).click();
assert.equal(
  await page
    .getByRole("combobox", { name: "Pitcher", exact: true })
    .inputValue(),
  "Jordan",
);
await page
  .getByRole("combobox", { name: "Pitcher", exact: true })
  .selectOption("Casey");
assert.match(await page.locator(".pitcher-profile p").innerText(), /1 pitches/);
await page.reload();
await page.setViewportSize({ width: 390, height: 844 });
await page.screenshot({ path: "docs/dashboard-mobile.png", fullPage: true });
assert.equal(
  await page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth,
  ),
  true,
  "No mobile overflow",
);
await page.getByRole("button", { name: "Open navigation" }).click();
await page
  .locator("nav")
  .getByRole("link", { name: "Movement", exact: true })
  .click();
await page.getByRole("heading", { name: "Movement.", exact: true }).waitFor();
assert.equal(errors.length, 0, errors.join("\n"));
console.log(
  "PASS: all nine pages, filters, education, flight controls, CSV import, pitcher selection, mobile layout/navigation; no browser errors.",
);
await browser.close();
