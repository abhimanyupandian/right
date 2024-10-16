import { get } from "svelte/store";
import { Symbols } from "./constants";
import { currentNotepad, index } from "./stores";

export function getCaretCoordinates(textArea: any) {
    const div = document.createElement("div");
    const span = document.createElement("span");
    const computedStyle = window.getComputedStyle(textArea);

    // Apply all styles to the div so it mimics the text area
    Array.from(computedStyle).forEach((key: any) => {
        div.style[key] = computedStyle[key];
    });

    // Create a mirror of the text inside the text area
    var caret =
        textArea.selectionDirection == "forward"
            ? textArea.selectionEnd
            : textArea.selectionStart;
    div.textContent = textArea.value.substring(0, caret);
    span.textContent =
        textArea.value.substring(textArea.selectionEnd) || ".";

    div.appendChild(span);
    document.body.appendChild(div);

    // Ensure the div is out of sight
    div.style.position = "absolute";
    div.style.visibility = "hidden";
    div.style.whiteSpace = "pre-wrap";
    div.style.wordWrap = "break-word";
    div.style.height = "auto";
    div.style.width = `${textArea.clientWidth}px`;

    // Adjust for the text area scroll
    div.scrollTop = textArea.scrollTop;

    // Now the span is where the caret should be, get its coordinates
    const rect = span.getBoundingClientRect();

    // Clean up by removing the div
    document.body.removeChild(div);

    return {
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
    };
}

function scrollTo(target: any, to: number, content: string) {
    const div = document.createElement("div");
    div.innerText = content.slice(0, to);
    document.body.appendChild(div);
    div.style.width = `${target.clientWidth}px`;
    var offsetHeight = div.clientHeight;
    div.remove();
    smoothScroll(target, offsetHeight, 200);
}

function smoothScroll(target: any, to: number, duration: number) {
    const increment = 20; // this is the line height
    const start = target.scrollTop;
    const change = to - start - increment;
    let currentTime = 0;

    function animation() {
        currentTime += increment;
        const run = easeInOutQuad(currentTime, start, change, duration);
        target.scrollTop = run;
        if (currentTime < duration) requestAnimationFrame(animation);
    }

    function easeInOutQuad(t: number, b: number, c: number, d: number) {
        t /= d / 2;
        if (t < 1) return (c / 2) * t * t + b;
        t--;
        return (-c / 2) * (t * (t - 2) - 1) + b;
    }

    requestAnimationFrame(animation);
}

export function scrollToLine(line: number) {
    var editor = document.getElementById("editor") as any;
    var content = get(currentNotepad).content;
    const lineArr = content.split(Symbols.EOL, line + 1);
    const arrJoin = lineArr.join(Symbols.EOL);
    const from = arrJoin.length - lineArr[line].length;
    const to = arrJoin.length;
    scrollTo(editor, to, content);

    var selection = get(index)[line]
    var cursorPosition = selection.index ?? -1;

    editor.setSelectionRange(selection.range.start, selection.range.end);
    editor.focus();
    return { from, to, cursorPosition };
}


export function clickOutside(element: any, callbackFunction: any) {
    function onClick(event: any) {
        if (!element.contains(event.target)) {
            callbackFunction();
        }
    }

    document.body.addEventListener('click', onClick);

    return {
        update(newCallbackFunction: any) {
            callbackFunction = newCallbackFunction;
        },
        destroy() {
            document.body.removeEventListener('click', onClick);
        }
    }
}