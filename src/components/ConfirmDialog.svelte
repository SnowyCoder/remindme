<script lang='ts'>
    import { getContext } from 'svelte';

    export let message: string = '';
    export let negativeText: string = 'Cancel';
    export let positiveText: string = 'Ok';
    export let onOkay = () => {};

    const { close } = getContext('simple-modal');

    function onCancel() {
        close();
    }

    function _onOkay() {
        onOkay();
        close();
    }
</script>

<style>
h2 {
    font-size: 2rem;
    text-align: center;
}

.buttons {
    display: flex;
    justify-content: space-between;
}
</style>

<h2>{message}</h2>

<div class="buttons">
    <button class="btn btn-primary" on:click={onCancel}>
        { negativeText }
    </button>
    <button class="btn btn-danger" on:click={_onOkay}>
        { positiveText }
    </button>
</div>
