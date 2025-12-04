import swc from "unplugin-swc";
import { defineConfig, configDefaults } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";
import { createRequire } from 'module';

const tsconfigJson = createRequire(import.meta.url)("./tsconfig.json");

process.env.STAGE = "test";

export default defineConfig({
  test: {
    testTimeout: process.env.TEST_TIMEOUT ? parseInt(process.env.TEST_TIMEOUT, 10) : 5_000,
    root: "./",
    include: [
      /**
       * unit - not using any external service
       * e2e - end-to-end test trough several (including external) services
       */
      "{src,test}/**/*.{unit,e2e}.ts",
    ],
    exclude:[
      ...configDefaults.exclude,
      '**/packages/**',
      ...tsconfigJson.exclude
    ],
    globals: true,
    alias: {
      "~*": "./src/*",
      "@test/*": "test/*"
    },
    coverage: {
      provider: "v8",
      reportsDirectory: './.tmp/coverage'
    }
  },
  plugins: [
    // needed for nest.js decorator support
    swc.vite({
      module: { type: "es6" }
    }),
    tsconfigPaths()]
});
