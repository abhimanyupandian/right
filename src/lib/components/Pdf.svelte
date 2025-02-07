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
    import { redBright } from "colorette";

    export let pdfId: string | undefined = undefined;

    var pdfViewer: any;
    var loadingDone: boolean = false;
    var progressEl: any;
    var hideNotes: boolean = false;
    var shadowRoot: ShadowRoot;
    var iframe: any;
    const color = writable<string>("");
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

    $: if (progressEl) {
        updateProgress();
    }

    async function getDocument(file: Blob) {
        const data = await file.arrayBuffer();
        return mupdfjs.PDFDocument.openDocument(data, "application/pdf");
    }

    function getRectCenter([x, y, width, height]: number[]) {
        return [x + width / 2, y + height / 2];
    }

    function componentToHex(c: number) {
        var hex = c.toString(16);
        return hex.length == 1 ? "00" + hex : hex;
    }

    function rgbToClass(rgb: number[]) {
        return hexToClass(
            `#${rgb.map((e) => componentToHex(Math.trunc(e))).join("")}`.toUpperCase(),
        );
    }

    function hexToClass(hex: string) {
        const colorMap: Record<string, string> = {
            "#FFFF98": "yellow",
            "#FFFF99": "yellow",
            "#53FFBC": "green",
            "#54FFBC": "green",
            "#80EBFF": "blue",
            "#7FEAFF": "blue",
            "#FFCBE6": "pink",
            "#FFCCE5": "pink",
            "#FF4F5F": "red",
            "#FF4F5E": "red",
        };
        return colorMap[hex] || "yellow";
    }

    async function getAndUpdateAnnotationsForPage(
        document: mupdfjs.PDFDocument,
        pageNumber: number,
    ) {
        const page = document.loadPage(pageNumber);
        const annotations = page.getAnnotations();

        if (!annotations.length) return;

        const collectedAnnotations = annotations
            .map((annotation) => {
                const note = annotation.getContents().trim();
                if (!note) return null;
                return {
                    note,
                    pageNumber: pageNumber + 1,
                    location: getRectCenter(annotation.getBounds()),
                    color: rgbToClass(
                        annotation.getColor().map((c: number) => c * 255),
                    ),
                };
            })
            .filter(Boolean) as {
            note: string;
            pageNumber: number;
            location: number[];
            color: string;
        }[];

        if (collectedAnnotations.length) {
            notes.update((notes) => {
                notes.set(pageNumber + 1, collectedAnnotations);
                return notes;
            });
        }
    }

    async function getAllAnnotations(file: Blob, pageNumber?: number) {
        const document = await getDocument(file);

        if (pageNumber && pageNumber >= 0) {
            await getAndUpdateAnnotationsForPage(document, pageNumber);
            return;
        }

        // Process all pages concurrently
        await Promise.all(
            Array.from({ length: document.countPages() }, (_, i) =>
                getAndUpdateAnnotationsForPage(document, i),
            ),
        );
    }

    async function loadPDF(file: Blob) {
        const fileReader = new FileReader();
        fileReader.onload = async (event) => {
            try {
                pdfViewer.open({
                    data: new Uint8Array(event.target!.result as ArrayBuffer),
                });
                $currentDocument.totalPages = pdfViewer.pagesCount;
                await getAllAnnotations(file);
            } catch (error) {
                console.error("Error loading PDF:", error);
            }
        };

        fileReader.readAsArrayBuffer(file);
    }

    async function onSave() {
        if (!pdfViewer?.pdfDocument) {
            console.warn("No PDF document loaded.");
            return;
        }
        try {
            Saver.save({
                content: new Blob(
                    [await pdfViewer.pdfDocument.saveDocument()],
                    { type: "application/pdf" },
                ),
            });
        } catch (error) {
            console.error("Error saving PDF:", error);
        }
    }

    function updateProgress() {
        try {
            const details = Progress.get($stats.percent);
            if (details) {
                $stats.percent = details.percent;
                progressEl.innerHTML = details.html;
            }
        } catch (error) {
            // console.error("Error updating progress:", error);
        }
    }

    onMount(async () => {
        var resetDone: boolean = false;

        Progress.init(progressEl);
        const viewerEl: any = document.querySelector("pdfjs-viewer-element")!;

        pdfViewer = await viewerEl.initialize();

        pdfViewer.save = onSave;
        pdfViewer.download = onSave;
        pdfViewer.downloadOrSave = onSave;

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
            pdfViewer.pdfViewer.setScale($currentDocument.scaleFactor ?? 1, {
                noScroll: false,
            });
        }
        function resetScroll() {
            const pdfContainer =
                iframe.contentDocument.querySelector("#viewerContainer");
            if (!pdfContainer) return;

            pdfContainer.scrollTop = $currentDocument.scrollTop;
            resetDone = true;

            const updateScrollPosition = () => {
                $currentDocument.scrollTop = pdfContainer.scrollTop;
            };

            pdfContainer.addEventListener("scroll", updateScrollPosition, {
                passive: true,
            });
            pdfContainer.addEventListener("scrollend", () => {
                Saver.saveScrollPosition($currentDocument.scrollTop);
            });

            setTimeout(() => (loadingDone = true), 100); // Prevent flashing effect
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

        pdfViewer.eventBus.on("ready", (e: any) => {
            if (!resetDone) {
                resetScale();
                resetScroll();
            }
        });

        pdfViewer.eventBus.on("colorchange", (e: string) => {
            $color = e;
        });

        pdfViewer.eventBus.on(
            "selectedtext",
            ({ text }: { text: string; color: string }) => {
                if (!text?.trim()) return;

                notes.update((e) => {
                    const page = $currentDocument.currentPage;
                    const existingNotes = e.get(page) ?? [];

                    e.set(page, [
                        ...existingNotes,
                        {
                            note: text.trim(),
                            pageNumber: page,
                            location: [],
                            color: hexToClass($color.toUpperCase()),
                        },
                    ]);

                    return e;
                });
            },
        );

        /** UPDATING SCROLL PROGRESS */
        pdfViewer.eventBus.on("pagechanging", (e: { pageNumber: number }) => {
            $stats.percent = roundPercent(e.pageNumber / pdfViewer.pagesCount);
            $currentDocument.currentPage = e.pageNumber;
            updateProgress();
        });

        /** UPDATING ZOOM SCALE FACTOR */
        pdfViewer.eventBus.on("zoomchange", (e: { scale: number }) => {
            $currentDocument.scaleFactor = e.scale;
            Saver.saveScaleFactor($currentDocument.scaleFactor);
            const pdfContainer =
                iframe.contentDocument.querySelector("#viewerContainer");
            Saver.saveScrollPosition(pdfContainer.scrollTop);
        });

        pdfViewer.eventBus.on(
            "updatepagehighlights",
            async ({ pageNumber = -1 }) => {
                setTimeout(async () => {
                    const data = await pdfViewer.pdfDocument.saveDocument();
                    const file = new Blob([data], { type: "application/pdf" });
                    await getAllAnnotations(file, pageNumber);
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
                pdfViewer.downloadManager.download(
                    $currentDocument.content,
                    "",
                    $currentDocument.name,
                );
            });
    });

    function goToPage(pageNumber: number) {
        pdfViewer.pdfLinkService.goToPage(pageNumber);
    }

    function goToHighlight(pageNumber: number, location: number[]) {
        pdfViewer.pdfLinkService.goToPage(pageNumber);
        pdfViewer.eventBus.dispatch("scrolltooffset", { details: location });
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
            class="px-4 sticky top-0 z-[100] bg-[#222] h-[33px] border-b-[1px] border-black flex flex-row items-center justify-center w-full"
        >
            <div class="flex-0 text-sm">Notes</div>
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
                                        class="flex w-full p-2 bg-black rounded-sm max-w-md relative"
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
