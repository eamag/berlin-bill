<script lang="ts">
	import { onMount } from 'svelte';
	import * as d3 from 'd3';

	let chartContainer: HTMLElement;

	onMount(async () => {
		const response = await fetch(`/revenue.csv`);
		const csvData = await response.text();
		const data = d3.dsvFormat(';').parse(csvData, d => {
			d.value = +d['Einnahmen Januar 2025 (T EUR)'];
			return d;
		});

		const groupedData = d3.group(data, d => d.Ertragshoheit);

		const hierarchicalData = {
			name: 'root',
			children: Array.from(groupedData, ([key, values]) => ({
				name: key,
				children: values.map(d => ({ name: d.Steuerart, value: d.value }))
			}))
		};

		const root = d3.hierarchy(hierarchicalData)
			.sum(d => d.value)
			.sort((a, b) => b.value - a.value);

		if (isNaN(root.value)) {
			console.error("Invalid data: root value is NaN");
			return;
		}

		const width = 928;
		const height = 928;

		const treemap = d3.treemap()
			.size([width, height])
			.padding(1)
			.round(true);

		const treemapRoot = treemap(root);

		const svg = d3.select(chartContainer).append('svg')
			.attr('viewBox', [0, 0, width, height])
			.style('font', '10px sans-serif');

		const color = d3.scaleOrdinal(d3.schemeCategory10);

		const leaf = svg.selectAll("g")
			.data(treemapRoot.leaves())
			.join("g")
			.attr("transform", d => `translate(${d.x0},${d.y0})`);

		leaf.append("title")
			.text(d => `${d.ancestors().reverse().map(d => d.data.name).join(" > ")}\n${d.value.toLocaleString("en")}`);

		leaf.append("rect")
			.attr("id", (d, i) => `leaf-${i}`)
			.attr("fill", d => color(d.parent.data.name))
			.attr("fill-opacity", 0.6)
			.attr("width", d => d.x1 - d.x0)
			.attr("height", d => d.y1 - d.y0);

		leaf.append("clipPath")
			.attr("id", (d, i) => `clip-${i}`)
			.append("use")
			.attr("href", (d, i) => `#leaf-${i}`);

		leaf.append("text")
			.attr("clip-path", (d, i) => `url(#clip-${i})`)
			.selectAll("tspan")
			.data(d => d.data.name.split(/(?=[A-Z][^A-Z])/g).concat(d.value.toLocaleString("en")))
			.join("tspan")
			.attr("x", 3)
			.attr("y", (d, i, nodes) => `${(i === nodes.length - 1) * 0.3 + 1.1 + i * 0.9}em`)
			.attr("fill-opacity", (d, i, nodes) => i === nodes.length - 1 ? 0.7 : null)
			.text(d => d);
	});
</script>

<div class="p-4">
	<h1 class="text-2xl font-bold mb-4">Berlin Tax Revenue - January 2025</h1>
	<div bind:this={chartContainer}></div>
</div>
