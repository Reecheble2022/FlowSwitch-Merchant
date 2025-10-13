const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';

export function toGeohash(lat: number, lng: number, precision: number = 9): string {
  let idx = 0;
  let bit = 0;
  let evenBit = true;
  let geohash = '';

  let latMin = -90, latMax = 90;
  let lngMin = -180, lngMax = 180;

  while (geohash.length < precision) {
    if (evenBit) {
      const lngMid = (lngMin + lngMax) / 2;
      if (lng >= lngMid) {
        idx |= (1 << (4 - bit));
        lngMin = lngMid;
      } else {
        lngMax = lngMid;
      }
    } else {
      const latMid = (latMin + latMax) / 2;
      if (lat >= latMid) {
        idx |= (1 << (4 - bit));
        latMin = latMid;
      } else {
        latMax = latMid;
      }
    }

    evenBit = !evenBit;
    bit++;

    if (bit === 5) {
      geohash += BASE32[idx];
      bit = 0;
      idx = 0;
    }
  }

  return geohash;
}

export function geohashPrecisionFor(meters: number): number {
  if (meters <= 0.037) return 12;
  if (meters <= 0.15) return 11;
  if (meters <= 1.2) return 10;
  if (meters <= 5) return 9;
  if (meters <= 38) return 8;
  if (meters <= 150) return 7;
  if (meters <= 1200) return 6;
  if (meters <= 5000) return 5;
  return 4;
}

export function getGeohashSimilarity(hash1: string, hash2: string): number {
  let commonLength = 0;
  const minLen = Math.min(hash1.length, hash2.length);

  for (let i = 0; i < minLen; i++) {
    if (hash1[i] === hash2[i]) {
      commonLength++;
    } else {
      break;
    }
  }

  return commonLength;
}
