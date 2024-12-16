import { CreateMLCEngine, MLCEngine, type ChatCompletionMessageParam, type InitProgressReport } from "@mlc-ai/web-llm";
import { get, writable } from "svelte/store";
import { ARTHUR_ENABLED } from "./constants";

export let arthur = writable<{
    state: boolean | 'loading' | 'unsupported',
    engine?: MLCEngine, model?: string
}>({ state: false });
export let arthurInitProgress = writable<string>("");

export const currentModel = writable<string>(localStorage.currentModel ?? "")
currentModel.subscribe((value) => localStorage.currentModel = value)

export const modelDownloadProgress = writable<Record<string, number>>({});

export const AVAILABLE_MODELS: string[] = [
    "Llama-3.2-1B-Instruct-q4f32_1-MLC"
];

export class Arthur {
    static model: string;

    static async chat(context: string, query: string) {
        if (!get(arthur).engine) return;
        const messages: ChatCompletionMessageParam[] = [
            {
                role: "system", content: `
You are a writing assistant limited to the text the user selects. Follow the user's instructions to improve the selected text without referencing outside context.  

### Tasks:  
- **Rephrase:** Rewrite while keeping the meaning.  
- **Shorten:** Condense while preserving key points.  
- **Expand:** Add detail or explanation.  
- **Clarify:** Make the text clearer.  
- **Correct:** Fix grammar, spelling, and style.  

Provide the revised text directly unless further clarification is needed.
`
            },
            {
                role: 'user', content: query
            }
        ]
        console.log(messages)
        // Chunks is an AsyncGenerator object
        const chunks = await get(arthur).engine!.chat.completions.create({
            messages,
            temperature: 1,
            stream: true, // <-- Enable streaming
            stream_options: { include_usage: true },
        });
        return chunks;
    }

    static async getCachedModels() {
        try {
            // Get all cache names
            const cacheNames = await caches.keys();
            const allCachedItems = [];

            for (const cacheName of cacheNames) {
                if (cacheName !== 'webllm/config') continue;
                const cache = await caches.open(cacheName);
                // Get all cached requests
                const cachedRequests = await cache.keys();

                // Store the requests in the allCachedItems array
                for (const request of cachedRequests) {
                    var url = new URL(request.url)
                    var modelName = url.pathname.split("/")[2];
                    allCachedItems.push(modelName);
                }
            }
            return allCachedItems;
        } catch (error) {
            console.error('Error retrieving cached items:', error);
        }
        return [];
    }

    static async init(options: {
        model: string,
        onError: (e: any) => void;
        onSuccess: (report: InitProgressReport) => void
    }) {
        arthur.set({ state: 'loading' });
        const model = options.model ?? AVAILABLE_MODELS[0];

        CreateMLCEngine(
            model,
            { initProgressCallback: options.onSuccess },
        ).then(engine => {
            const old = get(arthur).engine;
            if (old) old.unload();
            arthur.set({ state: true, engine, model: options.model });
            currentModel.set(model);
        }).catch((e) => {
            options.onError(e);
            // console.error(e);
            arthur.set({ state: 'unsupported' });
        });
    }

    static async restore() {
        if (!ARTHUR_ENABLED) return;
        const model = get(currentModel);
        if (!model) return;

        if (model === get(arthur).model) return;

        Arthur.init({
            model,
            onError: (e) => {
                arthur.set({ state: 'unsupported' })
            },
            onSuccess: (s) => {
                const percent = Math.round(s.progress * 100);
                modelDownloadProgress.update(v => {
                    v[model] = percent;
                    return v;
                })
            },
        });
    }
}
