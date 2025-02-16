import { get } from "svelte/store";
import { Delimeters, Symbols } from "./constants";
import { currentDocument, index, stats } from "./stores";
import type { IndexEntry, IndexType } from "./types";

const getDefaultProgressHtml = (v: string) => `<span class="opacity-15">${v}</span>`;

export function roundPercent(value: number) {
    let percent = (
        Math.round(
            Math.min(1, value) *
            1000,
        ) / 10
    ).toFixed(1);
    return percent;
}

export class Progress {
    static get(target: any) {
        if (target.scrollTop != undefined) { // is notepad
            let scrollDistance = target.scrollTop;
            let scrollMax = target.scrollHeight - target.offsetHeight;
            let ratio = Math.min(
                1,
                scrollMax === 0 ? 0 : scrollDistance / scrollMax,
            );
            let percent_ = roundPercent(scrollMax === 0 ? 0 : scrollDistance / scrollMax);
        } else {
            let percent_ = target as string;
            let ratio = Math.min(
                1,
                parseFloat(percent_) / 100,
            );
        }
        let html = Array.from({ length: 10 }, (_, i) => Symbols.DOT)
            .map((v, i) => {
                return i < ratio * 10 ? `<b>${v}</b>` : getDefaultProgressHtml(v);
            })
            .join(Symbols.SPACE);

        return { percent: percent_, html }
    }
    static init(target: any) {
        if (!target) return;
        let progress = Array.from({ length: 10 }, (_, i) => Symbols.DOT)
            .map((v, i) => getDefaultProgressHtml(v))
            .join(Symbols.SPACE);
        target.innerHTML = progress;
    }
    static track() {
        function getIndexType(line: string) {
            if (line.startsWith(Delimeters.title)) return "title";
            else if (line.startsWith(Delimeters.subtitle)) return "subtitle";
            else if (line.startsWith(Delimeters.heading)) return "heading";
            else if (line.startsWith(Delimeters.chapter)) return "chapter";
            return "content";
        }

        function splitByType(line: string, type: IndexType) {
            let delimeter = Delimeters[type];
            return (line.split(delimeter)[1] ?? "").trim();
        }

        function isTag(line: string) {
            return line.startsWith(Symbols.AT);
        }
        currentDocument.subscribe((c) => {
            if (!c || c.type !== 'notepad') {
                let stats_ = get(stats);
                return;
            }
            let index_: IndexEntry[] = [];
            let line = 0;
            let lastIndex = 0;
            let stats_ = get(stats);

            // Resetting
            stats_.totalC = 0;
            stats_.totalW = 0;
            stats_.absC = 0;
            stats_.absW = 0;

            for (let eachLine of (c.content as string).split(Symbols.EOL)) {
                let cCount = eachLine.length;
                let wCount = eachLine
                    .split(Symbols.SPACE)
                    .filter((e) => e.trim().length).length;

                let start = stats_.absC + line;
                let end = start + cCount;

                stats_.absC += cCount;
                stats_.absW += wCount;

                if (!isTag(eachLine)) { // Tags are not content but metadata
                    stats_.totalC += cCount;
                    stats_.totalW += wCount;
                }
                let type = getIndexType(eachLine) as IndexType;
                if (type != "content") {
                    lastIndex = line;
                    stats_.totalC -= 2; // Excluding the symbol and space
                    stats_.totalW -= 1; // Excluding the symbol
                }
                index_.push({
                    line,
                    label:
                        type == "content"
                            ? Symbols.EMPTY
                            : splitByType(eachLine, type),
                    type,
                    index: lastIndex,
                    range: { start, end },
                });
                line++;
            }
            stats.set(stats_);
            index.set(index_);
        });
    }
}

