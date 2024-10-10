import { writable } from "svelte/store";
import { type ModelDetails, type IndexEntry, type Stats } from "./types";
import { PageContent } from "./constants";

export const currentModel = writable<string>(localStorage.getItem("currentModel") ?? "");
currentModel.subscribe(value => {
    localStorage.setItem("currentModel", value);
});
export const availableModels = writable<ModelDetails[]>(JSON.parse(localStorage.getItem("availableModels") ?? "[]"));
availableModels.subscribe(value => {
    localStorage.setItem("availableModels", JSON.stringify(value));
});
export const arthurReady = writable<boolean>(false);
export const content = writable<string>(PageContent);
export const index = writable<IndexEntry[]>([]);
export const stats = writable<Stats>({
    percent: "0.0",
    totalC: 0,
    totalW: 0,
    selectedC: 0,
    selectedW: 0
});
export const selection = writable<{ before: string; content: string; after: string }>({
    before: "",
    after: "",
    content: "",
});
export const selectionTracker = writable<{ range: { start: number; end: number }, content: string, scrollTop: number, clientHeight: number, }>(
    {
        range: { start: 0, end: 0 },
        content: "",
        scrollTop: 0,
        clientHeight: 0
    }
);