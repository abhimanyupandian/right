import Dexie, { type EntityTable } from 'dexie';
import { currentNotepad } from './stores';
import { Defaults, Symbols, Tags } from './constants';
import { get } from 'svelte/store';
import type { TagType } from './types';

interface Note {
    noteId: string,
    startLine: number,
    endLine: number,
    content: string,
    createdOn: number,
    updatedOn: number
}

interface Notepad {
    id: string;
    name: string;
    content: string;
    createdOn: number;
    modifiedOn: number;
    notes: Note[],
    author: string,
    tags: string[]
}

const db = new Dexie('right-db') as Dexie & {
    notepad: EntityTable<
        Notepad,
        'id'
    >;
};

// Schema declaration:
db.version(1).stores({
    notepad: '++id, name, age' // primary key "id" (for the runtime!)
});

export type { Notepad, Note };
export { db };


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
        } else var title = Defaults.notepadName;
        
        if (title) currentNotepad_.name = title;
        else currentNotepad_.name = Defaults.notepadName;

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