<script lang="ts">
	import { onMount } from "svelte";
	import { getCaretCoordinates } from "$lib/utils/ui";
	import { getNewNotepadMetdata, Symbols } from "$lib/utils/constants";
	import { Theme } from "$lib/utils/theme";
	import { Progress } from "$lib/utils/progress";
	import {
		currentNotepad,
		index,
		Saver,
		selection,
		stats,
	} from "$lib/utils/stores";
	import Stats from "$lib/components/Stats.svelte";
	import Nav from "$lib/components/Nav.svelte";
	import Editor from "$lib/components/Editor.svelte";
	import { db, type Notepad } from "$lib/utils/db";
	import { liveQuery } from "dexie";
	import { v4 as uuidv4 } from "uuid";
	import Back from "$lib/icons/Back.svelte";

	const IS_DESKTOP = !!(globalThis as any).IS_DESKTOP;

	const pos: { x: number; y: number } = { x: 0, y: 0 };
	var cursorPosition: number = -1;

	var editorEl: any;
	var progressEl: any;

	var setupDone: boolean = false;

	function syncIndexWithCursor(target: any) {
		var textUntilCursor = target.value.substring(
			0,
			target.selectionDirection == "forward"
				? target.selectionEnd
				: target.selectionStart,
		);
		var lineNumber = textUntilCursor.split(Symbols.EOL).length;
		cursorPosition = $index[lineNumber - 1].index ?? -1;
	}

	function updateProgress(target: any) {
		if (!target) return;
		var details = Progress.get(target);
		$stats.percent = details.percent;
		progressEl.innerHTML = details.html;
	}

	function initListeners(target: HTMLElement) {
		if (!target) return;
		target.addEventListener("scroll", () => {
			updateProgress(target);
		});

		target.addEventListener("contextmenu", (event: any) => {
			event.preventDefault();
		});

		target.addEventListener("selectionchange", (event: any) => {
			var target = event.target as any;
			syncIndexWithCursor(target);
			var value = target.value;
			$selection.content = value.substring(
				target.selectionStart,
				target.selectionEnd,
			);
			$selection.before = value.substring(0, target.selectionStart);
			$selection.after = value.substring(
				target.selectionEnd,
				value.length,
			);
			$stats.selectedW = $selection.content
				.split(Symbols.SPACE)
				.filter((e) => e.trim().length).length;
			$stats.selectedC = $selection.content.length;

			var caret = getCaretCoordinates(target);
			pos.x = target.offsetLeft + target.offsetWidth;
			pos.y = caret.top;
		});
	}

	// First time setup
	$: if (editorEl && !setupDone) {
		initListeners(editorEl);
	}

	// Mounting
	onMount(() => {
		Theme.install();
	});

	var showIntroduction: boolean = false;
	var savedNotepads: Notepad[] = [];

	$: if (showIntroduction) {
		getSavedNotepads().then((v) => (savedNotepads = v));
	} else {
		Progress.init(progressEl);
	}

	async function getSavedNotepads() {
		var notepads = (await db.notepad.toArray())
			.sort((a, b) => b.modifiedOn - a.modifiedOn)
			.splice(0, 5);
		return notepads;
	}

	currentNotepad.subscribe((v) => {
		if (v) showIntroduction = false;
		else showIntroduction = true;
	});

	function onNewNotepad() {
		var metadata = getNewNotepadMetdata();
		db.notepad.add(metadata);
		$currentNotepad = metadata;
	}

	function onOpenNotepad(id: string) {
		db.notepad.get(id).then((notepad) => {
			if (notepad) $currentNotepad = notepad;
		});
	}

	function goToIntroPage() {
		Saver.save({
			callback: () => {
				//@ts-ignore
				$currentNotepad = null;
			},
		});
	}

	function onShowMore() {}
</script>

{#if showIntroduction}
	<div
		class="select-none flex max-h-[calc(100vh-64px)] min-h-[calc(100vh-64px)] min-w-screen max-w-screen w-screen space-x-2"
	>
		<div
			class="max-w-[320px] min-w-[320px] flex-0 px-4 max-h-[calc(100vh-72px)] pb-24"
		></div>
		<div class="flex flex-col justify-center items-start">
			<div class="text-3xl font-bold">Right</div>
			<div class="text-xl font-bold opacity-50">Focused Writing.</div>
			<div class="h-4"></div>
			<div class="flex flex-col space-y-1">
				<div class="text-xl opacity-25 select-none">Start</div>
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div
					on:click={onNewNotepad}
					class=" text-blue-500 rounded-sm cursor-pointer"
				>
					{`New`}
				</div>
				<div class="h-2"></div>
				<div class="text-xl opacity-25 select-none">Recents</div>
				<div class="">
					{#if savedNotepads}
						{#each savedNotepads as each (each.id)}
							<div class="flex flex-row space-x-4 items-center">
								<!-- svelte-ignore a11y_click_events_have_key_events -->
								<!-- svelte-ignore a11y_no_static_element_interactions -->
								<div
									on:click={() => onOpenNotepad(each.id)}
									class=" text-blue-500 rounded-sm cursor-pointer"
								>
									{each.name}
								</div>
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
{:else}
	<div class:pt-8={IS_DESKTOP} class="flex flex-col h-[100vh] relative">
		<status
			class="h-[40px] flex-row w-full min-w-full justify-between items-center flex px-4"
		>
			<div class="max-w-[320px] min-w-[320px]">
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div on:click={goToIntroPage} class="opacity-50 cursor-pointer">
					<Back></Back>
				</div>
			</div>
			<div
				class="max-w-[320px] min-w-[320px] flex flex-row justify-between items-center px-4"
			>
				<span> </span>
			</div>
		</status>
		<div
			class="flex max-h-[calc(100vh-64px)] min-h-[calc(100vh-64px)] min-w-screen max-w-screen w-screen space-x-2"
		>
			<Nav bind:cursorPosition />
			<Editor bind:editorEl />
		</div>

		<Stats bind:progressEl />
	</div>
{/if}

<style>
	status {
		font-family: var(--font-family);
		font-size: calc(var(--font-size) * 1);
		max-lines: 1;
	}
</style>
