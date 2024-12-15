<script lang="ts">
	import FileHunter from "$lib/components/FileHunter.svelte";
	import Delete from "$lib/icons/Delete.svelte";
	import New from "$lib/icons/New.svelte";
	import { ARTHUR_ENABLED, getNewNotepadMetdata } from "$lib/utils/constants";
	import { db, type Notepad } from "$lib/utils/db";
	import { recentsRefresher } from "$lib/utils/stores";
	import { onMount } from "svelte";
	import Wand from "$lib/icons/Wand.svelte";
	import ArthurSettings from "$lib/components/ArthurSettings.svelte";

	var savedNotepads: Notepad[] = [];
	var showFileHunter: boolean = false;
	var showArthurSettings: boolean = false;

	function onNewNotepad() {
		var metadata = getNewNotepadMetdata();
		db.notepad.add(metadata);
		refreshRecents();
		window.open(`/?id=${metadata.id}`, "_blank");
	}

	async function getSavedNotepads() {
		var notepads = (await db.notepad.toArray())
			.sort((a, b) => b.modifiedOn - a.modifiedOn)
			.splice(0, 5);
		loadingDone = true;
		return notepads;
	}

	function refreshRecents() {
		getSavedNotepads().then((v) => (savedNotepads = v));
	}

	function onShowMore() {
		showFileHunter = true;
	}

	var loadingDone: boolean = false;
	onMount(() => {
		recentsRefresher.broadcast.onmessage = refreshRecents;
		recentsRefresher.subscribe(refreshRecents);

		document.body.style.removeProperty("background-color");
	});

	let isConfirming: Record<string, any> = {};
	let hoveringOver: string = "";

	const handleDelete = (id: string) => {
		if (!isConfirming[id]) {
			isConfirming[id] = true;
			setTimeout(() => {
				delete isConfirming[id];
				isConfirming = isConfirming;
			}, 2000);
		} else {
			db.notepad.delete(id);
			refreshRecents();
		}
	};
</script>

{#if ARTHUR_ENABLED}
	<ArthurSettings bind:show={showArthurSettings}></ArthurSettings>
{/if}
<FileHunter bind:show={showFileHunter}></FileHunter>

{#if loadingDone}
	<div
		class="select-none flex max-h-[calc(100vh-64px)] min-h-[calc(100vh-64px)] min-w-screen max-w-screen w-screen space-x-2"
	>
		<div
			class="max-w-[320px] min-w-[320px] flex-0 px-4 max-h-[calc(100vh-72px)] pb-24"
		></div>
		<div class="flex flex-col justify-center items-start space-y-4">
			<!-- Start Section -->
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
					<div class="text-xl font-bold opacity-25">
						Focused Writing.
					</div>
				</div>
			</div>
			<!-- Recents Section -->
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
				<div class="">
					{#if savedNotepads.length}
						<div class="text-xl opacity-25 select-none">
							Recents
						</div>
						{#each savedNotepads as each (each.id)}
							<!-- svelte-ignore a11y_no_static_element_interactions -->
							<div
								on:mouseenter={() => (hoveringOver = each.id)}
								on:mouseleave={() => (hoveringOver = "")}
								class="flex flex-row space-x-2 items-center"
							>
								<a
									href={`/?id=${each.id}`}
									target="_blank"
									class=" text-blue-500 rounded-sm cursor-pointer text-wrap whitespace-break-spaces"
								>
									{each.name}
								</a>
								<span class="text-xs opacity-30">
									{new Date(each.modifiedOn).toLocaleString()}
								</span>
								{#if hoveringOver == each.id}
									<button
										on:click={() => handleDelete(each.id)}
										class="text-xs text-red-500"
									>
										{#if isConfirming[each.id]}
											Tap to confirm deletion
										{:else}
											<div class="w-4 h-4">
												<Delete></Delete>
											</div>
										{/if}
									</button>
								{/if}
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
			{#if ARTHUR_ENABLED}
				<div class="flex flex-col space-y-1">
					<div class="text-xl opacity-25 select-none">Arthur AI</div>
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div
						class="flex flex-row justify-start space-x-2 items-center"
					>
						<div class="stroke-blue-500">
							<Wand></Wand>
						</div>
						<div
							on:click={() => (showArthurSettings = true)}
							class=" text-blue-500 rounded-sm cursor-pointer"
						>
							{`Settings`}
						</div>
					</div>
				</div>
			{/if}
		</div>
	</div>
{:else}
	<div id="screen"></div>
{/if}
