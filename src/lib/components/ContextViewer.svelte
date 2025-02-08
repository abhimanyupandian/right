<script lang="ts">
    import { selection } from "$lib/utils/stores";

    var contextHtml = "";
    let contentEl: HTMLElement;

    export let isChatting: boolean;

    $: if ($selection.content.length > 1) {
        contextHtml =
            '<div id="context-parent" class="overflow-scroll">' +
            `<span class="opacity-25">${$selection.before}</span>` +
            '<span id="context-selected" contenteditable class="focus:outline-none bg-[yellow] text-[black]">' +
            `${$selection.content}</span>` +
            `<span class="opacity-25">${$selection.after}</span>` +
            "</div>";
    }

    $: if (contentEl) {
        contentEl.scrollTo({ top: $selection.scrollTop });
        contentEl.onscroll = (e: any) => {
            // Remove this to disable scrolling context into view
            // $selectionTracker.scrollTop = e.target.scrollTop;
        };
        // document.getElementById("context-selected")!.scrollIntoView({
        //     behavior: "smooth",
        //     block: "center",
        //     inline: "center",
        // });
    }
</script>

{#if isChatting}
    <div on:selectstart|preventDefault class="flex min-w-[640px] max-w-[640px]">
        <div bind:this={contentEl} id="chat-context" class="overflow-hidden">
            {@html contextHtml}
        </div>
    </div>
{/if}

<style>
    #chat-context {
        @apply outline-none pb-32;
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
        white-space: pre-wrap;
    }
</style>
