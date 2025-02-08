import { CreateMLCEngine, MLCEngine, type ChatCompletionMessageParam, type InitProgressReport } from "@mlc-ai/web-llm";
import { get, writable } from "svelte/store";

export let arthur = writable<{
    state: boolean | 'loading' | 'unsupported',
    engine?: MLCEngine, model?: string
    focused?: boolean
}>({ state: false, focused: false });
export let arthurInitProgress = writable<string>("");

export const currentModel = writable<string>(localStorage.currentModel ?? "")
currentModel.subscribe((value) => localStorage.currentModel = value)

export const modelDownloadProgress = writable<Record<string, number>>({});

export const AVAILABLE_MODELS: string[] = [
    "Llama-3.2-3B-Instruct-q4f32_1-MLC",
];

export class Arthur {
    static model: string;

    static async chat(context: string, query: string, options?: {
        words?: number,
        sentences?: number
    }) {
        if (!get(arthur).engine) return;

        var limitsPrompt = '';
        var limits: string[] = [];
        if (options?.words) {
            limits.push(`${options?.words} words`)
        }
        if (options?.sentences) {
            limits.push(`${options?.sentences} sentences`)
        }
        if (limits.length) {
            limitsPrompt = `Repsond in exactly ${limits.join(" and ")}.`
        }

        const prompt = `
You are a useful AI assistant who helps users write content. The user selects a portion of text and asks you a question based on the selected text. You only have information about the selected text and the question the user asks. Respond precisely in plain text without giving any other information about the steps you have taken. Do not provide the answer within quotes.
This is the text the user has selected: ${context}
`
        // console.log(prompt)
        const messages: ChatCompletionMessageParam[] = [
            {
                role: "system", content: prompt
            },
            {
                role: 'user', content: `${query}. ${limitsPrompt}`
            }
        ]
        const chunks = await get(arthur).engine!.chatCompletion({
            messages,
            temperature: 0,
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
            console.error(e);
            arthur.set({ state: 'unsupported' });
        });
    }

    static async restore() {
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
