import Papa from 'papaparse';
import type { PageServerLoad } from './$types';

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

export const load: PageServerLoad = async ({ fetch }) => {
  try {
    const response = await fetch('/stops.txt');
    if (!response.ok) {
      throw new Error(`Failed to fetch GTFS data: ${response.statusText}`);
    }
    const csvText = await response.text();

    const parsed = Papa.parse<Stop>(csvText, {
      header: true,
      skipEmptyLines: true,
    });

    if (parsed.errors.length) {
      console.error('Errors parsing GTFS data:', parsed.errors);
      throw new Error('Error parsing GTFS CSV data');
    }

    return {
      stops: parsed.data,
    };
  } catch (error) {
    console.error('Error in load function:', error);
    return {
      stops: [],
      error: 'Could not load transportation data.',
    };
  }
};
