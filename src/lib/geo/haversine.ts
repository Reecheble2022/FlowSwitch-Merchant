export function haversine(
  a: [number, number],
  b: [number, number]
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371000;

  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const deltaLat = toRad(b[0] - a[0]);
  const deltaLng = toRad(b[1] - a[1]);

  const a1 =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a1), Math.sqrt(1 - a1));

  return R * c;
}

export function haversineKm(a: [number, number], b: [number, number]): number {
  return haversine(a, b) / 1000;
}

export function haversineDistance(a: [number, number], b: [number, number]): number {
  return haversine(a, b);
}
