import { CreateMLCEngine, MLCEngine, type ChatCompletionMessageParam, type InitProgressReport } from "@mlc-ai/web-llm";
import { get, writable } from "svelte/store";

export let arthur = writable<{ state: boolean | 'loading', engine?: MLCEngine, model?: string }>({ state: false });
export let arthurInitProgress = writable<string>("");

export const currentModel = writable<string>(localStorage.currentModel ?? "")
currentModel.subscribe((value) => localStorage.currentModel = value)

export const modelDownloadProgress = writable<Record<string, number>>({});

export const AVAILABLE_MODELS: string[] = ["Llama-3.2-1B-Instruct-q4f32_1-MLC"];

export class Arthur {
    static model: string;

    static async chat(context: string, query: string) {
        if (!get(arthur).engine) return;
        const messages: ChatCompletionMessageParam[] = [
            {
                role: "system", content: `
You are a helpful assistant named Arthur. Please respond as accurately as possible without hallucinating. Just give me the response for the question asked. You don't have to give me the exact steps that you are doing. When the user mentions "statement" or "this", the user is talking about the argument provided. The argument is basically a snippet of text extracted from a larger text and is the text between the tags ###ARGSTART###  and ###ARGEND###. Ensure that all the responses are within the context of the argument provided. If the user asks something beyond the context, just greet them and tell them that you are not authorized to respond to anything beyond the context of the argument provided without providing any details of the context. The users question is the text between ###QSTART### and ###QEND###
`
            },
            {
                role: "user", content: `
###ARGSTART###
${context}
###ARGEND###
###QSTART###
${query}
###QEND###
`
            },
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

    static async init(options: { model: string, callback: (report: InitProgressReport) => void }) {
        arthur.set({ state: 'loading' });
        const model = options.model ?? AVAILABLE_MODELS[0];

        CreateMLCEngine(
            model,
            { initProgressCallback: options.callback },
        ).then(engine => {
            const old = get(arthur).engine;
            if (old) old.unload();
            arthur.set({ state: true, engine, model: options.model });
            currentModel.set(model);
        }).catch(console.error);
    }

    static async restore() {
        const model = get(currentModel);
        if (!model) return;

        if (model === get(arthur).model) return;

        Arthur.init({
            model,
            callback: (e) => {
                const percent = Math.round(e.progress * 100);
                modelDownloadProgress.update(v => {
                    v[model] = percent;
                    return v;
                })
            },
        });
    }
}
