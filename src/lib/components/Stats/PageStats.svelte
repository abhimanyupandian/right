<script lang="ts">
	import { Symbols } from "$lib/utils/constants";
	import { currentDocument, stats } from "$lib/utils/stores";
	import TimeAgo from "javascript-time-ago";
	import { onMount } from "svelte";
	import { get } from "svelte/store";
	import en from "javascript-time-ago/locale/en";
	import { arthur } from "$lib/utils/arthur";
	import ArthurSettings from "../ArthurSettings.svelte";

	export let progressEl: any;

	let showArthurStatus: boolean = false;
	let showArthurSettings: boolean = false;

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

<ArthurSettings bind:show={showArthurSettings}></ArthurSettings>
<div
	class="stats shadow-sm shadow-gray-400 h-[32px] px-3 flex flex-row w-[100vw] fixed bottom-0 select-none justify-between items-center min-w-[100vw]"
>
	<div class="flex flex-row space-x-2 items-center text-xs">
		<div class="flex flex-row space-x-4 w-[160px]">
			<div bind:this={progressEl}></div>
			<div class="stats-text">{$stats.percent}%</div>
		</div>
	</div>
	<div id="details" class="flex-row space-x-2 text-xs hidden md:flex">
		<div class="flex flex-row space-x-4 items-center text-xs stats-text">
			<div class="flex flex-row space-x-1">
				<div>{$stats.totalW} W,</div>
				<div>{$stats.totalC} C</div>
			</div>
			{#if $stats.selectedW && $stats.selectedC}
				<div class="flex flex-row space-x-1">
					(
					<div>{$stats.selectedW} W,</div>
					<div>{$stats.selectedC} C</div>
					)
				</div>
			{/if}
		</div>
		<span class="stats-text">{Symbols.DOT}</span>
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
	<div class="text-xs flex flex-row justify-between items-start space-x-3">
		<span class="stats-text">{time}</span>
		{#if showArthurStatus}
			<tooltip
				class="fixed right-1 bottom-[32px] bg-black text-white h-4 text-md p-1 flex flex-col items-center justify-center"
			>
				<div>
					Arthur AI {$arthur.state === "loading"
						? "Loading..."
						: $arthur.state == true
							? "Ready!"
							: "Unavailable"}
				</div>
			</tooltip>
		{/if}
		<button
			on:mouseenter={() => (showArthurStatus = true)}
			on:mouseleave={() => (showArthurStatus = false)}
			on:click={() => (showArthurSettings = true)}
			class="opacity-50 hover:opacity-100 outline-none"
		>
			{#if $arthur.state === "loading"}
				<div class="w-3 h-3 rounded-full bg-[orange]"></div>
			{:else}
				<div
					class:bg-green-500={$arthur.state == true}
					class:bg-yellow-500={$arthur.state == "unsupported"}
					class:bg-red-500={!$arthur.state}
					class="w-3 h-3 rounded-full"
				></div>
			{/if}
		</button>
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
