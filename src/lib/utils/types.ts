
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
    absW: number,
    absC: number,
    totalW: number,
    totalC: number,
    totalL: number,
    selectedW: number,
    selectedC: number,
    selectedL: number
}
export type TagType = "title" | "author" | "ref"