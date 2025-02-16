<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import FullscreenExit from "$lib/icons/FullscreenExit.svelte";
    import Fullscreen from "$lib/icons/Fullscreen.svelte";

    export let pageEl: HTMLElement;

    let isFullscreen = false;

    function toggleFullscreen() {
        if (!isFullscreen) {
            pageEl?.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }

    function updateFullscreenState() {
        isFullscreen = !!document.fullscreenElement;
    }

    onMount(() => {
        document.addEventListener("fullscreenchange", updateFullscreenState);
        updateFullscreenState();
    });

    onDestroy(() => {
        document.removeEventListener("fullscreenchange", updateFullscreenState);
    });
</script>

<span
    class="fill-zinc-500 opacity-30 hover:opacity-100 flex flex-col items-center"
>
    <button on:click={toggleFullscreen}>
        {#if isFullscreen}
            <FullscreenExit />
        {:else}
            <Fullscreen />
        {/if}
    </button>
</span>
