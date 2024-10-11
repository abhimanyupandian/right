<script lang="ts">
	import { Delimeters, Symbols, Tags } from "$lib/utils/constants";
	import { currentNotepad, index, stats } from "$lib/utils/stores";
	import type { IndexEntry, IndexType, TagType } from "$lib/utils/types";
	import TimeAgo from "javascript-time-ago";
	import { onMount } from "svelte";
	import { get } from "svelte/store";
	import en from "javascript-time-ago/locale/en";

	export let progressEl: any;

	TimeAgo.addLocale(en);
	// Create formatter (English).
	const timeAgo = new TimeAgo("en-US");
	var time: string = getCurrentTime();
	var lastSaveTime: number = get(currentNotepad).modifiedOn;

	function getCurrentTime() {
		const now = new Date();
		const hours = now.getHours().toString().padStart(2, "0"); // Get hours and pad with 0 if needed
		const minutes = now.getMinutes().toString().padStart(2, "0"); // Get minutes and pad with 0 if needed
		return `${hours}:${minutes}`;
	}

	function getIndexType(line: string) {
		if (line.startsWith(Delimeters.title)) return "title";
		else if (line.startsWith(Delimeters.subtitle)) return "subtitle";
		else if (line.startsWith(Delimeters.heading)) return "heading";
		else if (line.startsWith(Delimeters.chapter)) return "chapter";
		return "content";
	}

	function splitByType(line: string, type: IndexType) {
		var delimeter = Delimeters[type];
		return (line.split(delimeter)[1] ?? "").trim();
	}

	currentNotepad.subscribe((c) => {
		if (!c) return;
		var index_: IndexEntry[] = [];
		var line = 0;
		var lastIndex = 0;
		$stats.totalC = 0;
		$stats.totalW = 0;
		for (var eachLine of c.content.split(Symbols.EOL)) {
			var start = $stats.totalC + line;
			var end = start + eachLine.length;
			$stats.totalC += eachLine.length;
			$stats.totalW += eachLine
				.split(Symbols.SPACE)
				.filter((e) => e.trim().length).length;
			var type = getIndexType(eachLine) as IndexType;
			if (type != "content") lastIndex = line;
			index_.push({
				line,
				label:
					type == "content"
						? Symbols.EMPTY
						: splitByType(eachLine, type),
				type,
				index: lastIndex,
				range: { start, end },
			});
			line++;
		}
		$index = index_;
	});

	onMount(() => {
		var clock = setInterval(() => {
			time = getCurrentTime();
			lastSaveTime = get(currentNotepad).modifiedOn;
		}, 1000);
		return () => {
			clearInterval(clock);
		};
	});
</script>

<div
	class="stats h-[32px] px-4 flex flex-row w-[100vw] fixed bottom-0 select-none justify-between items-center min-w-[100vw]"
>
	<div class="flex flex-row space-x-2 items-center text-xs">
		<div bind:this={progressEl}></div>
		<div class="w-10 stats-text">{$stats.percent}%</div>
	</div>
	<div id="details" class="flex-row space-x-2 text-xs hidden md:flex">
		<div class="flex flex-row space-x-2 items-center text-xs stats-text">
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
		<span class="stats-text">{$currentNotepad.name}</span>
		<span class="stats-text">{Symbols.DOT}</span>
		<span class="stats-text"
			>Modified {timeAgo.format(new Date(lastSaveTime))}
		</span>
	</div>
	<div class="text-xs flex flex-row items-center justify-between space-x-3">
		<span class="stats-text">{time}</span>
	</div>
</div>

<style>
	.stats-text {
		font-family: var(--font-family);
		@apply opacity-25;
	}
	.stats {
		background: var(--background) !important;
	}
</style>
