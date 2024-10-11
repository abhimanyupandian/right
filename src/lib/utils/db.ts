import Dexie, { type EntityTable } from 'dexie';

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
