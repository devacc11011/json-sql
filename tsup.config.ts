import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ['react', 'react-dom'],
  // CSS injection is tricky with Tailwind in libs. 
  // We will rely on the consumer to import the CSS or inject it.
  // For simplicity here, we assume the consumer uses Tailwind or we ship a CSS file.
  injectStyle: false, 
});
