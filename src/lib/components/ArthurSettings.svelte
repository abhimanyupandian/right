<script lang="ts">
    import Check from "$lib/icons/Check.svelte";
    import Download from "$lib/icons/Download.svelte";
    import {
        Arthur,
        AVAILABLE_MODELS,
        currentModel,
        modelDownloadProgress,
    } from "$lib/utils/arthur";
    import { onMount } from "svelte";

    export var show: boolean = false;

    let showLoading: boolean = false;
    let overlayEl: HTMLElement;
    let modelNameEl: HTMLElement;
    let modelName: string;

    function onSelectModel(modelName: string) {
        if ($modelDownloadProgress[modelName]) return;
        $currentModel = modelName;
        showLoading = true;
        Arthur.init({
            model: modelName,
            callback: (e) => {
                const percent = Math.round(e.progress * 100);
                if (percent > 0) showLoading = false;
                $modelDownloadProgress[modelName] = percent;
            },
        });
    }

    function handleKeydown(event: any) {
        if (show) {
            if (event.key == "Escape") show = false;
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
</script>

{#if show}
    <div
        bind:this={overlayEl}
        class="fixed z-10 opacity-50 bg-black inset-0 justify-center items-center hidden md:flex"
    ></div>
    {#if showLoading}
        <div
            class="z-20 w-full h-full bg-black opacity-50 fixed flex flex-col items-center justify-center"
        >
            <div>Fetching Model Data...</div>
        </div>
    {/if}
    <div
        class="fixed z-10 top-10 left-[calc(50vw-250px)] justify-center items-center hidden md:flex"
    >
        <div
            class="bg-black p-2 rounded shadow-lg w-[500px] border-[0.1em] border-zinc-800 flex flex-col overflow-hidden"
        >
            <div class="flex flex-row items-center space-x-2">
                <input
                    type="text"
                    bind:this={modelNameEl}
                    bind:value={modelName}
                    class="w-full p-2 rounded-sm outline-none text-black border-zinc-800"
                    placeholder="Search for models"
                />
            </div>
            <div>
                {#await Arthur.getCachedModels() then cachedModels}
                    <ul
                        class="select-none overflow-scroll max-h-[80vh] space-y-2"
                        class:pt-2={AVAILABLE_MODELS.length}
                    >
                        {#each AVAILABLE_MODELS as each, i}
                            <button
                                class:cursor-not-allowed={!!$modelDownloadProgress[
                                    modelName
                                ]}
                                on:click={() => onSelectModel(each)}
                                id={`model#${each}`}
                                class=" hover:bg-white w-full outline-none hover:text-black rounded p-3 flex flex-row justify-between items-center"
                            >
                                <span>{each}</span>
                                <div class="text-sm">
                                    {#if $modelDownloadProgress[each] === undefined}
                                        <div class="stroke-green-500">
                                            <Download></Download>
                                        </div>
                                    {:else if $modelDownloadProgress[each] < 0.1}
                                        <span>Loading...</span>
                                    {:else if $modelDownloadProgress[each] !== 100}
                                        <span
                                            >{`${$modelDownloadProgress[each] ?? 0}%`}
                                        </span>
                                    {:else}
                                        <Check></Check>
                                    {/if}
                                </div>
                            </button>
                        {/each}
                    </ul>
                {/await}
            </div>
        </div>
    </div>
{/if}
