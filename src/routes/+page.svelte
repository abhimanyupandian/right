<script lang="ts">
	import { onMount } from "svelte";
	import { getCaretCoordinates } from "$lib/utils/ui";
	import { Symbols } from "$lib/utils/constants";
	import { Theme } from "$lib/utils/theme";
	import { Progress } from "$lib/utils/progress";
	import {
		index,
		selection,
		selectionTracker,
		stats,
	} from "$lib/utils/stores";
	import Stats from "$lib/components/Stats.svelte";
	import { get } from "svelte/store";
	import Nav from "$lib/components/Nav.svelte";
	import Editor from "$lib/components/Editor.svelte";

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
		var details = Progress.get(target);
		$stats.percent = details.percent;
		progressEl.innerHTML = details.html;
	}

	function initListeners(editorEl: HTMLElement) {
		editorEl.addEventListener("scroll", () => {
			updateProgress(editorEl);
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

	// Mounting
	onMount(() => {
		Theme.install();
		Progress.init(progressEl);
	});
</script>

<div class:pt-8={IS_DESKTOP} class="flex flex-col h-[100vh] relative">
	<status
		class="h-[64px] flex flex-row w-full min-w-full justify-between items-center"
	>
		<div></div>
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div></div>
		<div></div>
	</status>
	<div
		class="flex max-h-[calc(100vh-64px)] min-h-[calc(100vh-64px)] min-w-screen max-w-screen w-screen space-x-2"
	>
		<Nav bind:cursorPosition />
		<Editor bind:editorEl />
	</div>

	<Stats bind:progressEl />
</div>
