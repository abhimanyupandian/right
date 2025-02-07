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
		outDir: '.vite/build/main',
		minify: true,
		lib: {
			entry: './src/main.ts',
			fileName: () => '[name].js',
			formats: ['es'],
		},
		rollupOptions: {
			external,
		},
	},
	resolve: {
		// Load the Node.js entry.
		mainFields: ['module', 'jsnext:main', 'jsnext'],
	},
	clearScreen: false,
});