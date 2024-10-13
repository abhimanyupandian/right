<script lang="ts">
    import { db, type Notepad } from "$lib/utils/db";
    import { showFileHunter } from "$lib/utils/stores";
    import { onMount } from "svelte";

    var commandEl: HTMLElement;
    var overlayEl: HTMLElement;

    var query: string = "";
    let filtered: Notepad[] = [];
    var selectedNotepadIndex: number = -1;

    var doneSearching: boolean = true;

    $: if (commandEl) {
        query = "";
        filtered = [];
        selectedNotepadIndex = -1;
        commandEl.focus();
    }

    $: if (selectedNotepadIndex < 0 && commandEl) {
        commandEl.focus();
    }

    function handleKeydown(event: any) {
        if (event.key === "o" && (event.ctrlKey || event.metaKey)) {
            event.preventDefault();
            $showFileHunter = !$showFileHunter;
        }

        if ($showFileHunter) {
            if (event.key == "Escape") $showFileHunter = false;
            else if (event.key === "ArrowDown") {
                event.preventDefault();
                if (selectedNotepadIndex < filtered.length - 1) {
                    selectedNotepadIndex++;
                }
            } else if (event.key === "ArrowUp") {
                event.preventDefault();
                if (selectedNotepadIndex > 0) {
                    selectedNotepadIndex--;
                } else commandEl.focus();
            } else if (event.key === "Enter") {
                event.preventDefault();
                if (
                    selectedNotepadIndex >= 0 &&
                    selectedNotepadIndex < filtered.length
                ) {
                    document
                        .getElementById(`notepad#${selectedNotepadIndex}`)
                        ?.click();
                }
            }
        }
    }

    function handleQuery(_: any) {
        if (!query) filtered = [];
        else {
            doneSearching = false;
            db.notepad
                .toArray()
                .then((notepads) => {
                    filtered = notepads.filter(
                        (c) =>
                            c.name
                                .toLowerCase()
                                .includes(query.toLowerCase()) ||
                            new Date(c.modifiedOn)
                                .toLocaleString()
                                .includes(query) ||
                            new Date(c.createdOn)
                                .toLocaleString()
                                .includes(query),
                    );
                    doneSearching = true;
                    commandEl.focus();
                })
                .catch((_) => (doneSearching = true));
        }
    }

    onMount(() => {
        window.addEventListener("keydown", handleKeydown);
        window.addEventListener("click", function (e) {
            if ($showFileHunter && overlayEl == e.target) {
                $showFileHunter = false;
            }
        });
    });

    function disableQueryHandlingIfRequired(e: any) {
        if (!doneSearching) e.preventDefault();
    }

    $: if ($showFileHunter) {
        doneSearching = false;
        db.notepad
            .toArray()
            .then((notepads) => {
                filtered = notepads;
                doneSearching = true;
                commandEl.focus();
            })
            .catch((_) => (doneSearching = true));
    }
</script>

{#if $showFileHunter}
    <div
        bind:this={overlayEl}
        class="fixed z-10 opacity-50 bg-black inset-0 justify-center items-center hidden md:flex"
    ></div>
    <div
        class="fixed z-10 top-10 left-[calc(50vw-200px)] justify-center items-center hidden md:flex"
    >
        <div
            class="bg-black p-2 rounded shadow-lg w-[400px] border-[0.1em] border-zinc-800 flex flex-col overflow-hidden"
        >
            <input
                type="text"
                bind:this={commandEl}
                bind:value={query}
                on:input={handleQuery}
                on:keydown={disableQueryHandlingIfRequired}
                class="w-full p-2 rounded outline-none text-black border-zinc-800"
                placeholder="Search for notepads..."
            />
            {#if filtered.length}
                <ul
                    class="select-none overflow-scroll max-h-[80vh] space-y-2"
                    class:pt-2={filtered.length}
                >
                    {#each filtered as notepad, i}
                        <a
                            id={`notepad#${i}`}
                            href={`/notepad/${notepad.id}`}
                            target="_blank"
                            class:text-black={i == selectedNotepadIndex}
                            class:bg-white={i == selectedNotepadIndex}
                            class=" hover:bg-white outline-none hover:text-black rounded cursor-pointer p-2 flex flex-col items-start"
                        >
                            <span>{notepad.name}</span>
                            <div class="flex flex-col opacity-50 text-xs">
                                <span
                                    >Last Modified: {new Date(
                                        notepad.modifiedOn,
                                    ).toLocaleString()}
                                </span>
                                <span
                                    >Created: {new Date(
                                        notepad.createdOn,
                                    ).toLocaleString()}
                                </span>
                            </div>
                        </a>
                    {/each}
                </ul>
            {/if}
        </div>
    </div>
{/if}
