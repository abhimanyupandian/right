<script lang="ts">
    import "pdfjs-viewer-element";
    import { onMount } from "svelte";
    import { page } from "$app/stores";
    import { db, Saver } from "$lib/utils/db";
    import { currentDocument, stats } from "$lib/utils/stores";
    import Stats from "./Stats/PdfStats.svelte";
    import { Progress, roundPercent } from "$lib/utils/progress";

    var viewerApp: any;

    var loadingDone: boolean = false;

    async function loadPDF(file: Blob) {
        const fileReader = new FileReader();
        fileReader.onload = async (e: any) => {
            const pdfData = new Uint8Array(e.target.result);
            viewerApp.open({ data: pdfData });
            $currentDocument.totalPages = viewerApp.pagesCount;
        };
        fileReader.readAsArrayBuffer(file);
    }
    export let pdfId: string | undefined = undefined;

    async function onSave() {
        if (!viewerApp) return;
        const data = await viewerApp.pdfDocument.saveDocument();
        Saver.save({
            content: new Blob([data], {
                type: "application/pdf",
            }),
        });
    }

    let currentPage: number = 1;

    function updateProgress() {
        var details = Progress.get($stats.percent);
        $stats.percent = details.percent;
        progressEl.innerHTML = details.html;
    }

    $: if (progressEl) {
        updateProgress();
    }

    onMount(async () => {
        Progress.init(progressEl);
        const viewer: any = document.querySelector("pdfjs-viewer-element")!;
        viewerApp = await viewer.initialize();

        viewerApp.eventBus.on("pagechanging", (e: any) => {
            $stats.percent = roundPercent(e.pageNumber / viewerApp.pagesCount);
            currentPage = e.pageNumber;
            updateProgress();
        });

        const shadowRoot = document.querySelector(
            "pdfjs-viewer-element",
        )?.shadowRoot!;
        const iframe: any = shadowRoot.querySelector("iframe")!;

        viewerApp.save = onSave;
        viewerApp.download = onSave;
        viewerApp.downloadOrSave = onSave;

        db.document
            .get(pdfId ?? $page.url.searchParams.get("pdf") ?? "")
            .then((document) => {
                if (document) {
                    $currentDocument = document;
                    loadPDF(document.content as Blob);
                    loadingDone = true;
                }
            });

        iframe.contentDocument.addEventListener(
            "keydown",
            function (event: any) {
                if (event.shiftKey && event.metaKey) {
                    iframe.contentDocument
                        ?.querySelector("#editorHighlightButton")
                        .click();
                }
            },
        );

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
    var progressEl: any;
</script>

<div class="flex flex-row bg-[#222] relative">
    <pdfjs-viewer-element class="min-h-[100vh] z-[10]" viewer-path="pdfjs">
    </pdfjs-viewer-element>
    <div class="min-w-[30%] z-[0]"></div>
    {#if loadingDone}
        <div class="absolute z-[1000]"><Stats bind:progressEl /></div>
    {/if}
</div>
