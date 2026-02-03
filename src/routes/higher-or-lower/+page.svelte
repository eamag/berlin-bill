<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import { SvelteSet } from 'svelte/reactivity';
	import { scale } from 'svelte/transition';
	import type { BudgetData, BudgetItem } from '$lib/types';
	import * as m from '$paraglide/messages';
	import { getLocale, setLocale } from '$paraglide/runtime';

	type PlayableItem = BudgetItem & { parents: string[]; depth: number };
	let allItems: PlayableItem[] = $state([]);
	let translationMap: Record<string, string> = $state({});
	let itemA = $state<PlayableItem | null>(null),
		itemB = $state<PlayableItem | null>(null);
	let score = $state(0),
		highScore = $state(0);
	let gameState = $state<'loading' | 'playing' | 'gameover'>('loading');
	let showResult = $state<'correct' | 'wrong' | null>(null);
	let difficulty = $state<'medium' | 'hard'>('medium');
	let usedIndices = new SvelteSet<number>();

	function collectItems(
		nodes: BudgetItem[],
		list: PlayableItem[],
		parents: string[] = [],
		depth = 0
	) {
		for (const node of nodes) {
			if ((depth === 1 && node.v > 10_000_000) || (depth === 2 && node.v > 1_000_000)) {
				list.push({ ...node, parents, depth });
			}
			if (node.c && depth < 2) collectItems(node.c, list, [...parents, node.l], depth + 1);
		}
	}

	onMount(async () => {
		const saved = localStorage.getItem('berlin_highscore_hol');
		if (saved) highScore = parseInt(saved);
		try {
			const [bR, tR] = await Promise.all([
				fetch('/budget_clean.json'),
				fetch('/translations_en.json')
			]);
			const data = (await bR.json()) as BudgetData,
				flat: PlayableItem[] = [];
			collectItems(data.data, flat);
			allItems = flat.map((i) => ({ ...i, v: i.v / 2 }));
			translationMap = await tR.json();
			startGame();
		} catch (e) {
			console.error(e);
		}
	});

	const getPool = () => allItems.filter((i) => i.depth === (difficulty === 'medium' ? 1 : 2));

	function getItem(): PlayableItem {
		const pool = getPool(),
			avail = pool.map((_, i) => i).filter((i) => !usedIndices.has(i));
		if (!avail.length) usedIndices.clear();
		const idx = avail.length
			? avail[Math.floor(Math.random() * avail.length)]
			: Math.floor(Math.random() * pool.length);
		usedIndices.add(idx);
		return pool[idx];
	}

	function startGame() {
		score = 0;
		showResult = null;
		usedIndices.clear();
		itemA = getItem();
		do {
			itemB = getItem();
		} while (itemA.l === itemB.l || itemA.v === itemB.v);
		gameState = 'playing';
	}

	function makeGuess(dir: 'higher' | 'lower') {
		if (!itemA || !itemB) return;
		const win = (dir === 'higher' && itemB.v > itemA.v) || (dir === 'lower' && itemB.v <= itemA.v);
		if (win) {
			score++;
			showResult = 'correct';
			setTimeout(() => {
				itemA = itemB;
				showResult = null;
				do {
					itemB = getItem();
				} while (itemA?.l === itemB.l || itemA?.v === itemB.v);
			}, 1500);
		} else {
			showResult = 'wrong';
			if (score > highScore)
				localStorage.setItem('berlin_highscore_hol', (highScore = score).toString());
			setTimeout(() => (gameState = 'gameover'), 2000);
		}
	}

	const fmt = (v: number) =>
		new Intl.NumberFormat(getLocale() === 'de' ? 'de-DE' : 'en-US', {
			style: 'currency',
			currency: 'EUR',
			maximumFractionDigits: 0
		}).format(v);

	const getL = (item: BudgetItem | null) =>
		(item && getLocale() === 'en' && translationMap[item.l]) || item?.l || '';
	const getP = (item: PlayableItem | null) =>
		item?.parents?.map((p) => (getLocale() === 'en' && translationMap[p]) || p).join(' › ') || '';
	const trunc = (s: string, n = 25) => (s.length > n ? s.slice(0, n) + '...' : s);
</script>

<svelte:head>
	<title>{m.game_seo_title()}</title>
	<meta name="description" content={m.game_seo_description()} />

	<!-- Open Graph / Facebook -->
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://berlin-bill.eamag.me/{getLocale()}/higher-or-lower" />
	<meta property="og:title" content={m.game_seo_title()} />
	<meta property="og:description" content={m.game_seo_description()} />
	<meta property="og:image" content="https://berlin-bill.eamag.me/og-image.png" />
	<meta property="og:site_name" content="Berlin Budget Receipt" />

	<!-- Twitter -->
	<meta property="twitter:card" content="summary_large_image" />
	<meta
		property="twitter:url"
		content="https://berlin-bill.eamag.me/{getLocale()}/higher-or-lower"
	/>
	<meta property="twitter:title" content={m.game_seo_title()} />
	<meta property="twitter:description" content={m.game_seo_description()} />
	<meta property="twitter:image" content="https://berlin-bill.eamag.me/og-image.png" />
</svelte:head>

