import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		csp: {
			directives: {
				'script-src': ['self', 'wasm-unsafe-eval']
			},
		},
		paths: {
			relative: false,
		},
		adapter: adapter({
			fallback: 'index.html',
			pages: '.vite/renderer/main_window',
			assets: '.vite/renderer/main_window',
		})
	}
};

export default config;
