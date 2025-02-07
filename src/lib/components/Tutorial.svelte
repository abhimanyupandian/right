<script lang="ts">
    import { onMount } from "svelte";

    var overlayEl: HTMLElement;
    export var show: boolean = false;

    function handleKeydown(event: any) {
        if (event.key == "Escape") show = false;
    }

    onMount(() => {
        window.addEventListener("keydown", handleKeydown);
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
        class="fixed z-10 opacity-50 bg-black inset-0 justify-center items-center hidden md:flex"
    ></div>
    <div
        class="cursor-default select-none fixed z-10 top-10 left-[calc(50vw-200px)] justify-center items-center hidden md:flex"
    >
        <div
            class="bg-[#222] p-4 rounded shadow-lg w-[400px] border-[0.1em] border-zinc-800 flex flex-col overflow-hidden space-y-2"
        >
            <div class="text-zinc-400">Shortcuts</div>
            <div class="flex flex-row items-center justify-between">
                <div class="text-black bg-white py-1 px-2 rounded-md">
                    cmd + o
                </div>
                <div>Finder</div>
            </div>
            <div class="flex flex-row items-center justify-between">
                <div class="flex flex-row space-x-2">
                    <div class="text-black bg-white py-1 px-2 rounded-md">
                        select text
                    </div>
                    <div class="text-black bg-white py-1 px-2 rounded-md">
                        cmd + /
                    </div>
                </div>
                <div>Arthur AI</div>
            </div>
            <div class="h-2"></div>
            <div class="text-zinc-400">Tags</div>
            <div class="flex flex-row items-center justify-between space-x-6">
                <div class="text-black bg-white py-1 px-2 rounded-md">
                    @title
                </div>
                <div>Notepad Name</div>
            </div>
            <div class="flex flex-row items-center justify-between space-x-6">
                <div class="text-black bg-white py-1 px-2 rounded-md">
                    {`>`}
                </div>
                <div>Chapter</div>
            </div>
            <div class="flex flex-row items-center justify-between space-x-6">
                <div class="text-black bg-white py-1 px-2 rounded-md">#</div>
                <div>Heading</div>
            </div>
            <div class="flex flex-row items-center justify-between space-x-6">
                <div class="text-black bg-white py-1 px-2 rounded-md">##</div>
                <div>Subheading</div>
            </div>
            <div class="flex flex-row items-center justify-between space-x-6">
                <div class="text-black bg-white py-1 px-2 rounded-md">--</div>
                <div>Section</div>
            </div>
        </div>
    </div>
{/if}
