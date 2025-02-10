<script lang="ts">
    import FullscreenExit from "$lib/icons/FullscreenExit.svelte";
    import Fullscreen from "$lib/icons/Fullscreen.svelte";

    export let pageEl: HTMLElement;
    var isFullscreen: boolean = false;

    function fullscreenchanged(_: any) {
        isFullscreen = !!document.fullscreenElement;
    }

    document.addEventListener("fullscreenchange", fullscreenchanged);
    function toggleFullscreen() {
        if (pageEl.requestFullscreen && !isFullscreen) {
            pageEl.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }
</script>

<span class="fill-zinc-500 opacity-30 hover:opacity-100 flex flex-col items-center">
    <button on:click={toggleFullscreen}>
        {#if isFullscreen}
            <FullscreenExit></FullscreenExit>
        {:else}
            <Fullscreen></Fullscreen>
        {/if}
    </button>
</span>
