import TimeAgo from "javascript-time-ago";
import en from "javascript-time-ago/locale/en";

TimeAgo.addLocale(en);
const timeAgo = new TimeAgo("en-US");

export function getCurrentTime() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, "0"); // Get hours and pad with 0 if needed
    const minutes = now.getMinutes().toString().padStart(2, "0"); // Get minutes and pad with 0 if needed
    return `${hours}:${minutes}`;
}

export function startTicker(cb: (time: string) => void) {
    let clock = setInterval(() => {
        let time = getCurrentTime();
        cb(time);
    }, 1000);
    return () => {
        clearInterval(clock);
    };
}

export function getTimeAgo(lastSaveTime: number) {
    return timeAgo.format(new Date(lastSaveTime));
}