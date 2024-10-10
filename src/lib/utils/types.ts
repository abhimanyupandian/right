
export type IndexType = "title" | "subtitle" | "heading" | "content";
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
export type ModelDetails = {
    name: string,
    model: string,
    pSize: string,
    size: number
}