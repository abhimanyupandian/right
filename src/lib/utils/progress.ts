import { Symbols } from "./constants";

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
    static track(progressEl: any) {
        var progress = Array.from({ length: 10 }, (_, i) => Symbols.DOT)
            .map((v, i) => getDefaultProgressHtml(v))
            .join(Symbols.SPACE);
        progressEl.innerHTML = progress;
    }
}

