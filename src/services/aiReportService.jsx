import { clusterVerifications, findOutliers, computeLastMoveDistance } from '../lib/geo/clustering';
import { resolveDetailedLocation, getLocationPhoto, generateLocationBlurb } from '../lib/geo/detailedGeocoder';

export async function generateAgentReport(options, agent) {
  const { lookbackDays = 30, startDate, endDate } = options;

  const start = startDate || new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000).toISOString();
  const end = endDate || new Date().toISOString();

  if (!agent?.verifications || (agent?.verifications || []).length === 0) {
    return createEmptyReport(agent, start, end);
  }

  const points = agent?.verifications.map((v) => ({
    id: v.guid,
    lat: v.latitude,
    lng: v.longitude,
    verifiedAt: v.verified_at,
  }));

  const siteClusters = clusterVerifications(points, 0.05);
  const blockClusters = clusterVerifications(points, 0.2);
  const areaClusters = clusterVerifications(points, 2);

  const primaryCluster = areaClusters[0] || null;

  const clusters = areaClusters.map((cluster, idx) => ({
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

  const placeSummary = {};
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
      id: agent.guid,
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

function createEmptyReport(agent, start, end) {
  return {
    agent: {
      id: agent.guid,
      name: `${agent.firstName} ${agent.lastName}`,
      merchant: agent.merchantGuid?.name || 'Unknown',
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

function calculateTotalDistance(points) {
  if (points.length < 2) return 0;

  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += haversineDistance(points[i - 1].lat, points[i - 1].lng, points[i].lat, points[i].lng);
  }
  return Math.round(total * 10) / 10;
}

function haversineDistance(lat1, lon1, lat2, lon2) {
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

function generateNarrative(params) {
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
    `📍 **Location Analysis for ${agentName}**\n\nAnalyzed ${totalVerifications} verification${totalVerifications !== 1 ? 's' : ''
    } in the selected period.`
  );

  if (primaryCluster) {
    const sharePercent = Math.round(primaryCluster.shareOfTotal * 100);
    sections.push(
      `\n**Primary Area**: ${primaryLocation.city}, ${primaryLocation.countryName
      } (${sharePercent}% of all verifications)\n` +
      `The agent primarily operates ${primaryLocation.distanceKmToNearest < 5 ? 'in' : 'near'
      } ${primaryLocation.nearestPlace}${primaryLocation.townOrSuburb ? `, specifically in ${primaryLocation.townOrSuburb}` : ''
      }.`
    );
  }

  if (outliers.length > 0) {
    sections.push(
      `\n🚩 **Outliers**: ${outliers.length} verification${outliers.length !== 1 ? 's' : ''
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
