<script lang="ts">
	import FileHunter from "$lib/components/FileHunter.svelte";
	import Delete from "$lib/icons/Delete.svelte";
	import New from "$lib/icons/New.svelte";
	import {
		getNewNotepadMetdata,
		getNewPdfMetadata,
	} from "$lib/utils/constants";
	import { db, type Document } from "$lib/utils/db";
	import { recentsRefresher } from "$lib/utils/stores";
	import { onMount } from "svelte";
	import Wand from "$lib/icons/Wand.svelte";
	import ArthurSettings from "$lib/components/ArthurSettings.svelte";
	import TutorialIcon from "$lib/icons/Tutorial.svelte";
	import Tutorial from "./Tutorial.svelte";
	import Heart from "$lib/icons/Heart.svelte";
	import About from "./About.svelte";

	var savedDocuments: Document[] = [];
	var showFileHunter: boolean = false;
	var showArthurSettings: boolean = false;
	var showTutorial: boolean = false;
	var showAbout: boolean = false;

	function onNewNotepad() {
		var metadata = getNewNotepadMetdata();
		db.document.add(metadata);
		refreshRecents();
		window.open(`/?id=${metadata.id}`, "_blank");
	}

	function onOpenPdf(e: any) {
		const file = e.target.files[0];
		if (!file) return;
		var metadata = getNewPdfMetadata(file);
		db.document.add(metadata);
		refreshRecents();
		setTimeout(() => {
			window.open(`/?pdf=${metadata.id}`, "_blank");
		}, 500);
	}

	async function getSavedDocuments() {
		var documents = (await db.document.toArray())
			.sort((a, b) => b.modifiedOn - a.modifiedOn)
			.splice(0, 5);
		loadingDone = true;
		return documents;
	}

	function refreshRecents() {
		getSavedDocuments().then((v) => (savedDocuments = v));
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
			db.document.delete(id);
			refreshRecents();
		}
	};
</script>

<ArthurSettings bind:show={showArthurSettings}></ArthurSettings>
<Tutorial bind:show={showTutorial}></Tutorial>
<FileHunter bind:show={showFileHunter}></FileHunter>
<About bind:show={showAbout}></About>

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
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div class="flex flex-row justify-start space-x-2 items-center">
					<div>
						<New></New>
					</div>
					<label
						for="openPdf"
						class=" text-blue-500 rounded-sm cursor-pointer flex-nowrap"
					>
						{`Open PDF`}
					</label>
					<input
						id="openPdf"
						type="file"
						accept="application/pdf"
						class="invisible"
						on:change={onOpenPdf}
					/>
				</div>
				<div class="h-2"></div>
				<div class="">
					{#if savedDocuments.length}
						<div class="text-xl opacity-25 select-none">
							Recents
						</div>
						{#each savedDocuments as each (each.id)}
							<!-- svelte-ignore a11y_no_static_element_interactions -->
							<div
								on:mouseenter={() => (hoveringOver = each.id)}
								on:mouseleave={() => (hoveringOver = "")}
								class="flex flex-row space-x-8 items-center"
							>
								<a
									href={each.type === "notepad"
										? `/?id=${each.id}`
										: `/?pdf=${each.id}`}
									target="_blank"
									class="max-w-[480px] text-blue-500 rounded-sm cursor-pointer text-wrap whitespace-break-spaces"
								>
									{each.name.length <= 50
										? each.name
										: `${each.name.slice(0, 60)}...`}
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
						{#if savedDocuments.length > 2}
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
			<div class="flex flex-col space-y-">
				<div class="text-xl opacity-25 select-none">Settings</div>
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div class="flex flex-row justify-start space-x-2 items-center">
					<div class="stroke-blue-500">
						<TutorialIcon></TutorialIcon>
					</div>
					<div
						on:click={() => (showTutorial = true)}
						class=" text-blue-500 rounded-sm cursor-pointer"
					>
						{`Tutorial`}
					</div>
				</div>
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div class="flex flex-row justify-start space-x-2 items-center">
					<div class="stroke-blue-500">
						<Wand></Wand>
					</div>
					<div
						on:click={() => (showArthurSettings = true)}
						class=" text-blue-500 rounded-sm cursor-pointer"
					>
						{`Arthur AI`}
					</div>
				</div>
			</div>
		</div>
	</div>
{:else}
	<div id="screen"></div>
{/if}

<button
	on:click={() => (showAbout = true)}
	class="absolute bottom-4 right-4 p-4 fill-red-500 rounded-md bg-black opacity-25 hover:opacity-100 cursor-pointer"
>
	<Heart></Heart>
</button>
