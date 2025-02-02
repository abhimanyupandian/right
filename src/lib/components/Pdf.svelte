<script lang="ts">
    import "pdfjs-viewer-element";
    import { onMount } from "svelte";
    import { page } from "$app/stores";
    import { db, Saver } from "$lib/utils/db";
    import { currentDocument, stats } from "$lib/utils/stores";
    import Stats from "./Stats/PdfStats.svelte";
    import { Progress, roundPercent } from "$lib/utils/progress";
    import { writable } from "svelte/store";
    import * as mupdfjs from "mupdf/mupdfjs";

    var viewerApp: any;
    var loadingDone: boolean = false;
    var progressEl: any;
    var hideNotes: boolean = false;

    export let pdfId: string | undefined = undefined;

    async function getDocument(file: Blob) {
        const data = await file.arrayBuffer();
        const document = mupdfjs.PDFDocument.openDocument(
            data,
            "application/pdf",
        ) as mupdfjs.PDFDocument;
        return document;
    }

    function getRectCenter(rect: number[]) {
        const [x, y, width, height] = rect;
        const centerX = x + width / 2;
        const centerY = y + height / 2;
        return [centerX, centerY];
    }

    function componentToHex(c: number) {
        var hex = c.toString(16);
        return hex.length == 1 ? "00" + hex : hex;
    }

    function rgbToClass(r: number, g: number, b: number) {
        const hex = (
            "#" +
            componentToHex(Math.trunc(r)) +
            componentToHex(Math.trunc(g)) +
            componentToHex(Math.trunc(b))
        ).toUpperCase();
        return hexToClass(hex);
    }

    function hexToClass(hex: string) {
        if (hex === "#FFFF98" || hex === "#FFFF99") return "yellow";
        if (hex === "#53FFBC" || hex === "#54FFBC") return "green";
        if (hex === "#80EBFF" || hex === "#7FEAFF") return "blue";
        if (hex === "#FFCBE6" || hex === "#FFCCE5") return "pink";
        if (hex === "#FF4F5F" || hex === "#FF4F5E") return "red";
        return "yellow";
    }

    async function getAndUpdateAnnotationsForPage(
        document: mupdfjs.PDFDocument,
        pageNumber: number,
    ) {
        const page = document.loadPage(pageNumber);
        const annots = page.getAnnotations();

        pageNumber += 1;

        const _annotsCollected = [];
        if (annots.length) {
            for (var each of annots) {
                const note = each.getContents().trim();
                if (!note) continue;
                var color: any | string = each.getColor();
                color = rgbToClass(
                    color[0] * 255,
                    color[1]! * 255,
                    color[2]! * 255,
                );
                _annotsCollected.push({
                    note,
                    pageNumber,
                    location: getRectCenter(each.getBounds()),
                    color,
                });
            }
        }

        $notes.set(pageNumber, _annotsCollected);
        $notes = $notes;
    }

    async function getAllAnnotations(file: Blob, pageNumber?: number) {
        const document = await getDocument(file);

        if (!pageNumber) pageNumber = -1;

        // Update only one page
        if (pageNumber >= 0) {
            getAndUpdateAnnotationsForPage(document, pageNumber);
            return;
        }

        // Update all pages
        var i = 0;
        while (i < document.countPages()) {
            getAndUpdateAnnotationsForPage(document, i);
            i++;
        }
    }

    async function loadPDF(file: Blob) {
        const fileReader = new FileReader();
        fileReader.onload = async (e: any) => {
            const pdfData = new Uint8Array(e.target.result);
            viewerApp.open({ data: pdfData });
            $currentDocument.totalPages = viewerApp.pagesCount;
        };
        fileReader.readAsArrayBuffer(file);
        await getAllAnnotations(file);
    }

    async function onSave() {
        if (!viewerApp) return;
        const data = await viewerApp.pdfDocument.saveDocument();
        const file = new Blob([data], {
            type: "application/pdf",
        });
        Saver.save({
            content: file,
        });
    }

    function updateProgress() {
        try {
            var details = Progress.get($stats.percent);
            $stats.percent = details.percent;
            progressEl.innerHTML = details.html;
        } catch (e) {}
    }

    $: if (progressEl) {
        updateProgress();
    }

    const notes = writable<
        Map<
            number,
            {
                note: string;
                pageNumber: number;
                location: number[];
                color: string;
            }[]
        >
    >(new Map());

    var shadowRoot: ShadowRoot;
    var iframe: any;
    const color = writable<string>("");

    onMount(async () => {
        Progress.init(progressEl);
        const viewer: any = document.querySelector("pdfjs-viewer-element")!;
        viewerApp = await viewer.initialize();
        viewerApp.save = onSave;
        viewerApp.download = onSave;
        viewerApp.downloadOrSave = onSave;

        var resetDone: boolean = false;

        shadowRoot = document.querySelector(
            "pdfjs-viewer-element",
        )?.shadowRoot!;
        iframe = shadowRoot.querySelector("iframe")!;

        /** LOADING DOCUMENT */
        db.document
            .get(pdfId ?? $page.url.searchParams.get("pdf") ?? "")
            .then((document) => {
                if (document) {
                    $currentDocument = document;
                    loadPDF(document.content as Blob);
                }
            });

        function resetScale() {
            viewerApp.pdfViewer.setScale($currentDocument.scaleFactor ?? 1, {
                noScroll: false,
            });
        }

        function resetScroll() {
            const pdfContainer =
                iframe.contentDocument.querySelector("#viewerContainer");
            pdfContainer.scrollTop = $currentDocument.scrollTop;
            resetDone = true;

            pdfContainer.addEventListener(
                "scroll",
                function () {
                    $currentDocument.scrollTop = pdfContainer.scrollTop;
                },
                false,
            );
            pdfContainer.addEventListener(
                "scrollend",
                function () {
                    Saver.saveScrollPosition($currentDocument.scrollTop);
                },
                false,
            );
            setTimeout(() => (loadingDone = true), 100); // so that there is no flash
        }

        function getHighlighterButton() {
            return iframe.contentDocument?.querySelector(
                "#editorHighlightButton",
            );
        }

        function toggleHighlighter() {
            return getHighlighterButton().click();
        }

        function shouldCloseHighlighter(e: any) {
            const isToggled =
                getHighlighterButton().classList.contains("toggled");
            if (e.key === "Escape" && isToggled) {
                toggleHighlighter();
            }
        }

        viewerApp.eventBus.on("ready", (e: any) => {
            if (!resetDone) {
                resetScale();
                resetScroll();
            }
        });

        viewerApp.eventBus.on("colorchange", (e: string) => {
            $color = e;
        });

        viewerApp.eventBus.on(
            "selectedtext",
            (details: { text: string; color: string }) => {
                if (!details.text) return;
                notes.update((e) => {
                    if (!e.get($currentDocument.currentPage)) {
                        e.set($currentDocument.currentPage, []);
                    }
                    e.set($currentDocument.currentPage, [
                        ...(e.get($currentDocument.currentPage) ?? []),
                        {
                            note: details.text.trim(),
                            pageNumber: $currentDocument.currentPage,
                            location: [],
                            color: hexToClass($color.toUpperCase()),
                        },
                    ]);
                    return e;
                });
            },
        );
        /** UPDATING SCROLL PROGRESS */
        viewerApp.eventBus.on("pagechanging", (e: { pageNumber: number }) => {
            $stats.percent = roundPercent(e.pageNumber / viewerApp.pagesCount);
            $currentDocument.currentPage = e.pageNumber;
            updateProgress();
        });

        /** UPDATING ZOOM SCALE FACTOR */
        viewerApp.eventBus.on("zoomchange", (e: { scale: number }) => {
            $currentDocument.scaleFactor = e.scale;
            Saver.saveScaleFactor($currentDocument.scaleFactor);
            const pdfContainer =
                iframe.contentDocument.querySelector("#viewerContainer");
            Saver.saveScrollPosition(pdfContainer.scrollTop);
        });

        viewerApp.eventBus.on(
            "updatepagehighlights",
            async (e: { pageNumber: number }) => {
                setTimeout(async () => {
                    const data = await viewerApp.pdfDocument.saveDocument();
                    const file = new Blob([data], {
                        type: "application/pdf",
                    });
                    getAllAnnotations(file, e.pageNumber ?? -1);
                }, 10);
            },
        );

        /** FOR HIGHLIGHT SHORTCUT */
        iframe.contentDocument.addEventListener("keydown", function (e: any) {
            if ((e.shiftKey && e.metaKey) || shouldCloseHighlighter(e)) {
                toggleHighlighter();
            }
        });

        /** FOR SAVING */
        iframe.contentDocument
            ?.querySelector("#downloadButton")
            .addEventListener("click", function () {
                viewerApp.downloadManager.download(
                    $currentDocument.content,
                    "",
                    $currentDocument.name,
                );
            });
    });

    function goToPage(pageNumber: number) {
        viewerApp.pdfLinkService.goToPage(pageNumber);
    }

    function goToHighlight(pageNumber: number, location: number[]) {
        viewerApp.pdfLinkService.goToPage(pageNumber);
        viewerApp.eventBus.dispatch("scrolltooffset", { details: location });
    }

    function toggleNotes() {
        hideNotes = !hideNotes;
    }
