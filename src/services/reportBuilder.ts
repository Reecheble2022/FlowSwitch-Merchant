import { supabase } from '../lib/supabase';
import { resolvePlace, ResolvedPlace } from '../lib/geo/geocoder';
import {
  clusterVerifications,
  findOutliers,
  computeLastMoveDistance,
  Cluster,
  VerificationPoint,
} from '../lib/geo/clustering';
import { haversineKm } from '../lib/geo/haversine';

export interface AgentReport {
  agent: {
    id: string;
    name: string;
    merchant: string | null;
  };
  primaryCluster: {
    label: string;
    level: string;
    centroid: [number, number];
    share: number;
  } | null;
  clusters: Array<{
    id: string;
    level: string;
    centroid: [number, number];
    count: number;
    radiusM: number;
  }>;
  movements: {
    moves: number;
    lastMoveKm: number;
    lastTwoDistanceKm: number;
  };
  outliers: Array<{
    lat: number;
    lng: number;
    distanceFromPrimaryKm: number;
  }>;
  placeSummary: {
    country: string;
    region: string;
    cityOrNearest: string;
  };
  evidence: Array<{
    lat: number;
    lng: number;
    verifiedAt: string;
    place: ResolvedPlace;
    clusterId: string;
  }>;
  narrative: string;
}

export interface PortfolioReport {
  summary: {
    totalAgents: number;
    totalVerifications: number;
    regionDistribution: Record<string, number>;
    merchantDistribution: Record<string, number>;
  };
  agents: AgentReport[];
  generatedAt: string;
}

function generateNarrative(report: AgentReport): string {
  const { agent, primaryCluster, clusters, movements, outliers, placeSummary } = report;

  let narrative = `**${agent.name}** operates`;

  if (primaryCluster) {
    narrative += ` primarily in ${placeSummary.cityOrNearest}, ${placeSummary.region}`;

    if (primaryCluster.level === 'same_site') {
      narrative += ` at a single consistent site (${Math.round(primaryCluster.radiusM)}m radius)`;
    } else if (primaryCluster.level === 'same_premises') {
      narrative += ` within the same premises or block (${Math.round(primaryCluster.radiusM)}m spread)`;
    } else if (primaryCluster.level === 'same_area') {
      narrative += ` within the same neighbourhood (${(primaryCluster.radiusM / 1000).toFixed(1)}km area)`;
    }

    narrative += `. This location accounts for ${Math.round(primaryCluster.share * 100)}% of all verifications.`;
  }

  if (clusters.length > 1) {
    narrative += ` The agent has operated from ${clusters.length} distinct locations`;

    if (clusters.every(c => c.level === 'same_premises' || c.level === 'same_site')) {
      narrative += ', though these locations are effectively within the same premises or nearby blocks.';
    } else {
      narrative += ', indicating movement across different areas.';
    }
  } else if (clusters.length === 1) {
    narrative += ' The agent has maintained a single operational location throughout the verification period.';
  }

  if (movements.lastTwoDistanceKm > 0) {
    narrative += ` The most recent two verifications are ${movements.lastTwoDistanceKm.toFixed(2)}km apart.`;
  }

  if (outliers.length > 0) {
    narrative += ` **Note:** ${outliers.length} verification${outliers.length > 1 ? 's' : ''} detected >10km from primary location`;
    if (outliers.length === 1) {
      narrative += ` (${outliers[0].distanceFromPrimaryKm.toFixed(1)}km away)`;
    }
    narrative += ', which may indicate travel or service delivery outside normal operating area.';
  }

  return narrative;
}

