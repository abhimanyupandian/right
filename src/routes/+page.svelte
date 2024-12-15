<script lang="ts">
	import { onMount } from "svelte";
	import { page } from "$app/stores";
	import Home from "$lib/components/Home.svelte";
	import Page from "$lib/components/Page.svelte";

	let notepadId: string | null = null;

	onMount(() => {
		notepadId = $page.url.searchParams.get("id");
	});
</script>

{#if notepadId}
	<Page></Page>
{:else}
	<Home></Home>
{/if}
