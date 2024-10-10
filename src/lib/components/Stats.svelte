<script lang="ts">
	import { Delimeters, Symbols } from "$lib/utils/constants";
	import { content, index, stats } from "$lib/utils/stores";
	import type { IndexEntry, IndexType } from "$lib/utils/types";
	import { onMount } from "svelte";

	export let progressEl: any;

	var time: string = getCurrentTime();

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
		return "content";
	}

	function splitByType(line: string, type: IndexType) {
		var delimeter = Delimeters[type];
		return (line.split(delimeter)[1] ?? "").trim();
	}

	content.subscribe((c) => {
		var index_: IndexEntry[] = [];
		var line = 0;
		var lastIndex = 0;
		$stats.totalC = 0;
		$stats.totalW = 0;
		for (var eachLine of c.split(Symbols.EOL)) {
			var start = $stats.totalC + line;
			var end = start + eachLine.length;
			$stats.totalC += eachLine.length;
			$stats.totalW += eachLine.split(Symbols.SPACE).length;
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
		<div bind:this={progressEl} />
		<div class="w-10 stats-text">{$stats.percent}%</div>
		<span class="stats-text">{Symbols.DOT}</span>
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
	</div>
	<div class="text-xs flex flex-row items-center justify-between space-x-3">
		<span class="stats-text">{time}</span>
	</div>
</div>

<style>
	.stats-text {
		@apply opacity-40;
	}
	.stats {
		background: var(--background) !important;
	}
</style>
