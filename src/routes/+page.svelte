<script lang="ts">
	import ReceiptItem from '$lib/components/ReceiptItem.svelte';
	import { onMount } from 'svelte';
	import { fade, slide } from 'svelte/transition';
	import type { BudgetData, BudgetItem } from '$lib/types';
	import { triviaItems, type TriviaConfig } from '$lib/trivia';
	import * as m from '$paraglide/messages';
	import { getLocale, setLocale } from '$paraglide/runtime';

	let budgetData: BudgetData | null = $state(null);
	let translationMap: Record<string, string> = $state({});
	let loading = $state(true);

	// User Input State
	let annualIncome = $state(50000);

	// Trivia State
	let currentTrivia = $state<{ config: TriviaConfig; amount: number } | null>(null);
	let seenTriviaIndices = new Set<number>();

	// Recursively divide all values by 2
	function halveValues(item: any) {
		item.v = item.v / 2;
		if (item.c) {
			item.c.forEach(halveValues);
		}
	}

	// Helper to find sum of items matching a search term
	function findItemSum(items: BudgetItem[], searchTerm: string): number {
		let sum = 0;
		for (const item of items) {
			if (item.l.toLowerCase().includes(searchTerm.toLowerCase())) {
				sum += item.v;
			}
			if (item.c) {
				sum += findItemSum(item.c, searchTerm);
			}
		}
		return sum;
	}

	function generateTrivia() {
		if (!budgetData || !userTaxContribution) return;

		let attempts = 0;
		let found = false;

		// Create a list of available indices
		let availableIndices = triviaItems.map((_, i) => i).filter((i) => !seenTriviaIndices.has(i));

		// If we've seen everything, reset
		if (availableIndices.length === 0) {
			seenTriviaIndices.clear();
			availableIndices = triviaItems.map((_, i) => i);
		}

		while (attempts < 5 && !found && availableIndices.length > 0) {
			// Pick random index from available
			const randomIndexIndex = Math.floor(Math.random() * availableIndices.length);
			const targetIndex = availableIndices[randomIndexIndex];
			const randomConfig = triviaItems[targetIndex];

			const totalForTerm = findItemSum(budgetData.data, randomConfig.search);

			if (totalForTerm > 0) {
				const share = (totalForTerm / budgetData.meta.total_budget) * userTaxContribution;
				currentTrivia = {
					config: randomConfig,
					amount: share
				};
				found = true;
				seenTriviaIndices.add(targetIndex);
			} else {
				// If not found in budget, remove from available so we don't pick it again immediately
				console.warn(`No budget data found for trivia: ${randomConfig.search}`);
				availableIndices.splice(randomIndexIndex, 1);
				attempts++;
			}
		}
	}

	onMount(async () => {
		try {
			const res = await fetch('/budget_clean.json');
			const data = (await res.json()) as BudgetData;
			// JSON is for 2024+2025, so we divide by 2 for a single year average
			// halveValues(data.meta); // Meta structure is different
			data.data.forEach(halveValues);
			// Also fix the root total
			data.meta.total_budget = data.meta.total_budget / 2;

			budgetData = data;

			// Load translations
			const transRes = await fetch('/translations_en.json');
			translationMap = await transRes.json();

			// Generate initial trivia deferred
			setTimeout(() => {
				generateTrivia();
			}, 1000);
		} catch (e) {
			console.error('Failed to load budget data', e);
		} finally {
			loading = false;
		}
	});

	function toggleLanguage() {
		const next = getLocale() === 'de' ? 'en' : 'de';
		setLocale(next);
	}

	// Regenerate trivia when tax changes, but debounce/defer it
	$effect(() => {
		// Just referencing userTaxContribution to track dependency
		const _ = userTaxContribution;

		// Only auto-update if data is loaded and we have a value
		if (budgetData && userTaxContribution > 0) {
			// Debounce/defer to avoid blocking input or render
			const timer = setTimeout(() => {
				// Re-check availability inside callback
				if (!budgetData) return;

				// Don't regenerate if we already have one that works,
				// unless the user specifically asks (which calls the function directly)
				// OR if the tax change significantly alters the value.
				// Actually, let's only update the AMOUNT of the current trivia if it exists,
				// rather than picking a new random one, to save performance.
				if (currentTrivia) {
					const totalForTerm = findItemSum(budgetData.data, currentTrivia.config.search);
					if (totalForTerm > 0) {
						currentTrivia.amount =
							(totalForTerm / budgetData.meta.total_budget) * userTaxContribution;
					}
				}
			}, 500);
			return () => clearTimeout(timer);
		}
	});

	function formatMoney(amount: number) {
		const locale = getLocale() === 'de' ? 'de-DE' : 'en-US';
		return new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(amount);
	}

	function formatLargeMoney(amount: number) {
		const locale = getLocale() === 'de' ? 'de-DE' : 'en-US';
		return new Intl.NumberFormat(locale, {
			style: 'currency',
			currency: 'EUR',
			maximumFractionDigits: 0
		}).format(amount);
	}

	/*
	 * Simplified German Income Tax Estimation (2024, Class 1)
	 * This is a rough approximation for illustrative purposes.
	 * Logic: Gross -> Deduct ~21% Social Security & standard expenses -> Taxable -> Apply tariff
	 */
	function calculateGermanTax(gross: number) {
		if (gross <= 0) return 0;

		// Deduct Social Security (approx 21%) and basic expenses (Werbungskosten ~1230)
		// This is a heuristic to get from Gross to Taxable Income (zvE)
		const approximateDeductions = gross * 0.21 + 1230;
		const taxableIncome = Math.max(0, gross - approximateDeductions);

		// 2024 Tariff Formulas
		let tax = 0;

		if (taxableIncome <= 11604) {
			tax = 0;
		} else if (taxableIncome <= 17005) {
			const y = (taxableIncome - 11604) / 10000;
			tax = (983.21 * y + 1400) * y;
		} else if (taxableIncome <= 66760) {
			const z = (taxableIncome - 17005) / 10000;
			tax = (206.05 * z + 2397) * z + 1025.38;
		} else if (taxableIncome <= 277825) {
			tax = 0.42 * taxableIncome - 9972.98;
		} else {
			tax = 0.45 * taxableIncome - 18307.73;
		}

		return Math.floor(tax);
	}

	async function shareReceipt() {
		let text = '';
		const amount = formatMoney(userTaxContribution);
		const url = window.location.href;

		if (currentTrivia) {
			const subject =
				getLocale() === 'en' && translationMap[currentTrivia.config.name]
					? translationMap[currentTrivia.config.name]
					: currentTrivia.config.name;

			text = m.share_message_trivia({
				amount: formatMoney(currentTrivia.amount),
				subject: subject.toLowerCase()
			});
		} else {
			text = m.share_message_generic({ amount });
		}

		if (navigator.share) {
			try {
				await navigator.share({
					title: m.receipt_title(),
					text: text,
					url: url
				});
			} catch (err) {
				console.error('Share failed', err);
			}
		} else {
			// Fallback: Copy to clipboard
			try {
				await navigator.clipboard.writeText(`${text} ${url}`);
				alert(m.share_link_copied());
			} catch (err) {
				console.error('Clipboard failed', err);
			}
		}
	}

	let userTaxContribution = $derived(calculateGermanTax(annualIncome));

	// Toggle for showing raw budget vs personal receipt
	let displayMode = $state('personal'); // 'personal' or 'total'
