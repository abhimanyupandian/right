import { get } from "svelte/store";
import { arthurReady } from "./stores";

export function buildPayload(prompt: string) {
    const url = 'http://127.0.0.1:11444/api/generate';
    const options = {
        method: 'POST',
        body: JSON.stringify({
            model: 'llama3.2',
            prompt: prompt,
            stream: true,
        }),
    };
    return { url, options }
}

export class Arthur {
    static check() {
        if (get(arthurReady)) return;
        const { url, options } = buildPayload("Hey Arthur!");
        window.fetch(url, options).then((_) => (arthurReady.set(true)));
    }
    static wakeup() {
        if (!get(arthurReady)) {
            console.log("Starting Arthur...");
            window.arthur.says("arthur-says", (info: any) => {
                var message = info.message.toString();
                if (message.includes("address already in use")) Arthur.check();
                else if (message.includes("Running in")) Arthur.check();
                else if (info.event == "id") Arthur.check();
                // console.log(message);
            });
            window.arthur.start();
        } else {
            Arthur.check();
        }
    }
}