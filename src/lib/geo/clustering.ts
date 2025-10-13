import { haversine } from './haversine';
import { toGeohash, getGeohashSimilarity } from './geohash';

export type ClusterLevel = 'same_site' | 'same_premises' | 'same_area' | 'different';

export interface VerificationPoint {
  lat: number;
  lng: number;
  verifiedAt: string;
  id: string;
  [key: string]: any;
}

export interface Cluster {
  id: string;
  level: ClusterLevel;
  centroid: [number, number];
  points: VerificationPoint[];
  radiusM: number;
  consistency: number;
}

function determineClusterLevel(maxDistance: number, minGeohashPrecision: number): ClusterLevel {
  if (maxDistance <= 50 || minGeohashPrecision >= 9) {
    return 'same_site';
  }
  if (maxDistance <= 200 || minGeohashPrecision >= 8) {
    return 'same_premises';
  }
  if (maxDistance <= 2000 || minGeohashPrecision >= 7) {
    return 'same_area';
  }
  return 'different';
}

function computeCentroid(points: VerificationPoint[]): [number, number] {
  if (points.length === 0) return [0, 0];

  const sumLat = points.reduce((sum, p) => sum + p.lat, 0);
  const sumLng = points.reduce((sum, p) => sum + p.lng, 0);

  return [sumLat / points.length, sumLng / points.length];
}

function computeMaxDistanceFromCentroid(
  points: VerificationPoint[],
  centroid: [number, number]
): number {
  return Math.max(
    ...points.map(p => haversine([p.lat, p.lng], centroid)),
    0
  );
}

function getMinGeohashPrecision(points: VerificationPoint[]): number {
  if (points.length < 2) return 12;

  const hashes = points.map(p => toGeohash(p.lat, p.lng, 9));
  let minPrecision = 12;

  for (let i = 0; i < hashes.length; i++) {
    for (let j = i + 1; j < hashes.length; j++) {
      const similarity = getGeohashSimilarity(hashes[i], hashes[j]);
      minPrecision = Math.min(minPrecision, similarity);
    }
  }

  return minPrecision;
}

export function clusterVerifications(
  points: VerificationPoint[],
  thresholdKm: number = 2
): Cluster[] {
  if (points.length === 0) return [];

  const clusters: Cluster[] = [];
  const visited = new Set<string>();
  const thresholdM = thresholdKm * 1000;

  points.forEach((point, idx) => {
    if (visited.has(point.id)) return;

    const clusterPoints: VerificationPoint[] = [point];
    visited.add(point.id);

    points.forEach((other, otherIdx) => {
      if (idx === otherIdx || visited.has(other.id)) return;

      const distance = haversine([point.lat, point.lng], [other.lat, other.lng]);
      if (distance <= thresholdM) {
        clusterPoints.push(other);
        visited.add(other.id);
      }
    });

    const centroid = computeCentroid(clusterPoints);
    const radiusM = computeMaxDistanceFromCentroid(clusterPoints, centroid);
    const minGeohashPrecision = getMinGeohashPrecision(clusterPoints);
    const level = determineClusterLevel(radiusM, minGeohashPrecision);

    clusters.push({
      id: `cluster-${clusters.length + 1}`,
      level,
      centroid,
      points: clusterPoints,
      radiusM,
      consistency: clusterPoints.length / points.length,
    });
  });

  clusters.sort((a, b) => b.points.length - a.points.length);

  return clusters;
}

export function findOutliers(
  points: VerificationPoint[],
  primaryCentroid: [number, number],
  thresholdKm: number = 10
): VerificationPoint[] {
  const thresholdM = thresholdKm * 1000;

  return points.filter(point => {
    const distance = haversine([point.lat, point.lng], primaryCentroid);
    return distance > thresholdM;
  });
}

export function computeLastMoveDistance(points: VerificationPoint[]): number {
  if (points.length < 2) return 0;

  const sorted = [...points].sort((a, b) =>
    new Date(b.verifiedAt).getTime() - new Date(a.verifiedAt).getTime()
  );

  const [most, second] = sorted;
  return haversine([most.lat, most.lng], [second.lat, second.lng]) / 1000;
}
