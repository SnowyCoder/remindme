<script lang="ts">
    import router from 'page'
    import Icon from 'fa-svelte';
    import { faDiceFour } from '@fortawesome/free-solid-svg-icons/faDiceFour'
    import { faWrench } from '@fortawesome/free-solid-svg-icons/faWrench'

    import { CardSet, CARDS_BASE, EDIT_BASE } from "../data";

    export let cardset: CardSet;

    let chosenCard = cardset.data.cards[0] || 'none';

    function chooseCard(): void {
        const cards = cardset.data.cards;
        if (cards.length === 0) return;
        if (cards.length === 1) {
            chosenCard = cards[0];
            return;
        }
        let x = chosenCard;
        while (x === chosenCard) {
            x = cards[Math.floor(Math.random() * cards.length)];
        }
        chosenCard = x;
    }

    chooseCard();

    function gotoEdit() {
        router.show(EDIT_BASE + router.current.substring(CARDS_BASE.length))
    }

</script>

<div class="container py-3">
	<h1 class="text-center">
		{ cardset.data.name }
    </h1>

    <div>
        <h3 class="chosen-card pb-2">
            { chosenCard }
        </h3>
    </div>

    <div class="btn-group">
        <button class="btn btn-primary" on:click={chooseCard}>
            <Icon icon={faDiceFour} class="icon-lg"></Icon>
        </button>
        <button class="btn btn-primary" on:click={gotoEdit}>
            <Icon icon={faWrench} class="icon-lg"></Icon>
        </button>
    </div>
</div>

<style lang="scss">
    .chosen-card {
        border-bottom: 2px solid black;
        display: inline-block;
    }
</style>
