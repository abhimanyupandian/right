import { CreateMLCEngine, MLCEngine, type InitProgressReport } from "@mlc-ai/web-llm";
import { get, writable } from "svelte/store";

export let arthur = writable<{ state: boolean | 'loading', engine?: MLCEngine }>({ state: false });
export let arthurInitProgress = writable<string>("");

export const currentModel = writable<string>(localStorage.currentModel ?? "")
currentModel.subscribe((value) => localStorage.currentModel = value)

export const modelDownloadProgress = writable<Record<string, number>>({});

export const AVAILABLE_MODELS: string[] = ["Llama-3.2-1B-Instruct-q4f32_1-MLC"];

export class Arthur {
    static model: string;

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

    static async init(options: { model?: string, callback: (report: InitProgressReport) => void }) {
        arthur.set({ state: 'loading' });
        const model = options.model ?? AVAILABLE_MODELS[0];
        CreateMLCEngine(
            model,
            { initProgressCallback: options.callback },
        ).then(engine => {
            arthur.set({ state: true, engine });
            console.log(get(arthur))
        }).catch(console.error);
    }

    static async restore() {
        const savedModel = get(currentModel);
        if (!savedModel) return;
        console.log(get(arthur))
        Arthur.init({
            model: savedModel,
            callback: (e) => {
                const percent = Math.round(e.progress * 100);
                modelDownloadProgress.update(v => {
                    v[savedModel] = percent;
                    return v;
                })
            },
        });
    }
}
