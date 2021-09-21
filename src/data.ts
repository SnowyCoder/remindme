import { writable, Writable } from "svelte/store";
import { CardSetData, EntryType, FolderData, loadRaw, removeRaw, saveRaw, EntryData } from "./dataRaw";

export const URL_BASE = __IS_PRODUCTION__ ?  '/remindme/#!' : '/#!';

export const CARDS_BASE = '/cards';
export const EDIT_BASE = '/edit';


export const rootFolder: Writable<Folder | undefined> = writable(undefined);


export const loadedData = new Map<string, Folder | CardSet | null | Promise<Folder | CardSet | null>>();


// Please don't avoid the cache, it's necessary to avoid data races
async function loadEntryNoCache(path: string): Promise<Folder | CardSet | null> {
    const data = await loadRaw(path);
    if (data == null) return null;

    let parsed;
    if (data.type === EntryType.Folder) {
        parsed = new Folder(path, data);
    } else {
        parsed = new CardSet(path, data);
    }

    if (parsed != null) loadedData.set(path, parsed);
    else loadedData.delete(path);

    return parsed;
}

export async function loadEntry(path: string): Promise<Folder | CardSet | null>  {
    //console.log("[CACHE] load " + path);
    const val = loadedData.get(path);

    if (val === undefined) {
        const promise = loadEntryNoCache(path);
        loadedData.set(path, promise);
        return await promise;
    } else if ((val as any).then !== undefined) {
        return await (val as Promise<Folder | CardSet | null>);
    } else {
        return val;
    }
}

function renameCache(oldPath: string, path: string) {
    if (!loadedData.has(oldPath)) {
        throw new Error("Key not found");
    }
    //console.log("[CACHE] rename " + oldPath + " -> " + path);

    const d = loadedData.get(oldPath);
    loadedData.delete(oldPath);
    loadedData.set(path, d);
}

function saveCacheEntry(path: string, entry: Folder | CardSet) {
    //console.log('[CACHE] save ' + path, entry);
    loadedData.set(path, entry);
}

export class FsEntry<T extends FolderData | CardSetData> {
    protected _parent: Folder | undefined;
    protected isParentLoaded: boolean;
    _parentPath: string;
    folderName: string | undefined;
    private oldName: string;

    data: T;

    constructor(pathPar: string | Folder | undefined, data: T) {
        if (pathPar === undefined || pathPar == '/') {
            this._parent = undefined;
            this.isParentLoaded = true;
            this._parentPath = '';
            this.folderName = '';
            if (data.type !== EntryType.Folder) {
                throw new Error('Root is not a folder!');
            }
        } else if (typeof(pathPar) === 'string') {
            // parent not loaded yet
            const divider = pathPar.lastIndexOf('/');
            this._parentPath = pathPar.substring(0, divider + 1);
            this.folderName = pathPar.substring(divider + 1)

            // No foldername = not named yet
            if (this.folderName === '') this.folderName = undefined;
            this.isParentLoaded = false;
        } else {
            // new object constructor
            this._parent = pathPar;
            this._parentPath = this._parent.path();
            this.isParentLoaded = true;
        }
        this.data = data;
        this.oldName = this.data.name;
    }

    private translateFolderName(x: string): string {
        if (x === '') {
            console.trace("NONAME");
            return 'No name'
        }

        return x.replace(/\//, '-');
    }

    private dedupFolderName(original: string): string {
        if (original == this.folderName) return original;

        let name = original;
        let num = 1;
        while (this._parent.data.entries.findIndex(x => x === name) >= 0) {
            name = original + ' ' + num;
            num += 1;
        }
        return name;
    }

    protected async save0(saveParent: boolean): Promise<Array<Promise<unknown>>> {
        const saves = [];

        const parent = await this.parent();
        if (parent === undefined) {
            saveCacheEntry('/', this as any as Folder);
            // We are root baby, we ain' got no parents anyways
            return saves;
        }

        // if file is new (there is no previous foldername) or if it has been renamed
        if (this.folderName === undefined || this.oldName !== this.data.name) {
            let newFname = this.translateFolderName(this.data.name);
            newFname = this.dedupFolderName(newFname);

            if (this.folderName === undefined) {
                // Saving a new entry
                parent.addEntry(newFname);
            } else {
                // Renaming an existing entry
                parent.onEntryRename(this.folderName, newFname);

                const parentPath = parent.path();
                renameCache(parentPath + this.folderName, parentPath + newFname);

                saves.push(
                    removeRaw(parentPath + this.folderName)// remove old
                );
            }
            if (saveParent) {
                saves.push(
                    parent.save()// save folder changes
                );
            }

            let oldFname = this.folderName;
            this.folderName = newFname;
            await this.onRenamed(oldFname)
        }

        saveCacheEntry(parent.path() + this.folderName, this as any as Folder /*| CardSet*/);
        return saves;
    }

    protected async onRenamed(oldFName: string | undefined): Promise<void> {
    }

    _onParentRename(saves: Array<Promise<unknown>>) {
        if (this._parent === undefined) return;
        const newParentPath = this._parent.path();
        if (newParentPath === this._parentPath) return;

        renameCache(
            this._parentPath + this.folderName,
            newParentPath + this.folderName,
        );
        saves.push(
            removeRaw(this._parentPath + this.folderName),// remove old
            saveRaw(newParentPath + this.folderName, this.data)// save new
        );
        this._parentPath = newParentPath;
    }

    async save(saveParent: boolean = true): Promise<void> {
        await Promise.all([
            ...await this.save0(saveParent),
            saveRaw(this._parentPath + this.folderName + (this.isParentLoaded && this._parent === undefined ? '/' : ''), this.data)
        ]);
    }

    async parent(): Promise<Folder | undefined> {
        if (!this.isParentLoaded) {
            const parentPath = this._parentPath.length === 1 ? this._parentPath : this._parentPath.substring(0, this._parentPath.length - 1);
            const loaded = await loadEntry(parentPath);
            if (loaded == null) {
                throw new Error('Parent folder is null at path: ' + parentPath);
            }
            if (loaded.data.type !== EntryType.Folder) {
                throw new Error('Parent is not folder');
            }
            this._parent = loaded as Folder;
        }
        return this._parent;
    }

    async remove(): Promise<void> {
        if (this.isParentLoaded && this.parent === undefined) {
            throw Error('Cannot remove root');
        }
        if (this.folderName === undefined) {
            return; // not created yet
        }

        await removeRaw(this._parentPath + this.folderName);
        loadedData.delete(this._parentPath + this.folderName);
    }
}


export class Folder extends FsEntry<FolderData> {

