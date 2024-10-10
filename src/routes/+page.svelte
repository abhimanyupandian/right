<script lang="ts">
	import { Tooltip } from "@svelte-plugins/tooltips";
	import { onMount } from "svelte";
	import { getCaretCoordinates } from "$lib/utils/ui";
	import { Symbols } from "$lib/utils/constants";
	import { Theme } from "$lib/utils/theme";
	import { Progress } from "$lib/utils/progress";
	import { Arthur as ArthurAI } from "$lib/utils/arthur";
	import {
		arthurReady,
		index,
		selection,
		selectionTracker,
		stats,
	} from "$lib/utils/stores";
	import Stats from "$lib/components/Stats.svelte";
	import { get } from "svelte/store";
	import Nav from "$lib/components/Nav.svelte";
	import Editor from "$lib/components/Editor.svelte";
	import Arthur from "$lib/components/Arthur.svelte";
	import Viewer from "$lib/components/Viewer.svelte";
	import Devtools from "$lib/components/Devtools.svelte";
	import ArthurSettings from "$lib/components/ArthurSettings.svelte";

	const IS_DESKTOP = !!(globalThis as any).IS_DESKTOP;

	const pos: { x: number; y: number } = { x: 0, y: 0 };
	var cursorPosition: number = -1;

	var showArthurSettings: boolean = false;

	var editorEl: any;
	var progressEl: any;

	var isChatting = false;
	var setupDone: boolean = false;

	function restoreSelection(target: any) {
		if (!target) return;
		target.setSelectionRange(
			$selectionTracker.range.start,
			$selectionTracker.range.end,
		);
		target.scrollTo({
			top: $selectionTracker.scrollTop,
			behavior: "instant",
		});
		target.focus();
	}

	function saveSelection(target: any) {
		if (!target) return;
		$selectionTracker = {
			range: {
				start: target.selectionStart,
				end: target.selectionEnd,
			},
			content: get(selection).content,
			scrollTop: target.scrollTop,
			clientHeight: target.clientHeight,
		};
	}

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
		var details = Progress.get(target);
		$stats.percent = details.percent;
		progressEl.innerHTML = details.html;
	}

	function openChat() {
		if ($selection.content.trim().length <= 1) return;
		isChatting = true;
		saveSelection(editorEl);
	}

	function closeChat() {
		if (!isChatting) return;
		isChatting = false;
	}

	function initListeners(editorEl: HTMLElement) {
		editorEl.addEventListener("scroll", () => {
			updateProgress(editorEl);
		});

		editorEl.addEventListener("keydown", function (event: any) {
			if (event.metaKey && event.key === "/") {
				event.preventDefault();
				openChat();
			} else if (event.key === "Escape") closeChat();
		});

		editorEl.addEventListener("contextmenu", (event: any) => {
			event.preventDefault();
		});

		editorEl.addEventListener("selectionchange", (event: any) => {
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
			$stats.selectedW = $selection.content.split(Symbols.SPACE).length;
			$stats.selectedC = $selection.content.length;

			var caret = getCaretCoordinates(editorEl);
			pos.x = editorEl.offsetLeft + editorEl.offsetWidth;
			pos.y = caret.top;
		});
	}

	// First time setup
	$: if (editorEl && !setupDone) {
		initListeners(editorEl);
	}
	
	// Whenever chat is closed
	$: if (!isChatting && editorEl) {
		restoreSelection(editorEl);
		initListeners(editorEl);
	}

	// Mounting
	onMount(() => {
		Theme.install();
		Progress.init(progressEl);
		ArthurAI.wakeup();
	});
</script>

<div class:pt-8={IS_DESKTOP} class="flex flex-col h-[100vh] relative">
	<status
		class="h-[64px] flex flex-row w-full min-w-full justify-between items-center"
	>
		<div></div>
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<Tooltip
			position="bottom"
			align="center"
			animation="slide"
			style={{
				padding: "100px",
			}}
			content={$arthurReady
				? "Arthur AI is ready!"
				: "Arthur AI is unavailable. Tap to configure."}
		>
			<!-- svelte-ignore a11y_consider_explicit_label -->
			<button
				on:click={() => (showArthurSettings = true)}
				class:bg-red-700={!$arthurReady}
				class:bg-green-700={$arthurReady}
				class="hover:opacity-100 opacity-25 rounded-full w-10 h-2 m-2 mr-2"
			>
			</button>
		</Tooltip>
		<div></div>
	</status>
	<div
		class="flex max-h-[calc(100vh-64px)] min-h-[calc(100vh-64px)] min-w-screen max-w-screen w-screen space-x-2"
	>
		<Nav bind:cursorPosition />
		{#if isChatting}
			<Viewer bind:isChatting />
			<Arthur bind:isChatting bind:enabled={$arthurReady} />
		{:else}
			<Editor bind:editorEl />
		{/if}
	</div>

	<Stats bind:progressEl bind:arthurReady={$arthurReady} />
</div>

<ArthurSettings bind:showArthurSettings></ArthurSettings>
