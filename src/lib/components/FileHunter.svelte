<script lang="ts">
    import { goto } from "$app/navigation";
    import { page } from "$app/stores";
    import { db, type Notepad } from "$lib/utils/db";
    import { recentsRefresher } from "$lib/utils/stores";
    import { onMount } from "svelte";

    var commandEl: HTMLElement;
    var overlayEl: HTMLElement;

    var query: string = "";
    let filtered: Notepad[] = [];
    var selectedNotepadIndex: number = -1;

    var doneSearching: boolean = true;

    export var show: boolean = false;

    $: if (commandEl) {
        query = "";
        filtered = [];
        selectedNotepadIndex = -1;
        commandEl.focus();
        refreshList();
    }

    function handleKeydown(event: any) {
        if (event.key === "o" && (event.ctrlKey || event.metaKey)) {
            event.preventDefault();
            show = !show;
        }

        if (show) {
            if (event.key == "Escape") show = false;
            else if (event.key === "ArrowDown") {
                event.preventDefault();
                if (selectedNotepadIndex < filtered.length - 1) {
                    selectedNotepadIndex++;
                }
            } else if (event.key === "ArrowUp") {
                event.preventDefault();
                if (selectedNotepadIndex > 0) {
                    selectedNotepadIndex--;
                } else {
                    if (commandEl) commandEl.focus();
                    selectedNotepadIndex = -1;
                }
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

    onMount(() => {
        window.addEventListener("keydown", handleKeydown);
        window.addEventListener("click", function (e) {
            if (show && overlayEl == e.target) {
                show = false;
            }
        });
    });

    function disableQueryHandlingIfRequired(e: any) {
        if (!doneSearching) e.preventDefault();
    }

    function refreshList(query?: string) {
        doneSearching = false;
        db.notepad
            .toArray()
            .then((notepads) => {
                var filtered_ = [];
                if (query) {
                    filtered_ = notepads.filter(
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
                } else filtered_ = notepads.slice(0, 5);
                filtered = filtered_.sort((a, b) => b.modifiedOn - a.modifiedOn);
                doneSearching = true;
                if (commandEl) commandEl.focus();
            })
            .catch((_) => (doneSearching = true));
    }

    let isConfirming: Record<string, any> = {};
    const handleDelete = (e: any, id: string) => {
        e.preventDefault();
        if (!isConfirming[id]) {
            isConfirming[id] = true;
            setTimeout(() => {
                delete isConfirming[id];
                isConfirming = isConfirming;
            }, 2000);
        } else {
            db.notepad.delete(id);
            recentsRefresher.broadcast.postMessage(true);
            recentsRefresher.set(id);
            refreshList();
            if ($page.params.id == id) goto("/"); // If its the current notepad, close it.
        }
    };
</script>

{#if show}
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
                on:input={() => refreshList(query)}
                on:keydown={disableQueryHandlingIfRequired}
                class="w-full p-2 rounded outline-none text-black border-zinc-800"
                placeholder="Search for notepads..."
            />
            {#if filtered.length}
                <ul
                    class="select-none overflow-scroll max-h-[80vh] space-y-2"
                    class:pt-2={filtered.length}
                >
                    {#each filtered as each, i}
                        <a
                            id={`notepad#${i}`}
                            href={`/notepad/${each.id}`}
                            target="_blank"
                            class:text-black={i == selectedNotepadIndex}
                            class:bg-white={i == selectedNotepadIndex}
                            class=" hover:bg-white outline-none hover:text-black rounded cursor-pointer p-2 flex flex-col items-start"
                        >
                            <span>{each.name}</span>
                            <div class="flex flex-col opacity-50 text-xs">
                                <span
                                    >Last Modified: {new Date(
                                        each.modifiedOn,
                                    ).toLocaleString()}
                                </span>
                                <span
                                    >Created: {new Date(
                                        each.createdOn,
                                    ).toLocaleString()}
                                </span>
                            </div>
                            <div class="flex flex-row space-x-2 pt-2">
                                <button
                                    on:click|stopPropagation={(e: any) =>
                                        handleDelete(e, each.id)}
                                    class="text-xs text-red-500"
                                >
                                    {#if isConfirming[each.id]}
                                        Tap to confirm deletion
                                    {:else}
                                        <div class="">Delete</div>
                                    {/if}
                                </button>
                            </div>
                        </a>
                    {/each}
                </ul>
            {/if}
        </div>
    </div>
{/if}