export async function buildAgentReport(
  agentId: string,
  dateRange?: { start: string; end: string }
): Promise<AgentReport | null> {
  const { data: agent, error: agentError } = await supabase
    .from('agents')
    .select('id, first_name, last_name, merchant:merchants(name)')
    .eq('id', agentId)
    .maybeSingle();

  if (agentError || !agent) {
    console.error('Failed to fetch agent:', agentError);
    return null;
  }

  let query = supabase
    .from('agent_verifications')
    .select('id, agent_id, gps_lat, gps_lng, verified_at, notes')
    .eq('agent_id', agentId)
    .not('gps_lat', 'is', null)
    .not('gps_lng', 'is', null)
    .order('verified_at', { ascending: false });

  if (dateRange) {
    query = query.gte('verified_at', dateRange.start).lte('verified_at', dateRange.end);
  }

  const { data: verifications, error: verError } = await query;

  if (verError) {
    console.error('Failed to fetch verifications:', verError);
    return null;
  }

  if (!verifications || verifications.length === 0) {
    console.warn('No verifications found for agent:', agentId);
    return null;
  }

  const points: VerificationPoint[] = verifications.map(v => ({
    id: v.id,
    lat: typeof v.gps_lat === 'string' ? parseFloat(v.gps_lat) : v.gps_lat!,
    lng: typeof v.gps_lng === 'string' ? parseFloat(v.gps_lng) : v.gps_lng!,
    verifiedAt: v.verified_at,
  }));

  const clusters = clusterVerifications(points);
  const primaryCluster = clusters[0] || null;

  const outliers = primaryCluster
    ? findOutliers(points, primaryCluster.centroid).map(p => ({
        lat: p.lat,
        lng: p.lng,
        distanceFromPrimaryKm: haversineKm([p.lat, p.lng], primaryCluster.centroid),
      }))
    : [];

  const lastMoveKm = computeLastMoveDistance(points);
  const lastTwoDistanceKm = points.length >= 2
    ? haversineKm([points[0].lat, points[0].lng], [points[1].lat, points[1].lng])
    : 0;

  const primaryPlace = primaryCluster
    ? await resolvePlace(primaryCluster.centroid[0], primaryCluster.centroid[1])
    : await resolvePlace(points[0].lat, points[0].lng);

  const evidence = await Promise.all(
    points.map(async p => {
      const place = await resolvePlace(p.lat, p.lng);
      const cluster = clusters.find(c => c.points.some(cp => cp.id === p.id));
      return {
        lat: p.lat,
        lng: p.lng,
        verifiedAt: p.verifiedAt,
        place,
        clusterId: cluster?.id || 'none',
      };
    })
  );

  const report: AgentReport = {
    agent: {
      id: agent.id,
      name: `${agent.first_name} ${agent.last_name}`,
      merchant: (agent.merchant as any)?.name || null,
    },
    primaryCluster: primaryCluster
      ? {
          label: primaryCluster.level.replace('_', ' '),
          level: primaryCluster.level,
          centroid: primaryCluster.centroid,
          share: primaryCluster.consistency,
        }
      : null,
    clusters: clusters.map(c => ({
      id: c.id,
      level: c.level,
      centroid: c.centroid,
      count: c.points.length,
      radiusM: c.radiusM,
    })),
    movements: {
      moves: clusters.length - 1,
      lastMoveKm,
      lastTwoDistanceKm,
    },
    outliers,
    placeSummary: {
      country: primaryPlace.country,
      region: primaryPlace.region,
      cityOrNearest: primaryPlace.cityOrNearest,
    },
    evidence,
    narrative: '',
  };

  report.narrative = generateNarrative(report);

  return report;
}

export async function buildPortfolioReport(filters?: {
  merchantId?: string;
  startDate?: string;
  endDate?: string;
}): Promise<PortfolioReport> {
  let agentQuery = supabase
    .from('agents')
    .select('id, first_name, last_name, merchant_id');

  if (filters?.merchantId) {
    agentQuery = agentQuery.eq('merchant_id', filters.merchantId);
  }

  const { data: agents } = await agentQuery;

  if (!agents || agents.length === 0) {
    return {
      summary: {
        totalAgents: 0,
        totalVerifications: 0,
        regionDistribution: {},
        merchantDistribution: {},
      },
      agents: [],
      generatedAt: new Date().toISOString(),
    };
  }

  const agentReports = await Promise.all(
    agents.map(agent =>
      buildAgentReport(
        agent.id,
        filters?.startDate && filters?.endDate
          ? { start: filters.startDate, end: filters.endDate }
          : undefined
      )
    )
  );

  const validReports = agentReports.filter((r): r is AgentReport => r !== null);

  const regionDistribution: Record<string, number> = {};
  const merchantDistribution: Record<string, number> = {};
  let totalVerifications = 0;

  validReports.forEach(report => {
    totalVerifications += report.evidence.length;

    const region = report.placeSummary.region;
    regionDistribution[region] = (regionDistribution[region] || 0) + 1;

    if (report.agent.merchant) {
      merchantDistribution[report.agent.merchant] =
        (merchantDistribution[report.agent.merchant] || 0) + 1;
    }
  });

  return {
    summary: {
      totalAgents: validReports.length,
      totalVerifications,
      regionDistribution,
      merchantDistribution,
    },
    agents: validReports,
    generatedAt: new Date().toISOString(),
  };
}
