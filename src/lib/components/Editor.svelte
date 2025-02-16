<script lang="ts">
	import { Saver } from "$lib/utils/db";
	import { Progress } from "$lib/utils/progress";
	import { currentDocument } from "$lib/utils/stores";
	import { onDestroy, onMount } from "svelte";

	export let editorEl: HTMLElement;
	export let isChatting: boolean = false;

	function handleKeydown(event: any) {
		if ((event.ctrlKey || event.metaKey) && event.key === "s") {
			event.preventDefault();
			Saver.save();
		}
	}

	onMount(() => {
		Progress.track();
		document.addEventListener("keydown", handleKeydown);
	});

	onDestroy(() => {
		document.removeEventListener("keydown", handleKeydown);
	});
</script>

{#if !isChatting}
	<div class="flex min-w-[640px] max-w-[640px]">
		<textarea
			id="editor"
			on:input={() => Saver.save({ delay: 2 * 1000 })}
			bind:this={editorEl}
			bind:value={$currentDocument.content}
		></textarea>
	</div>
{/if}

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
	::selection {
		background: var(--hl_bg) !important;
		color: var(--hl_fg) !important;
	}
</style>
