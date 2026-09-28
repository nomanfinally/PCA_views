import { archivePlugin } from "./build/archivePlugin";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react(), archivePlugin()],
  base: "./",
  test: { include: ["src/**/*.test.ts"] },
});
