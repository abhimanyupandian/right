<script lang="ts">
	import { Symbols } from "$lib/utils/constants";
	import { currentDocument, stats } from "$lib/utils/stores";
	import { onMount } from "svelte";
	import { get } from "svelte/store";
	import ArthurStatus from "./ArthurStatus.svelte";
	import { getCurrentTime, getTimeAgo, startTicker } from "$lib/utils/time";

	export let progressEl: any;

	let time: string = getCurrentTime();
	let lastSaveTime: number = -1;

	onMount(() => {
		startTicker((timeStr: string) => {
			time = timeStr;
			lastSaveTime = get(currentDocument).modifiedOn;
		});
	});
</script>

<div
	class="stats shadow-sm shadow-gray-400 h-[32px] px-3 flex flex-row w-[100vw] fixed bottom-0 select-none justify-between items-center min-w-[100vw]"
>
	<div class="flex flex-row space-x-2 items-center text-xs">
		<div class="flex flex-row space-x-4">
			<div bind:this={progressEl}></div>
			<div class="stats-text">{$stats.percent}%</div>
		</div>
	</div>
	<div id="details" class="flex-row space-x-2 text-xs hidden md:flex">
		<span class="stats-text"
			>{$currentDocument.name.length <= 50
				? $currentDocument.name
				: `${$currentDocument.name.slice(0, 50)}...`}</span
		>
		<span class="stats-text">{Symbols.DOT}</span>
		<span class="stats-text"
			>Modified {getTimeAgo(lastSaveTime)}
		</span>
	</div>
	<div class="flex flex-row justify-between items-center space-x-3">
		<span class="stats-text text-xs">{time}</span>
		<ArthurStatus></ArthurStatus>
	</div>
</div>

<style>
	.stats-text {
		font-family: var(--font-family);
		@apply opacity-25;
	}
	.stats {
		background: var(--background) !important;
		z-index: 0;
	}
</style>
