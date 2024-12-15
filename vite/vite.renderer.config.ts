import { defineConfig } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';

//https://vitejs.dev/config
export default defineConfig({
	base: "https://kappasquare.github.io/right/",
	plugins: [sveltekit()],
	clearScreen: false
});