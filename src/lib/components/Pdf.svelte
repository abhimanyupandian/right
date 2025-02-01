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
    export let pdfId: string | undefined = undefined;

    async function getDocument(file: Blob) {
        const data = await file.arrayBuffer();
        const document = mupdfjs.PDFDocument.openDocument(
            data,
            "application/pdf",
        ) as mupdfjs.PDFDocument;
        return document;
    }

    async function getAllAnnotations(file: Blob) {
        const document = await getDocument(file);
        var i = 0;
        while (i < document.countPages()) {
            const page = document.loadPage(i);
            const annots = page.getAnnotations();
            if (annots.length) {
                for (var each of annots) {
                    notes.update((e) => {
                        e.push({
                            note: each.getContents().trim(),
                            pageNumber: i + 1,
                            location: 0,
                        });
                        return e;
                    });
                }
                // console.log(`Page=${i + 1}, Annotations=${annots}`);
            }
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
        { note: string; pageNumber: number; location: number }[]
    >([]);

    onMount(async () => {
        Progress.init(progressEl);
        const viewer: any = document.querySelector("pdfjs-viewer-element")!;
        viewerApp = await viewer.initialize();

        const shadowRoot = document.querySelector(
            "pdfjs-viewer-element",
        )?.shadowRoot!;
        const iframe: any = shadowRoot.querySelector("iframe")!;

        var resetScrollDone: boolean = false;

        viewerApp.save = onSave;
        viewerApp.download = onSave;
        viewerApp.downloadOrSave = onSave;

        viewerApp.eventBus.on("ready", (e: any) => {
            if (!resetScrollDone) resetScroll();
        });

        function resetScroll() {
            const pdfContainer =
                iframe.contentDocument.querySelector("#viewerContainer");
            pdfContainer.scrollTop = $currentDocument.scrollTop;
            resetScrollDone = true;

            pdfContainer.addEventListener(
                "scroll",
                function (event: any) {
                    $currentDocument.scrollTop = pdfContainer.scrollTop;
                },
                false,
            );
            pdfContainer.addEventListener(
                "scrollend",
                function (event: any) {
                    Saver.saveScrollPosition($currentDocument.scrollTop);
                },
                false,
            );
            setTimeout(() => (loadingDone = true), 100); // so that there is no flash
        }

        viewerApp.eventBus.on("selectedtext", (selectedText: string) => {
            if (!selectedText) return;
            notes.update((e) => {
                e.push({
                    note: selectedText.trim(),
                    pageNumber: $currentDocument.currentPage,
                    location: 0,
                });
                return e;
            });
        });

        /** LOADING DOCUMENT */
        db.document
            .get(pdfId ?? $page.url.searchParams.get("pdf") ?? "")
            .then((document) => {
                if (document) {
                    $currentDocument = document;
                    loadPDF(document.content as Blob);
                }
            });

        /** UPDATING SCROLL PROGRESS */
        viewerApp.eventBus.on("pagechanging", (e: any) => {
            $stats.percent = roundPercent(e.pageNumber / viewerApp.pagesCount);
            $currentDocument.currentPage = e.pageNumber;
            updateProgress();
        });

        function getHighlighterButton() {
            return iframe.contentDocument?.querySelector(
                "#editorHighlightButton",
            );
        }

        function toggleHighlighter() {
            return getHighlighterButton().click();
        }

        function shouldCloseHighlighter(event: any) {
            const isToggled =
                getHighlighterButton().classList.contains("toggled");
            if (event.key === "Escape" && isToggled) {
                toggleHighlighter();
            }
        }

        /** FOR HIGHLIGHT SHORTCUT */
        iframe.contentDocument.addEventListener(
            "keydown",
            function (event: any) {
                if (
                    (event.shiftKey && event.metaKey) ||
                    shouldCloseHighlighter(event)
                ) {
                    toggleHighlighter();
                }
            },
        );

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

    var isDarkMode: boolean = false;
    function toggleTheme() {
        isDarkMode = !isDarkMode;
        const shadowRoot = document.querySelector(
            "pdfjs-viewer-element",
        )?.shadowRoot!;
        const iframe: any = shadowRoot.querySelector("iframe")!;
        const elInner = iframe.contentDocument.querySelector("div");
        const viewer: HTMLElement = elInner?.querySelector("#viewerContainer");
        viewer.classList.add("invert");
        var style = document.createElement("style");
        style.innerHTML = "#viewerContainer { invert: 100%; }";
        shadowRoot.appendChild(style);
    }
</script>

<div class="flex flex-row bg-[#222] relative">
    <pdfjs-viewer-element class="min-h-[100vh] z-[10]" viewer-path="pdfjs">
    </pdfjs-viewer-element>
    <div class="min-w-[30%] max-w-[30%] z-[0] px-4 py-2">
        {#each $notes as note}
            {#if note.note}
                <div>{note.pageNumber} {note.note}</div>
            {/if}
        {/each}
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
