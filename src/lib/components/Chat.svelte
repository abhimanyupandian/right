<script lang="ts">
	import ChatMessageCopied from '$lib/icons/ChatMessageCopied.svelte';
	import ChatMessageCopy from '$lib/icons/ChatMessageCopy.svelte';
	import EmptyChat from '$lib/icons/EmptyChat.svelte';
	import { Symbols } from '$lib/utils/constants';
	import { selection } from '$lib/utils/stores';
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';

	export let contextEl;

	var promptEl: any;
	var contextHtml = '';
	var prompt: string = '';

	var isLoading: boolean = false;

	type Response = { status: boolean; content?: string };
	type Command = {
		label: string;
		alias?: string[];
		handler: (command: string[]) => Promise<Response>;
	};

	const commands = writable<Command[]>([
		{
			label: 'rephrase',
			alias: ['reword'],
			handler: async (v) => {
				return { status: true, content: v.join(',') };
			},
		},
		{
			label: 'debate',
			handler: async (v) => {
				return { status: true, content: v.join(',') };
			},
		},
		{
			label: 'outro',
			handler: async (v) => {
				return { status: true, content: v.join(',') };
			},
		},
		{
			label: 'intro',
			handler: async (v) => {
				return { status: true, content: v.join(',') };
			},
		},
		{
			label: 'revert',
			handler: async (v) => {
				return { status: true, content: v.join(',') };
			},
		},
	]);

	const messages = writable<{ source: 'user' | 'ai'; message: string }[]>([]);

	$: if ($selection.content.length > 1) {
		contextHtml =
			'<div id="context-parent">' +
			`<span class="opacity-25">${$selection.before}</span>` +
			'<span id="context-selected" contenteditable class="text-[white] outline-none focus:outline-none">' +
			`${$selection.content}</span>` +
			`<span class="opacity-25">${$selection.after}</span>` +
			'</div>';
	}

	onMount(() => {
		promptEl.focus();
		document.getElementById('context-selected')!.scrollIntoView({
			behavior: 'smooth',
			block: 'center',
		});
	});

	var messagesEl: any;

	function addDummyMessages(response: string) {
		$messages.push({
			source: 'ai',
			message: response,
		});
		$messages = $messages;
	}

	function refreshMessages() {
		messagesEl.lastElementChild?.scrollIntoView({ behavior: 'smooth' });
	}

	async function handleFreeText() {
		return { status: true, content: `This is the response for ${prompt}` };
	}

	function isValidCommand() {
		var args = prompt.split(Symbols.SPACE);
		var commandDef = $commands.filter((e) => `/${e.label}` === args[0])[0];
		return { args, commandDef };
	}

	$: if ($messages.length) {
		setTimeout(() => refreshMessages(), 1);
	}

	async function handleCommand() {
		var { args, commandDef } = isValidCommand();
		if (commandDef) {
			return await commandDef.handler(args);
		}
		return { status: false };
	}

	function startLoading() {
		isLoading = true;
	}

	function finishLoading() {
		isLoading = false;
	}

	function reset() {
		prompt = '';
		setTimeout(() => promptEl.focus(), 1);
		finishLoading();
	}

	async function handleKeyPress(e: any) {
		var keyCode = e.code || e.key;
		var resp: Response = { status: false };
		if (keyCode == 'Enter' && prompt) {
			if (prompt.startsWith('/')) {
				resp = await handleCommand();
			} else {
				resp = await handleFreeText();
			}
			if (resp.status) {
				$messages.push({
					source: 'user',
					message: prompt,
				});
				startLoading();
				await new Promise((r) => setTimeout(r, 1000));
				addDummyMessages(resp.content!);
				reset();
			}
		}
	}
	var copied: boolean = false;
	function copyMessage(message: string) {
		navigator.clipboard.writeText(message);
		copied = true;
		setTimeout(() => (copied = false), 5000);
	}

	var filteredCommands: Command[] = [];
	$: if (prompt) {
		filteredCommands = $commands.filter((e) =>
			`/${e.label}`.startsWith(prompt.split(Symbols.SPACE)[0] ?? ''),
		);
	}