    async remove(): Promise<void> {
        super.remove();

        const promises = [];
        for (let i = 0; i < this.data.entries.length; i++) {
            promises.push((async () => {
                await (await this.loadEntry(i)).remove();
            })());
        }

        await Promise.all(promises);
    }

    protected async onRenamed(oldFname: string | undefined) {
        const work: Array<Folder | CardSet> = [this];

        const process = async (current, oldParPath, fname) => {
            if (current.data.type !== EntryType.Folder) return;
            const folder = current as Folder;
            for (const x of folder.data.entries) {
                const path = oldParPath + fname + '/' + x;
                const cached = await loadEntry(path);
                if (cached == null) continue; // skip nulls and promises
                work.push(cached as Folder | CardSet);
            }
        }

        await process(this, this._parentPath, oldFname);
        let saves = [];

        while (work.length !== 0) {
            const current = work.pop();

            const oldParPath = current._parentPath;
            current._onParentRename(saves);

            await process(current, oldParPath, current.folderName);
        }

        await Promise.all(saves);
    }

    path(): string {
        return this._parentPath + this.folderName + '/';
    }

    isRoot(): boolean {
        return this.isParentLoaded && this._parent === undefined;
    }

    async loadEntry(index: number): Promise<Folder | CardSet> {
        return await loadEntry(this.getEntryPath(index));
    }

    getEntryPath(index: number): string {
        const part = this.data.entries[index];
        const path = this.path() + part;
        return path;
    }

    async createEntry(data: EntryData): Promise<CardSet | Folder> {
        const res = data.type === EntryType.CardSet ? new CardSet(this, data) : new Folder(this, data);
        await res.save();// create folderName usable for editors (TODO: fix)
        return res;
    }

    addEntry(fname: string) {
        this.data.entries.push(fname);
    }

    // DO NOT CALL THIS OUTSIDE, THIS DOES NOT RENAME THE CHILD!
    onEntryRename(oldFname: string, newFname: string) {
        const index = this.data.entries.indexOf(oldFname);
        if (index < 0) {
            throw new Error('Entry not found');
        }
        this.data.entries[index] = newFname;
    }

    async removeEntry(entryi: number): Promise<void> {
        const entry = await this.loadEntry(entryi);
        this.data.entries.splice(entryi, 1);

        await Promise.all([entry.remove(), this.save()]);
    }
}

export class CardSet extends FsEntry<CardSetData> {
    path(): string {
        return this._parentPath + this.folderName;
    }
}

async function writeDefault(): Promise<Folder> {
    const root = new Folder('/', {
        type: EntryType.Folder,
        name: 'root',
        entries: []
    });

    await new CardSet(root, {
        type: EntryType.CardSet,
        name: 'Hello World!',
        cards: [
            'Hi',
            'These are some new cards',
            'Click on the wrench below to edit these',
            'When in edit mode you can click on the name to change it',
        ]
    }).save();

    return root;
}

export async function loadRoot(): Promise<Folder> {
    const loaded = await loadEntry('/');
    if (loaded == null) {
        return await writeDefault();
    }

    if (loaded.data.type !== EntryType.Folder) {
        throw new Error('Root is not a folder');
    }

    return loaded as Folder;
}

export async function bootstrapRoot() {
    rootFolder.set(await loadRoot());
}
