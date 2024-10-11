// place files you want to import through the `$lib` alias in this folder.

import type { IndexType, TagType } from "./types";
import { v4 as uuidv4 } from "uuid";

export const Defaults = {
    notepadName: "Untitled"
}
export const Symbols = {
    EOL: "\n",
    SPACE: " ",
    DOT: "•",
    DASH: "-",
    EMPTY: ""
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

export const PageContent = `> The Modern Engineer

# Introduction

We are born into this world without choosing—without choosing to be born, without choosing the parents we are born to, our location in time and space we are born at, the bodies we are born into, and all the rest. As we open our eyes, we peer out at a world moving around us—a world that we had no say in. And soon, to paraphrase existentialist philosopher Jean-Paul Sartre, we will begin to face the problem of choosing what we do with what's been done to us. Jean-Paul Sartre is one of the most widely recognized and cited thinkers of existentialism, a movement of thinking that took form during the nineteenth century, initially fashioned by individuals like Søren Kierkegaard, Friedrich Nietzsche, and Fyodor Dostoevsky, and then further popularized by individuals including Albert Camus, Martin Heidegger, and, of course, Sartre. In Sartre's lecture, Existentialism is a Humanism, he famously summarized the primary principle of existentialism with the line: “Existence precedes essence.” Essence, here, means the qualities of a thing that create its purpose. For example, Sartre referenced how a paper knife is designed with a specific purpose in mind before it is made, and only once it is given a predetermined purpose and designed accordingly, is it manufactured into being; in which case, its essence precedes its existence. With the exception of itself, humanity does this with nearly everything it makes. As rational beings, we create things for reasons. Even if the reason is to make the point that we can create things for no reason, we have merely found ourselves in the paradox of creating for the reason of having none. We exist with the innate desire for reasons—reasons for what we do, who we are, why we are, and so on. And here lies the beginning of our existential problem. According to Sartre and many others, there is no predetermined meaning or reason to human life. There is no authority figure designing us or our lives. And there is no essence to our existence prior to our existence. Rather, life exists for itself. Beyond itself, it is intrinsically meaningless. Whenever we confront this potential realization—that the nature of life, including our self, appears not to agree with reason—we can often find ourselves in a sort of existential crisis. However, Sartre and the existentialists don't see this as despairing, but rather, freeing.

Robert Pantano. The Art of Living a Meaningless Existence Ideas From Philosophy That Change the Way You Think (Robert Pantano) (Z-Library) (pp. 97-98). Kindle Edition. 
`

export function getNewNotepadMetdata() {
    return {
        id: uuidv4(),
        content: `@title ${Defaults.notepadName}

> Lorem Ipsum

# Introduction
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

## Subheading
Donec sit amet nulla a arcu malesuada efficitur non vitae velit. Proin ultricies vehicula magna, sit amet suscipit magna aliquet id. Integer blandit purus vitae sapien suscipit, sed vulputate lacus molestie. Nullam bibendum, tortor a tincidunt malesuada, justo nisl vestibulum velit, eget fermentum risus dui at mauris.
        `,
        createdOn: Date.now(),
        modifiedOn: Date.now(),
        tags: [],
        name: Defaults.notepadName,
        notes: [],
        author: ""
    }
}