{#if gameState === 'loading'}
	<div class="flex h-screen items-center justify-center bg-stone-200">
		<div class="text-center">
			<div
				class="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-stone-400 border-t-stone-800"
			></div>
			<p class="font-mono text-stone-600">{m.game_loading()}</p>
		</div>
	</div>
{:else if gameState === 'gameover'}
	<div
		class="flex h-screen flex-col items-center justify-center space-y-6 bg-stone-900 px-6 text-white"
	>
		<h1 class="text-5xl font-extrabold text-red-500">{m.game_over()}</h1>
		<p class="text-2xl">
			{m.game_you_scored()}: <span class="font-mono font-bold text-yellow-400">{score}</span>
		</p>
		<p class="text-stone-400">{m.game_best()}: {highScore}</p>
		<div class="flex justify-center gap-2">
			{#each ['medium', 'hard'] as d (d)}
				<button
					onclick={() => {
						difficulty = d as 'medium' | 'hard';
						startGame();
					}}
					class="rounded-lg border-2 border-stone-600 px-4 py-2 font-bold transition hover:bg-stone-700 {difficulty ===
					d
						? 'bg-stone-700'
						: 'bg-transparent'}">{d}</button
				>
			{/each}
		</div>
		<button
			onclick={startGame}
			class="rounded-full bg-blue-600 px-8 py-3 text-xl font-bold transition hover:bg-blue-500"
			>{m.game_try_again()}</button
		>
		<a href={resolve('/')} class="text-sm text-stone-500 underline hover:text-stone-400"
			>{m.game_back()}</a
		>
	</div>
{:else}
	<div class="relative flex h-screen w-full flex-col overflow-hidden font-sans md:flex-row">
		<div
			class="absolute bottom-4 left-4 z-40 flex gap-2 md:top-4 md:bottom-auto md:left-1/2 md:-translate-x-1/2"
		>
			{#each ['medium', 'hard'] as d (d)}
				<button
					onclick={() => difficulty !== d && ((difficulty = d as 'medium' | 'hard'), startGame())}
					class="rounded-full px-3 py-1 text-xs font-bold uppercase shadow backdrop-blur transition-colors {difficulty ===
					d
						? 'bg-white text-stone-800'
						: 'bg-black/40 text-white hover:bg-black/60'}">{d}</button
				>
			{/each}
		</div>
		<div class="absolute top-4 left-4 z-30 flex gap-2">
			<a
				href={resolve('/')}
				class="rounded-full bg-white/80 p-2 text-stone-700 shadow backdrop-blur transition hover:bg-white"
				title={m.game_back()}
				><svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="2"
					stroke="currentColor"
					class="h-4 w-4"
					><path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
					/></svg
				></a
			>
			<button
				onclick={() => setLocale(getLocale() === 'de' ? 'en' : 'de')}
				class="rounded-full bg-white/80 px-3 py-1 text-xs font-bold text-stone-700 shadow backdrop-blur transition hover:bg-white"
				>{getLocale() === 'de' ? 'EN' : 'DE'}</button
			>
		</div>

		<div class="absolute top-1/2 left-1/2 z-20 -translate-x-1/2 -translate-y-1/2">
			<div
				class="rounded-full border-4 border-stone-200 bg-white p-4 text-xl font-black text-stone-900 shadow-xl"
			>
				VS
			</div>
		</div>
		<div class="absolute top-4 right-4 z-20 rounded-lg bg-black/50 px-4 py-2 font-mono text-white">
			{m.game_score()}: {score}
		</div>

		<div
			class="relative flex h-1/2 w-full flex-col items-center justify-center border-b-4 border-stone-300 bg-stone-100 p-6 text-center md:h-full md:w-1/2 md:border-r-4 md:border-b-0"
		>
			<div class="mb-2 max-w-md text-xs font-semibold text-stone-500 uppercase">{getP(itemA)}</div>
			<h2 class="mb-4 max-w-sm text-xl font-bold text-stone-800 md:text-2xl lg:text-3xl">
				{getL(itemA)}
			</h2>
			<div class="font-mono text-3xl font-bold text-blue-600 md:text-4xl lg:text-5xl">
				{fmt(itemA?.v || 0)}
			</div>
			<p class="mt-2 text-xs text-stone-500 md:text-sm">{m.game_annual_spend()}</p>
		</div>

		<div
			class="relative flex h-1/2 w-full flex-col items-center justify-center bg-stone-800 p-6 text-center text-white transition-colors duration-500 md:h-full md:w-1/2"
			class:bg-green-700={showResult === 'correct'}
			class:bg-red-700={showResult === 'wrong'}
		>
			<div class="mb-2 max-w-md text-xs font-semibold text-stone-400 uppercase">{getP(itemB)}</div>
			<h2 class="mb-4 max-w-sm text-xl font-bold md:text-2xl lg:text-3xl">{getL(itemB)}</h2>
			{#if showResult}
				<div
					in:scale={{ duration: 300, start: 0.5 }}
					class="font-mono text-3xl font-bold text-yellow-400 md:text-4xl lg:text-5xl"
				>
					{fmt(itemB?.v || 0)}
				</div>
			{:else}
				<p class="mb-6 text-stone-300">{m.game_costs()}</p>
				<div class="flex w-full max-w-xs flex-col gap-4">
					<button
						onclick={() => makeGuess('higher')}
						class="rounded-xl border-2 border-white/30 py-4 text-xl font-bold tracking-widest uppercase transition-all hover:border-white hover:bg-white/10"
						>▲ {m.game_higher()}</button
					>
					<button
						onclick={() => makeGuess('lower')}
						class="rounded-xl border-2 border-white/30 py-4 text-xl font-bold tracking-widest uppercase transition-all hover:border-white hover:bg-white/10"
						>▼ {m.game_lower()}</button
					>
				</div>
				<p class="mt-4 text-sm text-stone-400">{m.game_than()} {trunc(getL(itemA))}</p>
			{/if}
		</div>
	</div>
{/if}
