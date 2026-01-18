<script lang="ts">
	import { onMount } from 'svelte';
	import TreeView from 'svelte-tree-view';

	let organigramData: any = null;
	let loading = true;
	let error: Error | null = null;

	onMount(async () => {
		try {
			const response = await fetch('/organigramm-senbjf.json');
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			const data = await response.json();
			organigramData = data;
		} catch (e: any) {
			error = e;
		} finally {
			loading = false;
		}
	});
</script>

<svelte:head>
	<title>Organigram Visualization</title>
</svelte:head>

<div class="p-8">
	<h1 class="text-2xl font-bold">Organigram Visualization</h1>

	{#if loading}
		<p>Loading data...</p>
	{:else if error}
		<p class="text-red-500">Error loading data: {error.message}</p>
	{:else if organigramData}
		<div class="p-4 border rounded-lg bg-white">
			<TreeView data={organigramData} />
		</div>
	{:else}
		<p>No data found.</p>
	{/if}
</div>
