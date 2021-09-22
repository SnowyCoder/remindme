import page from 'page';
import { readable } from "svelte/store";


let setPath: (path: string) => void = x => {};

export const path = readable(page.current, set => {
    set(page.current);
    setPath = set;
});

// Yayy, let's monkeypatch it up!
function patchFunction<T extends Function>(x: T, name: string): T {
    return function patch() {
        const res = x.apply(this, arguments);
        //console.log("[PATCHED] " + name + ": " + page.current);
        setPath(page.current);
        return res;
    } as any as T;
}

// The entry points that seemm to cover all the cases are these:
page.start = patchFunction(page.start, 'start');

// I tried to monkey patch pagejs methods but they already saved internal copies
// so to cut right trough them we monkeypatch history directly
history.pushState = patchFunction(history.pushState, 'history.pushState');
history.replaceState = patchFunction(history.replaceState, 'history.replaceState');

// To listen for history backs we don't need any monkeypatching (fortunately)
window.addEventListener('popstate', () => {
    setTimeout(() => {
        setPath(page.current)
    }, 0);
});
