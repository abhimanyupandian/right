import { DefaultTheme } from "./constants";

export class Theme {
    static install(theme: any = DefaultTheme, host: HTMLElement = document.body) {
        var el = document.createElement("style");
        el.innerHTML = `:root { --background: ${theme.background}; --f_high: ${theme.f_high}; --f_med: ${theme.f_med}; --f_low: ${theme.f_low}; --f_inv: ${theme.f_inv}; --b_high: ${theme.b_high}; --b_med: ${theme.b_med}; --b_low: ${theme.b_low}; --b_inv: ${theme.b_inv}; --hl_bg: ${theme.hl_bg}; --hl_fg: ${theme.hl_fg}; --font-size: ${theme["font-size"]}; --font-family: ${theme["font-family"]}; --line-height: ${theme["lineHeight"]}}`;
        host.appendChild(el);
    }

}