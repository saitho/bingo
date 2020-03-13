import typescript from 'rollup-plugin-typescript2';
import globals from 'rollup-plugin-node-globals';
import builtins from 'rollup-plugin-node-builtins';
import pkg from './package.json';
import {terser} from "rollup-plugin-terser";

const getPluginsConfig = (prod) => {
  const plugins = [
    globals(),
    builtins(),
    typescript({
      typescript: require('typescript'),
    })
  ];
  if (prod) {
    plugins.push(
      terser({
        compress: {
          unused: false,
          collapse_vars: false,
        },
        output: {
          comments: false,
        },
        sourcemap: true,
      })
    );
  }
  return plugins;
};

const getFileConfig = (file, prod) => {
  return {
    input: file.input,
    output: [
      {
        file: file.output,
        format: file.format
      },
    ],
    external: [
      ...Object.keys(pkg.dependencies || {})
    ],
    plugins: getPluginsConfig(prod)
  }
}

export default (CLIArgs) => {
  const prod = !!CLIArgs['config-prod'];

  const bundle = [];
  bundle.push(getFileConfig({
    input: 'src/frontend/index.ts',
    output: 'dist/public/index.js',
    format: 'iife',
  }, prod));
  bundle.push(getFileConfig({
    input: 'src/backend/app.ts',
    output: 'dist/app.js',
    format: 'cjs',
  }, prod));

  return bundle;
};
