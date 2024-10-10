<script lang="ts">
	import { selection, selectionTracker } from "$lib/utils/stores";
	import { onMount } from "svelte";

	var contextHtml = "";
	let contentEl: any;

	export let isChatting: boolean;

	$: if ($selection.content.length > 1) {
		contextHtml =
			'<div id="context-parent" class="overflow-scroll">' +
			`<span class="opacity-25">${$selection.before}</span>` +
			'<span id="context-selected" contenteditable class="focus:outline-none bg-[yellow] text-[black]">' +
			`${$selection.content}</span>` +
			`<span class="opacity-25">${$selection.after}</span>` +
			"</div>";
	}
	onMount(() => {
		contentEl.scrollTo({ top: $selectionTracker.scrollTop });

		contentEl.onscroll = (e: any) => {
			// $selectionTracker.scrollTop = e.target.scrollTop;
		};

		contentEl.addEventListener("keydown", function (event: any) {
			if (event.key === "Escape") isChatting = false;
		});
	});
</script>

<div on:selectstart|preventDefault class="flex min-w-[640px] max-w-[640px]">
	<div bind:this={contentEl} id="chat-context" class="overflow-hidden">
		{@html contextHtml}
	</div>
</div>

<style>
	#chat-context {
		@apply outline-none pb-32;
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
		white-space: pre-wrap;
	}
</style>
