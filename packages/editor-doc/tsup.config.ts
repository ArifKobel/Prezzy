import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/commands.ts", "src/doc.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
});
