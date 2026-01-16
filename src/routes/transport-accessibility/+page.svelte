<svelte:head>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
    integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
    crossorigin=""/>
</svelte:head>

<div id="map" style="height: 100vh;"></div>

<script lang="ts">
  import { onMount } from 'svelte';
  import L from 'leaflet';
  import type { PageData } from './$types';

  export let data: PageData;

  onMount(() => {
    const map = L.map('map').setView([52.52, 13.405], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(map);

    if (data.stops) {
      data.stops.forEach(stop => {
        if (stop.stop_lat && stop.stop_lon) {
          L.marker([parseFloat(stop.stop_lat), parseFloat(stop.stop_lon)]).addTo(map);
        }
      });
    }
  });
</script>
