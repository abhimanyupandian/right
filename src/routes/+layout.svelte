<script lang="ts">
	import { onMount } from "svelte";
	import "../app.css";
	import { Theme } from "$lib/utils/theme";
	import FileHunter from "$lib/components/FileHunter.svelte";
	import { showFileHunter } from "$lib/utils/stores";

	onMount(() => {
		Theme.install();
	});
</script>

<FileHunter></FileHunter>
<slot></slot>
