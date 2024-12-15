// place files you want to import through the `$lib` alias in this folder.

import type { IndexType, TagType } from "./types";
import uuid from "short-uuid";

export const Defaults = {
    notepadName: "Untitled"
}
export const Symbols = {
    EOL: "\n",
    SPACE: " ",
    DOT: "•",
    DASH: "-",
    EMPTY: "",
    AT: "@"
}

export const Tags: Record<TagType, string> = {
    title: "@title" + Symbols.SPACE,
    author: "@author" + Symbols.SPACE,
    ref: "@ref" + Symbols.SPACE,
}

export const Delimeters: Record<IndexType, string> = {
    chapter: ">" + Symbols.SPACE,
    title: "#" + Symbols.SPACE,
    subtitle: "##" + Symbols.SPACE,
    heading: "--" + Symbols.SPACE,
    content: Symbols.EMPTY,
};

export const Indicator: Record<IndexType, string> = {
    chapter: Symbols.SPACE,
    title: Symbols.DOT,
    subtitle: Symbols.DOT,
    heading: Symbols.DASH,
    content: Symbols.EMPTY,
};

export const DefaultTheme = {
    background: "#222",
    f_high: "#eee",
    f_med: "#888",
    f_low: "#666",
    f_inv: "#00f",
    b_high: "#f9a",
    b_med: "#a9f",
    b_low: "#000",
    b_inv: "#af9",
    hl_bg: "black",
    hl_fg: "yellow",
    "font-family": "custom_mono",
    "font-size": "16px",
    "line-height": "24px",
};

export const PageContent = ``

export function getNewNotepadMetdata() {
    return {
        id: uuid.generate(),
        content: `@title ${Defaults.notepadName}`,
        createdOn: Date.now(),
        modifiedOn: Date.now(),
        tags: [],
        name: Defaults.notepadName,
        notes: [],
        author: ""
    }
}

export const ARTHUR_ENABLED = false;