<script lang="ts">
	import { slide } from 'svelte/transition';
	import { untrack } from 'svelte';
	import ReceiptItem from './ReceiptItem.svelte';
	import type { BudgetItem } from '$lib/types';

	let {
		item,
		level = 0,
		currency = 'EUR',
		total,
		budgetTotal,
		userTaxTotal,
		initiallyOpen
	} = $props<{
		item: BudgetItem;
		level?: number;
		currency?: string;
		total?: number; // Parent's value for local percentage
		budgetTotal?: number; // Global budget total for tax share calculation
		userTaxTotal?: number; // User's estimated tax contribution
		initiallyOpen?: boolean; // Whether the item should start expanded
	}>();

	let isOpen = $state(untrack(() => initiallyOpen) || false);

	function toggle() {
		if (item.c && item.c.length > 0) {
			isOpen = !isOpen;
		}
	}

	function formatMoney(amount: number) {
		return new Intl.NumberFormat('de-DE', { style: 'currency', currency: currency }).format(amount);
	}

	function formatLargeMoney(amount: number) {
		return new Intl.NumberFormat('de-DE', {
			style: 'currency',
			currency: currency,
			maximumFractionDigits: 0
		}).format(amount);
	}

	// Calculate value to display: either the raw budget or the user's share
	let displayValue = $derived.by(() => {
		if (userTaxTotal && budgetTotal) {
			const share = item.v / budgetTotal;
			return formatMoney(share * userTaxTotal);
		}
		return formatMoney(item.v);
	});

	// Secondary info: If personal mode, show the total budget amount for context.
	// "Instead of percentages in a small font lets show the actual number"
	let secondaryValue = $derived.by(() => {
		if (userTaxTotal && budgetTotal) {
			return formatLargeMoney(item.v);
		}
		return null;
	});
</script>

<div class="border-b border-dashed border-stone-300 last:border-0">
	<!-- Header / Main Row -->
	<button
		class="group flex w-full items-start justify-between px-2 py-3 text-left transition-colors hover:bg-stone-100"
		onclick={toggle}
		disabled={!item.c?.length}
	>
		<div class="flex items-start gap-2 pr-4">
			{#if item.c?.length}
				<span
					class="mt-1.5 text-xs text-stone-400 transition-transform duration-200 {isOpen
						? 'rotate-90'
						: ''}"
				>
					▶
				</span>
			{:else}
				<span class="w-3"></span>
			{/if}

			<div class="flex flex-col">
				<span
					class="text-sm font-medium tracking-wide text-stone-800 uppercase group-hover:text-black"
				>
					{item.l}
				</span>
				{#if item.code}
					<span class="font-mono text-[10px] text-stone-400">{item.code}</span>
				{/if}
			</div>
		</div>

		<div class="flex shrink-0 flex-col items-end">
			<span class="font-mono text-sm font-bold text-stone-800">
				{displayValue}
			</span>
			{#if secondaryValue}
				<span class="font-mono text-[10px] text-stone-400" title="Total Budget Amount">
					Total: {secondaryValue}
				</span>
			{/if}
		</div>
	</button>

	<!-- Children -->
	{#if isOpen && item.c}
		<div
			transition:slide={{ duration: 200 }}
			class="ml-3 border-l border-stone-300 bg-stone-50/50 pl-4"
		>
			{#each item.c as child}
				<ReceiptItem
					item={child}
					level={level + 1}
					{currency}
					total={item.v}
					{budgetTotal}
					{userTaxTotal}
				/>
			{/each}
		</div>
	{/if}
</div>

<style>
	/* Optional: Add custom scrollbar styling if needed, mainly relying on Tailwind */
</style>
