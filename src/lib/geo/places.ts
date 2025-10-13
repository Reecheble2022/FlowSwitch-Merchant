import { haversineDistance } from './haversine';
import type { GeocodedPlace } from '../../types';

interface MajorPlace {
  name: string;
  lat: number;
  lng: number;
  region: string;
  country: string;
  countryCode: string;
}

const MAJOR_PLACES: MajorPlace[] = [
  { name: 'Johannesburg', lat: -26.2041, lng: 28.0473, region: 'Gauteng', country: 'South Africa', countryCode: 'ZA' },
  { name: 'Pretoria', lat: -25.7479, lng: 28.2293, region: 'Gauteng', country: 'South Africa', countryCode: 'ZA' },
  { name: 'Cape Town', lat: -33.9249, lng: 18.4241, region: 'Western Cape', country: 'South Africa', countryCode: 'ZA' },
  { name: 'Durban', lat: -29.8587, lng: 31.0218, region: 'KwaZulu-Natal', country: 'South Africa', countryCode: 'ZA' },
  { name: 'Port Elizabeth', lat: -33.9608, lng: 25.6022, region: 'Eastern Cape', country: 'South Africa', countryCode: 'ZA' },
  { name: 'Polokwane', lat: -23.9045, lng: 29.4689, region: 'Limpopo', country: 'South Africa', countryCode: 'ZA' },
  { name: 'Bloemfontein', lat: -29.0852, lng: 26.1596, region: 'Free State', country: 'South Africa', countryCode: 'ZA' },
  { name: 'Nelspruit', lat: -25.4753, lng: 30.9703, region: 'Mpumalanga', country: 'South Africa', countryCode: 'ZA' },

  { name: 'Kampala', lat: 0.3476, lng: 32.5825, region: 'Central Region', country: 'Uganda', countryCode: 'UG' },
  { name: 'Entebbe', lat: 0.0522, lng: 32.4635, region: 'Central Region', country: 'Uganda', countryCode: 'UG' },
  { name: 'Jinja', lat: 0.4244, lng: 33.2041, region: 'Eastern Region', country: 'Uganda', countryCode: 'UG' },
  { name: 'Gulu', lat: 2.7747, lng: 32.2989, region: 'Northern Region', country: 'Uganda', countryCode: 'UG' },
  { name: 'Mbarara', lat: -0.6067, lng: 30.6583, region: 'Western Region', country: 'Uganda', countryCode: 'UG' },
  { name: 'Mbale', lat: 1.0820, lng: 34.1754, region: 'Eastern Region', country: 'Uganda', countryCode: 'UG' },
  { name: 'Lira', lat: 2.2499, lng: 32.8998, region: 'Northern Region', country: 'Uganda', countryCode: 'UG' },
  { name: 'Fort Portal', lat: 0.6619, lng: 30.2747, region: 'Western Region', country: 'Uganda', countryCode: 'UG' },
];

export function reverseGeocodeOffline(lat: number, lng: number): GeocodedPlace {
  let nearest: MajorPlace | null = null;
  let minDistance = Infinity;

  for (const place of MAJOR_PLACES) {
    const distance = haversineDistance(lat, lng, place.lat, place.lng);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = place;
    }
  }

  if (!nearest) {
    return {
      country: 'Unknown',
      region: 'Unknown',
      cityOrNearest: 'Unknown location',
      distanceKm: 0,
      source: 'offline',
    };
  }

  const cityLabel = minDistance < 50
    ? nearest.name
    : `${Math.round(minDistance)}km from ${nearest.name}`;

  return {
    country: nearest.country,
    region: nearest.region,
    cityOrNearest: cityLabel,
    distanceKm: Math.round(minDistance * 10) / 10,
    source: 'offline',
  };
}

export function getCountryFromCoords(lat: number, lng: number): string {
  if (lat >= -35 && lat <= -22 && lng >= 16 && lng <= 33) {
    return 'South Africa';
  }

  if (lat >= -1.5 && lat <= 4.2 && lng >= 29.5 && lng <= 35) {
    return 'Uganda';
  }

  return 'Unknown';
}
