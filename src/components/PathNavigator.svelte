<script lang='ts'>
    import page from 'page';
    import { fly } from 'svelte/transition';
    import { CARDS_BASE } from '../data';

    import { path } from '../pagejsData';

    let parts;

    $: parts = divideUrl($path)

    function divideUrl(url: string): string[] | undefined {
        if (url == '/') return [];
        if (!url.startsWith('/cards/')) return undefined;

        return decodeURIComponent(url.substring('/cards/'.length)).split('/');
    }

    function onNavClick(index: number) {
        let path = CARDS_BASE;
        for (let i = 0; i <= index; i++) {
            path += '/' + parts[i];
        }
        page.show(path);
    }

</script>


<div class="btn-group d-flex align-items-center">
    {#if parts !== undefined}
    <button class="btn btn-primary" transition:fly on:click={() => page.show('/')}>/</button>
    {#each parts as part, parti}
        <button class="btn btn-primary" on:click={() => onNavClick(parti)} transition:fly>{part}</button>
    {/each}
    {/if}
</div>

<style lang="scss">
    .btn {
        padding: .187rem .37rem;
        padding-right: 0;
        padding-left: 0;

        &:after {
            content: ' >';
            padding-right: 0.2em;
        }

        &:first-of-type {
            padding-left: revert;
        }

        &:last-of-type {
            padding-right: revert;
            &:after {
                content: '';
            }
        }

        &:focus {
            box-shadow: none;
        }
    }

    .squared {
        border-radius: 0;
    }
</style>
