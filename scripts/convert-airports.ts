/**
 * Script to convert airports.csv to an optimized JSON format.
 * Filters to only include airports with valid IATA codes.
 *
 * Run with: npm run convert-airports
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

interface RawAirport {
  id: string;
  ident: string;
  type: string;
  name: string;
  latitude_deg: string;
  longitude_deg: string;
  elevation_ft: string;
  continent: string;
  iso_country: string;
  iso_region: string;
  municipality: string;
  scheduled_service: string;
  gps_code: string;
  iata_code: string;
  local_code: string;
  home_link: string;
  wikipedia_link: string;
  keywords: string;
}

interface CompactAirport {
  /** IATA code */
  c: string;
  /** Latitude */
  a: number;
  /** Longitude */
  o: number;
  /** Location (region, country) */
  l: string;
}

function parseCSV(content: string): RawAirport[] {
  const lines = content.split('\n');
  const headers = parseCSVLine(lines[0] ?? '');
  const airports: RawAirport[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line?.trim()) continue;

    const values = parseCSVLine(line);
    const airport: Record<string, string> = {};

    headers.forEach((header, index) => {
      airport[header] = values[index] ?? '';
    });

    airports.push(airport as unknown as RawAirport);
  }

  return airports;
}

function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  values.push(current);
  return values;
}

function main() {
  const csvPath = join(__dirname, '..', 'airports.csv.bak');
  const outputPath = join(__dirname, '..', 'data', 'airports.json');

  console.log(`Reading CSV from: ${csvPath}`);

  let content: string;
  try {
    content = readFileSync(csvPath, 'utf-8');
  } catch {
    console.error('Error: airports.csv.bak not found. Please ensure the backup file exists.');
    process.exit(1);
  }

  console.log('Parsing CSV...');
  const rawAirports = parseCSV(content);
  console.log(`Total airports in CSV: ${rawAirports.length}`);

  // Filter to only airports with valid IATA codes
  const iataAirports = rawAirports.filter(
    (a) => a.iata_code && a.iata_code.length === 3 && /^[A-Z]{3}$/.test(a.iata_code)
  );

  console.log(`Airports with valid IATA codes: ${iataAirports.length}`);

  // Convert to compact format
  const compactAirports: CompactAirport[] = iataAirports.map((a) => ({
    c: a.iata_code,
    a: parseFloat(a.latitude_deg) || 0,
    o: parseFloat(a.longitude_deg) || 0,
    l: `${a.iso_region},${a.iso_country}`,
  }));

  // Sort by IATA code for consistent output
  compactAirports.sort((a, b) => a.c.localeCompare(b.c));

  // Write JSON
  const json = JSON.stringify(compactAirports);
  writeFileSync(outputPath, json, 'utf-8');

  const sizeKB = (json.length / 1024).toFixed(1);
  console.log(`\nOutput written to: ${outputPath}`);
  console.log(`Output size: ${sizeKB} KB (${compactAirports.length} airports)`);
}

main();
