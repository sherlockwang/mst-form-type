/// <reference types="vitest" />
import path from "path";
import { defineConfig } from "vite";
import dts from 'vite-plugin-dts'
import packageJson from "./package.json";

const getPackageName = () => {
  return packageJson.name;
};

const getPeerDependency = () => {
  return Object.keys(packageJson.peerDependencies)
}

const getPackageNameCamelCase = () => {
  try {
    return getPackageName().replace(/-./g, (char) => char[1].toUpperCase());
  } catch (err) {
    throw new Error("Name property in package.json is missing.");
  }
};

const fileName = {
  es: `${getPackageName()}.js`,
  cjs: `${getPackageName()}.cjs`,
  // iife: `${getPackageName()}.iife.js`,
};

const formats = Object.keys(fileName) as Array<keyof typeof fileName>;

export default defineConfig({
  base: "./",
  build: {
    lib: {
      entry: path.resolve(__dirname, "src/index.ts"),
      name: getPackageNameCamelCase(),
      formats,
      fileName: (format) => fileName[format],
    },
    rollupOptions: {
      external: getPeerDependency(),
    },
  },
  plugins: [
    dts({
      entryRoot: 'src',
      outDir: 'dist/types',
    }),
  ],
  test: {

  }
});
