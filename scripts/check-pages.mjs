import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
const base = process.argv[2] ?? "http://127.0.0.1:4173/pitcher_site/";
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("response", (r) => {
    if (r.status() >= 400 && r.url().startsWith(base))
      errors.push(`${r.status()} ${r.url()}`);
  });
  await page.goto(base);
  await page.getByRole("heading", { name: "Know your arsenal." }).waitFor();
  await page
    .locator("nav")
    .getByRole("link", { name: "Tunneling LAB" })
    .click();
  await page.waitForURL("**/#/tunneling");
  await page
    .getByRole("img", { name: "Interactive 3D pitcher and ball flight" })
    .waitFor();
  await page.reload();
  await page
    .getByRole("img", { name: "Interactive 3D pitcher and ball flight" })
    .waitFor();
  await page.getByRole("button", { name: "Play flight", exact: true }).click();
  await page
    .getByRole("button", { name: "Pause flight", exact: true })
    .waitFor();
  await page.getByRole("button", { name: "Pause flight", exact: true }).click();
  await page
    .locator("nav")
    .getByRole("link", { name: "Movement", exact: true })
    .click();
  await page.reload();
  await page.getByRole("heading", { name: "Movement.", exact: true }).waitFor();
  assert.equal(errors.length, 0, errors.join("\n"));
  console.log(
    `PASS: ${base} — asset paths, hash navigation, 3D lazy loading, playback, and deep-link refreshes.`,
  );
} finally {
  await browser.close();
}
