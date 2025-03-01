<script lang="ts">
    import "pdfjs-viewer-element";
    import { onMount } from "svelte";
    import { page } from "$app/stores";
    import { db, Saver } from "$lib/utils/db";
    import { currentDocument, selection, stats } from "$lib/utils/stores";
    import Stats from "./Stats/PdfStats.svelte";
    import { Progress, roundPercent } from "$lib/utils/progress";
    import { writable } from "svelte/store";
    import * as mupdfjs from "mupdf/mupdfjs";
    import Arthur from "./Arthur.svelte";
    import Loading from "./Loading.svelte";
    import { arthur } from "$lib/utils/arthur";
    import Fullscreen from "./Fullscreen.svelte";

    export let pdfId: string | undefined = undefined;

    let pdfViewer: any;
    let loadingDone: boolean = false;
    let progressEl: any;
    let hideNotes: boolean = false;
    let shadowRoot: ShadowRoot;
    let iframe: any;
    let pageEl: HTMLElement;
    let isChatting: boolean = false;

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
        let hex = c.toString(16);
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

        notes.update((notes) => {
            notes.set(
                pageNumber + 1,
                collectedAnnotations.length ? collectedAnnotations : [],
            );
            return notes;
        });
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

    function handleOpenChat(event: any) {
        if ($arthur.state == true) {
            if (event.metaKey && event.key === "/") {
                $arthur.focused = true;
                event.preventDefault();
                openChat();
            }
        }
    }

    function goToPage(pageNumber: number) {
        pdfViewer.pdfLinkService.goToPage(pageNumber);
    }

    function goToHighlight(pageNumber: number, location: number[]) {
        pdfViewer.pdfLinkService.goToPage(pageNumber);
        pdfViewer.eventBus.dispatch("scrolltooffset", { details: location });

        const pdfContainer =
            iframe.contentDocument.querySelector("#viewerContainer");
        if (!pdfContainer) return;
        pdfContainer.scrollLeft = $currentDocument.scrollLeft;
    }

    function toggleNotes() {
        hideNotes = !hideNotes;
    }
    function openChat() {
        if (!$selection.content) return;
        isChatting = true;
    }

    onMount(async () => {
        let resetDone: boolean = false;

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
            pdfContainer.scrollLeft = $currentDocument.scrollLeft;
            resetDone = true;

            const updateScrollPosition = () => {
                $currentDocument.scrollTop = pdfContainer.scrollTop;
                $currentDocument.scrollLeft = pdfContainer.scrollLeft;
            };

            pdfContainer.addEventListener("scroll", updateScrollPosition, {
                passive: true,
            });
            pdfContainer.addEventListener("scrollend", () => {
                Saver.saveScrollPosition(
                    $currentDocument.scrollTop,
                    $currentDocument.scrollLeft,
                );
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
                $selection.content = text;
            },
        );
        pdfViewer.eventBus.on("selectionend", () => {
            $selection.content = "";
        });

        pdfViewer.eventBus.on(
            "highlightedtext",
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
            Saver.saveScrollPosition(
                pdfContainer.scrollTop,
                pdfContainer.scrollLeft,
            );
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

        document.addEventListener("keydown", handleOpenChat);
        iframe.contentDocument.addEventListener("keydown", handleOpenChat);

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
</script>

<div
    bind:this={pageEl}
    class="flex flex-row bg-[#222] relative overflow-hidden max-h-[100vh]"
>
    <pdfjs-viewer-element class="min-h-[100vh] z-[10]" viewer-path="pdfjs">
    </pdfjs-viewer-element>
    {#if !isChatting}
        <div
            class="min-w-[400px] max-w-[400px] duration-100 bg-black bg-opacity-10 font overflow-scroll items-start flex flex-col"
        >
            <div
                class="px-4 sticky top-0 z-[100] bg-[#222] h-[33px] min-h-[33px] border-b-[1px] border-black flex flex-row items-center justify-between w-full"
            >
                <div></div>
                <button on:click={toggleNotes} class="flex-0 text-sm"
                    >Notes</button
                >
                <Fullscreen {pageEl}></Fullscreen>
            </div>
            <div
                class:opacity-[5%]={hideNotes}
                class="px-2 py-2 space-y-2 flex flex-col items-start hover:opacity-[100%]"
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
                                        on:click={() =>
                                            goToHighlight(
                                                pageNumber,
                                                note.location,
                                            )}
                                        class=" bg-black text-sm rounded-md border-none text-start flex flex-row items-start justify-center w-full min-w-full"
                                    >
                                        <div
                                            class="flex w-full p-2 bg-black rounded-sm relative"
                                        >
                                            <div
                                                class={`${note.color} opacity-75 w-1 rounded-l-sm absolute left-0 top-0 flex-1 bottom-0`}
                                            ></div>
                                            <div class="ml-2 break-all">
                                                {note.note}
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
    {/if}

    {#if loadingDone}
        <div class="absolute z-[1000]"><Stats bind:progressEl /></div>
        {#if isChatting}
            <div
                class="pt-4 flex max-h-[calc(100vh-64px)] min-h-[calc(100vh-32px)] space-x-2 max-w-[400px] min-w-[400px]"
            >
                <Arthur width={`400px`} bind:isChatting />
            </div>
        {/if}
    {:else}
        <Loading></Loading>
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
