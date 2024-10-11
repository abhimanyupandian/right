
export type IndexType = "chapter" | "title" | "subtitle" | "heading" | "content";
export type IndexEntry = {
    type: IndexType;
    line: number;
    label: string;
    index?: number;
    range: { start: number, end: number }
};
export type Stats = {
    percent: string,
    totalW: number,
    totalC: number,
    selectedW: number,
    selectedC: number
}
export type TagType = "title" | "author" | "ref"