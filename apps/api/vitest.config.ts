import { resolve } from "node:path";
import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

const root = resolve(process.cwd());

export default defineConfig({
  plugins: [swc.vite({ module: { type: "es6" }, jsc: { target: "es2022" } })],
  resolve: {
    alias: [{ find: /^@\//, replacement: `${resolve(root, "src")}/` }],
  },
  test: {
    root,
    environment: "node",
    include: ["test/**/*.spec.ts"],
    globalSetup: ["test/support/global-setup.ts"],
    setupFiles: ["test/support/setup.ts"],
    fileParallelism: false,
    testTimeout: 30000,
    hookTimeout: 60000,
  },
});
