<script lang="ts">
	import { rootFolder, bootstrapRoot } from "../data";
	import FolderView from "./FolderView.svelte";

	bootstrapRoot();
</script>

{#if $rootFolder == null}
Loading...
{:else}
<FolderView folder={$rootFolder}></FolderView>
{/if}


<style lang="scss">

</style>
