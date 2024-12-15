<script lang="ts">
    import { onMount } from "svelte";
    import { getCaretCoordinates } from "$lib/utils/ui";
    import { ARTHUR_ENABLED, Symbols } from "$lib/utils/constants";
    import { Progress } from "$lib/utils/progress";
    import {
        currentNotepad,
        index,
        selection,
        selectionTracker,
        stats,
    } from "$lib/utils/stores";
    import Stats from "$lib/components/Stats.svelte";
    import Nav from "$lib/components/Nav.svelte";
    import Editor from "$lib/components/Editor.svelte";
    import { db } from "$lib/utils/db";
    import { page } from "$app/stores";
    import Fullscreen from "$lib/icons/Fullscreen.svelte";
    import FullscreenExit from "$lib/icons/FullscreenExit.svelte";
    import FileHunter from "$lib/components/FileHunter.svelte";
    import { get } from "svelte/store";
    import ContextViewer from "$lib/components/ContextViewer.svelte";
    import { arthur } from "$lib/utils/arthur";
    import Arthur from "$lib/components/Arthur.svelte";

    export let notepadId: string | undefined = undefined;

    const pos: { x: number; y: number } = { x: 0, y: 0 };
    var cursorPosition: number = -1;

    var editorEl: any;
    var progressEl: any;

    var isChatting = false;
    var setupDone: boolean = false;

    function openChat() {
        if (!ARTHUR_ENABLED) return;
        if ($selection.content.trim().length <= 1) return;
        isChatting = true;
        saveSelection(editorEl);
    }

    function restoreSelection(target: any) {
        if (!target) return;
        target.setSelectionRange(
            $selectionTracker.range.start,
            $selectionTracker.range.end,
        );
        target.scrollTo({
            top: $selectionTracker.scrollTop,
            behavior: "instant",
        });
        target.focus();
    }

    function closeChat() {
        if (!isChatting) return;
        isChatting = false;
    }

    function saveSelection(target: any) {
        if (!target) return;
        $selectionTracker = {
            range: {
                start: target.selectionStart,
                end: target.selectionEnd,
            },
            content: get(selection).content,
            scrollTop: target.scrollTop,
            clientHeight: target.clientHeight,
        };
    }

    function syncIndexWithCursor(target: any) {
        var textUntilCursor = target.value.substring(
            0,
            target.selectionDirection == "forward"
                ? target.selectionEnd
                : target.selectionStart,
        );
        var lineNumber = textUntilCursor.split(Symbols.EOL).length;
        cursorPosition = $index[lineNumber - 1].index ?? -1;
    }

    function updateProgress(target: any) {
        if (!target) return;
        var details = Progress.get(target);
        $stats.percent = details.percent;
        progressEl.innerHTML = details.html;
    }

    function initListeners(target: HTMLElement) {
        if (!target) return;
        target.addEventListener("scroll", () => {
            updateProgress(target);
        });

        editorEl.addEventListener("keydown", function (event: any) {
            if ($arthur.state == true) {
                if (event.metaKey && event.key === "/") {
                    event.preventDefault();
                    openChat();
                } else if (event.key === "Escape") closeChat();
            }
        });

        target.addEventListener("contextmenu", (event: any) => {
            event.preventDefault();
        });

        target.addEventListener("selectionchange", (event: any) => {
            var target = event.target as any;
            syncIndexWithCursor(target);
            var value = target.value;
            $selection.content = value.substring(
                target.selectionStart,
                target.selectionEnd,
            );
            $selection.before = value.substring(0, target.selectionStart);
            $selection.after = value.substring(
                target.selectionEnd,
                value.length,
            );
            $stats.selectedW = $selection.content
                .split(Symbols.SPACE)
                .filter((e) => e.trim().length).length;
            $stats.selectedC = $selection.content.length;

            var caret = getCaretCoordinates(target);
            pos.x = target.offsetLeft + target.offsetWidth;
            pos.y = caret.top;
        });
    }

    var loadingDone: boolean = false;
    onMount(() => {
        loadingDone = false;
        onOpenNotepad();
    });

    $: if (editorEl && !setupDone) {
        Progress.init(progressEl);
        initListeners(editorEl);
        setupDone = true;
    }

    // Whenever chat is closed
    $: if (!isChatting && editorEl) {
        restoreSelection(editorEl);
        initListeners(editorEl);
    }

    function onOpenNotepad() {
        db.notepad
            .get(notepadId ?? $page.url.searchParams.get("id") ?? "")
            .then((notepad) => {
                if (notepad) $currentNotepad = notepad;
                loadingDone = true;
            });
    }
    var pageEl: HTMLElement;
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

{#if !$currentNotepad}
    {#if loadingDone}
        <div
            class="font flex flex-row min-h-screen justify-center items-center select-none"
        >
            <div
                class="flex flex-row space-x-4 text-3xl opacity-20 items-center"
            >
                <div class="flex flex-col items-end">
                    <div>Not</div>
                    <div>Found</div>
                </div>
                <div class="h-20 w-[0.05em] bg-white"></div>
                <div class="">404</div>
            </div>
        </div>
    {:else}
        <div id="screen"></div>
    {/if}
{:else}
    <div id="page" bind:this={pageEl} class="flex flex-col h-[100vh] relative">
        <FileHunter></FileHunter>
        <status
            class="h-[40px] fixed flex-row w-full min-w-full justify-between items-center flex px-2"
        >
            <div class="max-w-[320px] min-w-[320px]"></div>
            <div
                class="max-w-[320px] min-w-[320px] flex flex-row justify-between items-center"
            >
                <div></div>
                <div
                    class="flex flex-row space-x-2 items-center justify-center"
                >
                    <span class="fill-zinc-500 opacity-30 hover:opacity-100">
                        <button on:click={toggleFullscreen}>
                            {#if isFullscreen}
                                <FullscreenExit></FullscreenExit>
                            {:else}
                                <Fullscreen></Fullscreen>
                            {/if}
                        </button>
                    </span>
                </div>
            </div>
        </status>
        <div
            class="pt-[42px] flex max-h-[calc(100vh-64px)] min-h-[calc(100vh-32px)] min-w-screen max-w-screen w-screen space-x-2"
        >
            <Nav bind:cursorPosition />
            <ContextViewer bind:isChatting></ContextViewer>
            <Editor bind:editorEl bind:isChatting />
            {#if ARTHUR_ENABLED}
                <Arthur bind:isChatting />
            {/if}
        </div>

        <Stats bind:progressEl />
    </div>
{/if}

<style>
    .font {
        color: var(--f_high) !important;
        font-family: var(--font-family);
        font-size: var(--font-size);
    }
</style>
