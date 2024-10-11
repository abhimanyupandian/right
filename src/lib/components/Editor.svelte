<script lang="ts">
	import { currentNotepad, Saver } from "$lib/utils/stores";
	import { onMount } from "svelte";

	export let editorEl: HTMLElement;

	onMount(() => {
		document.addEventListener("keydown", function (event) {
			if ((event.ctrlKey || event.metaKey) && event.key === "s") {
				event.preventDefault();
				Saver.save();
			}
		});
	});
</script>

<div class="flex min-w-[640px] max-w-[640px]">
	<!-- svelte-ignore element_invalid_self_closing_tag -->
	<textarea
		id="editor"
		on:input={() => Saver.save({ delay: 2 * 1000 })}
		bind:this={editorEl}
		bind:value={$currentNotepad.content}
	/>
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