</script>

<div class="flex flex-row bg-[#222] relative overflow-hidden max-h-[100vh]">
    <pdfjs-viewer-element class="min-h-[100vh] z-[10]" viewer-path="pdfjs">
    </pdfjs-viewer-element>
    <div
        class:min-w-[25%]={!hideNotes}
        class:max-w-[25%]={!hideNotes}
        class:min-w-[10%]={hideNotes}
        class:w-[10%]={hideNotes}
        class="min-w-[25%] max-w-[25%] duration-100 font overflow-scroll items-start flex flex-col"
    >
        <button
            on:click={toggleNotes}
            class="px-4 py-1 sticky top-0 z-[100] bg-[#222] h-[33px] border-b-[1px] border-black flex flex-row items-start justify-center w-full"
        >
            <div class="flex-0">Notes</div>
        </button>
        <div
            class:min-w-[100%]={!hideNotes}
            class:w-[100%]={!hideNotes}
            class:opacity-[25%]={hideNotes}
            class="px-4 py-2 space-y-2 flex flex-col items-start"
        >
            {#if $notes.size}
                {#each [...$notes] as [pageNumber, page]}
                    {#if page?.length > 0}
                        <button
                            on:click={() => goToPage(pageNumber)}
                            class="opacity-25 text-xs"
                        >
                            Page {pageNumber}
                        </button>
                        {#each page as note}
                            {#if note.note}
                                <button
                                    class:min-w-[100%]={!hideNotes}
                                    class:w-[100%]={!hideNotes}
                                    on:click={() =>
                                        goToHighlight(
                                            pageNumber,
                                            note.location,
                                        )}
                                    class=" bg-black text-sm rounded-md border-none text-start flex flex-row items-start justify-center w-full"
                                >
                                    <div
                                        class="flex items-stretch p-2 bg-black rounded-sm max-w-md relative"
                                    >
                                        <div
                                            class={`${note.color} opacity-75 w-1 rounded-l-sm absolute left-0 top-0 flex-1 bottom-0`}
                                        ></div>
                                        <div class="ml-2 break-all">
                                            {!hideNotes
                                                ? note.note
                                                : `${note.note.slice(0, 10)}...`}
                                        </div>
                                    </div>
                                </button>
                            {/if}
                        {/each}
                    {/if}
                {/each}
            {:else}{/if}
            <div class="h-10"></div>
        </div>
    </div>
    {#if loadingDone}
        <div class="absolute z-[1000]"><Stats bind:progressEl /></div>
    {:else}
        <div class="absolute w-full h-full bg-[#222] top-0 left-0 z-[1000]">
            <span class="flex flex-col items-center justify-center h-full">
                <svg
                    aria-hidden="true"
                    class="w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-[yellow]"
                    viewBox="0 0 100 101"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                        fill="currentColor"
                    />
                    <path
                        d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                        fill="currentFill"
                    />
                </svg>
            </span>
        </div>
    {/if}
</div>

<style>
    .font {
        color: var(--f_high) !important;
        font-family: var(--font-family);
        font-size: var(--font-size);
    }
    .yellow {
        @apply bg-[#FFFF98];
    }
    .green {
        @apply bg-[#53FFBC];
    }
    .blue {
        @apply bg-[#80EBFF];
    }
    .pink {
        @apply bg-[#FFCBE6];
    }
    .red {
        @apply bg-[#FF4F5F];
    }
</style>
