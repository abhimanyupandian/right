<script lang="ts">
	import New from "$lib/icons/New.svelte";
	import { getNewNotepadMetdata } from "$lib/utils/constants";
	import { db, type Notepad } from "$lib/utils/db";
	import { showFileHunter } from "$lib/utils/stores";
	import { onMount } from "svelte";

	var savedNotepads: Notepad[] = [];

	onMount(() => {
		getSavedNotepads().then((v) => (savedNotepads = v));
	});

	function onNewNotepad() {
		var metadata = getNewNotepadMetdata();
		db.notepad.add(metadata);
		window.open(`/notepad/${metadata.id}`, "_blank");
	}

	async function getSavedNotepads() {
		var notepads = (await db.notepad.toArray())
			.sort((a, b) => b.modifiedOn - a.modifiedOn)
			.splice(0, 5);
		return notepads;
	}

	function onShowMore() {
		$showFileHunter = true;
	}
</script>

<div
	class="select-none flex max-h-[calc(100vh-64px)] min-h-[calc(100vh-64px)] min-w-screen max-w-screen w-screen space-x-2"
>
	<div
		class="max-w-[320px] min-w-[320px] flex-0 px-4 max-h-[calc(100vh-72px)] pb-24"
	></div>
	<div class="flex flex-col justify-center items-start">
		<div class="flex flex-row justify-center items-center space-x-4">
			<div>
				<img
					alt="logo"
					src="icon.png"
					width="75"
					height="75"
					class="rounded-md"
				/>
			</div>
			<div>
				<div class="text-3xl font-bold">Right.</div>
				<div class="text-xl font-bold opacity-50">Focused Writing.</div>
			</div>
		</div>
		<div class="h-4"></div>
		<div class="flex flex-col space-y-1">
			<div class="text-xl opacity-25 select-none">Start</div>
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div class="flex flex-row justify-start space-x-2 items-center">
				<div>
					<New></New>
				</div>
				<div
					on:click={onNewNotepad}
					class=" text-blue-500 rounded-sm cursor-pointer"
				>
					{`New Notepad`}
				</div>
			</div>
			<div class="h-2"></div>
			<div class="text-xl opacity-25 select-none">Recents</div>
			<div class="">
				{#if savedNotepads}
					{#each savedNotepads as each (each.id)}
						<div class="flex flex-row space-x-4 items-center">
							<a
								href={`/notepad/${each.id}`}
								target="_blank"
								class=" text-blue-500 rounded-sm cursor-pointer"
							>
								{each.name}
							</a>
							<span class="text-xs opacity-30">
								{new Date(each.modifiedOn).toLocaleString()}
							</span>
						</div>
					{/each}
					{#if savedNotepads.length > 2}
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div
							on:click={onShowMore}
							class="text-blue-500 rounded-sm cursor-pointer"
						>
							More...
						</div>
					{/if}
				{/if}
			</div>
		</div>
	</div>
</div>
