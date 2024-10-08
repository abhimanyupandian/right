<script lang="ts">
	import { content } from '$lib/utils/stores';

	export let editorEl;
</script>

<div class="flex min-w-[640px] max-w-[640px]">
	<textarea id="editor" bind:this={editorEl} bind:value={$content} />
</div>

<style>
	#editor {
		@apply outline-none pb-24 cursor-text;
		color: var(--f_high) !important;
		font-family: var(--font-family);
		font-size: var(--font-size);
		line-height: var(--line-height);
		resize: none;
		width: 100%;
		background: transparent;
		overflow: auto;
		scrollbar-width: none;
		z-index: 0;
	}
</style>
