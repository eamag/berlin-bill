<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import * as m from '$paraglide/messages';
	import { getLocale, setLocale } from '$paraglide/runtime';

	type Sheet = {
		headers: string[];
		rows: Record<string, string | number | null>[];
	};

	type AbiturData = {
		source: string;
		sheets: Record<string, Sheet>;
	};

	let data: AbiturData | null = $state(null);
	let loading = $state(true);
	let error = $state('');

	let subjectCourse = $state<'GK' | 'LK'>('GK');
	let districtSort = $state<'best' | 'name'>('best');
	let locale = $derived(getLocale());

	function toNumber(value: unknown): number | null {
		if (value == null) return null;
		if (typeof value === 'number') return Number.isFinite(value) ? value : null;
		const normalized = String(value).replace(',', '.').trim();
		const parsed = Number(normalized);
		return Number.isFinite(parsed) ? parsed : null;
	}

	function formatFixed(value: number | null | undefined, digits = 2) {
		return typeof value === 'number' && Number.isFinite(value) ? value.toFixed(digits) : '—';
	}

	function barWidth(value: number | null) {
		if (value == null) return '0%';
		const range = districtRange;
		const denom = range.max - range.min;
		if (denom <= 0) return '0%';
		const pct = ((range.max - value) / denom) * 100;
		return `${pct}%`;
	}

	const districtNames: Record<number, string> = {
		1: 'Mitte',
		2: 'Friedrichshain-Kreuzberg',
		3: 'Pankow',
		4: 'Charlottenburg-Wilmersdorf',
		5: 'Spandau',
		6: 'Steglitz-Zehlendorf',
		7: 'Tempelhof-Schöneberg',
		8: 'Neukölln',
		9: 'Treptow-Köpenick',
		10: 'Marzahn-Hellersdorf',
		11: 'Lichtenberg',
		12: 'Reinickendorf'
	};

	onMount(async () => {
		try {
			const res = await fetch('/abitur-2025.json');
			if (!res.ok) throw new Error(`Failed to load data: ${res.status}`);
			data = (await res.json()) as AbiturData;
		} catch (e) {
			console.error(e);
			error = 'Could not load the Abitur dataset.';
		} finally {
			loading = false;
		}
	});

	const comparisonTotal = $derived.by(() => data?.sheets['Vergleichsdaten|Gesamt']?.rows ?? []);

	const comparisonSubjects = $derived.by(() => data?.sheets['Vergleichsdaten|Fächer']?.rows ?? []);

	const schoolTotals = $derived.by(() => data?.sheets['Schuldaten|Gesamt']?.rows ?? []);

	const berlinAverage = $derived.by(() => {
		const row = comparisonTotal.find(
			(r) => r.Land === 'DE-BE' && r.Bezirksnummer == null && r.Schulform == null
		);
		return toNumber(row?.['mn.vgl']);
	});

	const schoolFormAverages = $derived.by(() =>
		comparisonTotal
			.filter((r) => r.Land === 'DE-BE' && r.Bezirksnummer == null && r.Schulform != null)
			.map((r) => ({
				form: r.Schulform as number,
				value: toNumber(r['mn.vgl'])
			}))
			.filter((r) => r.value != null)
			.sort((a, b) => a.form - b.form)
	);

	const districtAverages = $derived.by(() => {
		const rows = comparisonTotal
			.filter((r) => r.Land === 'DE-BE' && r.Bezirksnummer != null && r.Schulform == null)
			.map((r) => ({
				district: r.Bezirksnummer as number,
				name: districtNames[r.Bezirksnummer as number] ?? `Bezirk ${r.Bezirksnummer}`,
				value: toNumber(r['mn.vgl'])
			}));

		const filtered = rows.filter((row) => row.value != null);
		return districtSort === 'name'
			? filtered.slice().sort((a, b) => a.name.localeCompare(b.name))
			: filtered.slice().sort((a, b) => (a.value as number) - (b.value as number));
	});

	const districtRange = $derived.by(() => {
		if (!districtAverages.length) return { min: 0, max: 0 };
		let min = Infinity;
		let max = -Infinity;
		for (const row of districtAverages) {
			if (row.value == null) continue;
			min = Math.min(min, row.value);
			max = Math.max(max, row.value);
		}
		if (!Number.isFinite(min) || !Number.isFinite(max)) return { min: 0, max: 0 };
		return { min, max };
	});

	const examComponents = $derived.by(() =>
		comparisonSubjects
			.filter(
				(r) =>
					r.Land === 'DE-BE' &&
					r.Bezirksnummer == null &&
					r.Schulform == null &&
					r.Kurs == null &&
					['LF', 'PF3', 'PF4', 'PK5'].includes(String(r.Fach))
			)
			.map((r) => ({
				key: String(r.Fach),
				value: toNumber(r['mn.vgl'])
			}))
			.filter((r) => r.value != null)
	);

	const subjectAverages = $derived.by(() => {
		const rows = comparisonSubjects
			.filter(
				(r) =>
					r.Land === 'DE-BE' &&
					r.Bezirksnummer == null &&
					r.Schulform == null &&
					r.Kurs === subjectCourse &&
					r.Fach != null &&
					!['LF', 'PF3', 'PF4', 'PK5'].includes(String(r.Fach))
			)
			.map((r) => ({
				subject: String(r.Fach),
				value: toNumber(r['mn.vgl'])
			}))
			.filter((r) => r.value != null);

		rows.sort((a, b) => (b.value as number) - (a.value as number));
		return {
			top: rows.slice(0, 12)
		};
	});

	const schoolExtremes = $derived.by(() => {
		const rows = schoolTotals
			.filter((r) => r['mn.scls'] != null)
			.map((r) => ({
				bsn: String(r.BSN),
				district: r.Bezirksnummer as number,
				value: toNumber(r['mn.scls']),
				n: toNumber(r['n']),
				passed: toNumber(r['n.scls'])
			}))
			.filter((r) => r.value != null);

		rows.sort((a, b) => (a.value as number) - (b.value as number));
		return {
			best: rows.slice(0, 10),
			worst: rows.slice(-10).reverse()
		};
	});