</script>

<div
	class="flex min-h-screen flex-col items-center bg-stone-200 px-4 py-12 font-sans sm:px-6 lg:px-8"
>
	<!-- Header / Input Section -->
	<div class="mb-8 w-full max-w-2xl space-y-6 text-center">
		<div class="flex justify-end">
			<button
				onclick={toggleLanguage}
				class="rounded-full bg-stone-300 px-3 py-1 text-xs font-bold text-stone-600 uppercase transition-colors hover:bg-stone-400"
			>
				{getLocale() === 'de' ? 'Switch to English' : 'Auf Deutsch wechseln'}
			</button>
		</div>

		<h1 class="text-4xl font-extrabold tracking-tight text-stone-900">{m.header_title()}</h1>
		<p class="mx-auto max-w-lg text-stone-600">
			{m.header_subtitle()}
		</p>

		<div
			class="mx-auto flex max-w-md items-center rounded-xl border border-stone-300 bg-white p-2 shadow-sm"
		>
			<div class="px-4 text-lg font-bold text-stone-500">€</div>
			<input
				type="number"
				bind:value={annualIncome}
				class="w-full flex-1 text-2xl font-bold text-stone-800 outline-none placeholder:text-stone-300"
				placeholder={m.placeholder_income()}
			/>
			<button
				class="ml-2 rounded-lg bg-blue-600 px-6 py-2 font-medium text-white transition-colors hover:bg-blue-700"
				onclick={() => {
					/* No-op, reactive */
				}}
			>
				{m.button_calculate()}
			</button>
		</div>

		{#if userTaxContribution > 0}
			<div class="text-sm font-medium text-stone-500" transition:fade>
				{m.receipt_tax_estimated()}:
				<span class="font-bold text-stone-900">{formatMoney(userTaxContribution)}</span>
			</div>
		{/if}
	</div>

	<div class="relative w-full max-w-2xl bg-[#fdfbf7] shadow-2xl">
		<!-- Receipt jagged top edge (visual only using CSS/SVG or just standard border for now) -->
		<!-- We can simulate a jagged edge with a repeating gradient if we want to be fancy,
         but a simple clean receipt is safer for now. -->

		<div class="border-b-2 border-dashed border-stone-300 p-8 pb-4 text-center">
			<div class="mb-4 flex justify-center">
				<!-- Icon or Logo -->
				<div
					class="flex h-16 w-16 items-center justify-center rounded-full bg-stone-800 text-white"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="1.5"
						stroke="currentColor"
						class="h-8 w-8"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z"
						/>
					</svg>
				</div>
			</div>
			<h1 class="mb-1 text-3xl font-bold tracking-wider text-stone-900 uppercase">
				{m.receipt_title()}
			</h1>
			<p class="font-mono text-xs tracking-widest text-stone-500 uppercase">
				Berlin Treasury Dept.
			</p>

			<div class="mt-6 flex justify-between font-mono text-xs text-stone-500">
				<span
					>{m.date_label()}: {new Date().toLocaleDateString(
						getLocale() === 'de' ? 'de-DE' : 'en-US'
					)}</span
				>
				<span>{m.term_label()}: 2025*</span>
			</div>
			<div class="flex justify-between font-mono text-xs text-stone-500">
				<span>TRANS ID: #BER-8829-XJ</span>
				<span>
					{#if userTaxContribution > 0}
						{m.personalized_label()}
					{:else}
						{m.generic_label()}
					{/if}
				</span>
			</div>
		</div>

		<!-- Trivia / Did You Know Section -->
		{#if currentTrivia && userTaxContribution > 0}
			<div
				class="border-y-2 border-dashed border-stone-300 bg-stone-100 p-4 transition-all"
				transition:slide
			>
				<div class="flex items-start gap-4">
					<div class="pt-1 text-3xl select-none">{currentTrivia.config.icon}</div>
					<div class="flex-1">
						<p class="mb-1 font-mono text-sm text-stone-600">
							<strong class="text-stone-900">{formatMoney(currentTrivia.amount)}</strong> went to {getLocale() ===
								'en' && translationMap[currentTrivia.config.name]
								? translationMap[currentTrivia.config.name]
								: currentTrivia.config.name}.
						</p>
						<!-- <p class="text-sm font-bold text-stone-800 italic">
							{currentTrivia.config.question}
						</p> -->
					</div>
					<button
						onclick={generateTrivia}
						class="rounded-full p-2 text-stone-400 transition-colors hover:bg-stone-200 hover:text-stone-800"
						title={m.trivia_refresh()}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="1.5"
							stroke="currentColor"
							class="h-5 w-5"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
							/>
						</svg>
					</button>
				</div>
			</div>
		{/if}

		<!-- Items List -->
		<div class="min-h-[300px] px-6 py-6">
			{#if loading}
				<div class="flex h-40 animate-pulse items-center justify-center text-stone-400">
					Loading Budget Data...
				</div>
			{:else if budgetData}
				{#each budgetData.data as item, i}
					<ReceiptItem
						{item}
						currency="EUR"
						total={budgetData.meta.total_budget}
						budgetTotal={budgetData.meta.total_budget}
						userTaxTotal={userTaxContribution}
						initiallyOpen={i === 0}
						{translationMap}
						locale={getLocale()}
					/>
				{/each}
			{:else}
				<p class="text-center text-red-500">Error loading data.</p>
			{/if}
		</div>

		<!-- Total -->
		<div class="border-t-2 border-dashed border-stone-300 bg-stone-100 p-6">
			<div class="mb-2 flex items-end justify-between">
				<div class="flex flex-col">
					<span class="text-sm font-medium text-stone-500 uppercase">
						{#if userTaxContribution > 0}
							{m.mode_personal()}
						{:else}
							{m.mode_total()}
						{/if}
					</span>
					{#if userTaxContribution > 0 && budgetData}
						<span class="mt-1 font-mono text-[10px] text-stone-400 uppercase">
							/ {m.footer_sum_total()}: {formatLargeMoney(budgetData.meta.total_budget)}
						</span>
					{/if}
				</div>
				<span class="font-mono text-3xl font-bold text-stone-900">
					{#if budgetData}
						{#if userTaxContribution > 0}
							{formatMoney(userTaxContribution)}
						{:else}
							{formatMoney(budgetData.meta.total_budget)}
						{/if}
					{:else}
						---
					{/if}
				</span>
			</div>

			<div class="mt-4 border-t border-stone-200 pt-3 text-[10px] text-stone-400">
				<p class="mb-1 leading-tight">
					* {m.receipt_disclaimer()}
				</p>
				<a
					href="https://daten.berlin.de/datensaetze/doppelhaushalt-2024-2025-4-nachtrag-1614398"
					target="_blank"
					class="underline hover:text-stone-600"
				>
					{m.source_label()}: {m.source_link_text()}
				</a>
			</div>

			<div class="mt-6">
				<button
					class="flex w-full items-center justify-center gap-2 rounded-lg bg-stone-900 py-3 font-medium text-white shadow-lg transition-colors hover:bg-stone-800"
					onclick={shareReceipt}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="1.5"
						stroke="currentColor"
						class="h-5 w-5"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z"
						/>
					</svg>
					{m.share_button()}
				</button>
			</div>
		</div>
	</div>

	<!-- Extra Footer -->
	<footer class="mt-12 flex flex-col items-center gap-4 pb-12 text-stone-500">
		<div class="flex items-center gap-2">
			<span
				class="rounded bg-stone-300 px-2 py-0.5 text-xs font-bold tracking-widest text-stone-600 uppercase"
				>Support</span
			>
			<iframe
				src="https://github.com/sponsors/eamag/button"
				title="Sponsor eamag"
				height="32"
				width="114"
				style="border: 0; border-radius: 6px;"
			></iframe>
		</div>
		<p class="text-[12px] tracking-tighter uppercase opacity-70">
			Made in Berlin with &lt;3 by <a
				href="https://eamag.me/"
				class="underline hover:text-stone-600"
			>
				Dmitrii
			</a>
		</p>
	</footer>
</div>
