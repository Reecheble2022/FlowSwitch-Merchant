import { supabase } from '../lib/supabase';
import { clusterVerifications, findOutliers, computeLastMoveDistance } from '../lib/geo/clustering';
import { resolveDetailedLocation, getLocationPhoto, generateLocationBlurb } from '../lib/geo/detailedGeocoder';
import type { AgentAIReport, AgentVerification, Agent, ClusterInfo } from '../types';

export interface ReportOptions {
  agentId: string;
  lookbackDays?: number;
  startDate?: string;
  endDate?: string;
}

export async function generateAgentReport(options: ReportOptions): Promise<AgentAIReport> {
  const { agentId, lookbackDays = 30, startDate, endDate } = options;

  const { data: agent } = await supabase
    .from('agents')
    .select('*, merchant:merchants(*)')
    .eq('id', agentId)
    .maybeSingle();

  if (!agent) {
    throw new Error('Agent not found');
  }

  const start = startDate || new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000).toISOString();
  const end = endDate || new Date().toISOString();

  const { data: verifications } = await supabase
    .from('agent_verifications')
    .select('*')
    .eq('agent_id', agentId)
    .gte('verified_at', start)
    .lte('verified_at', end)
    .order('verified_at', { ascending: true });

  if (!verifications || verifications.length === 0) {
    return createEmptyReport(agent as Agent, start, end);
  }

  const points = verifications.map((v: AgentVerification) => ({
    id: v.id,
    lat: v.gps_lat,
    lng: v.gps_lng,
    verifiedAt: v.verified_at,
  }));

  const siteClusters = clusterVerifications(points, 0.05);
  const blockClusters = clusterVerifications(points, 0.2);
  const areaClusters = clusterVerifications(points, 2);

  const primaryCluster = areaClusters[0] || null;

  const clusters: ClusterInfo[] = areaClusters.map((cluster, idx) => ({
    id: `cluster-${idx}`,
    centroid: { lat: cluster.centroid[0], lng: cluster.centroid[1] },
    radius: cluster.radiusM / 1000,
    pointCount: cluster.points.length,
    shareOfTotal: cluster.points.length / points.length,
    points: cluster.points.map(p => ({
      id: p.id,
      lat: p.lat,
      lng: p.lng,
      timestamp: p.verifiedAt,
    })),
  }));

  const outliers = primaryCluster
    ? findOutliers(points, primaryCluster.centroid, 10).map(o => ({
        id: o.id,
        lat: o.lat,
        lng: o.lng,
        distanceFromPrimary: haversineDistance(
          primaryCluster.centroid[0],
          primaryCluster.centroid[1],
          o.lat,
          o.lng
        ),
      }))
    : [];

  const lastMovement = computeLastMoveDistance(points);
  const totalDistance = calculateTotalDistance(points);

  const placeSummary: Record<string, number> = {};
  points.forEach(p => {
    const location = resolveDetailedLocation(p.lat, p.lng);
    const key = `${location.city}, ${location.countryName}`;
    placeSummary[key] = (placeSummary[key] || 0) + 1;
  });

  const primaryLocation = primaryCluster
    ? resolveDetailedLocation(primaryCluster.centroid[0], primaryCluster.centroid[1])
    : resolveDetailedLocation(points[0].lat, points[0].lng);

  const locationPhoto = getLocationPhoto(primaryLocation);
  const locationBlurb = generateLocationBlurb(primaryLocation);

  const narrative = generateNarrative({
    agentName: `${agent.first_name} ${agent.last_name}`,
    totalVerifications: points.length,
    primaryCluster: clusters[0] || null,
    outliers,
    lastMovement,
    totalDistance,
    primaryLocation,
    placeSummary,
  });

  return {
    agent: {
      id: agent.id,
      name: `${agent.first_name} ${agent.last_name}`,
      merchant: agent.merchant?.name || 'Unknown',
    },
    summary: {
      totalVerifications: points.length,
      dateRange: { start, end },
      primaryLocation,
    },
    clusters,
    primaryCluster: clusters[0] || null,
    outliers,
    movement: {
      totalDistanceKm: totalDistance,
      lastMovementKm: lastMovement,
    },
    placeSummary,
    narrative,
    generatedAt: new Date().toISOString(),
    mode: 'offline',
    locationPhoto,
    locationBlurb,
  };
}

function createEmptyReport(agent: Agent, start: string, end: string): AgentAIReport {
  return {
    agent: {
      id: agent.id,
      name: `${agent.first_name} ${agent.last_name}`,
      merchant: agent.merchant?.name || 'Unknown',
    },
    summary: {
      totalVerifications: 0,
      dateRange: { start, end },
    },
    clusters: [],
    primaryCluster: null,
    outliers: [],
    movement: {
      totalDistanceKm: 0,
      lastMovementKm: 0,
    },
    placeSummary: {},
    narrative: 'No verification data available for the selected period.',
    generatedAt: new Date().toISOString(),
    mode: 'offline',
  };
}

function calculateTotalDistance(points: Array<{ lat: number; lng: number; verifiedAt: string }>): number {
  if (points.length < 2) return 0;

  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += haversineDistance(points[i - 1].lat, points[i - 1].lng, points[i].lat, points[i].lng);
  }
  return Math.round(total * 10) / 10;
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

interface NarrativeParams {
  agentName: string;
  totalVerifications: number;
  primaryCluster: ClusterInfo | null;
  outliers: any[];
  lastMovement: number;
  totalDistance: number;
  primaryLocation: any;
  placeSummary: Record<string, number>;
}

function generateNarrative(params: NarrativeParams): string {
  const {
    agentName,
    totalVerifications,
    primaryCluster,
    outliers,
    lastMovement,
    totalDistance,
    primaryLocation,
    placeSummary,
  } = params;

  const sections = [];

  sections.push(
    `📍 **Location Analysis for ${agentName}**\n\nAnalyzed ${totalVerifications} verification${
      totalVerifications !== 1 ? 's' : ''
    } in the selected period.`
  );

  if (primaryCluster) {
    const sharePercent = Math.round(primaryCluster.shareOfTotal * 100);
    sections.push(
      `\n**Primary Area**: ${primaryLocation.city}, ${
        primaryLocation.countryName
      } (${sharePercent}% of all verifications)\n` +
        `The agent primarily operates ${
          primaryLocation.distanceKmToNearest < 5 ? 'in' : 'near'
        } ${primaryLocation.nearestPlace}${
          primaryLocation.townOrSuburb ? `, specifically in ${primaryLocation.townOrSuburb}` : ''
        }.`
    );
  }

  if (outliers.length > 0) {
    sections.push(
      `\n🚩 **Outliers**: ${outliers.length} verification${
        outliers.length !== 1 ? 's' : ''
      } detected more than 10km from the primary location.`
    );
  }

  if (totalVerifications >= 2) {
    sections.push(
      `\n🧭 **Movement**: Total distance traveled: ${totalDistance}km. Last movement: ${lastMovement}km.`
    );
  }

  const topPlaces = Object.entries(placeSummary)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  if (topPlaces.length > 1) {
    sections.push(
      `\n📊 **Geographic Distribution**:\n${topPlaces
        .map(([place, count]) => `• ${place}: ${count} verification${count !== 1 ? 's' : ''}`)
        .join('\n')}`
    );
  }

  return sections.join('\n');
}
