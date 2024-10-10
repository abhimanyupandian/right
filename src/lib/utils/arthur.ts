import { get } from "svelte/store";
import { arthurReady, availableModels, currentModel } from "./stores";
import { PUBLIC_OLLAMA_HOST } from "$env/static/public";
import { PUBLIC_OLLAMA_DEBUG_MODE } from "$env/static/public";
import type { ModelDetails } from "./types";

export class Arthur {
    private init() { }

    private static getPrompt = (content: string, question: string) => `
This is the argument: ${content}
This is the question: ${question}
You are a helpful assistant named Arthur. Please respond as accurately as possible without hallucinating. Just give me the response. You don't have to give me the exact steps that you are doing. When the user mentions "statement" or "this", the user is talking about the argument provided. The argument is basically a snippet of text extracted from a larger text. Ensure that all the responses are within the context of the argument provided. 
If the user asks something beyond the context, just greet them and tell them that you are not authorized to respond to anything beyond the context of the argument provided without providing any details of the context, in less than 20 words.
`
    static _payload(prompt: string) {
        var model = get(currentModel);
        if (!model) throw `MODEL_NOT_SET`;
        var url = `${PUBLIC_OLLAMA_HOST}/api/generate`;
        var options = {
            method: 'POST',
            body: JSON.stringify({
                model,
                prompt: prompt,
                stream: true,
            }),
        };
        return { url, options }
    }

    static payload(content: string, question: string) {
        try {
            return Arthur._payload(Arthur.getPrompt(content, question));
        } catch (e) {
            arthurReady.set(false);
        }
    }

    static check() {
        if (get(arthurReady)) return;
        setTimeout(() => {
            try {
                Arthur.list().then(e => availableModels.set(e))
                const { url, options } = Arthur._payload("Hey Arthur!");
                window.fetch(url, options)
                    .then((resp) => {
                        if (resp.ok) arthurReady.set(true);
                    });
            } catch (e) {
                console.error(e)
            }
        }, 1000) // Waiting before checking!
    }

    static wakeup() {
        if (!get(arthurReady)) {
            console.log("Waking Arthur up...");
            window.arthur.says("arthur-says", (info: any) => {
                var message = info.message.toString();
                if (message.includes("address already in use")) Arthur.check();
                else if (message.includes("Running in")) Arthur.check();
                else if (info.event == "id") Arthur.check();
                if (PUBLIC_OLLAMA_DEBUG_MODE == "1") console.log(message);
            });
            window.arthur.start();
        } else {
            Arthur.check();
        }
    }

    static async list(): Promise<ModelDetails[]> {
        const url = `${PUBLIC_OLLAMA_HOST}/api/tags`;
        try {
            var resp = await fetch(url);
            if (resp.status) {
                var json = await resp.json();
                var models = [];
                for (var each of json.models) {
                    models.push({
                        name: each.name,
                        model: each.model,
                        size: each.size,
                        pSize: each.details.parameter_size
                    })
                }
                return models;
            }
        } catch (e) {
            console.error(e)
        }
        return [];
    }

    static set(model: string) {
        currentModel.set(model);
    }

    static async remove(name: string) {
        const url = `${PUBLIC_OLLAMA_HOST}/api/delete`;
        try {
            var resp = await fetch(url, { method: 'DELETE', body: JSON.stringify({ name }) });
            if (resp.status) {
                availableModels.update(models => {
                    return models.filter(m => m.model === name);
                })
            }
        } catch (e) {
            console.error(e)
        }
    }

    static async pull(model: string) {
        const url = `${PUBLIC_OLLAMA_HOST}/api/pull`;
        try {
            var resp = await fetch(url, { method: 'POST', body: JSON.stringify({ model, stream: true }) });
            if (resp.status) {
            }
        } catch (e) {
            console.error(e)
        }
    }
}