<script lang="ts">
	import './layout.css';
	import * as m from '$paraglide/messages';
	import { getLocale } from '$paraglide/runtime';

	let { children } = $props();
	let locale = $derived(getLocale());
</script>

<svelte:head>
	<title>{m.seo_title()}</title>
	<meta name="description" content={m.seo_description()} />

	<!-- Open Graph / Facebook -->
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://berlin-bill.eamag.me/{locale}" />
	<meta property="og:title" content={m.seo_title()} />
	<meta property="og:description" content={m.seo_description()} />
	<meta property="og:image" content="https://berlin-bill.eamag.me/og-image.png" />
	<meta property="og:site_name" content="Berlin Budget Receipt" />

	<!-- Twitter -->
	<meta property="twitter:card" content="summary_large_image" />
	<meta property="twitter:url" content="https://berlin-bill.eamag.me/{locale}" />
	<meta property="twitter:title" content={m.seo_title()} />
	<meta property="twitter:description" content={m.seo_description()} />
	<meta property="twitter:image" content="https://berlin-bill.eamag.me/og-image.png" />

	<meta name="theme-color" content="#d6d3d1" />
	<!-- stone-300 color -->
</svelte:head>
{@render children()}
