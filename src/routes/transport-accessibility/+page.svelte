<svelte:head>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
    integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
    crossorigin=""/>
</svelte:head>

<div id="map" style="height: 100vh;"></div>

<script lang="ts">
  import { onMount } from 'svelte';
  import L from 'leaflet';
  import Papa from 'papaparse';
  import type { ParseResult } from 'papaparse';

  interface Stop {
    stop_id: string;
    stop_name: string;
    stop_lat: string;
    stop_lon: string;
    stop_code: string;
    stop_desc: string;
    zone_id: string;
    location_type: string;
    parent_station: string;
    platform_code: string;
  }

  onMount(async () => {
    const map = L.map('map').setView([52.52, 13.405], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(map);

    try {
      const response = await fetch('https://vbb-gtfs.jannisr.de/latest/stops.txt');
      const csvText = await response.text();

      Papa.parse<Stop>(csvText, {
        header: true,
        complete: (results: ParseResult<Stop>) => {
          console.log('Parsed GTFS data:', results.data);
          results.data.forEach((stop: Stop) => {
            if (stop.stop_lat && stop.stop_lon) {
              L.marker([parseFloat(stop.stop_lat), parseFloat(stop.stop_lon)]).addTo(map);
            }
          });
        }
      });

    } catch (error) {
      console.error('Error fetching or parsing GTFS data:', error);
    }
  });
</script>