</script>

<svelte:head>
	<title>Berlin Abitur 2025 – Visualisierung</title>
	<meta
		name="description"
		content="Eine schnelle, visuelle Übersicht der Berliner Abitur-Ergebnisse 2025 nach Bezirk, Schulform und Fächern."
	/>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,800&family=Space+Grotesk:wght@400;500;600&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<section
	class="min-h-screen bg-[radial-gradient(circle_at_top,#ffffff,#f4f1ea_55%),linear-gradient(135deg,#f7f3ee_0%,#e9edf6_60%,#f8fafc_100%)] px-[6vw] py-12 font-['Space_Grotesk',system-ui,sans-serif] text-slate-800 md:py-16"
>
	<div class="mb-12 grid items-center gap-10 lg:grid-cols-2">
		<div>
			<div class="flex flex-wrap items-center justify-between gap-3">
				<p class="text-xs tracking-[0.25em] text-amber-700 uppercase">
					{m.abitur_eyebrow()}
				</p>
				<div class="flex items-center gap-3">
					<a
						href={resolve('/')}
						class="rounded-full border border-slate-300/70 bg-white px-3 py-1 text-xs tracking-[0.2em] text-slate-700 uppercase transition hover:border-slate-900 hover:bg-slate-900 hover:text-white"
					>
						{m.game_back()}
					</a>
					<button
						class="rounded-full border border-slate-300/70 bg-white px-3 py-1 text-xs tracking-[0.2em] text-slate-800 uppercase transition hover:border-slate-900 hover:bg-slate-900 hover:text-white"
						onclick={() => setLocale(locale === 'de' ? 'en' : 'de')}
					>
						{m.abitur_toggle_lang()}
					</button>
				</div>
			</div>
			<h1
				class="mt-4 font-['Fraunces',serif] text-[clamp(2.5rem,3vw+1.2rem,4.2rem)] leading-[1.05] tracking-[-0.02em] text-slate-900"
			>
				{m.abitur_title()}
			</h1>
			<p class="mt-4 max-w-2xl text-lg text-slate-600">{m.abitur_lede()}</p>
		</div>
		<div
			class="rounded-2xl border border-slate-300/70 bg-gradient-to-br from-white to-slate-50 p-8 shadow-[0_20px_50px_rgba(15,23,42,0.1)]"
		>
			<div>
				<span class="text-xs tracking-[0.2em] text-slate-500 uppercase">
					{m.abitur_berlin_avg()}
				</span>
				<strong class="mt-2 block font-['Fraunces',serif] text-4xl text-slate-900"
					>{formatFixed(berlinAverage, 2)}</strong
				>
				<small class="mt-3 block text-sm text-slate-500">{m.abitur_berlin_avg_note()}</small>
			</div>
			<div class="mt-6 rounded-2xl bg-amber-100 px-5 py-4 text-sm text-amber-900">
				<p>{m.abitur_threshold_note()}</p>
			</div>
		</div>
	</div>

	{#if loading}
		<div class="rounded-2xl border border-slate-300/70 bg-white p-8 text-center">Lade Daten…</div>
	{:else if error}
		<div class="rounded-2xl border border-red-200 bg-red-200/40 p-8 text-center">{error}</div>
	{:else}
		<div class="grid gap-8 lg:grid-cols-2">
			<section
				class="rounded-2xl border border-slate-300/70 bg-white p-7 shadow-[0_18px_36px_rgba(15,23,42,0.08)]"
			>
				<header class="flex flex-wrap items-center justify-between gap-4">
					<h2 class="font-['Fraunces',serif] text-[1.4rem]">
						{m.abitur_district_title()}
					</h2>
					<div class="flex flex-wrap gap-3">
						<button
							class={`rounded-full border px-4 py-1.5 text-sm transition ${districtSort === 'best' ? 'border-amber-500 bg-amber-500 text-slate-900' : 'border-slate-300/70 bg-slate-50 text-slate-800 hover:border-amber-500 hover:bg-amber-500 hover:text-slate-900'}`}
							onclick={() => (districtSort = 'best')}
						>
							{m.abitur_sort_best()}
						</button>
						<button
							class={`rounded-full border px-4 py-1.5 text-sm transition ${districtSort === 'name' ? 'border-amber-500 bg-amber-500 text-slate-900' : 'border-slate-300/70 bg-slate-50 text-slate-800 hover:border-amber-500 hover:bg-amber-500 hover:text-slate-900'}`}
							onclick={() => (districtSort = 'name')}
						>
							{m.abitur_sort_alpha()}
						</button>
					</div>
				</header>
				<div class="mt-6 grid gap-4">
					{#each districtAverages as row (row.district)}
						<div class="grid gap-2">
							<div class="flex justify-between text-sm text-slate-800">
								<span>{row.name}</span>
								<em class="font-semibold text-amber-700 not-italic">{formatFixed(row.value, 2)}</em>
							</div>
							<div class="h-2.5 overflow-hidden rounded-full bg-slate-300/50">
								<div
									class="h-full rounded-full bg-gradient-to-r from-blue-600 to-green-500 transition-all duration-300"
									style={`width:${barWidth(row.value)}`}
								></div>
							</div>
						</div>
					{/each}
				</div>
			</section>

			<section
				class="rounded-2xl border border-slate-300/70 bg-white p-7 shadow-[0_18px_36px_rgba(15,23,42,0.08)]"
			>
				<header class="flex flex-wrap items-center justify-between gap-4">
					<h2 class="font-['Fraunces',serif] text-[1.4rem]">
						{m.abitur_school_forms()}
					</h2>
				</header>
				<div class="mt-5 grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-4">
					{#each schoolFormAverages as row (row.form)}
						<div class="rounded-xl border border-slate-300/70 bg-slate-50 p-4">
							<span class="block text-xs tracking-[0.15em] text-slate-500 uppercase"
								>Schulform {row.form}</span
							>
							<strong class="mt-1 block font-['Fraunces',serif] text-xl"
								>{formatFixed(row.value, 2)}</strong
							>
						</div>
					{/each}
				</div>
				<p class="mt-3 text-sm text-slate-500">{m.abitur_school_forms_note()}</p>
			</section>

			<section
				class="rounded-2xl border border-slate-300/70 bg-white p-7 shadow-[0_18px_36px_rgba(15,23,42,0.08)] lg:col-span-2"
			>
				<header class="flex flex-wrap items-center justify-between gap-4">
					<h2 class="font-['Fraunces',serif] text-[1.4rem]">
						{m.abitur_subject_title()}
					</h2>
					<div class="flex flex-wrap gap-3">
						<button
							class={`rounded-full border px-4 py-1.5 text-sm transition ${subjectCourse === 'GK' ? 'border-amber-500 bg-amber-500 text-slate-900' : 'border-slate-300/70 bg-slate-50 text-slate-800 hover:border-amber-500 hover:bg-amber-500 hover:text-slate-900'}`}
							onclick={() => (subjectCourse = 'GK')}
						>
							{m.abitur_gk()}
						</button>
						<button
							class={`rounded-full border px-4 py-1.5 text-sm transition ${subjectCourse === 'LK' ? 'border-amber-500 bg-amber-500 text-slate-900' : 'border-slate-300/70 bg-slate-50 text-slate-800 hover:border-amber-500 hover:bg-amber-500 hover:text-slate-900'}`}
							onclick={() => (subjectCourse = 'LK')}
						>
							{m.abitur_lk()}
						</button>
					</div>
				</header>
				<div class="mt-6 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-x-8 gap-y-3">
					{#each subjectAverages.top as row (row.subject)}
						<div
							class="flex justify-between border-b border-dashed border-slate-300/70 py-2 text-sm"
						>
							<span>{row.subject}</span>
							<strong class="text-slate-900">{formatFixed(row.value, 1)}</strong>
						</div>
					{/each}
				</div>
			</section>

			<section
				class="rounded-2xl border border-slate-300/70 bg-white p-7 shadow-[0_18px_36px_rgba(15,23,42,0.08)]"
			>
				<header class="flex flex-wrap items-center justify-between gap-4">
					<h2 class="font-['Fraunces',serif] text-[1.4rem]">
						{m.abitur_components()}
					</h2>
				</header>
				<div class="mt-5 grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-4">
					{#each examComponents as row (row.key)}
						<div class="rounded-xl border border-blue-300/50 bg-blue-100/60 p-4">
							<span class="block text-xs tracking-[0.15em] text-slate-500 uppercase">{row.key}</span
							>
							<strong class="mt-1 block font-['Fraunces',serif] text-xl"
								>{formatFixed(row.value, 2)}</strong
							>
						</div>
					{/each}
				</div>
				<p class="mt-3 text-sm text-slate-500">{m.abitur_components_note()}</p>
			</section>

			<section
				class="rounded-2xl border border-slate-300/70 bg-white p-7 shadow-[0_18px_36px_rgba(15,23,42,0.08)] lg:col-span-2"
			>
				<header class="flex flex-wrap items-center justify-between gap-4">
					<h2 class="font-['Fraunces',serif] text-[1.4rem]">
						{m.abitur_schools_title()}
					</h2>
				</header>
				<div class="mt-6 grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-8">
					<div>
						<h3 class="text-sm tracking-[0.2em] text-amber-700 uppercase">
							{m.abitur_best_schools()}
						</h3>
						{#each schoolExtremes.best as row (row.bsn)}
							<div class="flex items-center justify-between border-b border-slate-300/70 py-3">
								<div>
									<strong class="font-['Fraunces',serif] text-lg text-slate-900"
										>{formatFixed(row.value, 2)}</strong
									>
									<span class="block text-sm text-slate-700"
										>{districtNames[row.district] ?? `Bezirk ${row.district}`}</span
									>
								</div>
								<small class="text-slate-500">BSN {row.bsn} • n {row.n ?? '—'}</small>
							</div>
						{/each}
					</div>
					<div>
						<h3 class="text-sm tracking-[0.2em] text-amber-700 uppercase">
							{m.abitur_worst_schools()}
						</h3>
						{#each schoolExtremes.worst as row (row.bsn)}
							<div class="flex items-center justify-between border-b border-slate-300/70 py-3">
								<div>
									<strong class="font-['Fraunces',serif] text-lg text-red-600"
										>{formatFixed(row.value, 2)}</strong
									>
									<span class="block text-sm text-slate-700"
										>{districtNames[row.district] ?? `Bezirk ${row.district}`}</span
									>
								</div>
								<small class="text-slate-500">BSN {row.bsn} • n {row.n ?? '—'}</small>
							</div>
						{/each}
					</div>
				</div>
			</section>
		</div>
	{/if}

	<footer class="mt-12 flex flex-col items-center gap-4 pb-12 text-stone-500">
		<a
			href="https://daten.berlin.de/datensaetze/abitur-ergebnisse-2025-1612167"
			target="_blank"
			rel="noreferrer"
			class="text-[12px] tracking-widest text-stone-500 uppercase underline hover:text-stone-700"
		>
			{m.source_label()}: {m.source_link_text()}
		</a>
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
</section>
