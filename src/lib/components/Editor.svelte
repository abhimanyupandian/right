<script lang="ts">
	import { Saver } from "$lib/utils/db";
	import { Progress } from "$lib/utils/progress";
	import { currentNotepad } from "$lib/utils/stores";
	import uuid from "short-uuid";
	import { onMount } from "svelte";

	export let editorEl: HTMLElement;

	const listeners: any = {};

	var setupDone: boolean = false;
	$: if (editorEl && !setupDone) {
		editorEl.innerHTML = $currentNotepad.raw;
		setupDone = true;
	}

	onMount(() => {
		Progress.track();
		document.addEventListener("keydown", function (event) {
			if ((event.ctrlKey || event.metaKey) && event.key === "s") {
				event.preventDefault();
				Saver.save();
			}
		});
		var observer = new MutationObserver(function (mutations) {
			mutations.forEach(function (mutation: any) {
				var message: {
					event: string;
					element: HTMLElement;
					old?: HTMLElement;
				};
				switch (mutation.type) {
					// case "characterData":
					// 	message = {
					// 		event:
					// 			"Character data changed from '" +
					// 			mutation.oldValue +
					// 			"' to '" +
					// 			mutation.target.data +
					// 			"'",
					// 		element: mutation.target,
					// 	};
					// 	break;
					// case "attributes":
					// 	message = {
					// 		event:
					// 			"Attribute '" +
					// 			mutation.attributeName +
					// 			"' changed from '" +
					// 			mutation.oldValue +
					// 			"' to '" +
					// 			mutation.target.getAttribute(
					// 				mutation.attributeName,
					// 			) +
					// 			"'",
					// 		element: mutation.target,
					// 	};
					// 	break;
					case "childList":
						message = { event: "ADD", element: mutation.target };
						// console.log(mutation.removedNodes)
						if (mutation.removedNodes) {
							// console.log("Removed", mutation.removedNodes)
							for (const node of mutation.removedNodes) {
								console.log(node)
								if (listeners[node.__id__]) {
									delete listeners[node.__id__];
								}
							}
						}
						if (mutation.addedNodes) {
							// console.log("Added", mutation.addedNodes);
							// let node = mutation.addedNodes[0];
							for (const node of mutation.addedNodes) {
								let allowed = ["DIV", "SPAN"].includes(node.tagName);
								if (true) {
									node.__id__ = uuid.generate();
									listeners[node.__id__] = {
										handler: () => {
											console.log(node);
										},
										type: node.tagName,
										id: node.__id__,
										node,
									};
								}
							}
						}
						console.log(Object.keys(listeners).length);
						break;
				}
				// console.log(message!);
			});
		});

		// pass in the target node, as well as the observer options
		observer.observe(editorEl, {
			subtree: true,
			attributes: true,
			childList: true,
			characterData: true,
			characterDataOldValue: true,
		});
	});

	function onInput(_: any) {
		Saver.save({ delay: 2 * 1000 });
		// $currentNotepad.content = editorEl.innerText;
	}
</script>

<div class="flex min-w-[640px] max-w-[640px]">
	<div
		contenteditable
		id="editor"
		on:input={onInput}
		on:dblclick={() => console.log(listeners)}
		bind:this={editorEl}
		bind:innerText={$currentNotepad.content}
		bind:innerHTML={$currentNotepad.raw}
	></div>
</div>

<style>
	#editor {
		@apply outline-none pb-24 cursor-text;
		color: var(--f_high) !important;
		font-family: var(--font-family);
		font-size: var(--font-size);
		line-height: var(--line-height);
		resize: none;
		width: 100%;
		background: transparent;
		overflow: auto;
		scrollbar-width: none;
		z-index: 0;
	}
	::selection {
		background: var(--hl_bg) !important;
		color: var(--hl_fg) !important;
	}
</style>
