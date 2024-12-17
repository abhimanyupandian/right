<script lang="ts">
	import { onMount } from "svelte";
	import { page } from "$app/stores";
	import Home from "$lib/components/Home.svelte";
	import Page from "$lib/components/Page.svelte";
	import { Theme } from "$lib/utils/theme";
	import { Arthur } from "$lib/utils/arthur";
	import Website from "$lib/components/Website.svelte";

	let notepadId: string | null = null;
	let isWebsite: boolean = false;

	onMount(() => {
		Theme.install();
		Arthur.restore();
		notepadId = $page.url.searchParams.get("id");
		isWebsite = $page.url.searchParams.has("home");
	});
</script>

<svelte:head>
	<title>Right - Focused Writing</title>
</svelte:head>

{#if isWebsite}
	<Website></Website>
{:else if notepadId}
	<Page></Page>
{:else}
	<Home></Home>
{/if}
