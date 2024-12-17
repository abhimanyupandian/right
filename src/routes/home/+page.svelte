<svelte:head>
    <title>Right - Focused Writing</title>
    <meta
        name="description"
        content="Right is a distraction-free writing tool powered by AI designed to enhance focus and productivity.
It runs directly in your browser, completely free and serverless, with all data stored locally for maximum privacy and convenience."
    />
    <meta name="”robots”" content="index, follow" />
</svelte:head>

<div class="lg:px-[200px] px-[40px] py-[40px] flex flex-col space-y-[40px]">
    <div class="h-[70vh]">
        <div class="flex lg:flex-row flex-col justify-center items-center">
            <a
                href="/"
                target="_blank"
                class="flex flex-row items-center space-x-4"
            >
                <div>
                    <img
                        alt="logo"
                        src="icon.png"
                        width="75"
                        height="75"
                        class="rounded-md"
                    />
                </div>
                <div class="text-white">
                    <div class="text-3xl font-bold">Right.</div>
                    <div class="text-xl font-bold opacity-25">
                        Focused Writing.
                    </div>
                </div>
            </a>
            <!-- <div class="flex flex-row space-x-4 text-white">
                <a href="/" target="_blank"> Go to App </a>
            </div> -->
        </div>
        <div class="text-[24px] text-white lg:w-[600px] pt-[25vh] w-full">
            Right is a
            <span class="text-black bg-[yellow] w-fit px-1"
                >distraction-free writing tool powered by AI</span
            >
            designed to enhance focus and productivity.
            <br /> It runs directly in your browser, completely free and
            serverless, with all data stored locally for maximum
            <span class="text-black bg-[yellow] w-fit px-1"
                >privacy and convenience.
            </span>
        </div>
    </div>
    <div>
        <img
            alt="logo"
            width="1200px"
            src="ss1.png"
            class="rounded-md w-[100%]"
        />
    </div>
    <div
        class="h-fit flex lg:flex-row flex-col text-white lg:space-x-[40px] py-[80px] lg:space-y-[0px] space-y-[40px]"
    >
        <div class="flex flex-col flex-1">
            <div class="font-bold text-[24px]">AI Powered</div>
            <div class="text-[20px]">
                Right is powered by Arthur AI. Simply select a portion of text
                from your notepad and ask Arthur for suggestions, such as
                rephrasing, generating arguments for or against a statement,
                creating an introduction, or crafting an outro.
            </div>
        </div>
        <div class="flex flex-col flex-1">
            <div class="font-bold text-[24px]">
                Auto Indexing and Statistics
            </div>
            <div class="text-[20px]">
                With formatting features, you can add headings and subheadings,
                then easily navigate between sections using the index.
            </div>
        </div>
        <div class="flex flex-col flex-1">
            <div class="font-bold text-[24px]">Notepad Management</div>
            <div class="text-[20px]">
                With autosave and a file finder feature, you never have to worry
                about forgetting to save. Easily switch between notepads you've
                previously worked on for a seamless writing experience.
            </div>
        </div>
    </div>
    <div>
        <img alt="logo" src="ss2.png" class="rounded-md" />
    </div>
</div>
<div
    class="bg-zinc-900 bottom-0 left-0 w-full py-4 px-8 text-zinc-500 text-sm flex flex-col justify-center items-center"
>
    <div class="opacity-50 hover:opacity-100">
        Full credit for the design goes to the team behind <a
            class="text-blue-500"
            href="https://github.com/hundredrabbits/Left"
            target="_blank">Left</a
        >, who generously allowed us to use and adapt their design.
    </div>
</div>
