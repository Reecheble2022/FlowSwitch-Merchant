import { haversineKm } from './haversine';
import type { DetailedLocation, LocationPhoto, LocationBlurb } from '../../types';

interface PlaceData {
  name: string;
  lat: number;
  lng: number;
  city: string;
  townOrSuburb?: string;
  province: string;
  country: string;
  countryCode: string;
  facts: string[];
}

const PLACE_DATABASE: PlaceData[] = [
  {
    name: 'Johannesburg',
    lat: -26.2041,
    lng: 28.0473,
    city: 'Johannesburg',
    townOrSuburb: 'Sandton',
    province: 'Gauteng',
    country: 'South Africa',
    countryCode: 'ZA',
    facts: [
      'Largest city in South Africa',
      'Economic hub of the country',
      'Known as the City of Gold',
      'Home to the JSE (Johannesburg Stock Exchange)',
    ],
  },
  {
    name: 'Pretoria',
    lat: -25.7479,
    lng: 28.2293,
    city: 'Pretoria',
    townOrSuburb: 'Arcadia',
    province: 'Gauteng',
    country: 'South Africa',
    countryCode: 'ZA',
    facts: [
      'Administrative capital of South Africa',
      'Also known as Tshwane',
      'Home to Union Buildings',
      'Known for Jacaranda trees',
    ],
  },
  {
    name: 'Cape Town',
    lat: -33.9249,
    lng: 18.4241,
    city: 'Cape Town',
    townOrSuburb: 'City Bowl',
    province: 'Western Cape',
    country: 'South Africa',
    countryCode: 'ZA',
    facts: [
      'Legislative capital of South Africa',
      'Famous for Table Mountain',
      'Popular tourist destination',
      'Mother City of South Africa',
    ],
  },
  {
    name: 'Durban',
    lat: -29.8587,
    lng: 31.0218,
    city: 'Durban',
    townOrSuburb: 'uMhlanga',
    province: 'KwaZulu-Natal',
    country: 'South Africa',
    countryCode: 'ZA',
    facts: [
      'Largest city in KwaZulu-Natal',
      'Busiest port in Africa',
      'Subtropical climate',
      'Known for Golden Mile beaches',
    ],
  },
  {
    name: 'Kampala',
    lat: 0.3476,
    lng: 32.5825,
    city: 'Kampala',
    townOrSuburb: 'Kololo',
    province: 'Central Region',
    country: 'Uganda',
    countryCode: 'UG',
    facts: [
      'Capital and largest city of Uganda',
      'Built on seven hills',
      'Economic and political center',
      'Located near Lake Victoria',
    ],
  },
  {
    name: 'Entebbe',
    lat: 0.0522,
    lng: 32.4635,
    city: 'Entebbe',
    province: 'Central Region',
    country: 'Uganda',
    countryCode: 'UG',
    facts: [
      'Home to Uganda\'s main international airport',
      'Located on Lake Victoria peninsula',
      'Former colonial capital',
      'Known for botanical gardens',
    ],
  },
  {
    name: 'Jinja',
    lat: 0.4244,
    lng: 33.2041,
    city: 'Jinja',
    province: 'Eastern Region',
    country: 'Uganda',
    countryCode: 'UG',
    facts: [
      'Source of the Nile River',
      'Adventure capital of East Africa',
      'Known for white-water rafting',
      'Industrial hub of Uganda',
    ],
  },
  {
    name: 'Gulu',
    lat: 2.7747,
    lng: 32.2989,
    city: 'Gulu',
    province: 'Northern Region',
    country: 'Uganda',
    countryCode: 'UG',
    facts: [
      'Largest city in Northern Uganda',
      'Commercial center of the region',
      'Gateway to Murchison Falls',
      'Growing economic hub',
    ],
  },
];

const OFFLINE_PHOTOS: Record<string, LocationPhoto> = {
  'Johannesburg': {
    url: 'https://images.unsplash.com/photo-1577948000111-9c970dfe3743?w=800',
    caption: 'Johannesburg skyline, South Africa',
    source: 'offline',
    attribution: 'Photo by Unsplash',
    used: 'offline',
  },
  'Cape Town': {
    url: 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=800',
    caption: 'Table Mountain, Cape Town',
    source: 'offline',
    attribution: 'Photo by Unsplash',
    used: 'offline',
  },
  'Kampala': {
    url: 'https://images.unsplash.com/photo-1619224236635-c4f5083e26a3?w=800',
    caption: 'Kampala cityscape, Uganda',
    source: 'offline',
    attribution: 'Photo by Unsplash',
    used: 'offline',
  },
  'Durban': {
    url: 'https://images.unsplash.com/photo-1591825729269-caeb344f6df2?w=800',
    caption: 'Durban beachfront, South Africa',
    source: 'offline',
    attribution: 'Photo by Unsplash',
    used: 'offline',
  },
};

export function resolveDetailedLocation(lat: number, lng: number): DetailedLocation {
  let nearest: PlaceData | null = null;
  let minDistance = Infinity;

  for (const place of PLACE_DATABASE) {
    const distance = haversineKm([lat, lng], [place.lat, place.lng]);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = place;
    }
  }

  if (!nearest) {
    return {
      country: 'XX',
      countryName: 'Unknown',
      provinceOrState: 'Unknown',
      city: 'Unknown',
      nearestPlace: 'Unknown location',
      distanceKmToNearest: 0,
      source: 'offline',
    };
  }

  return {
    country: nearest.countryCode,
    countryName: nearest.country,
    provinceOrState: nearest.province,
    city: nearest.city,
    townOrSuburb: nearest.townOrSuburb,
    nearestPlace: nearest.name,
    distanceKmToNearest: Math.round(minDistance * 10) / 10,
    source: 'offline',
  };
}

export function getLocationPhoto(location: DetailedLocation): LocationPhoto {
  const offlinePhoto = OFFLINE_PHOTOS[location.nearestPlace];

  if (offlinePhoto) {
    return offlinePhoto;
  }

  return {
    url: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=800',
    caption: `${location.city}, ${location.countryName}`,
    source: 'offline',
    attribution: 'Photo by Unsplash',
    used: 'offline',
  };
}

export function generateLocationBlurb(location: DetailedLocation): LocationBlurb {
  const placeData = PLACE_DATABASE.find(p => p.name === location.nearestPlace);

  if (!placeData || !placeData.facts.length) {
    const text = `This verification is ${
      location.townOrSuburb ? `near ${location.townOrSuburb}, ` : ''
    }${location.city}, ${location.countryName}, within ${location.distanceKmToNearest} km of ${
      location.nearestPlace
    }. The area is part of ${location.provinceOrState}.`;

    return {
      text,
      facts: [],
      mode: 'deterministic',
    };
  }

  const distanceText =
    location.distanceKmToNearest < 5
      ? 'in the heart of'
      : location.distanceKmToNearest < 20
      ? 'near'
      : `approximately ${location.distanceKmToNearest}km from`;

  const text = `This verification is ${distanceText} ${location.nearestPlace}, ${location.countryName}. ${
    placeData.facts[0]
  }. The city is known for ${placeData.facts.slice(1, 3).join(' and ').toLowerCase()}. ${
    location.townOrSuburb ? `The specific area is ${location.townOrSuburb}, ` : ''
  }located in ${location.provinceOrState}.`;

  return {
    text,
    facts: placeData.facts,
    mode: 'deterministic',
  };
}