</script>

<div id="overlay" class="flex flex-row w-full h-[calc(100vh-32px)] absolute p-4 space-x-4 pt-8">
	<div id="chat-context" class="flex-1 flex flex-col justify-center items-center overflow-hidden">
		<div
			bind:this={contextEl}
			class="max-h-screen overflow-scroll border-2 rounded-md border-zinc-800 p-2"
			style="scrollbar-width:none;"
		>
			{@html contextHtml}
		</div>
	</div>
	<div class:opacity-25={isLoading} class="flex-1 flex flex-col gap-y-2 relative">
		{#if isLoading}
			<div
				class="w-full h-full absolute z-10 bg-transparent opacity-5 flex flex-col items-center justify-center"
			/>
		{/if}
		{#if $messages.length == 0}
			<div
				class="flex flex-col h-full w-full items-center justify-center text-sm opacity-5 select-none"
			>
				<EmptyChat />
			</div>
		{/if}
		<div class="flex-1 flex overflow-hidden text-md">
			<div
				bind:this={messagesEl}
				class="overflow-scroll space-y-4 w-full"
				style="scrollbar-width: none;"
			>
				{#each $messages as each}
					{#if each.source === 'ai'}
						<div class="flex flex-row items-center">
							<div class="flex flex-row space-x-2 items-center justify-start">
								<div class=" bubble p-4 py-2 rounded-lg bg-black max-w-[70%]">
									{each.message}
								</div>
								<button
									class="opacity-50"
									on:click={() => copyMessage(each.message)}
								>
									<ChatMessageCopy />
								</button>
							</div>
						</div>
					{:else}
						<div class="flex flex-row items-center justify-end">
							<div
								class="bubble p-4 py-2 rounded-lg bg-zinc-800 text-zinc-300 max-w-[70%]"
							>
								{each.message}
							</div>
						</div>
					{/if}
				{/each}
			</div>
		</div>
		{#if prompt.startsWith('/')}
			<div class="flex flex-col justify-center items-start">
				{#if filteredCommands.length}
					<div class="flex flex-row space-x-2 items-center overflow-hidden">
						<div class="opacity-20 text-sm whitespace-nowrap">Available Commands:</div>
						<div
							style="scrollbar-width: none;"
							class="max-w-[500px] overflow-x-auto whitespace-nowrap space-x-2"
						>
							<div class="flex flex-row space-x-2">
								{#each filteredCommands as each}
									<div
										class="bg-zinc-900 text-white opacity-50 px-3 py-1 rounded-md text-sm"
									>
										{`/${each.label}`}
									</div>
								{/each}
							</div>
						</div>
					</div>
				{:else}
					<div class="text-red-500 text-xs self-center">Command not found!</div>
				{/if}
			</div>
		{/if}
		<div>
			<input
				type="text"
				id="prompt"
				on:keypress={handleKeyPress}
				bind:this={promptEl}
				bind:value={prompt}
				disabled={isLoading}
				class:opacity-25={isLoading}
				class="border-[0.1em] border-zinc-800 text-white text-md rounded-md block w-full p-2.5 outline-none focus:outline-none focus:border-zinc-600 placeholder:text-zinc-500"
				placeholder="Message Arthur"
				required
			/>
		</div>
	</div>
</div>

<style>
	#overlay {
		@apply bg-black;
		background: var(--background) !important;
	}
	input {
		background: var(--background) !important;
	}
	input::selection {
		background: white !important;
		color: black !important;
	}
	.bubble::selection {
		background: white !important;
		color: black !important;
	}
	#chat-context {
		@apply outline-none;
		color: var(--f_high) !important;
		font-family: var(--font-family);
		font-size: var(--font-size);
		line-height: var(--line-height);
		resize: none;
		background: transparent;
		transition: left 200ms;
		z-index: 0;
		white-space: pre-wrap;
	}
</style>
