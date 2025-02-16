import Dexie, { type EntityTable } from 'dexie';
import { currentDocument as currentDocument, recentsRefresher } from './stores';
import { Defaults, Symbols, Tags } from './constants';
import { get } from 'svelte/store';
import type { TagType } from './types';
import uuid from 'short-uuid';

interface Note {
    noteId: string,
    startLine: number,
    endLine: number,
    content: string,
    createdOn: number,
    updatedOn: number
}

export interface Document {
    id: string;
    type: "notepad" | "pdf",
    name: string;
    content: string | Blob;
    createdOn: number;
    modifiedOn: number;
    notes: Note[],
    author: string,
    tags: string[],
    totalPages: number,
    currentPage: number,
    scrollTop: number,
    scrollLeft: number,
    scaleFactor: number
}

const db = new Dexie('right-db') as Dexie & {
    document: EntityTable<
        Document,
        'id'
    >;
};

// Schema declaration:
db.version(1).stores({
    document: '++id, name, age' // primary key "id" (for the runtime!)
});

export type { Document as Notepad, Note };
export { db };


export class Saver {
    static timeoutId: NodeJS.Timeout;
    static clear() {
        if (Saver.timeoutId) clearTimeout(Saver.timeoutId);
    }

    static getTagValue(line: string, type: TagType) {
        let delimeter = Tags[type];
        return (line.split(delimeter)[1] ?? "").trim();
    }

    static saveScrollPosition(scrollTop: number, scrollLeft: number) {
        let currentDocument_ = get(currentDocument);
        db.document
            .where("id")
            .equals(currentDocument_.id)
            .modify((_, ref) => {
                ref.value.scrollTop = scrollTop;
                ref.value.scrollLeft = scrollLeft;
            });
    }

    static saveScaleFactor(scaleFactor: number) {
        let currentDocument_ = get(currentDocument);
        db.document
            .where("id")
            .equals(currentDocument_.id)
            .modify((_, ref) => {
                ref.value.scaleFactor = scaleFactor;
            });
    }

    private static doSave(pdfContent?: Blob) {
        let currentDocument_ = get(currentDocument);
        currentDocument_.modifiedOn = Date.now();
        currentDocument.set(currentDocument_);
        if (currentDocument_.type === 'notepad') {
            let firstLine = (currentDocument_.content as string).split(Symbols.EOL)[0];

            if (firstLine?.startsWith("@title")) {
                var title = Saver.getTagValue(firstLine, "title").substring(0, 100);
            } else var title = Defaults.notepadName;

            if (title) currentDocument_.name = title;
            else currentDocument_.name = Defaults.notepadName;
        } else {
            currentDocument_.content = pdfContent as Blob;
        }
        db.document
            .where("id")
            .equals(currentDocument_.id)
            .modify((_, ref) => {
                ref.value = currentDocument_;
            });

        recentsRefresher.broadcast.postMessage(true);
    }


    static save(options: { content?: Blob, delay?: number, callback?: () => void } = { delay: 1, callback: () => { } }) {
        Saver.clear();
        return (function () {
            Saver.timeoutId = setTimeout(() => {
                Saver.doSave(options.content);
                if (options.callback) options.callback();
            }, options.delay ?? 1);
        })();
    }
}