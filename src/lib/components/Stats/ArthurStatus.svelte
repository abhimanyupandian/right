<script lang="ts">
    import { arthur } from "$lib/utils/arthur";
    import ArthurSettings from "../ArthurSettings.svelte";

    let showArthurStatus: boolean = false;
    let showArthurSettings: boolean = false;
</script>

<ArthurSettings bind:show={showArthurSettings}></ArthurSettings>

{#if showArthurStatus}
    <tooltip
        class="fixed text-xs right-1 bottom-[32px] bg-black text-white h-4 text-md p-1 flex flex-col items-center justify-center"
    >
        <div>
            Arthur AI {$arthur.state === "loading"
                ? "Loading..."
                : $arthur.state == true
                  ? "Ready!"
                  : "Unavailable"}
        </div>
    </tooltip>
{/if}
<button
    on:mouseenter={() => (showArthurStatus = true)}
    on:mouseleave={() => (showArthurStatus = false)}
    on:click={() => (showArthurSettings = true)}
    class="opacity-50 hover:opacity-100 outline-none"
>
    {#if $arthur.state === "loading"}
        <div class="w-3 h-3 rounded-full bg-[orange]"></div>
    {:else}
        <div
            class:bg-green-500={$arthur.state == true}
            class:bg-yellow-500={$arthur.state == "unsupported"}
            class:bg-red-500={!$arthur.state}
            class="w-3 h-3 rounded-full"
        ></div>
    {/if}
</button>
