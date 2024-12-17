<script lang="ts">
    import { arthur, Arthur } from "$lib/utils/arthur";
    import { ARTHUR_ENABLED, Symbols } from "$lib/utils/constants";
    import { selectionTracker } from "$lib/utils/stores";
    import { clickOutside } from "$lib/utils/ui";
    import { writable } from "svelte/store";

    const IS_DESKTOP = !!(globalThis as any).IS_DESKTOP;

    var isLoading: boolean = false;
    var isStreaming: boolean = false;
    var promptEl: HTMLElement;
    var messagesEl: HTMLElement;
    export let prompt: string = "";

    let enabled: boolean = $arthur.state === true && ARTHUR_ENABLED;
    export let isChatting: boolean;

    const messages = writable<
        { source: "user" | "ai"; message: string; timestamp: string }[]
    >([]);

    type Response = { status: boolean; content?: string; id?: string };

    async function handleFreeText() {
        startLoading();
        startStreaming();
        const messageId = new Date().getMilliseconds().toString();
        try {
            Arthur.chat($selectionTracker.content, prompt).then((chunks) => {
                if (chunks) {
                    const messageDiv = document.getElementById(
                        `AI:${messageId}`,
                    )!;
                    setTimeout(async () => {
                        messageDiv.textContent = "";
                        for await (const chunk of chunks) {
                            messageDiv.textContent +=
                                chunk.choices[0]?.delta.content || "";
                            if (messagesEl) {
                                messagesEl.scrollTop = messagesEl.scrollHeight;
                            }
                            if (chunk.usage) {
                                reset();
                            }
                        }
                    }, 100); // Message DOM must be rendered.
                }
            });
            return {
                status: true,
                id: messageId,
            };
        } catch (e) {
            return {
                status: false,
            };
        }
    }

    function reset() {
        prompt = "";
        if (enabled) setTimeout(() => promptEl.focus(), 1);
        finishLoading();
        finishStreaming();
    }

    function startLoading() {
        isLoading = true;
    }

    function finishLoading() {
        isLoading = false;
    }

    function startStreaming() {
        isStreaming = true;
    }

    function finishStreaming() {
        isStreaming = false;
    }

    async function handleKeyPress(e: any) {
        if (!prompt.startsWith("/")) return;
        var keyCode = e.code || e.key;
        var resp: Response = { status: false };
        if (keyCode == "Enter" && prompt) {
            if (prompt.startsWith("/")) {
                resp = await handleCommand();
            } else {
                resp = await handleFreeText();
            }
            if (resp.status) {
                $messages.push({
                    source: "user",
                    message: prompt,
                    timestamp: resp.id!,
                });
                $messages.push({
                    // for streaming later
                    source: "ai",
                    message: "",
                    timestamp: resp.id!,
                });
                $messages = $messages;
            }
        }
    }

    var chatFocused = true;

    function isValidCommand() {
        var args = prompt.split(Symbols.SPACE);
        var words: number = -1;
        var sentences: number = -1;
        for (var each of args.slice(1)) {
            if (each.endsWith("w")) {
                words = parseInt(each.match(/\d/g)?.join("") ?? "-1");
            } else if (each.endsWith("s")) {
                sentences = parseInt(each.match(/\d/g)?.join("") ?? "-1");
            }
        }
        var commandDef = $commands.filter((e) => `/${e.label}` === args[0])[0];
        return { args, commandDef, words, sentences };
    }

    async function handleCommand() {
        var { args, commandDef, words, sentences } = isValidCommand();
        if (commandDef) {
            const { prompt } = await commandDef.handler(args);

            startLoading();
            startStreaming();

            const messageId = new Date().getMilliseconds().toString();
            try {
                Arthur.chat($selectionTracker.content, prompt, {
                    words: words > 0 ? words : undefined,
                    sentences: sentences > 0 ? sentences : undefined,
                }).then((chunks) => {
                    if (chunks) {
                        const messageDiv = document.getElementById(
                            `AI:${messageId}`,
                        )!;
                        setTimeout(async () => {
                            messageDiv.textContent = "";
                            for await (const chunk of chunks) {
                                messageDiv.textContent +=
                                    chunk.choices[0]?.delta.content || "";
                                if (messagesEl) {
                                    messagesEl.scrollTop =
                                        messagesEl.scrollHeight;
                                }
                                if (chunk.usage) {
                                    reset();
                                }
                            }
                        }, 100); // Message DOM must be rendered.
                    }
                });
                return {
                    status: true,
                    id: messageId,
                };
            } catch (e) {
                return {
                    status: false,
                };
            }
        }
        return { status: false };
    }

    $: if (isChatting) {
        enabled = true;
        chatFocused = true;
        document.addEventListener("keydown", function (event: any) {
            if (event.metaKey && event.key === "/") {
                event.preventDefault();
                chatFocused = true;
            } else if (event.key === "Escape") isChatting = false;
        });
    } else {
        enabled = false;
        chatFocused = false;
        $messages = [];
    }

    $: if (chatFocused && promptEl) {
        promptEl.focus();
    }

    $: if (enabled && promptEl) {
        promptEl.focus();
    }

    const commands = writable<Command[]>([
        {
            label: "rephrase",
            alias: ["reword"],
            handler: async (v) => {
                return {
                    prompt: "Rephrase the selected text.",
                };
            },
        },
        {
            label: "support",
            handler: async (v) => {
                return {
                    prompt: "Provide evidence or arguments that support the meaning of the selected text.",
                };
            },
        },
        {
            label: "argue",
            handler: async (v) => {
                return {
                    prompt: "Provide evidence or arguments that challenge or oppose the meaning of the selected text.",
                };
            },
        },
        {
            label: "conclude",
            handler: async (v) => {
                return {
                    prompt: "Give a meaningful conclusion for the selected text.",
                };
            },
        },
        {
            label: "intro",
            handler: async (v) => {
                return {
                    prompt: "Give some background to set the stage for the selected text.",
                };
            },
        },
    ]);
    type Command = {
        label: string;
        alias?: string[];
        handler: (command: string[]) => Promise<{ prompt: string }>;
    };
    var filteredCommands: Command[] = [];
    $: if (prompt) {
        filteredCommands = $commands.filter((e) =>
            `/${e.label}`.startsWith(prompt.split(Symbols.SPACE)[0] ?? ""),
        );
    }
