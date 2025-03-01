<script lang="ts">
    import { onMount } from "svelte";
    import TypewriterEffect from "./TypewriterEffect.svelte";

    export let show: boolean = false;
    let overlayEl: HTMLElement;

    onMount(() => {
        window.addEventListener("click", function (e) {
            if (show && overlayEl == e.target) {
                show = false;
            }
        });
    });
</script>

{#if show}
    <div
        bind:this={overlayEl}
        class="fixed z-10 bg-black bg-opacity-80 inset-0 justify-center items-center hidden md:flex"
    ></div>
    <div
        class="fixed z-10 top-10 left-[calc(50vw-250px)] justify-center items-center hidden md:flex"
    >
        <div
            class="bg-[#222] p-4 space-y-4 rounded shadow-lg w-[500px] border-[0.1em] border-zinc-800 flex flex-col overflow-hidden"
        >
            <div class="flex flex-row items-center space-x-4">
                <div>
                    <img
                        alt="logo"
                        src="icon.png"
                        width="75"
                        height="75"
                        class="rounded-md"
                    />
                </div>
                <div>
                    <div class="text-3xl font-bold">Right.</div>
                    <div class="text-xl font-bold opacity-25">
                        Focused <TypewriterEffect></TypewriterEffect>.
                    </div>
                </div>
            </div>
            <div>
                Right is a distraction-free writing and reading tool powered by
                AI, designed to enhance focus and productivity. It is completely
                free to use, with all data stored in your browser, ensuring
                privacy and convenience.
            </div>
            <div class="text-xl text-zinc-600">Credits and Attributions</div>
            <div>
                1. Full credit for the design goes to the team behind <a
                    class="text-blue-500"
                    href="https://github.com/hundredrabbits/Left"
                    target="_blank">Left</a
                >, who generously allowed us to use and adapt their design.
            </div>
            <div>
                2. Right is developed using open-source tools, with its AI
                capabilities powered by <a
                    class="text-blue-500"
                    href="https://webllm.mlc.ai/"
                    target="_blank">WebLLM</a
                > on the backend.
            </div>
            <div>
                3. Currently AI capabilities are only supported in machines on
                browsers that support WebGPU. Please check <a
                    class="text-blue-500"
                    href="https://github.com/mlc-ai/web-llm"
                    target="_blank">WebLLM Github Repo</a
                > for more details.
            </div>
            <div>
                4. For the PDF Reader functionalities, Right uses <a
                    class="text-blue-500"
                    href="https://mozilla.github.io/pdf.js/"
                    target="_blank">PDF.js</a
                >
                and
                <a
                    class="text-blue-500"
                    href="https://mupdfjs.readthedocs.io/en/latest/#"
                    target="_blank">MuPDF.js</a
                >.
            </div>
        </div>
    </div>
{/if}
