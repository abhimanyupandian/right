<script lang="ts">
	import { Indicator } from '$lib/utils/constants';
	import { index } from '$lib/utils/stores';
	import { scrollToLine } from '$lib/utils/ui';

	export let cursorPosition: number;
</script>

<div id="nav" class="max-w-[320px] min-w-[320px] flex-0 px-2 max-h-[calc(100vh-72px)] pb-24">
	{#each Object.values($index) as each}
		<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
		{#if each.type != 'content'}
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<ul
				class={`${each.type} w-fit px-2 cursor-pointer`}
				class:opacity-50={each.index !== cursorPosition}
				class:text-white={each.index === cursorPosition}
				on:click={() => scrollToLine(each.line)}
			>
				{Indicator[each.type]}
				{each.label}
			</ul>
		{/if}
	{/each}
</div>

<style>
	#nav {
		@apply select-none;
		color: var(--f_high) !important;
		font-family: var(--font-family);
		font-size: calc(var(--font-size) * 0.8);
		line-height: var(--line-height);
		resize: none;
		width: calc(100% / 3);
		background: transparent;
		overflow: auto;
		transition: left 200ms;
		scrollbar-width: none;
		z-index: 0;
	}

	.title {
		@apply pl-0;
	}

	.subtitle {
		@apply pl-4;
	}

	.heading {
		@apply pl-8;
	}
</style>
