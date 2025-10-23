import { resolvePlace, ResolvedPlace } from '../lib/geo/geocoder';
import {
  clusterVerifications,
  findOutliers,
  computeLastMoveDistance,
  Cluster,
  VerificationPoint,
} from '../lib/geo/clustering';
import { haversineKm } from '../lib/geo/haversine';

/*
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
*/

const generateNarrative = (report) => {
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

export const buildAgentReport = async (dateRange, agent) => {
  const points = ((agent || {}).verifications || []).filter(ve => {
    if (dateRange) {
      const rangeStartDate = new Date(dateRange.start);
      const rangeEndDate = new Date(dateRange.end);
      const verificationDate = new Date(ve.verifiedAt);
      return (verificationDate >= rangeStartDate) && (verificationDate <= rangeEndDate)
    } else {
      return true
    }
  }).map(v => ({
    id: v.guid,
    lat: typeof v.latitude === 'string' ? parseFloat(v.latitude) : v.latitude,
    lng: typeof v.longitude === 'string' ? parseFloat(v.longitude) : v.longitude,
    verifiedAt: v.verifiedAt,
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

  const report = {
    agent: {
      id: agent.guid,
      name: `${agent.firstName} ${agent.lastName}`,
      merchant: agent.merchantGuid?.name || null,
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

export const buildPortfolioReport = async (filters, agentsList = []) => {
  const agents = agentsList.filter(agt => agt.merchantGuid === (filters?.merchantId || filters?.merchantGuid))

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
        filters?.startDate && filters?.endDate
          ? { start: filters.startDate, end: filters.endDate }
          : undefined,
        agent
      )
    )
  );

  const validReports = agentReports.filter((r) => r !== null);

  const regionDistribution = {};
  const merchantDistribution = {};
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
