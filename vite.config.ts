import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ command, isPreview }) => ({
  plugins: [react()],
  // Project Pages serves assets from /pitcher_site/; local development stays at /.
  base: command === "build" || isPreview ? "/pitcher_site/" : "/",
}));
