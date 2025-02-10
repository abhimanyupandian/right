<script lang="ts">
    import { onMount } from "svelte";
    import { getCaretCoordinates } from "$lib/utils/ui";
    import { Symbols } from "$lib/utils/constants";
    import { Progress } from "$lib/utils/progress";
    import {
        currentDocument,
        index,
        selection,
        stats,
    } from "$lib/utils/stores";
    import Stats from "$lib/components/Stats/PageStats.svelte";
    import Nav from "$lib/components/Nav.svelte";
    import Editor from "$lib/components/Editor.svelte";
    import { db } from "$lib/utils/db";
    import { page } from "$app/stores";
    import FileHunter from "$lib/components/FileHunter.svelte";
    import { get } from "svelte/store";
    import ContextViewer from "$lib/components/ContextViewer.svelte";
    import { arthur } from "$lib/utils/arthur";
    import Arthur from "$lib/components/Arthur.svelte";
    import NotFound from "./NotFound.svelte";
    import Fullscreen from "./Fullscreen.svelte";

    export let notepadId: string | undefined = undefined;

    const pos: { x: number; y: number } = { x: 0, y: 0 };
    var cursorPosition: number = -1;

    var editorEl: any;
    var progressEl: any;

    var isChatting = false;
    var setupDone: boolean = false;

    function openChat() {
        if ($selection.content.trim().length <= 1) return;
        isChatting = true;
        saveSelection(editorEl);
    }

    function restoreSelection(target: any) {
        if (!target) return;
        target.setSelectionRange($selection.range.start, $selection.range.end);
        target.scrollTo({
            top: $selection.scrollTop,
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
        $selection = {
            before: "",
            after: "",
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
                }
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
        db.document
            .get(notepadId ?? $page.url.searchParams.get("id") ?? "")
            .then((notepad) => {
                if (notepad) $currentDocument = notepad;
                loadingDone = true;
            });
    }
    
    let pageEl: HTMLElement;
</script>

{#if !$currentDocument}
    {#if loadingDone}
        <NotFound></NotFound>
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
                    <Fullscreen {pageEl}></Fullscreen>
                </div>
            </div>
        </status>
        <div
            class="pt-[42px] flex max-h-[calc(100vh-64px)] min-h-[calc(100vh-32px)] min-w-screen max-w-screen w-screen space-x-2"
        >
            <Nav bind:cursorPosition />
            <ContextViewer bind:isChatting></ContextViewer>
            <Editor bind:editorEl bind:isChatting />
            <Arthur bind:isChatting />
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
