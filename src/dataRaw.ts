import localforage from "localforage";

export enum EntryType {
    CardSet = 'c',
    Folder = 'f',
}

export interface CardSetData {
    type: EntryType.CardSet;
    name: string;
    cards: Array<string>;
}

export interface FolderData {
    type: EntryType.Folder;
    name: string;
    entries: Array<string>;
}

export type EntryData = CardSetData | FolderData;


export function saveRaw(path: string, item: EntryData): Promise<EntryData> {
    //console.info("[RAW] save ", path, item);
    return localforage.setItem(path, item);
}

export function loadRaw(path: string): Promise<EntryData | null> {
    //console.info("[RAW] load ", path);
    return localforage.getItem(path)
}

export function removeRaw(path: string): Promise<void> {
    //console.info("[RAW] remove ", path);
    return localforage.removeItem(path);
}