</script>

{#if enabled}
    <div
        class:opacity-100={chatFocused}
        class:opacity-10={!chatFocused}
        class:pb-10={IS_DESKTOP}
        class="duration-100 flex-1 flex-col max-h-[calc(100vh)] max-w-[calc(100vw-976px)] min-w-[calc(100vw-976px)] justify-between px-4 lg:block md:hidden pb-2"
    >
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
            on:click={() => (chatFocused = true)}
            use:clickOutside={() => (chatFocused = false)}
            class="w-full h-full flex flex-col space-y-2"
        >
            <div
                class="w-full h-full rounded-md bg-[#212121] border-zinc-800 border-[0.1em] p-2 py-4 overflow-hidden"
            >
                <div
                    bind:this={messagesEl}
                    class="overflow-scroll max-h-full space-y-2"
                    style="scrollbar-width: none;"
                >
                    {#each $messages as each}
                        {#if each.source === "ai"}
                            <div class="flex flex-row items-center">
                                <div
                                    class="flex flex-row space-x-2 items-center justify-start"
                                >
                                    <div
                                        id={`AI:${each.timestamp}`}
                                        class="bubble p-4 py-2 rounded-lg bg-transparent max-w-[100%]"
                                    >
                                        {each.message}
                                    </div>
                                </div>
                            </div>
                        {:else}
                            <div
                                class="flex flex-row items-center justify-end w-full"
                            >
                                <div
                                    id={`USER:${each.timestamp}`}
                                    class="bubble p-4 py-2 rounded-lg bg-zinc-800 text-zinc-300 max-w-[70%]"
                                >
                                    {each.message}
                                </div>
                            </div>
                        {/if}
                    {/each}
                </div>
            </div>
            {#if prompt && !isLoading && !isStreaming}
                <div class="w-full">
                    <div class="flex flex-col justify-center items-start">
                        {#if filteredCommands.length}
                            <div
                                class="flex flex-row space-x-2 items-center overflow-hidden"
                            >
                                <div
                                    style="scrollbar-width: none;"
                                    class="max-w-[460px] overflow-x-auto whitespace-nowrap space-x-2"
                                >
                                    <div class="flex flex-row space-x-2">
                                        {#each filteredCommands as each}
                                            <div
                                                class="bg-zinc-900 text-white px-3 py-1 rounded-md text-sm"
                                            >
                                                {`/${each.label}`}
                                            </div>
                                        {/each}
                                    </div>
                                </div>
                            </div>
                        {:else}
                            <div class="text-red-500 text-xs self-center">
                                Invalid action. Please start your command with
                                '/' followed by a valid action.
                            </div>
                        {/if}
                    </div>
                </div>
            {/if}
            <input
                type="text"
                id="prompt"
                on:keypress={handleKeyPress}
                bind:this={promptEl}
                bind:value={prompt}
                disabled={isLoading || isStreaming || !enabled}
                class:opacity-25={isLoading || isStreaming}
                class="border-[0.1em] border-zinc-800 text-white text-md rounded-md block w-full p-2.5 outline-none focus:outline-none placeholder:text-zinc-500"
                placeholder={enabled
                    ? "Type / for commands"
                    : "Arthur AI not setup."}
                required
            />
        </div>
    </div>
{/if}

<style>
    input {
        background: var(--background) !important;
        font-size: 15px;
    }
    input::selection {
        background: white !important;
        color: black !important;
    }
    #prompt {
        background: var(--background) !important;
    }
    .bubble {
        /* font-family: var(--font-family); */
        font-size: 15px;
    }
    .bubble::selection {
        background: black !important;
        color: grey !important;
    }
</style>
