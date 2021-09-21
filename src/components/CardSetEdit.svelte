<script lang="ts">
    import router from 'page';

    import { CardSet, CARDS_BASE, EDIT_BASE, Folder } from "../data";
    import EditableText from './EditableText.svelte';
    import { faSave } from '@fortawesome/free-solid-svg-icons/faSave'
    import { faPlus } from '@fortawesome/free-solid-svg-icons/faPlus'
    import { faTrash } from '@fortawesome/free-solid-svg-icons/faTrash'
    import Icon from 'fa-svelte';

    import { slide } from 'svelte/transition'

    export let cardset: CardSet;
    // Used to mantain a key for each card in the set (useful for animations)
    let ids = [];

    for (let x of cardset.data.cards) {
        ids.push({})
    }

    async function save() {
        await cardset.save();
        router.show(CARDS_BASE + cardset.path())
    }

    function addOne() {
        ids.push({});
        cardset.data.cards = [...cardset.data.cards, ''];
    }

    function del(index: number) {
        ids.splice(index, 1);
        cardset.data.cards.splice(index, 1);
        cardset.data.cards = cardset.data.cards;
    }
</script>

<div class="container py-3">
	<div class="text-center div pb-3">
        <EditableText class="h1 title" placeholder="Click here to name the cardset" bind:value={cardset.data.name}/>
    </div>

    <div>
        <ul class="list-group">
            {#each cardset.data.cards as card, cardi (ids[cardi])}
                <li class="list-group-item d-flex align-items-center" transition:slide|local>
                    <EditableText bind:value={card} placeholder="OwO, what's this?" />
                    <button title="Remove" class="btn btn-xs btn-default" style="color: red;" on:click={() => del(cardi)}>
                        <Icon icon={faTrash} class="icon-large"></Icon>
                    </button>
                </li>
            {/each}
        </ul>
    </div>

    <div class="btn-group">
        <button title="Save" class="btn btn-primary" on:click={save}>
            <Icon icon={faSave} class="icon-large"></Icon>
        </button>
        <button title="Add" class="btn btn-secondary" on:click={addOne}>
            <Icon icon={faPlus} class="icon-large"></Icon>
        </button>
    </div>
</div>

<style lang="scss">
    .div :global(.title) {
        :global(input) {
            text-align: center;
        }
    }
</style>
