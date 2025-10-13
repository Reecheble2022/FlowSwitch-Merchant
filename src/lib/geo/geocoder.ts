import { haversine } from './haversine';

export interface ResolvedPlace {
  country: string;
  region: string;
  cityOrNearest: string;
  adminCode: string;
  distanceToCityKm: number;
  source: 'offline' | 'nominatim' | 'google';
}

interface GeoJSONFeature {
  type: string;
  properties: {
    country: string;
    region: string;
    district?: string;
    name?: string;
    adminCode: string;
    population?: number;
  };
  geometry: {
    type: string;
    coordinates: any;
  };
}

let adminBoundaries: GeoJSONFeature[] | null = null;
let majorPlaces: GeoJSONFeature[] | null = null;

export async function loadGeoData(): Promise<void> {
  if (adminBoundaries && majorPlaces) return;

  try {
    const [zaResponse, ugResponse, placesResponse] = await Promise.all([
      fetch('/data/za_admin.geojson'),
      fetch('/data/ug_admin.geojson'),
      fetch('/data/major_places.geojson'),
    ]);

    const [zaData, ugData, placesData] = await Promise.all([
      zaResponse.json(),
      ugResponse.json(),
      placesResponse.json(),
    ]);

    adminBoundaries = [
      ...zaData.features,
      ...ugData.features,
    ];

    majorPlaces = placesData.features;
  } catch (error) {
    console.error('Failed to load geo data:', error);
    adminBoundaries = [];
    majorPlaces = [];
  }
}

function pointInPolygon(point: [number, number], polygon: number[][]): boolean {
  const [lat, lng] = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [lng1, lat1] = polygon[i];
    const [lng2, lat2] = polygon[j];

    const intersect =
      lat1 > lat !== lat2 > lat &&
      lng < ((lng2 - lng1) * (lat - lat1)) / (lat2 - lat1) + lng1;

    if (intersect) inside = !inside;
  }

  return inside;
}

function findAdminBoundary(lat: number, lng: number): GeoJSONFeature | null {
  if (!adminBoundaries) return null;

  for (const feature of adminBoundaries) {
    if (feature.geometry.type === 'Polygon') {
      const coords = feature.geometry.coordinates[0];
      if (pointInPolygon([lat, lng], coords)) {
        return feature;
      }
    }
  }

  return null;
}

function findNearestCity(lat: number, lng: number, maxDistanceKm: number = 25): {
  city: GeoJSONFeature;
  distance: number;
} | null {
  if (!majorPlaces) return null;

  let nearest: { city: GeoJSONFeature; distance: number } | null = null;

  for (const place of majorPlaces) {
    if (place.geometry.type === 'Point') {
      const [cityLng, cityLat] = place.geometry.coordinates;
      const distance = haversine([lat, lng], [cityLat, cityLng]) / 1000;

      if (distance <= maxDistanceKm && (!nearest || distance < nearest.distance)) {
        nearest = { city: place, distance };
      }
    }
  }

  return nearest;
}

export async function resolvePlace(
  lat: number,
  lng: number,
  useOnline: boolean = false
): Promise<ResolvedPlace> {
  await loadGeoData();

  const admin = findAdminBoundary(lat, lng);
  const nearestCity = findNearestCity(lat, lng);

  if (admin && nearestCity) {
    return {
      country: admin.properties.country,
      region: admin.properties.region,
      cityOrNearest: nearestCity.city.properties.name || admin.properties.district || 'Unknown',
      adminCode: admin.properties.adminCode,
      distanceToCityKm: Number(nearestCity.distance.toFixed(2)),
      source: 'offline',
    };
  }

  if (nearestCity) {
    return {
      country: nearestCity.city.properties.country,
      region: nearestCity.city.properties.region,
      cityOrNearest: nearestCity.city.properties.name!,
      adminCode: nearestCity.city.properties.adminCode,
      distanceToCityKm: Number(nearestCity.distance.toFixed(2)),
      source: 'offline',
    };
  }

  if (admin) {
    return {
      country: admin.properties.country,
      region: admin.properties.region,
      cityOrNearest: admin.properties.district || 'Unknown',
      adminCode: admin.properties.adminCode,
      distanceToCityKm: 0,
      source: 'offline',
    };
  }

  return {
    country: 'Unknown',
    region: 'Unknown',
    cityOrNearest: 'Unknown',
    adminCode: 'UNKNOWN',
    distanceToCityKm: 0,
    source: 'offline',
  };
}
