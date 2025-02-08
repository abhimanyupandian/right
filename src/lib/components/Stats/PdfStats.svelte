<script lang="ts">
	import { Symbols } from "$lib/utils/constants";
	import { currentDocument, stats } from "$lib/utils/stores";
	import TimeAgo from "javascript-time-ago";
	import { onMount } from "svelte";
	import { get } from "svelte/store";
	import en from "javascript-time-ago/locale/en";
	import ArthurStatus from "./ArthurStatus.svelte";

	export let progressEl: any;

	TimeAgo.addLocale(en);
	const timeAgo = new TimeAgo("en-US");
	var time: string = getCurrentTime();
	var lastSaveTime: number = get(currentDocument).modifiedOn;

	function getCurrentTime() {
		const now = new Date();
		const hours = now.getHours().toString().padStart(2, "0"); // Get hours and pad with 0 if needed
		const minutes = now.getMinutes().toString().padStart(2, "0"); // Get minutes and pad with 0 if needed
		return `${hours}:${minutes}`;
	}

	onMount(() => {
		var clock = setInterval(() => {
			time = getCurrentTime();
			lastSaveTime = get(currentDocument).modifiedOn;
		}, 1000);
		return () => {
			clearInterval(clock);
		};
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
			>Modified {timeAgo.format(new Date(lastSaveTime))}
		</span>
	</div>
	<div class="flex flex-row justify-between items-start space-x-3">
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
