<script lang='ts'>
	import router from 'page'
	import Home from './components/Home.svelte'
	import About from './components/About.svelte'
	import { CardSet, Folder, loadEntry, URL_BASE } from './data';
	import CardSetView from './components/CardSetView.svelte';
	import { setContext } from 'svelte';
	import CardSetEdit from './components/CardSetEdit.svelte';
	import Modal from 'svelte-simple-modal';
	import { EntryType } from './dataRaw';
	import FolderView from './components/FolderView.svelte';
	import NotFound from './components/NotFound.svelte';

	let page = Home;
	let params = {};

	setContext('router', {
		page, params,
	});

	interface PageContext {
		params: any;
	}

	function load(x: any): () => void {
		return () => {
			params = {};
			page = x;
		}
	}

	function loadPage(pager: (data: CardSet | Folder) => void): (ctx: any) => void {
		return async (ctx) => {
			const path = '/' + ctx.params.path as string;
			//const paths = path.split('/', 2);
			const data = await loadEntry(path);
			if (data == null) {
				params = {};
				page = NotFound;
			} else {
				pager(data);
			}
		}
	}

	router.base(URL_BASE);
	router('/', load(Home));
	router('/about', load(About));
	router('/cards/:path(.*)', loadPage((data: CardSet | Folder) => {
		if (data.data.type === EntryType.CardSet) {
			params = { cardset: data };
			page = CardSetView;
		} else {
			params = { folder: data };
			page = FolderView;
		}
	}));
	router('/edit/:path(.*)', loadPage(data => {
		if (data.data.type === EntryType.CardSet) {
			params = { cardset: data };
			page = CardSetEdit;
		} else {
			params = { folder: data };
			page = FolderView;
		}
	}));
	router.redirect('/remindme/', '/');
	router('*', load(NotFound));

	router.start();
</script>

<div class="navbar navbar-expand-lg navbar-dark bg-dark">
	<div class="container">
		<a class="navbar-brand remindme" href={URL_BASE}>
			Remindme
		</a>
	</div>
</div>

<Modal>
	<svelte:component this={page} {...params} />
</Modal>

<style lang="scss">
	:global(.icon-lg) {
		width: 1.5em !important;
		height: 1.5em !important;
	}

	:global(.fill-red) {
		fill: red !important;
	}

</style>
