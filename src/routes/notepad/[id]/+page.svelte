<script lang="ts">
    import { onMount } from "svelte";
    import { getCaretCoordinates } from "$lib/utils/ui";
    import { Symbols } from "$lib/utils/constants";
    import { Progress } from "$lib/utils/progress";
    import { currentNotepad, index, selection, stats } from "$lib/utils/stores";
    import Stats from "$lib/components/Stats.svelte";
    import Nav from "$lib/components/Nav.svelte";
    import Editor from "$lib/components/Editor.svelte";
    import { db } from "$lib/utils/db";
    import { page } from "$app/stores";

    const IS_DESKTOP = !!(globalThis as any).IS_DESKTOP;

    const pos: { x: number; y: number } = { x: 0, y: 0 };
    var cursorPosition: number = -1;

    var editorEl: any;
    var progressEl: any;

    var setupDone: boolean = false;

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

    onMount(() => {
        onOpenNotepad();
    });

    $: if (editorEl && !setupDone) {
        Progress.init(progressEl);
        initListeners(editorEl);
        setupDone = true;
    }

    function onOpenNotepad() {
        db.notepad.get($page.params.id).then((notepad) => {
            if (notepad) $currentNotepad = notepad;
        });
    }
</script>

{#if !$currentNotepad}
    <div
        class="font flex flex-row min-h-screen justify-center items-center select-none"
    >
        <div class="flex flex-row space-x-4 text-3xl opacity-20 items-center">
            <div class="flex flex-col items-end">
                <div>Not</div>
                <div>Found</div>
            </div>
            <div class="h-20 w-[0.05em] bg-white"></div>
            <div class="">404</div>
        </div>
    </div>
{:else}
    <div class:pt-8={IS_DESKTOP} class="flex flex-col h-[100vh] relative">
        <status
            class="h-[40px] flex-row w-full min-w-full justify-between items-center flex px-4"
        >
            <div class="max-w-[320px] min-w-[320px]"></div>
            <div
                class="max-w-[320px] min-w-[320px] flex flex-row justify-between items-center px-4"
            >
                <span> </span>
            </div>
        </status>
        <div
            class="flex max-h-[calc(100vh-64px)] min-h-[calc(100vh-64px)] min-w-screen max-w-screen w-screen space-x-2"
        >
            <Nav bind:cursorPosition />
            <Editor bind:editorEl />
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
