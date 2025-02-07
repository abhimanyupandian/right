import { defineConfig } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';
import topLevelAwait from "vite-plugin-top-level-await";
import { viteStaticCopy } from 'vite-plugin-static-copy'

//https://vitejs.dev/config
export default defineConfig({
	plugins: [
		viteStaticCopy({
			targets: [
				{
					src: './node_modules/mupdf/dist/mupdf-wasm.wasm',
					dest: './node_modules/.vite/deps'
				}
			]
		}),
		sveltekit(),
		topLevelAwait({
			// The export name of top-level await promise for each chunk module
			promiseExportName: "__tla",
			// The function to generate import names of top-level await promise in each chunk module
			promiseImportName: i => `__tla_${i}`
		})
	],
	clearScreen: false
});