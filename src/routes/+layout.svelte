<script lang="ts">
	import { onMount } from "svelte";
	import "../app.css";
	import { Theme } from "$lib/utils/theme";
	import { Arthur } from "$lib/utils/arthur";

	onMount(() => {
		Theme.install();
		Arthur.restore();
	});
</script>

<slot></slot>
