import { defineConfig } from 'vite';
import { external } from './shared';

export default defineConfig({
	base: "https://kappasquare.github.io/right/",
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