<script lang='ts'>
    export let value = '';
    export let placeholder = '';
    export let style = '';

</script>

<div class="cnt m-0 {$$props.class ? $$props.class : ""}" style={style}>
    <input class="hprior form-control-plaintext"
           type="text" bind:value={value} placeholder={placeholder}>
    <span class="iborder"></span>
</div>

<style lang="scss">
.cnt {
    width: 100%;
    height: 100%;
    position: relative;
    margin: 5px;
}
.iborder {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 0;
    height: 1px;
    border: 1px solid transparent;
    transition: width 0.4s, border 0s 0.4s;
}
input:focus ~ .iborder {
    border-color: #4285F4;
    width: 100%;
    transition: width 0.3s;
}
input.hprior {
    margin: 3px 10px 0 10px;
    margin: 0;
    padding: 0;
    outline: none;
    display: inline-block;
}
</style>
