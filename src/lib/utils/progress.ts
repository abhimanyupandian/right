import { get } from "svelte/store";
import { Delimeters, Symbols } from "./constants";
import { currentNotepad, index, stats } from "./stores";
import type { IndexEntry, IndexType } from "./types";

const getDefaultProgressHtml = (v: string) => `<span class="opacity-15">${v}</span>`;

export class Progress {
    static get(editor: any) {
        var scrollDistance = editor.scrollTop;
        var scrollMax = editor.scrollHeight - editor.offsetHeight;
        var ratio = Math.min(
            1,
            scrollMax === 0 ? 0 : scrollDistance / scrollMax,
        );
        var percent = (
            Math.round(
                Math.min(1, scrollMax === 0 ? 0 : scrollDistance / scrollMax) *
                1000,
            ) / 10
        ).toFixed(1);
        var html = Array.from({ length: 10 }, (_, i) => Symbols.DOT)
            .map((v, i) => {
                return i < ratio * 10 ? `<b>${v}</b>` : getDefaultProgressHtml(v);
            })
            .join(Symbols.SPACE);

        return { percent, html }
    }
    static init(target: any) {
        if (!target) return;
        var progress = Array.from({ length: 10 }, (_, i) => Symbols.DOT)
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
            var delimeter = Delimeters[type];
            return (line.split(delimeter)[1] ?? "").trim();
        }

        function isTag(line: string) {
            return line.startsWith(Symbols.AT);
        }
        currentNotepad.subscribe((c) => {
            if (!c) return;
            var index_: IndexEntry[] = [];
            var line = 0;
            var lastIndex = 0;
            var stats_ = get(stats);

            // Resetting
            stats_.totalC = 0;
            stats_.totalW = 0;
            stats_.absC = 0;
            stats_.absW = 0;

            for (var eachLine of c.content.split(Symbols.EOL)) {
                var cCount = eachLine.length;
                var wCount = eachLine
                    .split(Symbols.SPACE)
                    .filter((e) => e.trim().length).length;

                var start = stats_.absC + line;
                var end = start + cCount;

                stats_.absC += cCount;
                stats_.absW += wCount;

                if (!isTag(eachLine)) { // Tags are not content but metadata
                    stats_.totalC += cCount;
                    stats_.totalW += wCount;
                }
                var type = getIndexType(eachLine) as IndexType;
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

