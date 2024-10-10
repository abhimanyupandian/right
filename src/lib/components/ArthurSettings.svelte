<script lang="ts">
    import ModelDelete from "$lib/icons/ModelDelete.svelte";
    import SelectedModelIndicator from "$lib/icons/SelectedModelIndicator.svelte";
    import { Arthur } from "$lib/utils/arthur";
    import { currentModel } from "$lib/utils/stores";
    import { onMount } from "svelte";

    export let showArthurSettings: boolean = false;

    var pullModelEl: HTMLElement;
    var overlayEl: HTMLElement;

    $: if (overlayEl) {
        pullModelEl.focus();
        overlayEl.addEventListener("click", (e) => {
            if (e.target === overlayEl) showArthurSettings = false;
        });
    }
    onMount(() => {});
</script>

{#if showArthurSettings}
    <div
        bind:this={overlayEl}
        class="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center"
    >
        <div
            class="bg-black p-6 rounded-md shadow-lg max-w-md w-full border-[0.1em] border-zinc-800 flex flex-col space-y-4"
        >
            <h2 class="text-xl font-semibold select-none">
                Arthur AI - Settings
            </h2>
            <div class="h-[1px] bg-zinc-800 w-full"></div>
            <div class="flex flex-col space-y-2">
                <h2 class="text-md font-semibold select-none">
                    Available Models
                </h2>
                <div class="h-[1px] bg-zinc-900 w-full"></div>
                {#await Arthur.list() then models}
                    {#if models.length}
                        {#each models as model}
                            <button
                                on:click={() => Arthur.set(model.model)}
                                class="py-1 rounded-sm hover:opacity-70 flex flex-row justify-between items-center"
                            >
                                <div class="flex flex-col items-start">
                                    <span class="text-sm font-bold"
                                        >{model.model}</span
                                    >
                                    <span class="text-sm opacity-75"
                                        >{model.name}
                                    </span>
                                </div>
                                <div
                                    class="flex flex-row space-x-2 items-center"
                                >
                                    {#if $currentModel == model.model}
                                        <!-- svelte-ignore node_invalid_placement_ssr -->
                                        <button
                                            on:click|stopPropagation={() =>
                                                Arthur.remove(model.name)}
                                            ><ModelDelete></ModelDelete>
                                        </button>
                                        <SelectedModelIndicator
                                        ></SelectedModelIndicator>
                                    {/if}
                                </div>
                            </button>
                        {/each}
                    {:else}
                        <div
                            class="flex flex-col items-center justify-center opacity-50 select-none text-sm p-4"
                        >
                            No Models Available
                        </div>
                    {/if}
                {/await}
            </div>
            <div class="flex flex-col space-y-2">
                <h2 class="text-md font-semibold select-none">Pull Model</h2>
                <div class="h-[1px] bg-zinc-900 w-full"></div>
                <input
                    bind:this={pullModelEl}
                    class="rounded-sm text-black p-2 outline-none"
                />
            </div>
            <button
                on:click={() => (showArthurSettings = false)}
                class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >Close
            </button>
        </div>
    </div>
{/if}
