import { writable } from "svelte/store";
import { type IndexEntry, type Stats } from "./types";
import { type Notepad } from "./db";

function createSessionState(label: string) {
    const { subscribe, set, update } = writable<string>("");
    return {
        subscribe,
        set,
        update,
        broadcast: new BroadcastChannel(label)
    }
}

export const recentsRefresher = createSessionState('recentsRefresher');

export const showFileHunter = writable<boolean>(false);
export const currentNotepad = writable<Notepad>();
export const index = writable<IndexEntry[]>([]);
export const stats = writable<Stats>({
    percent: "0.0",
    totalC: 0,
    totalW: 0,
    absC: 0,
    absW: 0,
    selectedC: 0,
    selectedW: 0,
    totalL: 0,
    selectedL: 0
});
export const selection = writable<{ before: string; content: string; after: string }>({
    before: "",
    after: "",
    content: "",
});
