import { get, writable } from "svelte/store";
import { type IndexEntry, type Stats, type TagType } from "./types";
import { db, type Notepad } from "./db";
import { Defaults, Symbols, Tags } from "./constants";

export const showFileHunter = writable<boolean>(false);
export const currentNotepad = writable<Notepad>();
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

export class Saver {
    static timeoutId: NodeJS.Timeout;
    static clear() {
        if (Saver.timeoutId) clearTimeout(Saver.timeoutId);
    }

    static getTagValue(line: string, type: TagType) {
        var delimeter = Tags[type];
        return (line.split(delimeter)[1] ?? "").trim();
    }

    private static doSave() {
        var currentNotepad_ = get(currentNotepad);
        currentNotepad_.modifiedOn = Date.now();
        currentNotepad.set(currentNotepad_);
        var firstLine = currentNotepad_.content.split(Symbols.EOL)[0];
        if (firstLine?.startsWith("@title")) {
            var title = Saver.getTagValue(firstLine, "title").substring(0, 100);
            if (title) currentNotepad_.name = title;
            else currentNotepad_.name = Defaults.notepadName;
        }

        db.notepad
            .where("id")
            .equals(currentNotepad_.id)
            .modify((_, ref) => {
                ref.value = currentNotepad_;
            });
    }


    static save(options: { delay?: number, callback?: () => void } = { delay: 1, callback: () => { } }) {
        Saver.clear();
        return (function () {
            Saver.timeoutId = setTimeout(() => {
                Saver.doSave();
                if (options.callback) options.callback();
            }, options.delay ?? 1);
        })();
    }
}