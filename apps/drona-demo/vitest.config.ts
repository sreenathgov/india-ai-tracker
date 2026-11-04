import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    css: true,
    // One fork, deliberately. Vitest's CPU-count default spawns enough workers to
    // exhaust an 8 GB laptop; the suite is small enough that serial is fast anyway.
    pool: "forks",
    minWorkers: 1,
    maxWorkers: 1,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
