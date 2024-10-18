<script lang="ts">
	import { onMount } from "svelte";
	import "../app.css";
	import { Theme } from "$lib/utils/theme";
	import FileHunter from "$lib/components/FileHunter.svelte";
	
	onMount(() => {
		Theme.install();
	});
</script>

<slot></slot>
