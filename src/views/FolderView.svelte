<script lang="ts">
    import router from 'page';

    import { CARDS_BASE, EDIT_BASE, Folder } from '../data';
    import { faTrash } from '@fortawesome/free-solid-svg-icons/faTrash';
    import { faPlus } from '@fortawesome/free-solid-svg-icons/faPlus';
    import { faFolderPlus } from '@fortawesome/free-solid-svg-icons/faFolderPlus';
    import { faShareSquare } from '@fortawesome/free-solid-svg-icons/faShareSquare';
    import Icon from 'fa-svelte';
    import { slide } from 'svelte/transition';
    import { EntryType } from '../dataRaw';
    import { getContext } from 'svelte';
    import ConfirmDialog from '../components/ConfirmDialog.svelte';
    import EditableText from '../components/EditableText.svelte';

    const { open } = getContext('simple-modal');


    export let folder: Folder;

    function del(i: number) {
        open(ConfirmDialog, {
            message: 'Do you want to delete "' + folder.data.entries[i] + '"',
            onOkay: async () => {
                await folder.removeEntry(i);
                console.log("Completely removed!");
                folder.data.entries = folder.data.entries;
            }
        });
    }

    async function add() {
        const cardset = await folder.createEntry({
            type: EntryType.CardSet,
            name: 'This is a new cardset',
            cards: [
                'And these are the cards',
                'Click any text to change it',
                'This is the third card',
            ],
        });

        router.show(EDIT_BASE + cardset.path());
    }

    async function addFolder() {
        const nfolder = await folder.createEntry({
            type: EntryType.Folder,
            name: 'New',
            entries: []
        });

        router.show(CARDS_BASE + nfolder.path().slice(0, -1));
    }

    function onEntryClick(index: number) {
        router.show(CARDS_BASE + folder.getEntryPath(index));
    }

    function share() {
        alert('Not done yet');
    }


    let savedName = folder.data.name;
    let timeout = undefined;
    function onFolderDataChange(folderName: string) {
        if (folderName === savedName) return;
        if (timeout) {
            clearInterval(timeout);
        }
        timeout = setTimeout(async () => {
            console.log("Folder saved");
            await folder.save();
            savedName = folder.data.name;
            const newPath = router.current.substring(0, router.current.lastIndexOf('/') + 1) + folder.folderName;
            router.replace(newPath, undefined, undefined, false);
        }, 500);
    }

    $: {
        onFolderDataChange(folder.data.name)
    }
</script>

<div class="container pt-3">
    <div class="text-center div pb-2">
        <EditableText class="h1 title" placeholder="Click here to name the folder" bind:value={folder.data.name}/>
    </div>
    <div class="list-group">
        {#each folder.data.entries as entry, index(entry)}
        <div class="list-group-item list-group-item-action d-flex" transition:slide|local >
            <div class="" style="flex-grow: 1" on:click={() => onEntryClick(index)}>
                <span class="text">{entry}</span>
            </div>
            <button title="Remove" class="btn btn-xs btn-default p-0" style="color: red;" on:click={() => del(index)}>
                <Icon icon={faTrash} class="icon-large"></Icon>
            </button>
        </div>
        {/each}
    </div>
    <div class="btn-group">
        <button class="btn btn-primary" on:click={add}>
            <Icon icon={faPlus} class="icon-lg"></Icon>
        </button>
        <button class="btn btn-primary" on:click={addFolder}>
            <Icon icon={faFolderPlus} class="icon-lg"></Icon>
        </button>
        <button class="btn btn-primary" on:click={share}>
            <Icon icon={faShareSquare} class="icon-lg"></Icon>
        </button>
    </div>
</div>

<style lang="scss">
</style>
