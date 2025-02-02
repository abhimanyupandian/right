import { defineConfig } from 'vite';
import { external } from './shared';
import topLevelAwait from "vite-plugin-top-level-await";

export default defineConfig({
	plugins: [
		topLevelAwait({
			// The export name of top-level await promise for each chunk module
			promiseExportName: "__tla",
			// The function to generate import names of top-level await promise in each chunk module
			promiseImportName: i => `__tla_${i}`
		})
	],
	build: {
		outDir: '.vite/build/preload',
		minify: true,
		rollupOptions: {
			external,
			// Preload scripts may contain Web assets, so use the `build.rollupOptions.input` instead `build.lib.entry`.
			input: './src/preload.ts',
			output: {
				format: 'commonjs',
				// It should not be split chunks.
				inlineDynamicImports: true,
				entryFileNames: '[name].js',
				chunkFileNames: '[name].js',
				assetFileNames: '[name].[ext]',
			},
		},
	},
	resolve: {
		// Load the Node.js entry.
		mainFields: ['module', 'jsnext:main', 'jsnext'],
	},
	clearScreen: false,
});