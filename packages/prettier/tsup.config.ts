import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  minify: false,
  sourcemap: true,
  clean: true,
  splitting: true,
  cjsInterop: true,
  shims: false,
})
